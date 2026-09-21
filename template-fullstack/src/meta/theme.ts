import { css, metaThemes } from '@/meta/load';
import type { MetaTheme, TEXT_VARIANTS } from '@/meta/schema';

/**
 * Turns the themes into CSS once, at startup: every colour token as `--token` under
 * `[data-theme="<id>"]`, the fonts, and one class per text variant. The first theme is the default;
 * a dark one applies when the system prefers dark and nothing was chosen.
 */

type TextStyle = MetaTheme['typography']['text'][(typeof TEXT_VARIANTS)[number]];

function textRule(
  selector: string,
  style: TextStyle,
  fonts: MetaTheme['typography']['fonts'],
): string {
  const lines = [
    `font-family: ${style.family === 'mono' ? fonts.mono : fonts.sans}`,
    `font-size: ${String(style.size)}px`,
    `line-height: ${String(style.lineHeight)}px`,
    `font-weight: ${String(style.weight)}`,
    `color: ${String(css(style.color))}`,
  ];
  if (style.letterSpacing) lines.push(`letter-spacing: ${style.letterSpacing}`);
  if (style.background) lines.push(`background: ${String(css(style.background))}`);
  if (style.padding !== undefined)
    lines.push(
      `padding: ${typeof style.padding === 'number' ? `${String(style.padding)}px` : style.padding}`,
    );
  if (style.radius !== undefined) lines.push(`border-radius: ${String(style.radius)}px`);
  return `${selector} { ${lines.join('; ')}; }`;
}

export function themeCss(themes: MetaTheme[]): string {
  const out: string[] = [];
  for (const theme of themes) {
    const vars = Object.entries(theme.colors).map(([k, v]) => `--${k}: ${v};`);
    out.push(`[data-theme="${theme.id}"] { ${vars.join(' ')} }`);
  }
  // Typography comes from the active theme too; text variants are the same for every theme in practice,
  // and each theme's block wins while it is active.
  for (const theme of themes) {
    const { fonts, base, text } = theme.typography;
    const scope = `[data-theme="${theme.id}"]`;
    out.push(textRule(`${scope} body`, base, fonts));
    for (const [variant, style] of Object.entries(text)) {
      out.push(textRule(`${scope} .meta-text-${variant}`, style, fonts));
    }
  }
  return out.join('\n');
}

const STORAGE_KEY = 'theme';

export function readStoredTheme(): string | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && metaThemes.some((t) => t.id === stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function defaultTheme(): MetaTheme {
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const wanted = readStoredTheme();
  const first = metaThemes[0];
  if (!first) throw new Error('no themes in meta/themes');
  if (wanted) return metaThemes.find((t) => t.id === wanted) ?? first;
  return (prefersDark ? metaThemes.find((t) => t.dark) : metaThemes.find((t) => !t.dark)) ?? first;
}

export function applyTheme(theme: MetaTheme): void {
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.classList.toggle('dark', theme.dark);
}

export function storeTheme(theme: MetaTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    // Without storage the choice lasts for this page only.
  }
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'meta-theme';
  style.textContent = themeCss(metaThemes);
  document.head.append(style);
  applyTheme(defaultTheme());
}
