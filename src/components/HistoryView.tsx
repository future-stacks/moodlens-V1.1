import React from 'react';
import { format } from 'date-fns';
import { History, Calendar, Feather, Footprints } from 'lucide-react';
import { Dialog } from './Dialog';
import type { CheckIn } from '../lib/storage';
import { actionTitle } from '../lib/insights';
import { moodLabel } from '../../shared/moods';

const FEEDBACK_LABEL = { helpful: 'Helped', somewhat: 'Helped a little', not_helpful: "Didn't help" } as const;
const FELT_LABEL = { better: 'Felt a bit better', same: 'Felt about the same', worse: 'Felt worse' } as const;

function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' }) {
  return (
    <span
      className={
        tone === 'good'
          ? 'rounded-full bg-[#7dd3c0]/10 px-2.5 py-0.5 text-xs text-[#9fe3d3]'
          : 'rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-[#b8b8d0]'
      }
    >
      {children}
    </span>
  );
}

export function HistoryEntry({ item }: { item: CheckIn }) {
  const action = actionTitle(item);
  const quote = item.intervention?.quote;
  return (
    <li className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#7c6af7]/25 bg-[#7c6af7]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#c4b5fd] uppercase">
          {moodLabel(item.mood)}
        </span>
        <time dateTime={item.createdAt} className="text-xs text-[#8b8ba5]">
          {format(new Date(item.createdAt), 'EEE d MMM, HH:mm')}
        </time>
      </div>

      {quote && (
        <p className="flex gap-2 text-sm leading-relaxed text-[#d4d4e4]">
          <Feather className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]" aria-hidden />
          <span>
            “{quote.text}”{quote.type === 'curated_quote' && <span className="text-[#8b8ba5]"> — {quote.author}</span>}
          </span>
        </p>
      )}

      {action && (
        <p className="flex gap-2 text-sm leading-relaxed text-[#b8b8d0]">
          <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-[#7dd3c0]" aria-hidden />
          <span>
            {item.completedAt ? '' : 'Suggested: '}
            {action}
          </span>
        </p>
      )}

      {(item.completedAt || item.feedback || item.feltAfter) && (
        <div className="flex flex-wrap gap-1.5">
          {item.completedAt && <Tag tone="good">Done</Tag>}
          {item.feedback && <Tag tone={item.feedback === 'not_helpful' ? 'neutral' : 'good'}>{FEEDBACK_LABEL[item.feedback]}</Tag>}
          {item.feltAfter && <Tag>{FELT_LABEL[item.feltAfter]}</Tag>}
        </div>
      )}
    </li>
  );
}

export function HistoryView({ checkIns, onClose }: { checkIns: CheckIn[]; onClose: () => void }) {
  const items = [...checkIns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Dialog title="Your check-ins" icon={History} iconClassName="bg-[#f76a8a]/10 text-[#f76a8a]" onClose={onClose}>
      {items.length === 0 ? (
        <div className="space-y-4 py-16 text-center">
          <div className="mx-auto w-fit rounded-full bg-white/5 p-4">
            <Calendar className="h-8 w-8 text-[#8b8ba5]" aria-hidden />
          </div>
          <p className="text-[#a5a5bf]">
            Nothing here yet.
            <br />
            Your check-ins will appear here, stored only in this browser.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <HistoryEntry key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Dialog>
  );
}
