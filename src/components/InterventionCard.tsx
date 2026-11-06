import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, RefreshCw, Clock, Footprints, Feather, BookOpen, Check, ChevronDown, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Intervention, Quote } from '../../shared/intervention';

export type ActionChoice = 'main' | 'alternative';

interface InterventionCardProps {
  moodLabel: string;
  intervention: Intervention;
  /** True while another suggestion is being fetched. */
  busy?: boolean;
  onComplete: (choice: ActionChoice) => void;
  onSmaller?: () => void;
  onAnother: () => void;
  /** Record that this suggestion didn't fit, then offer something different. */
  onNotHelpful: () => void;
  onBack: () => void;
}

export function quoteLabel(quote: Quote) {
  return quote.type === 'curated_quote' ? 'A thought to carry' : 'A MoodLens reflection';
}

export function QuoteCard({ quote }: { quote: Quote }) {
  const copy = async () => {
    const text = quote.type === 'curated_quote' ? `“${quote.text}” — ${quote.author}` : `“${quote.text}” — MoodLens`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error("Couldn't copy. Your browser blocked clipboard access.");
    }
  };

  return (
    <figure className="relative overflow-hidden rounded-[24px] border border-[#7c6af7]/25 bg-gradient-to-br from-[#1b1830] via-[#151426] to-[#13131f] p-7 md:p-10">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#7c6af7]/15 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a78bfa]">
          <Feather className="h-3.5 w-3.5" aria-hidden />
          {quoteLabel(quote)}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy thought"
          className="rounded-full p-2 text-[#8b8ba5] transition-colors hover:bg-white/5 hover:text-white"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <blockquote className="relative mt-5 text-[1.35rem] leading-snug font-medium tracking-tight text-white md:text-[1.75rem] text-balance">
        “{quote.text}”
      </blockquote>
      {quote.type === 'curated_quote' && (
        <figcaption className="relative mt-5 text-sm text-[#a5a5bf]">
          — {quote.author}
          {quote.source && <span className="text-[#8b8ba5]">, <cite className="not-italic">{quote.source}</cite></span>}
        </figcaption>
      )}
    </figure>
  );
}

export function InterventionCard({ moodLabel, intervention, busy, onComplete, onSmaller, onAnother, onNotHelpful, onBack }: InterventionCardProps) {
  const [choice, setChoice] = useState<ActionChoice>('main');
  const [showPrompt, setShowPrompt] = useState(false);
  const active = choice === 'main' ? intervention.action : intervention.alternative_action;

  const toggleSmaller = () => {
    const next = choice === 'main' ? 'alternative' : 'main';
    setChoice(next);
    if (next === 'alternative') onSmaller?.();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl space-y-5"
      aria-labelledby="ack-heading"
    >
      {/* Understand */}
      <section className="space-y-3 px-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#7c6af7]/30 bg-[#7c6af7]/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#c4b5fd]">
          {moodLabel}
        </div>
        <h2 id="ack-heading" className="text-2xl font-semibold leading-snug tracking-tight text-white md:text-3xl text-balance">
          {intervention.acknowledgement}
        </h2>
        <p className="text-base leading-relaxed text-[#b8b8d0]">{intervention.reflection}</p>
      </section>

      {/* Thought */}
      <QuoteCard quote={intervention.quote} />

      {/* Action */}
      <section aria-labelledby="action-heading" className="rounded-[24px] border border-white/10 bg-[#13131f] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="action-heading" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7dd3c0]">
            <Footprints className="h-3.5 w-3.5" aria-hidden />
            {choice === 'main' ? 'Your next step' : 'A smaller step'}
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[#b8b8d0]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            About {active.duration_minutes} min
          </span>
        </div>
        <p className="mt-4 text-lg font-semibold text-white">{active.title}</p>
        <p className="mt-2 leading-relaxed text-[#b8b8d0]">{active.description}</p>

        <button
          type="button"
          onClick={toggleSmaller}
          className="mt-5 text-left text-sm font-medium text-[#a78bfa] underline-offset-4 hover:underline"
        >
          {choice === 'main' ? `That feels like a lot. Show me something smaller (${intervention.alternative_action.duration_minutes} min)` : 'Back to the original suggestion'}
        </button>
      </section>

      {intervention.journal_prompt && (
        <section className="rounded-[20px] border border-[#f76a8a]/15 bg-[#f76a8a]/5">
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            aria-expanded={showPrompt}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-[#f0a3b5]"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" aria-hidden />
              If you'd like something to reflect on
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {showPrompt && <p className="px-5 pb-5 leading-relaxed text-[#d8c4cb]">{intervention.journal_prompt}</p>}
        </section>
      )}

      <div className="space-y-3 pt-1">
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] text-base font-bold text-white shadow-xl shadow-purple-900/20 hover:opacity-90"
          onClick={() => onComplete(choice)}
        >
          <Check className="mr-2 h-5 w-5" aria-hidden />
          I did it
        </Button>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="rounded-full border-white/10 bg-transparent text-[#b8b8d0] hover:bg-white/5 hover:text-white"
            onClick={onAnother}
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            Suggest something else
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="rounded-full border-white/10 bg-transparent text-[#b8b8d0] hover:bg-white/5 hover:text-white"
            onClick={onNotHelpful}
          >
            <ThumbsDown className="mr-2 h-3.5 w-3.5" aria-hidden />
            This isn't helpful
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/10 bg-transparent text-[#b8b8d0] hover:bg-white/5 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" aria-hidden />
            Start over
          </Button>
        </div>
        {intervention.origin === 'library' && (
          <p className="text-center text-xs text-[#8b8ba5]">This suggestion comes from MoodLens' built-in library.</p>
        )}
      </div>
    </motion.article>
  );
}
