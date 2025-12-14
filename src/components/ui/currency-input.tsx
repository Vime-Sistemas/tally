import { useState, useEffect } from 'react';
import { formatCurrencyValue, parseCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onValueChange: (value: number) => void;
  error?: string;
  label?: string;
  symbolClassName?: string;
  autoResize?: boolean;
}

export function CurrencyInput({ value, onValueChange, className, error, label, symbolClassName, autoResize, ...props }: CurrencyInputProps) {
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
    
    // Remove tudo que não é número
    const numbersOnly = val.replace(/\D/g, '');
    
    // Converte para número para remover zeros à esquerda
    const numValue = parseInt(numbersOnly, 10) || 0;
    
    // Formata baseado no número (sem zeros à esquerda)
    let formatted = '';
    if (numValue === 0) {
      formatted = '';
    } else if (numValue < 100) {
      formatted = `0,${String(numValue).padStart(2, '0')}`;
    } else {
      const str = String(numValue);
      const reais = str.slice(0, -2);
      const centavos = str.slice(-2);
      
      // Adiciona separador de milhar
      const reaisFormatado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formatted = `${reaisFormatado},${centavos}`;
    }
    
    setDisplayValue(formatted);
    
    // Calcula o número e passa para o parent
    const number = parseCurrency(formatted);
    onValueChange(number);
  };

  const handleBlur = () => {
    if (displayValue && value) {
      setDisplayValue(formatCurrencyValue(value));
    }
  };

  if (autoResize) {
    return (
      <div className="space-y-2 w-full flex flex-col items-center">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <div className={cn(
          "inline-flex items-center justify-center bg-white rounded-xl border border-gray-200 focus-within:border-black focus-within:ring-black focus-within:ring-1 transition-colors px-4 py-4 shadow-sm max-w-full overflow-hidden min-w-[140px]",
          error && "border-red-500"
        )}>
          <span className={cn("text-gray-400 font-medium mr-2 shrink-0", symbolClassName)}>R$</span>
          <div className="relative grid place-items-center max-w-full overflow-hidden">
            {/* Ghost element to determine width */}
            <span className={cn("invisible col-start-1 row-start-1 whitespace-pre px-1", className)}>
              {displayValue || props.placeholder || "0,00"}
            </span>
            <input
              type="text"
              inputMode="decimal"
              className={cn(
                "col-start-1 row-start-1 w-full h-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none appearance-none text-left",
                className
              )}
              value={displayValue}
              onChange={handleChange}
              onBlur={handleBlur}
              {...props}
            />
          </div>
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <div className={cn("flex items-center bg-white rounded-xl border border-gray-200 focus-within:border-black focus-within:ring-black focus-within:ring-1 transition-colors px-4 py-4 shadow-sm", error && "border-red-500")}>
            <span className={cn("text-gray-400 font-medium mr-2", symbolClassName)}>R$</span>
            <input
                type="text"
                inputMode="decimal"
                className={cn("flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none appearance-none", className)}
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
