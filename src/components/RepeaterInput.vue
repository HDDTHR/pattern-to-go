<script generic="T" lang="ts" setup>
import Button from 'primevue/button';
import { VueDraggable } from 'vue-draggable-plus';

import type { ItemWithId } from '@/types.ts';

type Item = T & ItemWithId;
const items = defineModel<Item[]>({ default: () => [] });
const { defaultItem } = defineProps<{
  defaultItem: T;
  disabled: boolean;
  emptyMessage: string;
}>();

const handleAdd = () => {
  items.value.push({ id: items.value.length, ...defaultItem });
};

const handleRemove = (index: number) => {
  items.value.splice(index, 1);
};

const moveUp = (index: number) => {
  if (index > 0) {
    const temp = items.value[index];
    items.value[index] = items.value[index - 1];
    items.value[index - 1] = temp;
  }
};
const moveDown = (index: number) => {
  if (index < items.value.length - 1) {
    const temp = items.value[index];
    items.value[index] = items.value[index + 1];
    items.value[index + 1] = temp;
  }
};
</script>

<template>
  <div>
    <VueDraggable ref="el" v-model="items" :animation="100" handle=".drag-handle" class="pb-1">
      <TransitionGroup>
        <div v-for="(item, index) in items" :key="item.id" class="w-full flex items-start gap-1">
          <img
            alt="drag handle"
            class="drag-handle cursor-move w-5 mt-2"
            src="@/assets/draggable.svg"
          />
          <slot :index="index" :item="item" name="inputs" />
          <div class="relative top-[-15px] flex flex-col justify-center items-center">
            <Button
              :disabled="index === 0 || disabled"
              icon="pi pi-arrow-up"
              size="small"
              text
              @click="moveUp(index)"
            />
            <Button
              :disabled="index === items.length - 1 || disabled"
              icon="pi pi-arrow-down"
              size="small"
              text
              @click="moveDown(index)"
            />
          </div>
          <Button
            :disabled="disabled"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            text
            @click="handleRemove(index)"
          />
        </div>
      </TransitionGroup>
    </VueDraggable>
    <div v-if="items.length === 0" class="mb-4 text-center text-gray-500">
      {{ emptyMessage }}
    </div>
    <Button
      :disabled="disabled"
      class="mt-2"
      label="Add More"
      variant="outlined"
      @click="handleAdd"
    />
  </div>
</template>

<style></style>
