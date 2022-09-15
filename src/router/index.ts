import { RouteRecordRaw, createWebHashHistory, createRouter } from 'vue-router';
import Home from '../views/Home.vue';
import S3ToolBox from '../views/S3ToolBox.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    alias: '/*',
  },
  {
    path: '/s3toolbox',
    name: 's3toolbox',
    component: S3ToolBox,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
