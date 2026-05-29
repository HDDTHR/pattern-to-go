import {
  type ChatCompletionChunk,
  CreateMLCEngine,
  type MLCEngineInterface,
} from '@mlc-ai/web-llm';
import { Readability } from '@mozilla/readability';
import { parse } from 'jsonriver';
import { ref } from 'vue';

import schema from '@/assets/generation_settings_schema.json';
import systemPrompt from '@/assets/prompt.txt?raw';
import { getErrorMessage } from '@/composables/utils.ts';
import { GenerationState, type LLMGeneratedSettings } from '@/types.ts';

const PARSER = new DOMParser();

const state = ref<GenerationState>(GenerationState.IDLE);
const downloadingMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const generationResult = ref<Partial<LLMGeneratedSettings> | null>(null);
let engine: MLCEngineInterface | null = null;

const useLLM = () => {
  async function initializeEngine() {
    if (!engine) {
      state.value = GenerationState.DOWNLOADING_MODEL;
      engine = await CreateMLCEngine('Qwen2.5-7B-Instruct-q4f32_1-MLC', {
        initProgressCallback: (progress) => {
          downloadingMessage.value = `${Math.round(progress.progress * 100)}%`;
        },
      });
    }
  }

  async function scrapePage(url: string) {
    state.value = GenerationState.SCRAPING_PAGE;
    const response = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(url));
    const text = await response.text();
    const doc = PARSER.parseFromString(text, 'text/html');
    const article = new Readability(doc).parse();
    if (!article || !article.content)
      throw new Error('Readability Library Failed To Extract Relevant Content From Pattern Page.');
    const articleDoc = PARSER.parseFromString(article.content, 'text/html');
    Array.from(articleDoc.body?.querySelectorAll('*') ?? [])
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join('\n');
    return `Page title: ${article.title}\nPage URL: ${url}\n\n${articleDoc.documentElement.innerText}`;
  }

  async function generateSettings(pageText: string) {
    state.value = GenerationState.GENERATING;
    generationResult.value = {};

    const chunks = await engine!.chat.completions.create({
      stream: true,
      response_format: { type: 'json_object', schema: JSON.stringify(schema) },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: pageText },
      ],
    });
    const textChunks = mapToStringAsyncIterable(chunks);
    const parsedJsonObjects = parse(textChunks);
    for await (const object of parsedJsonObjects) {
      generationResult.value = JSON.parse(
        JSON.stringify(object),
      ) as unknown as LLMGeneratedSettings;
    }
  }

  async function* mapToStringAsyncIterable(source: AsyncIterable<ChatCompletionChunk>) {
    for await (const item of source) {
      yield item.choices[0]?.delta?.content || '';
    }
  }

  const startGeneration = async (url: string) => {
    errorMessage.value = null;
    downloadingMessage.value = null;
    generationResult.value = null;
    try {
      await initializeEngine();
      const response = await scrapePage(url);
      await generateSettings(response);
    } catch (e) {
      console.log(e);
      errorMessage.value = getErrorMessage(e);
    } finally {
      state.value = GenerationState.IDLE;
    }
  };

  return {
    state,
    downloadingMessage,
    errorMessage,
    generationResult,
    startGeneration,
  };
};

export { useLLM };
