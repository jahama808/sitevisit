'use client';

import { useEffect, useRef } from 'react';

export function SearchInput() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;

    function handleInput() {
      const q = input!.value.toLowerCase();
      document.querySelectorAll('.queue-table tbody').forEach((tbody) => {
        tbody.querySelectorAll('tr').forEach((row) => {
          const propCell = (row as HTMLTableRowElement).cells[1];
          if (!propCell) return;
          (row as HTMLElement).style.display = propCell.textContent!.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, []);

  return <input ref={ref} type="text" className="form-control" placeholder="Search by property name\u2026" />;
}
