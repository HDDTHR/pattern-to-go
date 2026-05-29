<script lang="ts" setup>
import Editor from 'primevue/editor';
import { computed } from 'vue';

const value = defineModel<string>({ default: () => '' });
defineProps<{ disabled: boolean }>();
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
};

const proxyValue = computed<string>({
  get() {
    return value.value;
  },
  set(rawHtml: string) {
    value.value = rawHtml.replace(/(<img src="[^"]+">)/g, '$1</img>');
  },
});
</script>

<template>
  <div class="relative">
    <Editor
      v-model="proxyValue"
      class="border border-gray-300 rounded-md"
      editor-style="height: 240px"
      :readonly="disabled"
      :modules="{ toolbar: toolbarOptions }"
    >
      <template #toolbar>
        <span class="ql-formats" />
      </template>
    </Editor>
  </div>
</template>
