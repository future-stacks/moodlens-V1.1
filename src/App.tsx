import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { toast } from 'sonner';
import { History as HistoryIcon, HelpCircle, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { CheckInPanel, type CheckInInput } from './components/CheckInPanel';
import { ReflectPanel } from './components/ReflectPanel';
import { InterventionCard, type ActionChoice } from './components/InterventionCard';
import { WeeklyCheckins } from './components/WeeklyCheckins';
import { Onboarding } from './components/Onboarding';
import { HistoryView } from './components/HistoryView';
import { HelpView } from './components/HelpView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { SupportView } from './components/SupportView';
import { requestIntervention } from './lib/api';
import { useMoodLens } from './lib/useMoodLens';
import { actionTitle, weeklyCount } from './lib/insights';
import { KEYS, type CheckIn, type Feedback, type FeltAfter } from './lib/storage';
import type { Intervention } from '../shared/intervention';
import type { RiskCategory } from '../shared/safeguarding';
import { moodLabel } from '../shared/moods';

type Screen =
  | { name: 'checkin' }
  | { name: 'loading' }
  | { name: 'result'; checkInId: string; input: CheckInInput; intervention: Intervention; shown: string[] }
  | { name: 'reflect'; checkInId: string; actionTitle: string }
  | { name: 'support'; category?: RiskCategory; disclosure: boolean };

function readOnboardingSeen() {
  try {
    return localStorage.getItem(KEYS.onboarding) === 'true';
  } catch {
    return true;
  }
}

export default function App() {
  const store = useMoodLens();
  const [screen, setScreen] = useState<Screen>({ name: 'checkin' });
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingSeen());
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * Actions the user previously said weren't helpful. Passed as `exclude` so
   * future suggestions avoid them. This uses only data already on this device.
   */
  const unhelpfulTitles = (checkIns: CheckIn[]) =>
    checkIns
      .flatMap((c) => [...(c.notHelpful ?? []), ...(c.feedback === 'not_helpful' && actionTitle(c) ? [actionTitle(c)!] : [])])
      .slice(-8);

  // Bring each new step of the journey into view (the result can sit below the fold on mobile).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen.name]);

  const navButtons = [
    { label: 'Help', icon: HelpCircle, onClick: () => setShowHelp(true) },
    { label: 'History', icon: HistoryIcon, onClick: () => setShowHistory(true) },
    { label: 'Insights', icon: BarChart3, onClick: () => setShowInsights(true) },
    { label: 'Settings', icon: SettingsIcon, onClick: () => setShowSettings(true) },
  ];

  const startCheckIn = async (input: CheckInInput) => {
    setScreen({ name: 'loading' });
    const avoid = unhelpfulTitles(store.checkIns);
    const result = await requestIntervention({ ...input, exclude: avoid.length ? avoid : undefined, country: store.settings.country }, { ai: store.settings.aiEnabled });
    if (result.kind === 'support') {
      setScreen({ name: 'support', category: result.category, disclosure: true });
      return;
    }
    const checkInId = crypto.randomUUID();
    store.upsertCheckIn({ id: checkInId, createdAt: new Date().toISOString(), ...input, intervention: result.intervention });
    setScreen({ name: 'result', checkInId, input, intervention: result.intervention, shown: [...avoid, result.intervention.action.title] });
  };

  const handleAnother = async () => {
    if (screen.name !== 'result') return;
    setRefreshing(true);
    const result = await requestIntervention({ ...screen.input, exclude: screen.shown.slice(-10), country: store.settings.country }, { ai: store.settings.aiEnabled });
    setRefreshing(false);
    if (result.kind !== 'intervention') return;
    store.updateCheckIn(screen.checkInId, { intervention: result.intervention });
    setScreen({ ...screen, intervention: result.intervention, shown: [...screen.shown, result.intervention.action.title] });
  };

  const handleNotHelpful = async () => {
    if (screen.name !== 'result') return;
    // Remember that this suggestion didn't fit, then offer a different one.
    const current = store.checkIns.find((c) => c.id === screen.checkInId);
    store.updateCheckIn(screen.checkInId, { notHelpful: [...(current?.notHelpful ?? []), screen.intervention.action.title] });
    toast("Thanks for telling us. Here's something different.");
    await handleAnother();
  };

  const handleComplete = (choice: ActionChoice) => {
    if (screen.name !== 'result') return;
    store.updateCheckIn(screen.checkInId, { actionChoice: choice, completedAt: new Date().toISOString() });
    const action = choice === 'main' ? screen.intervention.action : screen.intervention.alternative_action;
    setScreen({ name: 'reflect', checkInId: screen.checkInId, actionTitle: action.title });
  };

  const handleReflect = (result: { feedback?: Feedback; feltAfter?: FeltAfter }) => {
    if (screen.name !== 'reflect') return;
    if (result.feedback || result.feltAfter) store.updateCheckIn(screen.checkInId, result);
    toast.success(result.feedback || result.feltAfter ? 'Saved. Thank you for checking in.' : 'Thank you for checking in.');
    reset();
  };

  const reset = () => setScreen({ name: 'checkin' });

  const completeOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(KEYS.onboarding, 'true');
    } catch {
      /* storage unavailable: onboarding will show again next time */
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#0d0d14] pb-16 font-sans text-[#e8e8f0] selection:bg-[#7c6af7]/30">
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
        {showHistory && <HistoryView checkIns={store.checkIns} onClose={() => setShowHistory(false)} />}
        {showInsights && <InsightsView checkIns={store.checkIns} onClose={() => setShowInsights(false)} />}
        {showSettings && (
          <SettingsView
            settings={store.settings}
            onChange={store.setSettings}
            onDeleteAll={() => {
              store.clearAll();
              reset();
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showHelp && (
          <HelpView
            onClose={() => setShowHelp(false)}
            onGetSupport={() => {
              setShowHelp(false);
              setScreen({ name: 'support', disclosure: false });
            }}
          />
        )}
      </AnimatePresence>

      <header className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-8">
        <nav aria-label="MoodLens" className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-1 py-2 text-[13px] font-bold tracking-[0.3em] text-[#a78bfa] uppercase focus-visible:outline-2 focus-visible:outline-[#a78bfa]"
          >
            MoodLens
          </button>
          <div className="flex gap-1.5">
            {navButtons.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                aria-label={label}
                title={label}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#13131f] text-[#a5a5bf] transition-colors hover:border-[#7c6af7]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a78bfa]"
              >
                <Icon className="h-5 w-5" aria-hidden />
              </button>
            ))}
          </div>
        </nav>

        {screen.name === 'checkin' && (
          <div className="space-y-3 pt-10 pb-10 text-center sm:pt-14">
            <h1 className="bg-gradient-to-br from-white via-white to-[#a78bfa] bg-clip-text text-4xl leading-[1.1] font-bold tracking-tight text-transparent md:text-6xl">
              What are you
              <br />
              feeling right now?
            </h1>
            <p className="text-base text-[#a5a5bf] md:text-lg">Understand how you feel. Find one manageable next step.</p>
          </div>
        )}
      </header>

      <main className={`mx-auto max-w-4xl px-4 sm:px-6 ${screen.name === 'checkin' ? '' : 'pt-8 sm:pt-12'}`}>
        <AnimatePresence mode="wait">
          {screen.name === 'support' ? (
            <SupportView
              key="support"
              category={screen.category}
              disclosure={screen.disclosure}
              country={store.settings.country}
              onBack={reset}
            />
          ) : screen.name === 'checkin' ? (
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              <CheckInPanel aiEnabled={store.settings.aiEnabled} onSubmit={startCheckIn} />
              <div className="mx-auto max-w-sm">
                <WeeklyCheckins count={weeklyCount(store.checkIns)} />
              </div>
            </motion.div>
          ) : screen.name === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6 py-20"
              role="status"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#7c6af7]" aria-hidden />
              <p className="text-sm text-[#a5a5bf]">Finding a thought and a next step for you…</p>
            </motion.div>
          ) : screen.name === 'reflect' ? (
            <ReflectPanel
              key="reflect"
              actionTitle={screen.actionTitle}
              onSave={handleReflect}
              onGetSupport={() => setScreen({ name: 'support', disclosure: false })}
            />
          ) : (
            <motion.div key={`result-${screen.checkInId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InterventionCard
                key={screen.intervention.action.title}
                moodLabel={moodLabel(screen.input.mood)}
                intervention={screen.intervention}
                busy={refreshing}
                onComplete={handleComplete}
                onAnother={handleAnother}
                onNotHelpful={handleNotHelpful}
                onBack={reset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 space-y-4 px-6 text-center">
        <div className="mx-auto h-px max-w-md bg-white/5" />
        <p className="text-xs text-[#8b8ba5]">
          MoodLens is not a medical or emergency service.{' '}
          <button
            type="button"
            onClick={() => setScreen({ name: 'support', disclosure: false })}
            className="font-medium text-[#7dd3c0] underline underline-offset-4"
          >
            Get support now
          </button>
        </p>
        <p className="text-[11px] font-medium tracking-wider text-[#8b8ba5]">Built by Future&amp;Hope · MoodLens 2026</p>
      </footer>
    </div>
    </MotionConfig>
  );
}
