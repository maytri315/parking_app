// C:\Users\Admin\Desktop\parking_app\frontend\src\router.js

import { createRouter, createWebHistory } from 'vue-router'

// Core application components
import App from './App.vue' // App.vue is usually the root component, not a route itself
import Index from './Index.vue' // Often your main landing page

// General utility components (assuming they are public)
import About from './components/About.vue'
import Contact from './components/Contact.vue'
import Home from './components/Home.vue' // If this is a separate home page from Index.vue

// User-related components (authentication routes)
import Register from './components/User/Register.vue'
import Login from './components/User/Login.vue'

// User dashboard and actions (require authentication)
import UserDashboard from './components/User/UserDashboard.vue'
import UserBookSpot from './components/User/UserBookSpot.vue'
import UserReleaseSpot from './components/User/UserReleaseSpot.vue'
import UserSelectLot from './components/User/UserSelectLot.vue'
import UserSummary from './components/User/UserSummary.vue'

// Admin-related components (require authentication and admin role)
import AdminDashboard from './components/Admin/AdminDashboard.vue'
import AdminEditLot from './components/Admin/AdminEditLot.vue'
import AdminViewLot from './components/Admin/AdminViewLot.vue'

// Navbar.vue is typically a component used within App.vue or other layouts, not a route itself.


const routes = [
    // --- Public Routes ---
    { path: '/', name: 'HomeIndex', component: Index }, // Your main landing page
    { path: '/about', name: 'About', component: About },
    { path: '/contact', name: 'Contact', component: Contact },
    { path: '/general-home', name: 'GeneralHome', component: Home }, // If 'Home.vue' is a separate general home page

    // --- Authentication Routes ---
    { path: '/register', name: 'Register', component: Register },
    { path: '/login', name: 'Login', component: Login },

    // --- User Authenticated Routes ---
    { path: '/user/dashboard', name: 'UserDashboard', component: UserDashboard, meta: { requiresAuth: true } },
    { path: '/user/book', name: 'UserBookSpot', component: UserBookSpot, meta: { requiresAuth: true } },
    { path: '/user/release', name: 'UserReleaseSpot', component: UserReleaseSpot, meta: { requiresAuth: true } },
    { path: '/user/select-lot', name: 'UserSelectLot', component: UserSelectLot, meta: { requiresAuth: true } },
    { path: '/user/summary', name: 'UserSummary', component: UserSummary, meta: { requiresAuth: true } },

    // --- Admin Authenticated & Authorized Routes ---
    { path: '/admin/dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
    // Using dynamic segments for ID for editing/viewing specific lots
    { path: '/admin/edit-lot/:id', name: 'AdminEditLot', component: AdminEditLot, props: true, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/view-lot/:id', name: 'AdminViewLot', component: AdminViewLot, props: true, meta: { requiresAuth: true, requiresAdmin: true } },

    // --- Catch-all 404 route (optional, but good practice) ---
    // Make sure this is the last route
    // { path: '/:catchAll(.*)', name: 'NotFound', component: NotFoundComponent } // You'd need to create a NotFoundComponent.vue
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// --- Navigation Guard for Authentication and Authorization ---
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('access_token'); // Check if a token exists
    // You might also store user role in localStorage or a Vuex/Pinia store
    const userRole = localStorage.getItem('user_role'); // e.g., 'user' or 'admin'

    if (to.meta.requiresAuth && !isAuthenticated) {
        // If the route requires authentication but no token is found
        console.log("Redirecting to login: Not authenticated.");
        next('/login');
    } else if (to.meta.requiresAdmin && userRole !== 'admin') {
        // If the route requires admin privileges but the user is not an admin
        console.log("Redirecting to user dashboard: Not authorized as admin.");
        // You can redirect to a general user dashboard or an unauthorized page
        next('/user/dashboard'); // Or '/unauthorized' if you have one
    } else {
        // Continue to the route
        next();
    }
});


export default router;