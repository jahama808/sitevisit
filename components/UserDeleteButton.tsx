'use client';

import { useTransition } from 'react';

interface UserDeleteButtonProps {
  userId: string;
  username: string;
  action: (userId: string) => Promise<void>;
}

export function UserDeleteButton({ userId, username, action }: UserDeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete user "${username}"? This will deactivate the account.`)) return;
    startTransition(() => { action(userId); });
  }

  return (
    <button className="btn btn-sm btn-outline-danger ms-1" onClick={handleClick} disabled={pending}>
      Delete
    </button>
  );
}
