// src/components/PasswordInput.tsx
import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  disabled?: boolean;
  name?: string;

  inputClassName?: string;
  containerClassName?: string;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Password',
      autoComplete = 'current-password',
      id,
      disabled,
      name,
      inputClassName = '',
      containerClassName = '',
    },
    ref
  ) => {
    const [show, setShow] = useState(false);

    return (
      <div className={`relative ${containerClassName}`}>
        <input
          ref={ref}
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
