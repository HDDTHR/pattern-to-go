<script lang="ts" setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'

const previewUrl = defineModel<string | null>({ default: () => null })
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref<boolean>(false)

let currentBlobUrl: string | null = null

const dimensions = ref<string>('')

watch(previewUrl, (url) => {
  if (!url) {
    dimensions.value = ''
    return
  }

  const img = new Image()
  img.onload = () => {
    dimensions.value = `${img.width} x ${img.height}`
  }
  img.src = url
})

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    loadPreview(input.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    loadPreview(file)
  }
}

const loadPreview = (file: File) => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
  }
  const blobUrl = URL.createObjectURL(file)
  currentBlobUrl = blobUrl
  previewUrl.value = blobUrl
}

const removeImage = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  isDragging.value = false
}

let dragCounter = 0
const onDragEnter = (e: DragEvent) => {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}
</script>
<template>
  <div>
    <div
      v-if="!previewUrl"
      :class="isDragging ? 'p-12' : ''"
      class="flex flex-col justify-center p-4 outline-dashed rounded text-gray-500 outline-2 bg-gray-100 cursor-pointer"
      @click="triggerFileSelect"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div class="text-center">Drag and drop files here to upload.</div>
      <div class="text-center text-sm">or <span class="underline">click here</span></div>
      <input
        ref="fileInput"
        accept="image/png, image/jpeg, image/bmp, image/gif, image/webp"
        class="hidden"
        type="file"
        @change="handleFileChange"
      />
    </div>

    <div v-else class="relative inline-block">
      <img
        :src="previewUrl"
        alt="Uploaded"
        class="rounded max-w-full max-h-64 min-h-32 object-contain border border-gray-300"
      />
      <Button
        class="absolute top-1 right-1"
        icon="pi pi-times"
        raised
        rounded
        severity="danger"
        size="small"
        @click="removeImage"
      />
      <span class="absolute bottom-1 left-1 bg-highlight text-gray-500">{{ dimensions }}</span>
    </div>
  </div>
</template>

<style scoped>
.p-button {
  position: absolute;
}
</style>
