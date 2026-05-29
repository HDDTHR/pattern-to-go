import { unzipSync } from 'fflate';
import { ref } from 'vue';

import { getErrorMessage } from '@/composables/utils';
import { type GenerationSettings, RenderingState } from '@/types';
import { workerAPI } from '@/workers/api.ts';

const state = ref<RenderingState>(RenderingState.EMPTY);
const url = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

export function useRenderer() {
  const fetchEPUBTemplate = async () => {
    const response = await fetch('template.epub');
    if (!response.ok) {
      throw new Error('Failed to load template EPUB');
    }
    const buffer = await response.arrayBuffer();
    return unzipSync(new Uint8Array(buffer));
  };

  async function render(settings: GenerationSettings) {
    state.value = RenderingState.LOADING;
    if (url.value) {
      URL.revokeObjectURL(url.value);
    }
    url.value = null;
    errorMessage.value = null;
    try {
      const entries = await fetchEPUBTemplate();
      url.value = await workerAPI.renderEpub(entries, JSON.parse(JSON.stringify(settings)));
      state.value = RenderingState.READY;
    } catch (err) {
      console.error(err);
      url.value = null;
      state.value = RenderingState.ERROR;
      errorMessage.value = getErrorMessage(err);
    }
  }

  return {
    url,
    state,
    errorMessage,
    render,
  };
}
