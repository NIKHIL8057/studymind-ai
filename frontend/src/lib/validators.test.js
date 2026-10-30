import { describe, expect, it } from 'vitest';
import { validateEmail, validatePassword } from './validators';

describe('validators', () => {
  it('rejects weak passwords with a clear message', () => {
    expect(validatePassword('short1')).toMatch(/8 characters/);
    expect(validatePassword('allletters')).toMatch(/number/);
    expect(validatePassword('12345678')).toMatch(/letter/);
    expect(validatePassword('goodpass1')).toBe('');
  });
  it('validates emails', () => {
    expect(validateEmail('nope')).not.toBe('');
    expect(validateEmail('a@b.co')).toBe('');
  });
});
