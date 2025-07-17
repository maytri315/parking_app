import { createRouter, createWebHistory } from 'vue-router';
import Index from './Index.vue';
import Home from './components/Home.vue';
import About from './components/About.vue';
import Contact from './components/Contact.vue';
import Register from './components/User/Register.vue';
import Login from './components/User/Login.vue';
import UserDashboard from './components/User/UserDashboard.vue';
import UserBookSpot from './components/User/UserBookSpot.vue';
import UserReleaseSpot from './components/User/UserReleaseSpot.vue';
import UserSelectLot from './components/User/UserSelectLot.vue';
import UserSummary from './components/User/UserSummary.vue';
import AdminDashboard from './components/Admin/AdminDashboard.vue';
import AdminEditLot from './components/Admin/AdminEditLot.vue';
import AdminViewLot from './components/Admin/AdminViewLot.vue';

const routes = [
  { path: '/', name: 'HomeIndex', component: Index, meta: { guest: true } },
  { path: '/home', name: 'Home', component: Home, meta: { guest: true } },
  { path: '/about', name: 'About', component: About, meta: { guest: true } },
  { path: '/contact', name: 'Contact', component: Contact, meta: { guest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guest: true } },
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
  { path: '/user/dashboard', name: 'UserDashboard', component: UserDashboard, meta: { requiresAuth: true, isUser: true } },
  { path: '/user/select-lot', name: 'UserSelectLot', component: UserSelectLot, meta: { requiresAuth: true, isUser: true } },
  { path: '/user/book-spot/:lotId/:spotId', name: 'UserBookSpot', component: UserBookSpot, props: true, meta: { requiresAuth: true, isUser: true } },
  { path: '/user/release-spot/:reservationId', name: 'UserReleaseSpot', component: UserReleaseSpot, props: true, meta: { requiresAuth: true, isUser: true } },
  { path: '/user/summary', name: 'UserSummary', component: UserSummary, meta: { requiresAuth: true, isUser: true } },
  { path: '/admin/dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true, isAdmin: true } },
  { path: '/admin/edit-lot/:id', name: 'AdminEditLot', component: AdminEditLot, props: true, meta: { requiresAuth: true, isAdmin: true } },
  { path: '/admin/view-lot/:id', name: 'AdminViewLot', component: AdminViewLot, props: true, meta: { requiresAuth: true, isAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('user_role');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.guest && token) {
    if (userRole === 'admin') {
      next('/admin/dashboard');
    } else {
      next('/user/dashboard');
    }
  } else if (to.meta.isAdmin && userRole !== 'admin') {
    next('/user/dashboard');
  } else if (to.meta.isUser && userRole !== 'user') {
    next('/admin/dashboard');
  } else {
    next();
  }
});

export default router;