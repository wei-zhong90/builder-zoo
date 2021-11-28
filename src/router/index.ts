import { RouteRecordRaw, createWebHistory, createRouter } from 'vue-router';
import Home from '../views/Home.vue';
import AccessTest from '../views/AccessTest.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/accesstest',
    name: 'accesstest',
    component: AccessTest,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
