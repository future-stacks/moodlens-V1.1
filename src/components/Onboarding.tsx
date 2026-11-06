import React, { useState } from 'react';
import { Brain, Feather, Footprints, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from './Dialog';

const steps = [
  {
    title: 'Welcome to MoodLens',
    description:
      'From emotional clarity to meaningful action. Check in with how you feel, and MoodLens helps you understand it and find a next step.',
    icon: Brain,
    color: 'text-[#a78bfa] bg-[#7c6af7]/10',
  },
  {
    title: 'A thought for how you feel',
    description: 'Each check-in includes a thought chosen for your mood. Quotations always show their real author, and original reflections are labelled as MoodLens reflections.',
    icon: Feather,
    color: 'text-[#f0a3b5] bg-[#f76a8a]/10',
  },
  {
    title: 'One manageable step',
    description: "Then one practical action, usually 2, 5 or 10 minutes, with a smaller option if it feels like too much. Nothing is lost if you skip it.",
    icon: Footprints,
    color: 'text-[#7dd3c0] bg-[#7dd3c0]/10',
  },
  {
    title: 'Your privacy',
    description:
      "Your check-ins stay in this browser. To personalise suggestions, check-in content is sent to Google's Gemini AI service. You can turn this off in Settings. MoodLens is not a medical or emergency service.",
    icon: ShieldCheck,
    color: 'text-[#fcd34d] bg-yellow-500/10',
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const last = current === steps.length - 1;

  return (
    <Dialog title={step.title} onClose={onComplete} hideTitle className="sm:max-w-sm">
      <div className="space-y-7 pt-2 text-center" aria-live="polite">
        <div className={`mx-auto w-fit rounded-3xl p-6 ${step.color}`}>
          <step.icon className="h-11 w-11" aria-hidden />
        </div>
        <div className="space-y-3">
          <p className="text-2xl font-bold tracking-tight text-white">{step.title}</p>
          <p className="text-sm leading-relaxed text-[#b8b8d0]">{step.description}</p>
        </div>
        <div className="flex justify-center gap-1.5" aria-label={`Step ${current + 1} of ${steps.length}`} role="img">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-[#7c6af7]' : 'w-1.5 bg-white/15'}`} />
          ))}
        </div>
        <Button
          onClick={() => (last ? onComplete() : setCurrent(current + 1))}
          className="h-14 w-full rounded-2xl bg-[#7c6af7] text-lg font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-[#6b58e6]"
        >
          {last ? 'Get started' : 'Next'}
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
        </Button>
      </div>
    </Dialog>
  );
}
