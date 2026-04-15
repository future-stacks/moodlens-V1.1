import React from 'react';
import { motion } from 'motion/react';
import { 
  Wind, 
  Battery, 
  Layers, 
  Coffee, 
  Zap, 
  Target,
  Smile,
  CloudRain
} from 'lucide-react';
import { cn } from '@/lib/utils';

const moods = [
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥' },
  { id: 'sad', label: 'Sad', emoji: '🌧' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'stuck', label: 'Stuck', emoji: '🪨' },
  { id: 'inspired', label: 'Inspired', emoji: '✨' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'angry', label: 'Angry', emoji: '⚡' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌅' },
  { id: 'lost', label: 'Lost', emoji: '🧭' },
];

interface MoodSelectorProps {
  onSelect: (mood: string) => void;
  activeMood?: string | null;
}

export function MoodSelector({ onSelect, activeMood }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center max-w-xl mx-auto">
      {moods.map((mood, index) => (
        <motion.button
          key={mood.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mood.id)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-sm font-medium",
            activeMood === mood.id
              ? "bg-[#7c6af7] border-[#7c6af7] text-white shadow-[0_4_20px_rgba(124,106,247,0.4)]"
              : "bg-[#13131f] border-white/10 text-[#e8e8f0] hover:border-[#7c6af7] hover:bg-[#7c6af7]/10"
          )}
        >
          <span>{mood.emoji}</span>
          <span>{mood.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
