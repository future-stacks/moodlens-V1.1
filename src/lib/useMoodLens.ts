import { useCallback, useEffect, useState } from 'react';
import {
  deleteAllData,
  loadCheckIns,
  loadSettings,
  migrate,
  saveCheckIns,
  saveSettings,
  type CheckIn,
  type Settings,
} from './storage';

/** App-wide state backed by localStorage. Runs the storage migration once on mount. */
export function useMoodLens() {
  const [ready, setReady] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [migration, setMigration] = useState<ReturnType<typeof migrate>>({ migrated: 0, removedInsecure: false });

  useEffect(() => {
    setMigration(migrate());
    setCheckIns(loadCheckIns());
    setSettingsState(loadSettings());
    setReady(true);
  }, []);

  const upsertCheckIn = useCallback((checkIn: CheckIn) => {
    setCheckIns((prev) => {
      const next = prev.some((c) => c.id === checkIn.id)
        ? prev.map((c) => (c.id === checkIn.id ? checkIn : c))
        : [...prev, checkIn];
      saveCheckIns(next);
      return next;
    });
  }, []);

  const updateCheckIn = useCallback((id: string, patch: Partial<CheckIn>) => {
    setCheckIns((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveCheckIns(next);
      return next;
    });
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    deleteAllData();
    setCheckIns([]);
    setSettingsState(loadSettings());
  }, []);

  return { ready, checkIns, settings, migration, upsertCheckIn, updateCheckIn, setSettings, clearAll };
}
