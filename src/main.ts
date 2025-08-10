import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import budouxDirective from './directives/budoux';

createApp(App).directive('budoux', budouxDirective).mount('#app');
