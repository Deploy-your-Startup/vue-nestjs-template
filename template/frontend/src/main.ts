import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Board from './Board.vue';
import './style.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Board },
    { path: '/shipped', component: Board },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

createApp(App).use(router).mount('#app');
