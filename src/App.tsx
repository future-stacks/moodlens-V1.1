import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoodSelector } from './components/MoodSelector';
import { InterventionCard } from './components/InterventionCard';
import { StreakDisplay } from './components/StreakDisplay';
import { Onboarding } from './components/Onboarding';
import { HistoryView } from './components/HistoryView';
import { HelpView } from './components/HelpView';
import { AuthView } from './components/AuthView';
import { SupportView } from './components/SupportView';
import type { RiskCategory } from '../shared/safeguarding';
import { requestIntervention } from './lib/api';
import type { Intervention } from '../shared/intervention';
import { moodLabel } from '../shared/moods';
import { toast } from 'sonner';
import { Brain, Sparkles, ArrowRight, History as HistoryIcon, HelpCircle, User as UserIcon, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HistoryItem {
  id: string;
  mood: string;
  action: string;
  timestamp: string;
}

export default function App() {
  const [mood, setMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState('');
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [shownActions, setShownActions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [support, setSupport] = useState<{ category?: RiskCategory; disclosure: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedStreak = localStorage.getItem('moodlens_streak');
    const lastCompleted = localStorage.getItem('moodlens_last_completed');
    const savedHistory = localStorage.getItem('moodlens_history');
    const hasSeenOnboarding = localStorage.getItem('moodlens_onboarding_seen');
    const savedUser = localStorage.getItem('moodlens_current_user');
    
    if (savedUser) {
      setCurrentUser(savedUser);
    }

    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    if (savedStreak) {
      const streakVal = parseInt(savedStreak);
      if (lastCompleted) {
        const lastDate = new Date(lastCompleted);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays > 1) {
          setStreak(0);
          localStorage.setItem('moodlens_streak', '0');
          toast.info("Streak reset. Let's get back on track with a small win.");
        } else {
          setStreak(streakVal);
        }
      } else {
        setStreak(streakVal);
      }
    }
  }, []);

  const handleMoodSelect = async (selectedMood: string) => {
    setMood(selectedMood);
    setLoading(true);
    const result = await requestIntervention({ mood: selectedMood });
    setLoading(false);
    if (result.kind === 'support') {
      setMood(null);
      setSupport({ category: result.category, disclosure: true });
      return;
    }
    setIntervention(result.intervention);
    setShownActions([result.intervention.action.title]);
  };

  const handleAnother = async () => {
    if (!mood) return;
    setRefreshing(true);
    const result = await requestIntervention({ mood, exclude: shownActions });
    setRefreshing(false);
    if (result.kind !== 'intervention') return;
    setIntervention(result.intervention);
    setShownActions((prev) => [...prev, result.intervention.action.title]);
  };

  const handleCustomMoodSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (customMood.trim()) {
      handleMoodSelect(customMood.trim());
    }
  };

  const handleComplete = (choice: 'main' | 'alternative') => {
    if (!intervention) return;
    const newStreak = streak + 1;
    setStreak(newStreak);
    const now = new Date().toISOString();
    
    const newHistoryItem: HistoryItem = {
      id: crypto.randomUUID(),
      mood: mood || 'custom',
      action: (choice === 'main' ? intervention.action : intervention.alternative_action).title,
      timestamp: now
    };
    
    const updatedHistory = [...history, newHistoryItem];
    setHistory(updatedHistory);
    
    localStorage.setItem('moodlens_streak', newStreak.toString());
    localStorage.setItem('moodlens_last_completed', now);
    localStorage.setItem('moodlens_history', JSON.stringify(updatedHistory));
    
    toast.success("Action completed! Streak maintained.");
    setMood(null);
    setIntervention(null);
    setCustomMood('');
  };

  const handleReset = () => {
    setMood(null);
    setIntervention(null);
    setCustomMood('');
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('moodlens_onboarding_seen', 'true');
  };

  const handleAuthSuccess = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('moodlens_current_user', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('moodlens_current_user');
    toast.info("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-[#e8e8f0] font-sans selection:bg-[#7c6af7]/30 pb-20">
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
        {showHistory && <HistoryView history={history} onClose={() => setShowHistory(false)} />}
        {showHelp && <HelpView onClose={() => setShowHelp(false)} />}
        {showAuth && <AuthView onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} />}
      </AnimatePresence>

      <header className="pt-16 pb-12 text-center space-y-4 max-w-2xl mx-auto px-6 relative">
        <div className="absolute top-16 right-6 flex gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 bg-[#13131f] border border-white/10 rounded-xl text-[#6b6b85] hover:text-white transition-all hover:border-[#7c6af7]/50"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 bg-[#13131f] border border-white/10 rounded-xl text-[#6b6b85] hover:text-white transition-all hover:border-[#7c6af7]/50"
            title="View History"
          >
            <HistoryIcon className="w-5 h-5" />
          </button>
          {currentUser ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-[#13131f] border border-white/10 rounded-xl text-[#6b6b85] hover:text-white transition-all hover:border-red-500/50"
              title="Logout"
            >
              <UserIcon className="w-4 h-4" />
              <span className="text-xs font-bold">{currentUser}</span>
              <LogOut className="w-3 h-3 ml-1" />
            </button>
          ) : (
            <button 
              onClick={() => setShowAuth(true)}
              className="p-2 bg-[#13131f] border border-white/10 rounded-xl text-[#6b6b85] hover:text-white transition-all hover:border-[#7c6af7]/50"
              title="Login / Register"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[13px] font-bold tracking-[0.3em] uppercase text-[#7c6af7]"
        >
          MoodLens
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-br from-white via-white to-[#7c6af7] bg-clip-text text-transparent"
        >
          What are you<br />feeling right now?
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#6b6b85] text-base md:text-lg"
        >
          Turn your mood into a moment of growth — not just a quote.
        </motion.p>
      </header>

      <main className="max-w-4xl mx-auto px-6 space-y-12">
        <AnimatePresence mode="wait">
          {support ? (
            <SupportView key="support" category={support.category} disclosure={support.disclosure} onBack={() => setSupport(null)} />
          ) : !mood ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#6b6b85] text-center">
                  Pick a mood
                </div>
                <MoodSelector onSelect={handleMoodSelect} activeMood={mood} />
              </div>

              <form 
                onSubmit={handleCustomMoodSubmit}
                className="flex gap-3 max-w-md mx-auto w-full"
              >
                <Input 
                  value={customMood}
                  onChange={(e) => setCustomMood(e.target.value)}
                  placeholder="Or type your own mood..."
                  className="rounded-full bg-[#13131f] border-white/10 h-12 px-6 focus:border-[#7c6af7] transition-all"
                />
                <Button 
                  type="submit"
                  disabled={!customMood.trim()}
                  className="rounded-full h-12 px-8 bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] font-bold hover:opacity-90 transition-all"
                >
                  Reflect <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="max-w-xs mx-auto">
                <StreakDisplay streak={streak} />
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="w-10 h-10 border-2 border-white/10 border-t-[#7c6af7] rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6b6b85] animate-pulse">
                Fetching your signal...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="intervention"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {intervention && (
                <InterventionCard
                  moodLabel={moodLabel(mood)}
                  intervention={intervention}
                  busy={refreshing}
                  onComplete={handleComplete}
                  onAnother={handleAnother}
                  onBack={handleReset}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 text-center space-y-4 px-6">
        <div className="h-px bg-white/5 max-w-md mx-auto" />
        <p className="text-xs text-[#8b8ba5]">
          MoodLens is not a medical or emergency service.{' '}
          <button type="button" onClick={() => setSupport({ disclosure: false })} className="font-medium text-[#7dd3c0] underline underline-offset-4">
            Get support now
          </button>
        </p>
        <p className="text-[11px] font-medium tracking-wider text-[#6b6b85]">
          Built by Future&Hope · Built as a habit experiment · MoodLens 2026
        </p>
      </footer>
    </div>
  );
}
