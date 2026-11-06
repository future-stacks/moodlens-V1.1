import React from 'react';
import { CalendarCheck } from 'lucide-react';

/**
 * Replaces the V1.1 streak. A simple, non-punitive count: no resets, no
 * "don't break the chain", nothing to lose by not opening the app.
 */
export function WeeklyCheckins({ count }: { count: number }) {
  const message =
    count === 0
      ? 'No check-ins yet this week. Whenever you need it, MoodLens is here.'
      : `You checked in ${count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`} this week.`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#13131f] px-5 py-4" aria-live="polite">
      <span className="rounded-xl bg-[#7dd3c0]/10 p-2 text-[#7dd3c0]">
        <CalendarCheck className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm leading-snug text-[#d4d4e4]">{message}</p>
    </div>
  );
}
