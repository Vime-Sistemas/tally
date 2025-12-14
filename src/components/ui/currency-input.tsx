import { useState, useEffect } from 'react';
import { formatCurrencyValue, parseCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onValueChange: (value: number) => void;
  error?: string;
  label?: string;
}

export function CurrencyInput({ value, onValueChange, className, error, label, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Initial load or external update
    if (value !== undefined && value !== null) {
        const parsed = parseCurrency(displayValue);
        // Only update if the value is different from what we have parsed from current display
        // This prevents overwriting "1," with "1,00" while typing
        if (parsed !== value) {
             setDisplayValue(value === 0 ? '' : formatCurrencyValue(value));
        }
    } else {
        setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers, comma, dot
    if (!/^[0-9.,]*$/.test(val)) return;
    
    setDisplayValue(val);
    const number = parseCurrency(val);
    onValueChange(number);
  };

  const handleBlur = () => {
    if (value) {
      setDisplayValue(formatCurrencyValue(value));
    }
  };

  return (
    <div className="space-y-2">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <div className={cn("flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 transition-colors", error && "border-red-500")}>
            <span className="pl-4 text-gray-500 font-medium">R$</span>
            <input
                type="text"
                inputMode="decimal"
                className={cn("flex-1 px-2 py-4 bg-transparent text-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none appearance-none", className)}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                {...props}
            />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
