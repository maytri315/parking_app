import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router'; // Or createWebHashHistory if you prefer that mode
import App from './App.vue'; // Your main App component

// Import all your individual components
import Home from './components/Home.vue';
import Contact from './components/Contact.vue';
import About from './components/About.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import UserDashboard from './components/UserDashboard.vue';
import AdminEditLot from './components/AdminEditLot.vue';
import AdminViewLot from './components\AdminViewLot.vue';
// ... import any other components you create (e.g., AdminEditUser, AdminViewSpot, etc.)

// Define your routes
const routes = [
    { path: '/', component: Home },
    { path: '/contact', component: Contact },
    { path: '/about', component: About },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/admin/dashboard', component: AdminDashboard },
    { path: '/user/dashboard', component: UserDashboard },
    { path: '/admin/edit-lot/:id', component: AdminEditLot, props: true },
    { path: '/admin/view-lot/:id', component: AdminViewLot, props: true },
    // Add all other routes here, mapping paths to your imported components
    // Example: { path: '/admin/edit-user/:id', component: AdminEditUser, props: true },
    // Example: { path: '/admin/spot-details/:id', component: AdminSpotDetails, props: true },
    // Example: { path: '/user/select-lot/:id', component: UserSelectLot, props: true },
    // Example: { path: '/user/release-reservation/:id', component: UserReleaseReservation, props: true },
    // Example: { path: '/admin/summary', component: AdminSummary },
    // Example: { path: '/admin/occupied-spots', component: AdminOccupiedSpots },
    // Example: { path: '/admin/search', component: AdminSearch },
    // Example: { path: '/admin/view-delete-spot', component: AdminViewDeleteSpot },
    // Example: { path: '/user/summary', component: UserSummary },
];

// Create the router instance
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), // Keep this or change to createWebHashHistory()
    routes,
});

// Create the Vue app instance
const app = createApp(App); // Mounts your root App.vue component

// Use the router
app.use(router);

// Mount the app to the DOM element with id="app" (in public/index.html)
app.mount('#app');

// Important: If you still need a global config loaded from config.json,
// you'll need to rethink how to load it. For now, you might hardcode it
// or ensure it's loaded in index.html before your app starts.
// For example:
window.config = {
    apiBaseUrl: 'http://localhost:5000' // Make sure this matches your Flask backend URL
};

// If you want to use axios or Chart.js globally (less common in modern Vue)
// you'd typically import them in individual components or use plugins.
// If you want to keep them global from CDN as before, ensure they are in index.html.