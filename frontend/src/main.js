import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';
import App from './App.vue'; // Make sure App.vue is in src/
import Login from './components/Login.vue'; // Make sure Login.vue is in src/components/
import Register from './components/Register.vue';
import UserDashboard from './components/User/UserDashboard.vue';
import AdminDashboard from './components/Admin/AdminDashboard.vue';
import UserSummary from './components/User/UserSummary.vue';
import UserSelectLot from './components/User/UserSelectLot.vue';
import UserBookSpot from './components/User/UserBookSpot.vue';
import UserReleaseSpot from './components/User/UserReleaseSpot.vue';


// Set Axios base URL
axios.defaults.baseURL = 'http://127.0.0.1:5000'; // Flask backend URL

// Define your routes (you had this, just ensure it's here)
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login, meta: { guest: true } },
    { path: '/register', component: Register, meta: { guest: true } },
    { path: '/user/dashboard', component: UserDashboard, meta: { requiresAuth: true, isUser: true } },
    { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresAuth: true, isAdmin: true } },
    { path: '/user/summary', component: UserSummary, meta: { requiresAuth: true, isUser: true } },
    { path: '/user/select-lot', component: UserSelectLot, meta: { requiresAuth: true, isUser: true } },
    { path: '/user/book-spot/:lotId/:spotId', name: 'BookSpot', component: UserBookSpot, props: true, meta: { requiresAuth: true, isUser: true } },
    { path: '/user/release-spot/:reservationId', name: 'ReleaseSpot', component: UserReleaseSpot, props: true, meta: { requiresAuth: true, isUser: true } },
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

const app = createApp(App); // Here 'App' is the root App.vue component
app.use(router);
app.mount('#app');