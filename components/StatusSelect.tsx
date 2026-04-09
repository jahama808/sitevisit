'use client';

import { useTransition } from 'react';

interface StatusSelectProps {
  visitId: number;
  field: string;
  currentValue: string;
  options: { value: string; label: string }[];
  action: (visitId: number, field: string, value: string) => Promise<void>;
}

export function StatusSelect({ visitId, field, currentValue, options, action }: StatusSelectProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => { action(visitId, field, e.target.value); });
  }

  return (
    <select className="form-select form-select-sm" value={currentValue} onChange={handleChange} disabled={pending}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}
