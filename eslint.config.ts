import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { globalIgnores } from 'eslint/config'
import simpleImportSort from "eslint-plugin-simple-import-sort";
import pluginVue from 'eslint-plugin-vue'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    },
  },
);
