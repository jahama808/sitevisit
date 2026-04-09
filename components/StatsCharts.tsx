'use client';

import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Props { barLabels: string[]; barOnTime: number[]; barLate: number[]; pieWithin14: number; pieOver14: number; }

export function StatsCharts({ barLabels, barOnTime, barLate, pieWithin14, pieOver14 }: Props) {
  return (
    <div className="row mb-4">
      <div className="col-lg-8"><div className="card border-0 shadow-sm h-100"><div className="card-body">
        <Bar
          data={{
            labels: barLabels,
            datasets: [
              { label: 'Delivered Within 14 Days', data: barOnTime, backgroundColor: 'rgba(34,197,94,0.8)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1 },
              { label: 'Delivered Outside 14 Days', data: barLate, backgroundColor: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,1)', borderWidth: 1 },
            ],
          }}
          options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Monthly Wiring Plan Delivery Turnaround' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }}
        />
      </div></div></div>
      <div className="col-lg-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex flex-column align-items-center justify-content-center">
        <Pie
          data={{
            labels: ['\u2264 14 Days', '> 14 Days'],
            datasets: [{ data: [pieWithin14, pieOver14], backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'], borderColor: ['rgba(34,197,94,1)', 'rgba(239,68,68,1)'], borderWidth: 1 }],
          }}
          options={{ responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'YTD Wiring Plan Delivery Turnaround' } } }}
        />
        <p className="text-muted mt-2 mb-0 small">Year to Date &mdash; {pieWithin14 + pieOver14} total completed</p>
      </div></div></div>
    </div>
  );
}
