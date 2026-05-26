import { wrap } from 'comlink';

import type { GenerationSettings } from '@/types.ts';

const worker = new Worker(new URL('@/workers/renderEpub.worker.ts', import.meta.url), {
  type: 'module',
});

export const workerAPI = wrap<{
  renderEpub: (
    templateEntries: Record<string, Uint8Array>,
    settings: GenerationSettings,
  ) => Promise<string>;
}>(worker);
