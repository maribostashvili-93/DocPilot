import { forwardRef, useId, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

/**
 * Generate a strong password that satisfies the server policy:
 *   - >= 12 chars (we use 18 by default)
 *   - includes lowercase, uppercase, digit, and symbol
 * Uses window.crypto for randomness.
 */
export function generatePassword(length = 18): string {
  const lowers = 'abcdefghijkmnopqrstuvwxyz'; // skip l
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // skip I, O
  const digits = '23456789'; // skip 0, 1
  const symbols = '!@#$%^&*()-_=+[]{}<>?';
  const all = lowers + uppers + digits + symbols;

  const buf = new Uint32Array(Math.max(length, 4));
  window.crypto.getRandomValues(buf);
  const pick = (alphabet: string, i: number) => alphabet[buf[i] % alphabet.length];

  // Guarantee at least one of each class in positions 0..3
  const required = [
    pick(lowers, 0),
    pick(uppers, 1),
    pick(digits, 2),
    pick(symbols, 3),
  ];
  const rest: string[] = [];
  for (let i = 4; i < length; i += 1) rest.push(pick(all, i));

  // Fisher-Yates shuffle the full set so required chars are not always at start
  const arr = [...required, ...rest];
  const shuffleBuf = new Uint32Array(arr.length);
  window.crypto.getRandomValues(shuffleBuf);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = shuffleBuf[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  minLength?: number;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** When true, renders a "Generate" button + (after generation) "Copy" feedback. */
  showGenerator?: boolean;
  /** Inline label/header above the input. Optional — most callers wrap with their own label. */
  label?: string;
  /** Visual size. */
  size?: 'md' | 'sm';
  className?: string;
};

const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.4 4M6.5 7.5A17 17 0 0 0 2 12s3.5 6 10 6c1.6 0 3-.3 4.2-.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.9 10A3 3 0 0 0 14 14.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  {
    id,
    name,
    value,
    onChange,
    placeholder,
    required,
    autoComplete,
    autoFocus,
    disabled,
    minLength,
    ariaInvalid,
    ariaDescribedBy,
    onKeyDown,
    showGenerator,
    label,
    size = 'md',
    className,
  },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isStrong = value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /[0-9]/.test(value)
    && /[^A-Za-z0-9]/.test(value);

  async function handleGenerate() {
    const next = generatePassword(18);
    onChange(next);
    setVisible(true);
    try {
      await navigator.clipboard.writeText(next);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 2500);
    } catch {
      // Clipboard may be blocked — that's fine, user can see the value
    }
  }

  return (
    <div className={`password-field${className ? ` ${className}` : ''} password-field--${size}`}>
      {label && <span className="password-field-label">{label}</span>}
      <div className="password-field-wrap">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          minLength={minLength}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="password-field-actions">
          {showGenerator && (
            <button
              type="button"
              className="password-field-action password-field-generate"
              onClick={handleGenerate}
              disabled={disabled}
              aria-label="Generate a strong password"
              title="Generate strong password"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 4v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 20v-6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 14a8 8 0 0 1-14.9 2M4 10a8 8 0 0 1 14.9-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button
            type="button"
            className="password-field-action password-field-toggle"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            title={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        </div>
      </div>
      {showGenerator && (
        <div className="password-field-meta">
          {justCopied && <span className="password-field-copied">✓ Copied to clipboard</span>}
          {!justCopied && value && (
            <span className={`password-field-strength${isStrong ? ' is-strong' : ''}`}>
              {isStrong ? 'Strong password ✓' : 'Needs upper, lower, digit, symbol · min 12 chars'}
            </span>
          )}
          {!justCopied && !value && (
            <span className="password-field-strength">Tip: click 🔄 to generate a strong password (copied to clipboard).</span>
          )}
        </div>
      )}
    </div>
  );
});

export default PasswordField;
