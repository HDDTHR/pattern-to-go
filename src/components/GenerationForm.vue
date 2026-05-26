<script lang="ts" setup>
import { Form } from '@primevue/forms';
import { watchDebounced } from '@vueuse/core';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import { onMounted, ref } from 'vue';
import { z, ZodError } from 'zod';

import RepeaterInput from '@/components/RepeaterInput.vue';
import RichTextInput from '@/components/RichTextInput.vue';
import UploadInput from '@/components/UploadInput.vue';
import { useGenerationSettings } from '@/composables/useGenerationSettings.ts';
import type { GenerationSettings, GlossaryItem, RequiredToolsItem } from '@/types.ts';
import Button from 'primevue/button';

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

watchDebounced(
  generationSettings,
  (val) => {
    const parseResult = schema.safeParse(val);
    errors.value = parseResult.error ?? null;
    setSettings(parseResult.success ? { ...val } : null);
    setSettingsInvalid(!parseResult.success);
  },
  {
    deep: true,
    debounce: 300,
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
    <Form class="flex flex-col  gap-8 mb-8 pl-1 pt-2 pr-4 overflow-auto">
      <div class="flex flex-col-reverse sm:flex-row gap-4 w-full xl:w-3/4">
        <FloatLabel class="grow-1" variant="on">
          <InputText
            id="pattern-url"
            v-model="generationSettings.patternUrl"
            class="p-filled w-full"
            name="patternUrl"
            type="text"
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
          <Button disabled="true" icon="pi pi-sparkles" label="Generate Using Local AI" severity="secondary" />
          <span class="mt-2 text-gray-400">This feature is disabled.</span>
        </div>
      </div>

      <FloatLabel variant="on">
        <InputText
          id="title"
          v-model="generationSettings.title"
          name="title"
          class="w-full xl:w-3/4 p-filled"
          type="text"
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
        />
        <label for="author">Author</label>
      </FloatLabel>

      <div>
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
        <RichTextInput v-model="generationSettings.content.body" class="mt-4" />
      </div>
    </Form>
  </div>
</template>
