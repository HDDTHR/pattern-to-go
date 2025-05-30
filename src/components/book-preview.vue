<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import ePub, { Book, Rendition } from 'epubjs'

const { url, title, loading, error, errorMessage } = defineProps<{
  url: string | null
  title: string | null
  loading: boolean
  error: boolean
  errorMessage: string | null
}>()

const viewerContainer = ref<HTMLElement | null>(null)
const aElement = ref<HTMLLinkElement | null>(null)
const firstRendering = ref<boolean>(true)

let currentLocation: Rendition['location'] | null = null
let book: Book | null = null
let rendition: Rendition | null = null
const snakeTitle = title?.toLowerCase().replace(/ /g, '_')

const message = computed(() => {
  if (firstRendering.value) return 'Add some parameters to watch live changes...'
  if (loading) return 'loading..'
  if (error) return errorMessage ?? 'Unknown error occurred'
  return 'Up-to-date'
})

const circleClass = computed(() => {
  if (firstRendering.value) return 'border-2 text-gray-500'
  if (loading) return 'border-none bg-orange-200'
  if (error) return 'border-none bg-red-400'
  return 'border-none bg-green-400'
})

const initBook = async () => {
  if (!url) return
  if (firstRendering.value) firstRendering.value = false

  const savedLocation = currentLocation?.start.cfi

  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    if (book) book.destroy()
    book = ePub(buffer)

    await book.ready
    await nextTick()

    if (!viewerContainer.value) return

    rendition = book.renderTo(viewerContainer.value, {
      width: '100%',
      height: '100%',
    })
    rendition.on('relocated', (location: Rendition['location']) => {
      currentLocation = location
    })

    await rendition.display(savedLocation || undefined)
  } catch (e) {
    console.error('Failed to load EPUB:', e)
  }
}

const nextPage = () => rendition?.next()
const prevPage = () => rendition?.prev()

watch(
  () => url,
  () => initBook(),
  { immediate: true },
)
onMounted(initBook)
onUnmounted(() => book?.destroy())
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4 items-center">
      <div :class="circleClass" class="shrink-0 w-4 h-4 rounded-[50%] transition-colors" />
      <span class="text-gray-500 grow truncate">{{ message }}</span>
    </div>
    <div class="relative grow">
      <div class="absolute w-full h-full flex justify-between items-center px-4 z-1">
        <Button
          :disabled="currentLocation?.atStart"
          icon="pi pi-chevron-left"
          rounded
          severity="secondary"
          @click="prevPage()"
        />
        <Button
          :disabled="currentLocation?.atEnd"
          icon="pi pi-chevron-right"
          rounded
          severity="secondary"
          @click="nextPage()"
        />
      </div>
      <div ref="viewerContainer" class="w-full h-full border border-gray-300 overflow-hidden"></div>
    </div>
    <div class="flex flex-row-reverse">
      <Button
        :disabled="error || loading || firstRendering"
        @click="() => aElement?.click()"
        icon="pi pi-download"
        label="Download"
        :severity="error || loading || firstRendering ? 'secondary' : 'primary'"
      />
      <a v-if="url && title" ref="aElement" :download="snakeTitle" :href="url" class="hidden" />
    </div>
  </div>
</template>
