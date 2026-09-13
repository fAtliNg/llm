import { describe, expect, it } from 'vitest';
import { parsePlan } from '../src/prompt/parser.js';

describe('parsePlan', () => {
  it('keeps distinct actionable steps and drops restatements', () => {
    const reply = [
      '1. Modify the `CartItem` interface to include a `discount` property.',
      '2. Update the `cartTotal` function to calculate the total after applying the discount.',
      '3. Modify the `CartItem` interface in `src/cart.ts` to include a `discount` property.',
      '4. `src/cart.ts`',
      '5. Open `src/cart.ts`.',
    ].join('\n');

    const steps = parsePlan(reply);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.index).toBe(1);
    expect(steps[1]?.index).toBe(2);
  });

  it('extracts the files a step names', () => {
    const steps = parsePlan('1. Update the cart total in src/cart.ts and src/index.ts');

    expect(steps[0]?.files).toEqual(['src/cart.ts', 'src/index.ts']);
  });

  it('caps the number of steps', () => {
    const names = [
      'alpha',
      'beta',
      'gamma',
      'delta',
      'epsilon',
      'zeta',
      'eta',
      'theta',
      'iota',
      'kappa',
      'lambda',
      'mu',
    ];
    const reply = names
      .map((name, i) => `${i + 1}. Add the ${name} helper to src/${name}.ts`)
      .join('\n');

    expect(parsePlan(reply)).toHaveLength(6);
  });

  it('returns nothing when the reply has no list at all', () => {
    expect(parsePlan('You should probably use Redux Toolkit here.')).toEqual([]);
  });
});

describe('parsePlan with mixed output', () => {
  it('prefers the numbered plan over reasoning bullets above it', () => {
    const reply = [
      '- Existing code that relies on CartItem might break if it ignores the new field.',
      '- The reduce call will need updating.',
      '',
      '1. Add an optional discountPercent field to the CartItem interface in src/cart.ts.',
      '2. Update cartTotal to subtract the discount from each line item.',
    ].join('\n');

    const steps = parsePlan(reply);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.description).toContain('discountPercent');
  });

  it('falls back to bullets when there is no numbered list', () => {
    const reply = '- Add a discountPercent field to CartItem in src/cart.ts';

    expect(parsePlan(reply)).toHaveLength(1);
  });
});
