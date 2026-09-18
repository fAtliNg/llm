"""
LoRA fine-tune of Qwen3.5-9B on agent trajectories (bench/dataset/train.jsonl) with Unsloth.

Runs on a rented GPU with at least 48 GB (bf16 weights of the 9B model alone take ~19 GB, and the
examples go up to 16k tokens). QLoRA is deliberately not used: Unsloth reports high quantisation
error for Qwen3.5. Requires transformers v5.

Usage:
  pip install "unsloth[cu128-torch280]" "transformers>=5" trl datasets
  python train.py --data train.jsonl --out out/qwen3.5-9b-agent-v1 [--epochs 2] [--max-seq 16384]

The dataset rows are OpenAI-style chats with tool calls (see bench/src/dataset/convert.ts). They
are rendered with the model's own chat template (tools included), and the loss is computed only
on assistant turns. The same template is what Ollama's built-in qwen3.5 renderer produces, so the
exported GGUF sees at inference exactly the format it was trained on.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_rows(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        messages = []
        for m in row["messages"]:
            m = dict(m)
            if m.get("tool_calls"):
                # HF templates expect arguments as objects, the JSONL keeps them as strings.
                m["tool_calls"] = [
                    {
                        "type": "function",
                        "function": {
                            "name": c["function"]["name"],
                            "arguments": json.loads(c["function"]["arguments"]),
                        },
                    }
                    for c in m["tool_calls"]
                ]
            messages.append(m)
        rows.append({"messages": messages, "tools": row["tools"]})
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--base", default="Qwen/Qwen3.5-9B")
    ap.add_argument("--epochs", type=float, default=2)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--rank", type=int, default=16)
    ap.add_argument("--max-seq", type=int, default=16384)
    ap.add_argument("--batch", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=8)
    ap.add_argument("--eval-frac", type=float, default=0.0, help="held-out share for eval loss; 0 = train on everything (eval on 32k sequences needs ~80 GB for logits, and quality is measured by the benchmark anyway)")
    ap.add_argument("--gguf", nargs="*", default=["q4_k_m", "q8_0"], help="quantisations to export")
    ap.add_argument("--max-steps", type=int, default=0, help="stop after N optimizer steps (smoke test); 0 = full epochs")
    ap.add_argument("--no-export", action="store_true", help="skip merge and GGUF export (smoke test)")
    args = ap.parse_args()

    from unsloth import FastLanguageModel  # noqa: E402  (must be imported before transformers)
    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer
    from unsloth.chat_templates import train_on_responses_only

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base,
        max_seq_length=args.max_seq,
        load_in_4bit=False,
        load_in_8bit=False,
        dtype=None,  # bf16 on Ampere+
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.rank,
        lora_alpha=args.rank,
        lora_dropout=0,
        bias="none",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    # Qwen3.5 is multimodal: Unsloth returns a processor whose text tokenizer lives in `.tokenizer`.
    # Everything text-only (rendering, length filter, the trainer) must use that inner tokenizer,
    # otherwise the processor tries to parse our chats as images.
    text_tok = getattr(tokenizer, "tokenizer", tokenizer)

    rows = load_rows(args.data)

    # Render BEFORE handing anything to `datasets`: Dataset.from_list unifies nested dict schemas
    # across rows, so tool-call arguments would get every key seen anywhere in the data, filled
    # with None. v1 was trained on exactly that corruption and learned to emit "None" parameters.
    texts = [text_tok.apply_chat_template(row["messages"], tools=row["tools"], tokenize=False) for row in rows]
    bad = [i for i, t in enumerate(texts) if ">None</parameter>" in t or ">null</parameter>" in t]
    if bad:
        raise SystemExit(f"rendered text contains None/null parameters in {len(bad)} examples (e.g. #{bad[0]}); refusing to train on it")
    print("sample rendered tool call:", texts[0][texts[0].find("<tool_call>"):texts[0].find("</tool_call>") + 12][:300])
    ds = Dataset.from_dict({"text": texts})
    ds = ds.filter(lambda r: len(text_tok(r["text"])["input_ids"]) <= args.max_seq)
    if args.eval_frac > 0:
        split = ds.train_test_split(test_size=args.eval_frac, seed=42)
        train_ds, eval_ds = split["train"], split["test"]
    else:
        train_ds, eval_ds = ds, None
    print(f"train {len(train_ds)}, eval {len(eval_ds) if eval_ds else 0} examples (dropped over {args.max_seq} tokens: {len(rows) - len(ds)})")

    trainer = SFTTrainer(
        model=model,
        processing_class=text_tok,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        args=SFTConfig(
            dataset_text_field="text",
            max_length=args.max_seq,
            per_device_train_batch_size=args.batch,
            gradient_accumulation_steps=args.grad_accum,
            num_train_epochs=args.epochs,
            max_steps=args.max_steps if args.max_steps > 0 else -1,
            learning_rate=args.lr,
            lr_scheduler_type="cosine",
            warmup_ratio=0.05,
            optim="adamw_8bit",
            weight_decay=0.01,
            bf16=True,
            logging_steps=5,
            eval_strategy="steps" if eval_ds else "no",
            eval_steps=50,
            per_device_eval_batch_size=1,
            prediction_loss_only=True,
            # A checkpoint every 25 optimizer steps (about 200 examples): a crash costs minutes, not hours.
            save_strategy="steps",
            save_steps=25,
            save_total_limit=2,
            output_dir=str(args.out / "checkpoints"),
            report_to="none",
            seed=42,
        ),
    )
    # Loss only on assistant turns: everything the model must produce (text, tool calls, final report).
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|im_start|>user\n",
        response_part="<|im_start|>assistant\n",
    )
    # Resume from the last checkpoint when there is one (the session watchdog re-runs the script after a crash).
    ckpts = sorted((args.out / "checkpoints").glob("checkpoint-*"), key=lambda p: int(p.name.split("-")[-1])) if (args.out / "checkpoints").exists() else []
    if ckpts:
        print("resuming from", ckpts[-1])
    stats = trainer.train(resume_from_checkpoint=str(ckpts[-1]) if ckpts else None)
    print("train stats:", stats)

    adapter_dir = args.out / "lora"
    model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)
    text_tok.save_pretrained(adapter_dir)
    if args.no_export:
        print("smoke run done, adapter at", adapter_dir)
        return
    merged_dir = args.out / "merged-bf16"
    model.save_pretrained_merged(str(merged_dir), tokenizer, save_method="merged_16bit")
    for quant in args.gguf:
        model.save_pretrained_gguf(str(args.out / f"gguf-{quant}"), tokenizer, quantization_method=quant)
    print("done:", adapter_dir, merged_dir, [args.out / f"gguf-{q}" for q in args.gguf])


if __name__ == "__main__":
    main()
