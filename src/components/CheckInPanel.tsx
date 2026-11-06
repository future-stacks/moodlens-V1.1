import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MoodSelector } from './MoodSelector';
import { CONTRIBUTORS, NEEDS, type ContributorId, type NeedId } from '../../shared/moods';
import type { CheckInRequest } from '../../shared/intervention';

export type CheckInInput = Omit<CheckInRequest, 'exclude' | 'country'>;

interface CheckInPanelProps {
  aiEnabled: boolean;
  onSubmit: (input: CheckInInput) => void;
}

const ENERGY = ['Very low', 'Low', 'Okay', 'Good', 'High'];
const LOAD = ['Light', 'Some', 'Busy', 'Heavy', 'Too much'];

function Scale({
  legend,
  labels,
  value,
  onChange,
}: {
  legend: string;
  labels: string[];
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#d4d4e4]">{legend}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {labels.map((label, i) => {
          const v = i + 1;
          const checked = value === v;
          return (
            <label
              key={label}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-1 text-center text-xs leading-tight transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#a78bfa]',
                checked ? 'border-[#7c6af7] bg-[#7c6af7]/25 text-white' : 'border-white/10 bg-white/[0.03] text-[#b8b8d0] hover:border-white/25',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={legend}
                value={v}
                checked={checked}
                onChange={() => onChange(v)}
                onClick={() => checked && onChange(undefined)}
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-9 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#a78bfa]',
        selected ? 'border-[#7c6af7] bg-[#7c6af7]/25 text-white' : 'border-white/10 bg-white/[0.03] text-[#b8b8d0] hover:border-white/25',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Stage 1: check in. Only the mood is required; everything else is optional
 * and tucked away so a check-in can take a few seconds.
 */
export function CheckInPanel({ aiEnabled, onSubmit }: CheckInPanelProps) {
  const [moodId, setMoodId] = useState<string | null>(null);
  const [ownWords, setOwnWords] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [energy, setEnergy] = useState<number>();
  const [mentalLoad, setMentalLoad] = useState<number>();
  const [contributors, setContributors] = useState<ContributorId[]>([]);
  const [need, setNeed] = useState<NeedId>();
  const [note, setNote] = useState('');

  const mood = ownWords.trim() || moodId;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;
    onSubmit({
      mood,
      energy,
      mentalLoad,
      contributors: contributors.length ? contributors : undefined,
      need,
      note: note.trim() || undefined,
    });
  };

  const toggleContributor = (id: ContributorId) =>
    setContributors((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-8" aria-label="Check in">
      <div className="space-y-4">
        <h2 className="text-center text-[11px] font-bold tracking-[0.2em] text-[#8b8ba5] uppercase">Pick the closest feeling</h2>
        <MoodSelector
          activeMood={ownWords.trim() ? null : moodId}
          onSelect={(id) => {
            setMoodId((prev) => (prev === id ? null : id));
            setOwnWords('');
          }}
        />
      </div>

      <div className="mx-auto max-w-md space-y-2">
        <label htmlFor="own-words" className="sr-only">
          Or describe it in your own words
        </label>
        <Input
          id="own-words"
          value={ownWords}
          maxLength={100}
          onChange={(e) => setOwnWords(e.target.value)}
          placeholder="Or describe it in your own words…"
          className="h-12 rounded-full border-white/10 bg-[#13131f] px-6 text-base focus:border-[#7c6af7]"
        />
      </div>

      <div className="rounded-[20px] border border-white/10 bg-[#13131f]/60">
        <button
          type="button"
          onClick={() => setShowContext((v) => !v)}
          aria-expanded={showContext}
          aria-controls="checkin-context"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-medium text-white">Add a little context</span>
            <span className="block text-xs text-[#8b8ba5]">Optional. It helps make the suggestion fit.</span>
          </span>
          <ChevronDown className={cn('h-4 w-4 text-[#8b8ba5] transition-transform', showContext && 'rotate-180')} aria-hidden />
        </button>

        {showContext && (
          <div id="checkin-context" className="space-y-6 border-t border-white/5 px-5 pt-5 pb-6">
            <Scale legend="Energy" labels={ENERGY} value={energy} onChange={setEnergy} />
            <Scale legend="Mental load" labels={LOAD} value={mentalLoad} onChange={setMentalLoad} />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#d4d4e4]">What's contributing?</legend>
              <div className="flex flex-wrap gap-2">
                {CONTRIBUTORS.map((c) => (
                  <Chip key={c.id} selected={contributors.includes(c.id)} onClick={() => toggleContributor(c.id)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#d4d4e4]">What do you need most right now?</legend>
              <div className="flex flex-wrap gap-2">
                {NEEDS.map((n) => (
                  <Chip key={n.id} selected={need === n.id} onClick={() => setNeed((prev) => (prev === n.id ? undefined : n.id))}>
                    {n.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="checkin-note" className="text-sm font-medium text-[#d4d4e4]">
                Anything else? <span className="font-normal text-[#8b8ba5]">(optional)</span>
              </label>
              <textarea
                id="checkin-note"
                value={note}
                maxLength={280}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                aria-describedby="checkin-note-hint"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-[#6b6b85] focus:border-[#7c6af7] focus:outline-none"
                placeholder="A sentence or two about what's going on"
              />
              <p id="checkin-note-hint" className="text-xs text-[#8b8ba5]">
                {aiEnabled
                  ? 'To personalise your suggestion, what you choose and write here is sent to Google Gemini. Avoid names or details that identify anyone.'
                  : 'AI suggestions are off, so nothing you write leaves this device.'}{' '}
                {note.length}/280
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!mood}
        className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] text-base font-bold text-white shadow-xl shadow-purple-900/20 hover:opacity-90 disabled:opacity-40"
      >
        Find my next step
        <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
      </Button>
    </form>
  );
}
