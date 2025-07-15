<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <h2 class="mb-4 text-center">Login</h2>
                <form @submit.prevent="login" class="border p-4 rounded shadow">
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input v-model="email" type="email" class="form-control" id="email" placeholder="Enter email" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input v-model="password" type="password" class="form-control" id="password" placeholder="Enter password" required>
                    </div>
                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" class="btn btn-primary">Login</button>
                        <router-link to="/register" class="btn btn-secondary">Register</router-link>
                    </div>
                    <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
// Import axios here, as it's used by this component
import axios from 'axios';

export default {
    name: 'Login',
    data() {
        return {
            email: '',
            password: '',
            error: ''
        };
    },
    methods: {
        async login() {
            try {
                // IMPORTANT: You need to define `window.config` or pass it as a prop/provide-inject
                // For now, let's assume config.apiBaseUrl is hardcoded or globally available
                // If you fetch config.json, that logic needs to happen before this component loads
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback for development
                
                const response = await axios.post(`${config.apiBaseUrl}/login`, new URLSearchParams({
                    email: this.email,
                    password: this.password
                }), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                localStorage.setItem('token', response.data.access_token);
                const decoded = JSON.parse(atob(response.data.access_token.split('.')[1]));
                this.$router.push(decoded.is_admin ? '/admin/dashboard' : '/user/dashboard');
            } catch (err) {
                this.error = err.response?.data?.message || 'Login failed';
            }
        }
    }
};
</script>

<style scoped>
/* Add any Login-specific styles here if needed */
</style>