import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DurationInputProps {
  value: number; // seconds
  onChange: (seconds: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Duration input (mm:ss) with local state. Commits on blur.
 */
const DurationInput = ({
  value,
  onChange,
  placeholder = "0:00",
  className,
  disabled,
}: DurationInputProps) => {
  const formatDuration = (secs: number) =>
    secs > 0 ? `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}` : "";

  const [localValue, setLocalValue] = useState<string>(formatDuration(value));
  const committedRef = useRef(value);

  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setLocalValue(formatDuration(value));
    }
  }, [value]);

  const commit = useCallback(() => {
    const val = localValue.trim();
    let seconds = 0;
    const mmssMatch = val.match(/^(\d{1,2}):(\d{1,2})$/);
    if (mmssMatch) {
      seconds = parseInt(mmssMatch[1]) * 60 + parseInt(mmssMatch[2]);
    } else if (/^\d+$/.test(val)) {
      seconds = Number(val);
    }
    committedRef.current = seconds;
    onChange(seconds);
  }, [localValue, onChange]);

  return (
    <Input
      type="text"
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
    />
  );
};

export default DurationInput;
