<script lang="ts" setup>
import { Form } from '@primevue/forms';
import { watchDebounced } from '@vueuse/core';
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import { computed, onMounted, ref, watch } from 'vue';
import { z, ZodError } from 'zod';

import RepeaterInput from '@/components/RepeaterInput.vue';
import RichTextInput from '@/components/RichTextInput.vue';
import UploadInput from '@/components/UploadInput.vue';
import { useGenerationSettings } from '@/composables/useGenerationSettings.ts';
import { useLLM } from '@/composables/useLLM.ts';
import {
  type GenerationSettings,
  GenerationState,
  type GlossaryItem,
  type RequiredToolsItem,
} from '@/types.ts';

const isWebGPUEnabled = 'gpu' in navigator;
const formDisabled = ref<boolean>(false);
const generationSettings = ref<GenerationSettings>({
  patternUrl: '',
  title: '',
  author: '',
  coverImageUri: '',
  glossary: [],
  content: {
    requiredItems: [],
    body: '',
  },
});
const errors = ref<ZodError<GenerationSettings> | null>(null);
const { setSettings, setSettingsInvalid } = useGenerationSettings();
const { state, downloadingMessage, generationResult, startGeneration } = useLLM();

const schema = z.object({
  title: z.string().trim().nonempty('Field must not be empty.'),
  patternUrl: z.string().trim().url('Pattern URL must be a valid URL.').or(z.literal('')),
  glossary: z.array(
    z.object({
      term: z.string().trim().nonempty('Field must not be empty'),
    }),
  ),
  content: z.object({
    requiredItems: z.array(
      z.object({
        body: z.string().trim().nonempty('Field must not be empty'),
      }),
    ),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arraysEqual = (a: any[], b: any[]) =>
  a.length === b.length && a.every((val, index) => val === b[index]);

const isFieldInvalid = (...path: (string | number)[]) => {
  return errors.value ? errors.value.errors.some((error) => arraysEqual(error.path, path)) : false;
};

const getFieldError = (...path: (string | number)[]) => {
  return errors.value!.errors.filter((error) => arraysEqual(error.path, path))[0].message;
};

const generationButtonMessage = computed(() => {
  if (state.value === GenerationState.DOWNLOADING_MODEL)
    return downloadingMessage.value ?? 'Initializing Engine...';
  if (state.value === GenerationState.SCRAPING_PAGE) return 'Scrapping Pattern Page';
  if (state.value === GenerationState.GENERATING) return 'Generating settings';
  return 'Unknown State';
});

watchDebounced(
  generationSettings,
  (val) => {
    const parseResult = schema.safeParse(val);
    setSettings(parseResult.success ? { ...val } : null);
    setSettingsInvalid(!parseResult.success);
  },
  {
    deep: true,
    debounce: 300,
  },
);

watch(state, () => {
  if (state.value === GenerationState.IDLE) formDisabled.value = false;
  else formDisabled.value = true;
});

watch(generationResult, (val) => {
  generationSettings.value = { ...generationSettings.value, ...val };
});

watch(
  generationSettings,
  (val) => {
    const parseResult = schema.safeParse(val);
    errors.value = parseResult.error ?? null;
  },
  {
    deep: true,
  },
);

onMounted(() => {
  const parsed = schema.safeParse(generationSettings.value);
  errors.value = parsed.error as ZodError<GenerationSettings>;
});
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <h2 class="text-2xl py-4 mb-8 border-b-1">Generation Parameters</h2>
    <Form class="flex flex-col gap-8 pb-4 pl-1 pt-2 pr-4 overflow-auto">
      <div class="flex flex-col-reverse sm:flex-row gap-4 w-full xl:w-3/4">
        <FloatLabel class="grow-1" variant="on">
          <InputText
            id="pattern-url"
            v-model="generationSettings.patternUrl"
            class="p-filled w-full"
            name="patternUrl"
            type="text"
            :disabled="formDisabled"
          />
          <label for="pattern-url">Pattern URL</label>
          <Message
            v-if="isFieldInvalid('patternUrl')"
            severity="error"
            size="small"
            variant="simple"
            class="mt-1"
          >
            {{ getFieldError('patternUrl') }}
          </Message>
        </FloatLabel>
        <div class="flex flex-col items-center">
          <Button
            :disabled="
              !isWebGPUEnabled ||
              generationSettings.patternUrl == '' ||
              isFieldInvalid('patternUrl')
            "
            :loading="state !== GenerationState.IDLE"
            icon="pi pi-sparkles"
            label="Generate Using Local AI"
            severity="secondary"
            @click="startGeneration(generationSettings.patternUrl)"
          />
          <span v-if="!isWebGPUEnabled" class="mt-2 text-gray-400">
            WebGPU is disabled.
            <a
              class="underline"
              target="_blank"
              href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility"
              >Learn more here</a
            >
          </span>
          <span v-if="isWebGPUEnabled && state === GenerationState.IDLE" class="mt-2 text-gray-400">
            ~8GB VRAM Recommended
          </span>
          <span v-if="state !== GenerationState.IDLE" class="mt-2 text-gray-400">
            {{ generationButtonMessage }}
          </span>
        </div>
      </div>

      <FloatLabel variant="on">
        <InputText
          id="title"
          v-model="generationSettings.title"
          name="title"
          class="w-full xl:w-3/4 p-filled"
          type="text"
          :disabled="formDisabled"
        />
        <Message
          v-if="isFieldInvalid('title')"
          severity="error"
          size="small"
          variant="simple"
          class="mt-1"
        >
          {{ getFieldError('title') }}
        </Message>
        <label for="title">Title</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText
          id="author"
          v-model="generationSettings.author"
          class="w-full xl:w-3/4 p-filled"
          type="text"
          :disabled="formDisabled"
        />
        <label for="author">Author</label>
      </FloatLabel>

      <div :class="[formDisabled ? '.no-interactions' : '']">
        <label for="cover-image">Cover Image</label>
        <i
          v-tooltip.top="'Image will be resized to 1000px x 1000px if necessary'"
          class="pl-2 opacity-60 pi pi-info-circle hover:opacity-80"
        />
        <UploadInput
          id="cover-image"
          v-model="generationSettings.coverImageUri"
          class="w-full mt-4"
        />
      </div>

      <div>
        <label for="glossary">Glossary</label>
        <RepeaterInput
          id="glossary"
          v-model="generationSettings.glossary"
          class="full pt-6"
          :default-item="{ term: '', description: '' }"
          :disabled="formDisabled"
          empty-message="No Terms. Click 'Add More' below."
        >
          <template #inputs="{ item, index }: { item: GlossaryItem; index: number }">
            <div class="w-1/5">
              <FloatLabel variant="on">
                <Textarea
                  :id="`term-${index}`"
                  v-model="item.term"
                  auto-resize
                  class="w-full p-filled"
                  rows="1"
                  :disabled="formDisabled"
                />
                <Message
                  v-if="isFieldInvalid('glossary', index, 'term')"
                  severity="error"
                  size="small"
                  variant="simple"
                  class="relative mt-1 mb-4"
                >
                  {{ getFieldError('glossary', index, 'term') }}
                </Message>
                <label :for="`term-${index}`">Term</label>
              </FloatLabel>
            </div>
            <div class="grow-2">
              <FloatLabel variant="on">
                <Textarea
                  :id="`description-${index}`"
                  v-model="item.description"
                  auto-resize
                  class="w-full p-filled"
                  rows="1"
                  :disabled="formDisabled"
                />
                <label :for="`description-${index}`">Description</label>
              </FloatLabel>
            </div>
          </template>
        </RepeaterInput>
      </div>

      <div>
        <label for="required-items">Required Items</label>
        <RepeaterInput
          id="required-items"
          v-model="generationSettings.content.requiredItems"
          class="full pt-6"
          :default-item="{ body: '' }"
          :disabled="formDisabled"
          empty-message="No Items. Click 'Add More' below."
        >
          <template #inputs="{ item, index }: { item: RequiredToolsItem; index: number }">
            <div class="grow">
              <FloatLabel variant="on">
                <Textarea
                  :id="`tool-${index}`"
                  v-model="item.body"
                  auto-resize
                  class="w-full p-filled"
                  rows="1"
                  :disabled="formDisabled"
                />
                <Message
                  v-if="isFieldInvalid('content', 'requiredItems', index, 'body')"
                  severity="error"
                  size="small"
                  variant="simple"
                  class="mt-1"
                >
                  {{ getFieldError('content', 'requiredItems', index, 'body') }}
                </Message>
                <label :for="`description-${index}`">Description</label>
              </FloatLabel>
            </div>
          </template>
        </RepeaterInput>
      </div>

      <div>
        <label for="body">Body</label>
        <RichTextInput
          v-model="generationSettings.content.body"
          :disabled="formDisabled"
          class="mt-4"
        />
      </div>
    </Form>
  </div>
</template>

<style scoped>
.no-interaction {
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  touch-action: none;
}
</style>
