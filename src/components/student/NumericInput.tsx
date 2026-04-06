import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  step?: number;
  ariaLabel?: string;
}

/**
 * Numeric input with local state that commits to parent on blur.
 * Prevents parent re-renders on every keystroke.
 */
const NumericInput = ({
  value,
  onChange,
  placeholder = "0",
  className,
  disabled,
  min = 0,
  step,
  ariaLabel,
}: NumericInputProps) => {
  const [localValue, setLocalValue] = useState<string>(value ? String(value) : "");
  const committedRef = useRef(value);

  // Sync from parent only when the parent value changes externally
  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setLocalValue(value ? String(value) : "");
    }
  }, [value]);

  const commit = useCallback(() => {
    const num = Number(localValue) || 0;
    const clamped = min !== undefined ? Math.max(min, num) : num;
    committedRef.current = clamped;
    onChange(clamped);
  }, [localValue, min, onChange]);

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder}
      className={cn(
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        className
      )}
      disabled={disabled}
      min={min}
      step={step}
      aria-label={ariaLabel}
    />
  );
};

export default NumericInput;
