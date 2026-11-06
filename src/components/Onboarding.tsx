import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Flame, History, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to MoodLens",
    description: "A habit support tool for high-performing individuals. We focus on action over reflection.",
    icon: Brain,
    color: "text-[#7c6af7]",
    bg: "bg-[#7c6af7]/10"
  },
  {
    title: "Mood → Action",
    description: "Tell us how you feel, and we'll give you a micro-intervention that takes less than 2 minutes.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10"
  },
  {
    title: "Build Momentum",
    description: "Small steps add up. MoodLens shows how often you've checked in this week, with no streaks to break and nothing to lose if you take a day off.",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    title: "Track Your Growth",
    description: "View your history of interventions to see patterns in your state and how you overcame them.",
    icon: History,
    color: "text-[#f76a8a]",
    bg: "bg-[#f76a8a]/10"
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

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
        className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-[#6b6b85] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-8">
          <div className="flex justify-center">
            <div className={`p-6 rounded-3xl ${step.bg}`}>
              <step.icon className={`w-12 h-12 ${step.color}`} />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{step.title}</h2>
            <p className="text-[#6b6b85] text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-8 bg-[#7c6af7]" : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={next}
            className="w-full h-14 rounded-2xl bg-[#7c6af7] hover:bg-[#6b58e6] text-white font-bold text-lg shadow-lg shadow-purple-900/20"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
