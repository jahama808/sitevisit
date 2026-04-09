'use client';

import { useState } from 'react';

interface VisitRow {
  request_status: string;
  wiring_plan_status: string;
  created_at: string;
}

interface StatsHeaderProps {
  visits: VisitRow[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function StatsHeader({ visits }: StatsHeaderProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [mode, setMode] = useState<'ytd' | 'month'>('ytd');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const filtered = visits.filter((v) => {
    const d = new Date(v.created_at);
    if (mode === 'ytd') {
      return d.getFullYear() === currentYear;
    }
    return d.getFullYear() === currentYear && d.getMonth() === selectedMonth;
  });

  const totalVisits = filtered.length;
  const wiringCompleted = filtered.filter((v) => v.wiring_plan_status === 'sent').length;
  const wiringPending = filtered.filter((v) => v.wiring_plan_status !== 'sent').length;

  const label = mode === 'ytd' ? `Year to Date (${currentYear})` : `${MONTHS[selectedMonth]} ${currentYear}`;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${mode === 'ytd' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMode('ytd')}
          >
            Year to Date
          </button>
          <button
            className={`btn ${mode === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMode('month')}
          >
            By Month
          </button>
        </div>
        {mode === 'month' && (
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        )}
        <span className="small text-muted">{label}</span>
      </div>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card stat-card p-3">
            <div className="label">Total Site Visits</div>
            <div className="value">{totalVisits}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stat-card p-3">
            <div className="label">Wiring Plans Completed</div>
            <div className="value" style={{ color: 'rgba(34, 197, 94, 1)' }}>{wiringCompleted}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stat-card p-3">
            <div className="label">Wiring Plans Pending</div>
            <div className="value" style={{ color: 'rgba(239, 68, 68, 1)' }}>{wiringPending}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
