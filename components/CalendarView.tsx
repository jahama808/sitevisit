'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';

interface CalendarEvent { id: string; title: string; start: string; end?: string; allDay?: boolean; color: string; }

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
      events={events}
      eventClick={(info) => { router.push(`/visits/${info.event.id}`); }}
      height="auto"
    />
  );
}
