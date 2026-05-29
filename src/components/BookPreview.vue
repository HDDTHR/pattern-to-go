<script lang="ts" setup>
import type { Book, Rendition } from 'epubjs';
import ePub from 'epubjs';
import Button from 'primevue/button';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { useGenerationSettings } from '@/composables/useGenerationSettings.ts';
import { useLLM } from '@/composables/useLLM.ts';
import { useRenderer } from '@/composables/useRenderer.ts';
import { type GenerationSettings, GenerationState, RenderingState } from '@/types.ts';

const { settings, areSettingsInvalid } = useGenerationSettings();
const { render, url, state, errorMessage } = useRenderer();
const { state: generationState } = useLLM();

const viewerContainer = ref<HTMLElement | null>(null);
const aElement = ref<HTMLLinkElement | null>(null);
const currentLocation = ref<Rendition['location'] | null>(null);

let book: Book | null = null;
let rendition: Rendition | null = null;

const message = computed(() => {
  if (state.value === RenderingState.EMPTY) return 'Waiting For Parameters..';
  if (areSettingsInvalid.value) return 'Check Generation Settings';
  if (state.value === RenderingState.LOADING) return 'Loading..';
  if (state.value === RenderingState.ERROR) return 'Error Occurred During Rendering';
  if (state.value === RenderingState.READY) return 'Up-To-Date';
  return 'Unknown State';
});

const circleClass = computed(() => {
  if (state.value === RenderingState.EMPTY) return 'border-2 color-gray';
  if (areSettingsInvalid.value) return 'border-none bg-violet-400';
  if (state.value === RenderingState.LOADING) return 'border-none bg-orange-200';
  if (state.value === RenderingState.ERROR) return 'border-none bg-red-400';
  if (state.value === RenderingState.READY) return 'border-none bg-green-400';
  return 'border-2 color-gray';
});

const initBook = async (generationSettings: GenerationSettings) => {
  await render(generationSettings);
  if (!url.value) return;
  try {
    renderToCanvas(currentLocation.value?.start.cfi);
  } catch (e) {
    console.error('Failed to load EPUB:', e);
  }
};

const renderToCanvas = async (savedLocation: string | undefined) => {
  const response = await fetch(url.value as string);
  const buffer = await response.arrayBuffer();
  if (book) book.destroy();
  book = ePub(buffer);
  await book.ready;
  await nextTick();
  if (!viewerContainer.value) return;
  rendition = book.renderTo(viewerContainer.value, {
    width: '100%',
    height: '100%',
    flow: 'paginated',
    spread: 'none',
    minSpreadWidth: 999999,
  });
  rendition.on('relocated', (location: Rendition['location']) => {
    currentLocation.value = location;
  });
  await rendition.display(savedLocation || undefined);
};

const nextPage = async () => await rendition?.next();
const prevPage = async () => await rendition?.prev();

const bookTitle = computed(() => {
  if (areSettingsInvalid.value) return '';
  return `${settings
    .value!.title.replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()}.epub`;
});

watch(settings, (newSettings) => {
  if (newSettings && generationState.value === GenerationState.IDLE) initBook(newSettings);
});

onMounted(() => {
  if (url.value) {
    renderToCanvas(undefined);
  }
});

onUnmounted(() => book?.destroy());
</script>

<template>
  <div class="flex flex-col gap-4 h-full w-full">
    <div class="flex gap-4 items-center">
      <div class="shrink-0 w-4 h-4 rounded-[50%] transition-colors" :class="circleClass" />
      <span class="text-gray-500 grow truncate">{{ message }}</span>
    </div>
    <div class="relative grow">
      <div class="absolute w-full h-full flex justify-between items-center px-4 z-1 opacity-70">
        <Button
          :disabled="currentLocation?.atStart"
          icon="pi pi-chevron-left"
          rounded
          severity="secondary"
          @click="prevPage()"
        />
        <Button
          :disabled="currentLocation?.atEnd"
          icon="pi pi-chevron-right"
          rounded
          severity="secondary"
          @click="nextPage()"
        />
      </div>
      <div ref="viewerContainer" class="w-full h-full border border-gray-300 overflow-hidden">
        <div v-if="state === RenderingState.ERROR" class="h-full flex items-end justify-center">
          <span class="p-5"> Error: {{ errorMessage }} </span>
        </div>
      </div>
    </div>
    <div class="flex flex-row-reverse">
      <Button
        :disabled="state !== RenderingState.READY"
        icon="pi pi-download"
        label="Download"
        :severity="state !== RenderingState.READY ? 'secondary' : 'primary'"
        @click="() => aElement?.click()"
      />
      <a v-if="url" ref="aElement" class="hidden" :download="bookTitle" :href="url" />
    </div>
  </div>
</template>
