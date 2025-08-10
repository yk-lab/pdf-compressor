import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import budouxd from './directives/budoux';

createApp(App).directive('budoux', budouxd).mount('#app');
