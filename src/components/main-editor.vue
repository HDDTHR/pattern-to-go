<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import RepeaterInput from '@/components/repeater-input.vue'
import UploadInput from '@/components/upload-input.vue'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import RichTextInput from '@/components/rich-text-input.vue'
import type { GenerationSettings, GlossaryItem, RequiredToolsItem } from '@/composables/types.ts'
import { useRenderEpub } from '@/composables/useRenderEpub.ts'
import { z } from 'zod'
import BookPreview from '@/components/book-preview.vue'

const generationSettings = reactive<GenerationSettings>({
  patternUrl: '',
  title: '',
  author: '',
  coverImageUri: '',
  glossary: [],
  content: {
    requiredItems: [],
    body: '',
  },
})

const resolver = ref(
  zodResolver(
    z.object({
      patternUrl: z.string().url('Pattern URL must be a valid URL').or(z.literal('')).optional(),
    }),
  ),
)

const { epubURL, loading, error, errorMessage } = useRenderEpub(generationSettings, 200)
</script>

<template>
  <div class="flex justify-start md:justify-around md:flex-row flex-col gap-8">
    <Form
      class="w-full flex flex-col gap-8 py-8"
      :resolver="resolver"
      :validateOnBlur="true"
      :validateOnValueUpdate="true"
      v-slot="$form"
    >
      <h2 class="text-2xl">Generation Parameters</h2>
      <FloatLabel variant="on">
        <InputText
          id="pattern-url"
          v-model="generationSettings.patternUrl"
          name="patternUrl"
          class="w-full xl:w-2/5 p-filled"
          type="text"
        />
        <label for="pattern-url">Pattern URL</label>
        <Message v-if="$form.patternUrl?.invalid" severity="error" size="small" variant="simple">
          {{ $form.patternUrl?.error.message }}
        </Message>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText
          id="title"
          v-model="generationSettings.title"
          class="w-full xl:w-1/2 p-filled"
          type="text"
        />
        <label for="title">Title</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText
          id="author"
          v-model="generationSettings.author"
          class="w-full xl:w-1/2 p-filled"
          type="text"
        />
        <label for="author">Author</label>
      </FloatLabel>
      <div>
        <label for="cover-image">Cover Image</label>
        <uploadInput
          id="cover-image"
          v-model="generationSettings.coverImageUri"
          class="w-full mt-4"
        />
      </div>
      <div>
        <label for="glossary">Glossary</label>
        <i
          class="pl-2 opacity-60 pi pi-info-circle hover:opacity-80"
          v-tooltip.top="'Image will be resized to 1000px x 1000px if necessary'"
        />
        <RepeaterInput
          id="glossary"
          v-model="generationSettings.glossary"
          :defaultItem="{ term: '', description: '' }"
          class="full pt-6"
          emptyMessage="No Terms. Click 'Add More' below."
        >
          <template #inputs="{ item, index }: { item: GlossaryItem; index: number }">
            <div class="self-center w-1/5">
              <FloatLabel variant="on">
                <Textarea
                  :id="`term-${index}`"
                  v-model="item.term"
                  auto-resize
                  class="w-full p-filled"
                  rows="1"
                />
                <label :for="`term-${index}`">Term</label>
              </FloatLabel>
            </div>
            <div class="self-center grow-2">
              <FloatLabel variant="on">
                <Textarea
                  :id="`description-${index}`"
                  v-model="item.description"
                  autoResize
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
          :defaultItem="{ body: '' }"
          class="full pt-6"
          emptyMessage="No Items. Click 'Add More' below."
        >
          <template #inputs="{ item, index }: { item: RequiredToolsItem; index: number }">
            <div class="self-center grow">
              <FloatLabel variant="on">
                <Textarea
                  :id="`tool-${index}`"
                  v-model="item.body"
                  autoResize
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
        <label for="body">Body</label>
        <RichTextInput v-model="generationSettings.content.body" class="mt-4" />
      </div>
    </Form>
    <div class="border-r-1" />
    <div class="basis-3xl md:flex justify-center hidden w-[350px] lg:[650px]">
      <div class="w-full h-[80svh] overflow-clip sticky top-[108px] flex justify-center">
        <BookPreview
          :error="error"
          :errorMessage="errorMessage"
          :loading="loading"
          :title="generationSettings.title"
          :url="epubURL"
          class="h-full w-full max-w-[600px]"
        />
      </div>
    </div>
  </div>
</template>
