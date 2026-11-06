import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Phone, ExternalLink, ArrowLeft, HeartHandshake, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RiskCategory } from '../../shared/safeguarding';
import { supportFor } from '../../shared/supportResources';

interface SupportViewProps {
  /** Set when shown because of something the user wrote. Omit for "Get support" from the menu. */
  category?: RiskCategory;
  disclosure?: boolean;
  country?: string;
  onBack: () => void;
}

/**
 * Shown instead of a quote + action when a check-in suggests someone may be at
 * risk. Deliberately plain: no AI-generated text, no suggestions, no quote.
 */
export function SupportView({ category, disclosure = true, country, onBack }: SupportViewProps) {
  const support = supportFor(country);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resources = support.resources.filter((r) => !r.onlyFor || (category && r.onlyFor.includes(category)));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="support-heading"
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      <div className="space-y-3 px-1">
        <HeartHandshake className="h-8 w-8 text-[#7dd3c0]" aria-hidden />
        <h2 id="support-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold leading-snug tracking-tight text-white outline-none md:text-3xl">
          {disclosure ? 'It sounds like things are really hard right now.' : 'Support from real people'}
        </h2>
        <p className="leading-relaxed text-[#b8b8d0]">
          {disclosure
            ? "Thank you for telling us. MoodLens can't help with this on its own, and you deserve support from a person. You don't have to go through this alone."
            : 'MoodLens is not a medical or emergency service. If you need to talk to someone, these services are free and confidential.'}
        </p>
      </div>

      <div role="note" className="flex gap-3 rounded-[20px] border border-[#f76a8a]/30 bg-[#f76a8a]/10 p-5">
        <Siren className="mt-0.5 h-5 w-5 shrink-0 text-[#f9a8b8]" aria-hidden />
        <p className="leading-relaxed text-[#fde2e8]">
          {support.emergency.text}
          {support.emergency.href && (
            <>
              {' '}
              <a href={support.emergency.href} className="font-semibold underline underline-offset-4">
                Call {support.emergency.number}
              </a>
            </>
          )}
        </p>
      </div>

      <ul className="space-y-3">
        {resources.map((r) => {
          const external = r.href.startsWith('http');
          return (
            <li key={r.name}>
              <a
                href={r.href}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-[#13131f] p-5 transition-colors hover:border-[#7dd3c0]/50 focus-visible:outline-2 focus-visible:outline-[#7dd3c0]"
              >
                <span className="rounded-xl bg-[#7dd3c0]/10 p-3 text-[#7dd3c0]">
                  {external ? <ExternalLink className="h-5 w-5" aria-hidden /> : <Phone className="h-5 w-5" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">
                    {r.name} <span className="font-normal text-[#7dd3c0]">· {r.contact}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-[#a5a5bf]">{r.description}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {country !== 'GB' && country !== undefined && (
        <p className="text-sm text-[#8b8ba5]">You can change your country in Settings to see local services.</p>
      )}

      <Button
        variant="outline"
        onClick={onBack}
        className="rounded-full border-white/10 bg-transparent text-[#b8b8d0] hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
        Back to MoodLens
      </Button>
    </motion.section>
  );
}
