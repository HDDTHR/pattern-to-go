<script lang="ts" setup>
import MainEditor from '@/components/main-editor.vue'
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div class="pt-6 px-6 sticky top-0 bg-white z-1">
      <div class="flex justify-center mb-2 items-center">
        <a class="text-2xl" href="."
          ><img src="/yarn.png" class="inline w-8 pb-1" alt="yarn_icon" /> Pattern To Go</a
        >
      </div>
      <hr />
    </div>
    <MainEditor class="grow px-8" />
  </div>
</template>
