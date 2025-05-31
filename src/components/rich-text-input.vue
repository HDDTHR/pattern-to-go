<script lang="ts" setup>
import { computed } from 'vue'
import Editor from 'primevue/editor'

const value = defineModel<string>({ default: () => '' })
const { placeholder } = defineProps<{ placeholder: string }>()
const toolbarOptions = {
  container: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'link', 'image'],

    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['clean'],
  ],
}

const proxyValue = computed<string>({
  get() {
    return value.value
  },
  set(rawHtml: string) {
    value.value = rawHtml.replace(/(<img src="[^"]+">)/g, '$1</img>')
  },
})
</script>

<template>
  <div class="relative">
    <Editor
      v-model="proxyValue"
      :modules="{ toolbar: toolbarOptions }"
      class="border border-gray-300 rounded-md"
      editorStyle="height: 240px"
      :placeholder="placeholder"
    >
      <template #toolbar>
        <span class="ql-formats" />
      </template>
    </Editor>
  </div>
</template>
