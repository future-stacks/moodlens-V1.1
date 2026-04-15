import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  RotateCcw, 
  BookOpen 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Intervention {
  action: string;
  reframe: string;
  nextStep: string;
  reflection?: string;
  quote: string;
  author: string;
  journalPrompt: string;
}

interface InterventionCardProps {
  mood: string;
  intervention: Intervention;
  onComplete: () => void;
  onReset: () => void;
  onRefresh: () => void;
}

export function InterventionCard({ mood, intervention, onComplete, onReset, onRefresh }: InterventionCardProps) {
  const copyQuote = () => {
    const text = `"${intervention.quote}" — ${intervention.author}`;
    navigator.clipboard.writeText(text);
    toast.success("Quote copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="bg-[#13131f] border border-white/10 rounded-[24px] p-8 md:p-10 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c6af7]/15 border border-[#7c6af7]/30 text-[#a78bfa] text-xs font-bold uppercase tracking-widest mb-8">
          <span className="text-base">✨</span>
          {mood}
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative pl-6">
            <span className="absolute left-0 top-[-10px] text-4xl text-[#7c6af7] font-serif opacity-50">"</span>
            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
              {intervention.quote}
            </p>
          </div>
          <p className="pl-6 text-sm text-[#6b6b85]">
            — {intervention.author}
          </p>
        </div>

        <div className="h-px bg-white/10 my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7c6af7]">
              <Zap className="w-3 h-3" />
              Micro-Action
            </div>
            <p className="text-sm text-[#b8b8d0] leading-relaxed">
              {intervention.action}
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7c6af7]">
              <RotateCcw className="w-3 h-3" />
              Reframe
            </div>
            <p className="text-sm text-[#b8b8d0] leading-relaxed">
              {intervention.reframe}
            </p>
          </div>

          <div className="md:col-span-2 bg-[#f76a8a]/5 border border-[#f76a8a]/15 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#f76a8a]">
              <BookOpen className="w-3 h-3" />
              Journal Prompt
            </div>
            <p className="text-sm text-[#b8b8d0] leading-relaxed">
              {intervention.journalPrompt}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-white/10 text-[#6b6b85] hover:bg-white/5 hover:text-white"
            onClick={onRefresh}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            New Insight
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-white/10 text-[#6b6b85] hover:bg-white/5 hover:text-white"
            onClick={copyQuote}
          >
            <Copy className="w-3.5 h-3.5 mr-2" />
            Copy Quote
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-white/10 text-[#6b6b85] hover:bg-white/5 hover:text-white"
            onClick={onReset}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <Button 
        size="lg" 
        className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] hover:opacity-90 transition-all shadow-xl shadow-purple-900/20"
        onClick={onComplete}
      >
        Action Completed
      </Button>
    </motion.div>
  );
}
