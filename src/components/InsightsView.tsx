import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { Dialog } from './Dialog';
import type { CheckIn } from '../lib/storage';
import { averageEnergy, checkInsInWeek, feltAfterSummary, helpfulActions, topMoods } from '../lib/insights';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold tracking-[0.18em] text-[#a78bfa] uppercase">{title}</h3>
      {children}
    </section>
  );
}

const ENERGY_WORDS = ['very low', 'low', 'okay', 'good', 'high'];
const energyWord = (v: number) => ENERGY_WORDS[Math.min(4, Math.max(0, Math.round(v) - 1))];

/**
 * Descriptive summaries only: counts and the user's own reports. No trends
 * are presented as causes, and nothing is framed as a diagnosis.
 */
export function InsightsView({ checkIns, onClose }: { checkIns: CheckIn[]; onClose: () => void }) {
  const now = new Date();
  const thisWeek = checkInsInWeek(checkIns, now);
  const lastWeek = checkInsInWeek(checkIns, now, 1);
  const moods = topMoods(checkIns, now);
  const helpful = helpfulActions(checkIns);
  const felt = feltAfterSummary(checkIns);
  const feltTotal = felt.better + felt.same + felt.worse;
  const energyThisWeek = averageEnergy(thisWeek);
  const maxMood = Math.max(1, ...moods.map((m) => m.count));

  return (
    <Dialog title="Insights" icon={BarChart3} onClose={onClose}>
      {checkIns.length === 0 ? (
        <p className="py-16 text-center text-[#a5a5bf]">Insights will appear once you've checked in a few times.</p>
      ) : (
        <div className="space-y-8">
          <Section title="This week">
            <p className="text-2xl font-semibold text-white">
              {thisWeek.length} {thisWeek.length === 1 ? 'check-in' : 'check-ins'}
            </p>
            <p className="text-sm text-[#a5a5bf]">
              {lastWeek.length} last week.
              {energyThisWeek !== undefined && ` When you noted it, your energy was ${energyWord(energyThisWeek)} on average.`}
            </p>
          </Section>

          {moods.length > 0 && (
            <Section title="Feelings you chose most (last 30 days)">
              <ul className="space-y-2.5">
                {moods.map((m) => (
                  <li key={m.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#e8e8f0]">{m.label}</span>
                      <span className="text-[#8b8ba5]">{m.count}×</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5" aria-hidden>
                      <div className="h-2 rounded-full bg-[#7c6af7]" style={{ width: `${(m.count / maxMood) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Steps you said helped">
            {helpful.length === 0 ? (
              <p className="text-sm text-[#a5a5bf]">After you take a step, you can say whether it helped. Those steps will be listed here.</p>
            ) : (
              <ul className="space-y-2">
                {helpful.map((h) => (
                  <li key={h.title} className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm">
                    <span className="text-white">{h.title}</span>
                    <span className="block text-xs text-[#8b8ba5]">
                      When you felt {h.mood.toLowerCase()} · {h.feedback === 'helpful' ? 'helped' : 'helped a little'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {feltTotal > 0 && (
            <Section title="How you felt after a step">
              <p className="text-sm text-[#d4d4e4]">
                A bit better {felt.better} · About the same {felt.same} · Worse {felt.worse}
              </p>
            </Section>
          )}

          <p className="flex gap-2 rounded-2xl bg-white/[0.03] p-4 text-xs leading-relaxed text-[#a5a5bf]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            These are simple summaries of what you've recorded in this browser. They are observations, not a diagnosis, and they
            can't show what causes how you feel.
          </p>
        </div>
      )}
    </Dialog>
  );
}
