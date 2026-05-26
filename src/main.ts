import './assets/main.css';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import { createApp } from 'vue';

import App from './App.vue';

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark-mode',
    },
  },
});
app.directive('tooltip', Tooltip);

app.mount('#app');
