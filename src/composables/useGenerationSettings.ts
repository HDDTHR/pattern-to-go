import { ref } from 'vue';

import type { GenerationSettings } from '@/types.ts';

const settings = ref<GenerationSettings | null>(null);
const areSettingsInvalid = ref<boolean>(true);

export function useGenerationSettings() {
  const setSettings = (newSettings: GenerationSettings | null) => {
    settings.value = newSettings;
  };

  const setSettingsInvalid = (newState: boolean) => {
    areSettingsInvalid.value = newState;
  };

  return { settings, setSettings, areSettingsInvalid, setSettingsInvalid };
}
