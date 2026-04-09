'use client';

import { useTransition } from 'react';

interface DeleteButtonProps {
  visitId: number;
  action: (visitId: number) => Promise<void>;
}

export function DeleteButton({ visitId, action }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete request #${visitId}? This cannot be undone.`)) return;
    startTransition(() => { action(visitId); });
  }

  return (
    <button className="btn btn-sm btn-outline-danger ms-1" onClick={handleClick} disabled={pending}>Delete</button>
  );
}
