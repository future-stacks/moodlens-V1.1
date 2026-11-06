import React, { useState } from 'react';
import { Settings as SettingsIcon, Download, Trash2, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog } from './Dialog';
import { exportData, type Settings } from '../lib/storage';
import { COUNTRY_OPTIONS } from '../../shared/supportResources';

interface SettingsViewProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onDeleteAll: () => void;
  onClose: () => void;
}

function Heading({ icon: Icon, children }: { icon: typeof Globe; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#a78bfa] uppercase">
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </h3>
  );
}

export function SettingsView({ settings, onChange, onDeleteAll, onClose }: SettingsViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodlens-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog title="Settings & privacy" icon={SettingsIcon} onClose={onClose}>
      <div className="space-y-8">
        <section className="space-y-3">
          <Heading icon={Sparkles}>AI suggestions</Heading>
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/[0.03] p-4">
            <div className="space-y-1">
              <p id="ai-label" className="text-sm font-medium text-white">
                Personalise with Google Gemini
              </p>
              <p id="ai-desc" className="text-xs leading-relaxed text-[#a5a5bf]">
                When on, what you choose and write in a check-in is sent to Google's Gemini AI service to write your reflection and
                suggestion. When off, nothing leaves this device and suggestions come from MoodLens' built-in library.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.aiEnabled}
              aria-labelledby="ai-label"
              aria-describedby="ai-desc"
              onClick={() => onChange({ aiEnabled: !settings.aiEnabled })}
              className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a78bfa] ${
                settings.aiEnabled ? 'bg-[#7c6af7]' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${settings.aiEnabled ? 'translate-x-5' : ''}`}
                aria-hidden
              />
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <Heading icon={Globe}>Support resources</Heading>
          <label htmlFor="country" className="block text-sm text-[#d4d4e4]">
            Show emergency and support numbers for
          </label>
          <select
            id="country"
            value={settings.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0d0d14] px-4 text-white focus:border-[#7c6af7] focus:outline-none"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#8b8ba5]">More countries will be added once their services have been verified.</p>
        </section>

        <section className="space-y-3">
          <Heading icon={ShieldCheck}>Your data</Heading>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#b8b8d0]">
            <li>Your check-ins, reflections and settings are stored only in this browser. There is no MoodLens account.</li>
            <li>
              With AI suggestions on, each check-in (the feeling, any context you add and your note) is sent through the MoodLens
              server to Google Gemini to generate a response. The MoodLens server does not store it. Google processes it under the Gemini API terms that apply to MoodLens.
            </li>
            <li>MoodLens does not use your check-ins to train AI models, and doesn't sell or share your data.</li>
            <li>Clearing your browser data also removes your MoodLens history.</li>
          </ul>
          <Button
            variant="outline"
            onClick={download}
            className="h-11 w-full rounded-xl border-white/10 bg-transparent text-[#d4d4e4] hover:bg-white/5 hover:text-white"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Download my data (JSON)
          </Button>

          {!confirmDelete ? (
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full rounded-xl border-red-500/25 bg-transparent text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Delete all my data
            </Button>
          ) : (
            <div role="alert" className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm text-red-100">
                This permanently deletes every check-in and setting stored in this browser. It can't be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onDeleteAll();
                    setConfirmDelete(false);
                    toast.success('All MoodLens data on this device has been deleted.');
                  }}
                  className="h-10 flex-1 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600"
                >
                  Delete everything
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  className="h-10 flex-1 rounded-xl border-white/10 bg-transparent text-[#d4d4e4] hover:bg-white/5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
