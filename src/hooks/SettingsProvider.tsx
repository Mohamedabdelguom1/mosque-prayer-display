import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../config/defaults';
import { loadSettings, saveSettings } from '../lib/storage';
import { SettingsContext } from './settingsContext';

/** مزوّد الاعدادات — كل تعديل يُحفظ فورا في تخزين الجهاز */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const replace = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ settings, update, replace, reset }),
    [settings, update, replace, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
