<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core';
import Button from 'primevue/button';
import { computed, ref, watch } from 'vue';

import BookPreview from '@/components/BookPreview.vue';
import GenerationForm from '@/components/GenerationForm.vue';
import NavBar from '@/components/NavBar.vue';
import { useGenerationSettings } from '@/composables/useGenerationSettings.ts';
import { useRenderer } from '@/composables/useRenderer.ts';
import { GenerationState } from '@/types.ts';

const drawerVisible = ref<boolean>(false);

const { state } = useRenderer();
const { areSettingsInvalid } = useGenerationSettings();
const isMobileScreen = useMediaQuery('(max-width: 80rem)');

const circleClass = computed(() => {
  if (state.value === GenerationState.EMPTY) return 'border-2 color-gray';
  if (areSettingsInvalid.value) return 'border-none bg-violet-400';
  if (state.value === GenerationState.LOADING) return 'border-none bg-orange-200';
  if (state.value === GenerationState.ERROR) return 'border-none bg-red-400';
  if (state.value === GenerationState.READY) return 'border-none bg-green-400';
  return 'border-2 color-gray';
});

watch(isMobileScreen, (currentValue) => {
  if (!currentValue) drawerVisible.value = false;
});
</script>

<template>
  <div class="w-screen h-screen flex flex-col select-none">
    <NavBar />
    <hr class="mx-6" />

    <div class="mx-6 min-h-0 flex-auto flex">
      <div class="pr-4 flex-1">
        <GenerationForm />
      </div>
      <div v-if="!isMobileScreen" class="h-full p-4 pt-16 aspect-[74/100] mx-auto">
        <BookPreview />
      </div>
    </div>
  </div>

  <Button
    v-if="isMobileScreen"
    class="!fixed bottom-5 right-5 !border-2"
    icon="pi pi-eye"
    rounded
    severity="secondary"
    size="large"
    @click="drawerVisible = true"
  />
  <div
    v-if="isMobileScreen"
    class="fixed w-3 h-3 bottom-[49px] right-[49px] border-1 rounded-[50%] bg-gray-300 xl:hidden"
    :class="circleClass"
  />

  <div
    v-if="isMobileScreen"
    :class="[
      'fixed inset-0 z-1 flex flex-col p-8 bg-white',
      drawerVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Preview</h2>
      <button
        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
        @click="drawerVisible = false"
      >
        <i class="pi pi-times text-xl" />
      </button>
    </div>
    <div
      class="flex-1 flex justify-center items-stretch overflow-auto px-10 py-4 aspect-[74/100] mx-auto"
    >
      <BookPreview />
    </div>
  </div>
</template>
