import { expose } from 'comlink'
import { strFromU8, strToU8, zipSync } from 'fflate'
import Velocity from 'velocityjs'
import type { GenerationSettings } from '@/composables/types.ts'

const getContext = (settings: GenerationSettings) => ({
  ...settings,
  context: {
    currentDate: new Date().toISOString().split('T')[0],
  },
  helpers: {
    getUrlHost: (url: string) => new URL(url).host,
  },
})

const renderEpub = async (
  templateEntries: Record<string, Uint8Array>,
  settings: GenerationSettings,
): Promise<string> => {
  const files = renderTemplate(templateEntries, settings)
  if (settings.coverImageUri)
    await generateCoverFromUri(settings.coverImageUri, 1000, 1000, settings.title, files)
  const zipped = zipSync(files)
  return URL.createObjectURL(new Blob([zipped], { type: 'application/epub+zip' }))
}

const renderTemplate = (
  templateEntries: Record<string, Uint8Array>,
  settings: GenerationSettings,
): Record<string, Uint8Array> => {
  const files: Record<string, Uint8Array> = {}

  for (const [filename, content] of Object.entries(templateEntries)) {
    const isTextFile = /\.(xhtml|html|opf|ncx|xml|txt|css|json)$/.test(filename)
    if (isTextFile) {
      const text = strFromU8(content)
      const rendered = Velocity.render(text, getContext(settings))
      files[filename] = strToU8(rendered)
    } else {
      files[filename] = content
    }
  }
  return files
}

const generateCoverFromUri = async (
  blobUri: string,
  targetWidth: number,
  targetHeight: number,
  text: string,
  files: Record<string, Uint8Array>,
): Promise<void> => {
  const response = await fetch(blobUri)
  if (!response.ok) throw new Error('Failed to fetch blob URI')
  const blob = await response.blob()

  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D context')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const scale = Math.max(targetWidth / bitmap.width, targetHeight / bitmap.height)
  const scaledWidth = bitmap.width * scale
  const scaledHeight = bitmap.height * scale
  const dx = (targetWidth - scaledWidth) / 2
  const dy = (targetHeight - scaledHeight) / 2
  ctx.clearRect(0, 0, targetWidth, targetHeight)
  ctx.drawImage(bitmap, dx, dy, scaledWidth, scaledHeight)

  ctx.font = '80px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'

  const maxTextWidth = targetWidth * 0.8
  const lineHeight = 110

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxTextWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const paddingX = 20
  const paddingY = 20
  const boxWidth = maxTextWidth + paddingX * 2
  const boxHeight = lines.length * lineHeight + paddingY * 2

  const rectX = (targetWidth - boxWidth) / 2
  const rectY = 10
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(rectX, rectY, boxWidth, boxHeight)

  ctx.fillStyle = '#ffffff'
  lines.forEach((line, i) => {
    const lineWidth = ctx.measureText(line).width
    const lineX = rectX + paddingX + (maxTextWidth - lineWidth) / 2
    const lineY = rectY + paddingY + i * lineHeight
    ctx.fillText(line, lineX, lineY)
  })

  const resultBlob = await canvas.convertToBlob()
  files['OEBPS/Images/cover.jpg'] = new Uint8Array(await resultBlob.arrayBuffer())
}
expose({ renderEpub })
