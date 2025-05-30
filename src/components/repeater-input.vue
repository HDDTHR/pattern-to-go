<script generic="T" lang="ts" setup>
import Button from 'primevue/button'
import { VueDraggable } from 'vue-draggable-plus'
import type { ItemWithId } from '@/composables/types.ts'

type Item = T & ItemWithId
const items = defineModel<Item[]>({ default: () => [] })
const { defaultItem } = defineProps<{
  defaultItem: T
  emptyMessage: string
}>()

const handleAdd = () => {
  items.value.push({ id: items.value.length, ...defaultItem })
}

const handleRemove = (index: number) => {
  items.value.splice(index, 1)
}

const moveUp = (index: number) => {
  if (index > 0) {
    const temp = items.value[index]
    items.value[index] = items.value[index - 1]
    items.value[index - 1] = temp
  }
}
const moveDown = (index: number) => {
  if (index < items.value.length - 1) {
    const temp = items.value[index]
    items.value[index] = items.value[index + 1]
    items.value[index + 1] = temp
  }
}
</script>

<template>
  <div>
    <VueDraggable
      ref="el"
      v-model="items"
      :animation="100"
      handle=".drag-handle"
      target=".sort-target"
    >
      <TransitionGroup class="sort-target pb-1" name="fade" tag="div" type="transition">
        <div v-for="(item, index) in items" :key="item.id" class="w-full flex gap-1">
          <img alt="drag handle" class="drag-handle cursor-move w-5" src="@/assets/draggable.svg" />
          <slot :index="index" :item="item" name="inputs" />
          <div class="flex flex-col justify-center items-center">
            <Button
              :disabled="index === 0"
              icon="pi pi-arrow-up"
              size="small"
              text
              @click="moveUp(index)"
            />
            <Button
              :disabled="index === items.length - 1"
              icon="pi pi-arrow-down"
              size="small"
              text
              @click="moveDown(index)"
            />
          </div>
          <Button
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
    <Button class="mt-2" label="Add More" variant="outlined" @click="handleAdd" />
  </div>
</template>

<style scoped>
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-active {
  height: auto;
}

.dragging > :not(.sortable-chosen) {
  opacity: 0.5;
}
</style>
