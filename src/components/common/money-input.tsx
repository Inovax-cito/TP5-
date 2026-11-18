"use client";

import { Input } from "@/components/ui/input";
import { formatAmount, parseAmount } from "@/lib/format";

/** Campo de importe en pesos argentinos; el valor viaja en centavos. */
export function MoneyInput({
  value,
  onChange,
  id,
  disabled,
  placeholder = "0,00",
  className,
}: {
  value: number;
  onChange: (centavos: number) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      id={id}
      inputMode="decimal"
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      value={value === 0 ? "" : formatAmount(value)}
      onChange={(e) => onChange(parseAmount(e.target.value) ?? 0)}
    />
  );
}
