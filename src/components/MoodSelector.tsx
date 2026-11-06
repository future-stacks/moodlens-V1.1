import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MOODS } from '../../shared/moods';

interface MoodSelectorProps {
  onSelect: (mood: string) => void;
  activeMood?: string | null;
}

export function MoodSelector({ onSelect, activeMood }: MoodSelectorProps) {
  return (
    <div role="group" aria-label="How are you feeling?" className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2.5">
      {MOODS.map((mood, index) => {
        const active = activeMood === mood.id;
        return (
          <motion.button
            key={mood.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(mood.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a78bfa]',
              active
                ? 'border-[#7c6af7] bg-[#7c6af7] text-white shadow-[0_4px_20px_rgba(124,106,247,0.4)]'
                : 'border-white/10 bg-[#13131f] text-[#e8e8f0] hover:border-[#7c6af7] hover:bg-[#7c6af7]/10',
            )}
          >
            <span aria-hidden>{mood.emoji}</span>
            <span>{mood.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
