import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import UserDashboard from './components/UserDashboard.vue';

const routes = [
  { path: '/', component: Login },
  { path: '/dashboard', component: AdminDashboard, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/user-dashboard', component: UserDashboard, meta: { requiresAuth: true, role: 'user' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/');
  } else if (to.meta.requiresAuth) {
    const role = JSON.parse(atob(token.split('.')[1])).role;
    if (to.meta.role && role !== to.meta.role) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

createApp(App).use(router).mount('#app');