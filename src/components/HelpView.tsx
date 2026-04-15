import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, X, Info, Zap, Flame, Shield } from 'lucide-react';

interface HelpViewProps {
  onClose: () => void;
}

const faqs = [
  {
    question: "What is MoodLens?",
    answer: "MoodLens is a habit support tool designed for high-functioning individuals who struggle with consistency and overthinking. It turns your current emotional state into a productive signal.",
    icon: Info
  },
  {
    question: "Why micro-actions?",
    answer: "Big goals often lead to paralysis. By focusing on actions that take less than 2 minutes, we bypass the brain's resistance and build momentum through small wins.",
    icon: Zap
  },
  {
    question: "How do streaks work?",
    answer: "Complete at least one micro-intervention every 24 hours to maintain your streak. If you miss a day, the system resets to help you focus on the next small win rather than past failures.",
    icon: Flame
  },
  {
    question: "Is my data private?",
    answer: "Currently, all your data (history, streaks, profile) is stored locally in your browser. We don't track your personal identity or sell your mood data.",
    icon: Shield
  }
];

export function HelpView({ onClose }: HelpViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0d0d14]/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-md w-full h-[80vh] shadow-2xl relative flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7c6af7]/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-[#7c6af7]" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Help & FAQ</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#6b6b85] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {faqs.map((faq, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-2 text-[#7c6af7]">
                <faq.icon className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">{faq.question}</h3>
              </div>
              <p className="text-sm text-[#b8b8d0] leading-relaxed pl-6">
                {faq.answer}
              </p>
            </div>
          ))}

          <div className="pt-8 border-t border-white/5">
            <div className="bg-[#7c6af7]/5 border border-[#7c6af7]/10 rounded-2xl p-5">
              <p className="text-xs text-[#6b6b85] text-center italic">
                "Consistency is the antidote to overthinking."
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
