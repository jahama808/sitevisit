'use client';

import { useTransition } from 'react';

interface DateInputProps {
  visitId: number;
  field: string;
  value: string | null;
  action: (visitId: number, field: string, value: string) => Promise<void>;
}

export function DateInput({ visitId, field, value, action }: DateInputProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    startTransition(() => { action(visitId, field, e.target.value); });
  }

  return (
    <input type="date" className="form-control form-control-sm" value={value ?? ''} onChange={handleChange} disabled={pending} />
  );
}
