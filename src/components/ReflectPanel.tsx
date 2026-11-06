import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Feedback, FeltAfter } from '../lib/storage';

interface ReflectPanelProps {
  actionTitle: string;
  onSave: (result: { feedback?: Feedback; feltAfter?: FeltAfter }) => void;
  onGetSupport: () => void;
}

const HELPED: Array<[Feedback, string]> = [
  ['helpful', 'Yes'],
  ['somewhat', 'A little'],
  ['not_helpful', 'Not really'],
];

const FELT: Array<[FeltAfter, string]> = [
  ['better', 'A bit better'],
  ['same', 'About the same'],
  ['worse', 'Worse'],
];

function Options<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<[T, string]>;
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-medium text-white">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map(([id, label]) => (
          <label
            key={id}
            className={cn(
              'flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#a78bfa]',
              value === id ? 'border-[#7c6af7] bg-[#7c6af7]/25 text-white' : 'border-white/10 bg-white/[0.03] text-[#b8b8d0] hover:border-white/25',
            )}
          >
            <input type="radio" className="sr-only" name={legend} checked={value === id} onChange={() => onChange(id)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Stage 5: reflect. Entirely optional and brief. Completing an action is not
 * assumed to have improved anything.
 */
export function ReflectPanel({ actionTitle, onSave, onGetSupport }: ReflectPanelProps) {
  const [feedback, setFeedback] = useState<Feedback>();
  const [feltAfter, setFeltAfter] = useState<FeltAfter>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="reflect-heading"
      className="mx-auto w-full max-w-xl space-y-7 rounded-[24px] border border-white/10 bg-[#13131f] p-6 md:p-8"
    >
      <div className="space-y-2">
        <h2 id="reflect-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-white outline-none">
          You took a step.
        </h2>
        <p className="text-[#b8b8d0]">
          “{actionTitle}”. If you'd like, take a moment to notice how it went. This is optional.
        </p>
      </div>

      <Options<Feedback> legend="Did this help?" options={HELPED} value={feedback} onChange={setFeedback} />
      <Options<FeltAfter> legend="How do you feel now?" options={FELT} value={feltAfter} onChange={setFeltAfter} />

      {feltAfter === 'worse' && (
        <p className="rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-[#d4d4e4]" role="status">
          Thank you for being honest. Not every step helps every time, and that's okay. If things feel hard,{' '}
          <button type="button" onClick={onGetSupport} className="font-medium text-[#7dd3c0] underline underline-offset-4">
            support from a real person is available
          </button>
          .
        </p>
      )}

      <div className="grid gap-2 sm:auto-cols-fr sm:grid-flow-col">
        <Button
          onClick={() => onSave({ feedback, feltAfter })}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] font-bold text-white hover:opacity-90"
        >
          {feedback || feltAfter ? 'Save and finish' : 'Finish'}
        </Button>
        {(feedback || feltAfter) && (
          <Button
            variant="outline"
            onClick={() => onSave({})}
            className="h-12 rounded-2xl border-white/10 bg-transparent text-[#b8b8d0] hover:bg-white/5 hover:text-white"
          >
            Skip
          </Button>
        )}
      </div>
    </motion.section>
  );
}
