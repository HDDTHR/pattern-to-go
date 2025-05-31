import type { Reactive } from 'vue'
import { ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { unzipSync } from 'fflate'
import { wrap } from 'comlink'
import type { GenerationSettings } from '@/composables/types'
import { getErrorMessage } from '@/composables/utils.ts'

export const useRenderEpub = (settings: Reactive<GenerationSettings>, debounce: number) => {
  const epubURL = ref<string | null>(null)
  const loading = ref(false)
  const error = ref(false)
  const errorMessage = ref('')

  const worker = new Worker(new URL('@/workers/renderEpub.worker.ts', import.meta.url), {
    type: 'module',
  })

  const workerAPI = wrap<{
    renderEpub(
      templateEntries: Record<string, Uint8Array>,
      settings: GenerationSettings,
    ): Promise<string>
  }>(worker)

  const templatePromise = (async () => {
    const response = await fetch('template.epub')
    if (!response.ok) throw new Error('Failed to load template EPUB')
    const buffer = await response.arrayBuffer()
    return unzipSync(new Uint8Array(buffer))
  })()

  watchDebounced(
    settings,
    async () => {
      loading.value = true
      error.value = false
      errorMessage.value = ''

      try {
        const entries = await templatePromise
        const url = await workerAPI.renderEpub(entries, JSON.parse(JSON.stringify(settings)))

        if (epubURL.value) URL.revokeObjectURL(epubURL.value)
        epubURL.value = url
      } catch (err) {
        const message = getErrorMessage(err)
        console.error('Render EPUB failed:', err)
        error.value = true
        errorMessage.value = message
      } finally {
        loading.value = false
      }
    },
    { deep: true, debounce, immediate: true },
  )

  return {
    epubURL,
    loading,
    error,
    errorMessage,
  }
}
