"use client";

import { useBetSlip, type SlipSelection } from "@/lib/betslip";
import { odds } from "@/lib/format";

interface Props {
  pick: SlipSelection;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function OddsButton({ pick, label, disabled, className }: Props) {
  const { toggle, isSelected } = useBetSlip();
  const selected = isSelected(pick.oddsId);
  return (
    <button
      type="button"
      className={`odds-btn ${className ?? ""}`}
      data-selected={selected}
      disabled={disabled}
      onClick={() => toggle(pick)}
      aria-pressed={selected}
    >
      {label && <span className={`text-[11px] font-medium leading-tight ${selected ? "text-brand-ink/80" : "text-muted"}`}>{label}</span>}
      <span>{odds(pick.price)}</span>
    </button>
  );
}
