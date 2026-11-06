import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen bg-[#0d0d14] pb-20 font-sans text-[#e8e8f0] selection:bg-[#7c6af7]/30">
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

      <header className="relative mx-auto max-w-2xl space-y-4 px-6 pt-16 pb-12 text-center">
        <div className="absolute top-16 right-6 flex gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="rounded-xl border border-white/10 bg-[#13131f] p-2 text-[#6b6b85] transition-all hover:border-[#7c6af7]/50 hover:text-white"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="rounded-xl border border-white/10 bg-[#13131f] p-2 text-[#6b6b85] transition-all hover:border-[#7c6af7]/50 hover:text-white"
            title="View History"
          >
            <HistoryIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowInsights(true)}
            className="rounded-xl border border-white/10 bg-[#13131f] p-2 text-[#6b6b85] transition-all hover:border-[#7c6af7]/50 hover:text-white"
            title="Insights"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-xl border border-white/10 bg-[#13131f] p-2 text-[#6b6b85] transition-all hover:border-[#7c6af7]/50 hover:text-white"
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="text-[13px] font-bold tracking-[0.3em] text-[#7c6af7] uppercase">MoodLens</div>
        <h1 className="bg-gradient-to-br from-white via-white to-[#7c6af7] bg-clip-text text-4xl leading-[1.1] font-bold tracking-tight text-transparent md:text-6xl">
          What are you
          <br />
          feeling right now?
        </h1>
        <p className="text-base text-[#6b6b85] md:text-lg">Turn your mood into a moment of growth — not just a quote.</p>
      </header>

      <main className="mx-auto max-w-4xl space-y-12 px-6">
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
        <p className="text-[11px] font-medium tracking-wider text-[#6b6b85]">Built by Future&amp;Hope · MoodLens 2026</p>
      </footer>
    </div>
  );
}
