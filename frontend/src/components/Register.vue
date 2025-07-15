<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <h2 class="mb-4 text-center">Register</h2>
                <form @submit.prevent="register" class="border p-4 rounded shadow">
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input v-model="email" type="email" class="form-control" id="email" placeholder="Enter email" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input v-model="password" type="password" class="form-control" id="password" placeholder="Enter password" required>
                    </div>
                    <div class="mb-3 form-check">
                        <input v-model="isAdmin" type="checkbox" class="form-check-input" id="isAdmin">
                        <label for="isAdmin" class="form-check-label">Register as Admin</label>
                    </div>
                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" class="btn btn-primary">Register</button>
                        <router-link to="/login" class="btn btn-secondary">Back to Login</router-link>
                    </div>
                    <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'; // Don't forget to import axios!

export default {
    name: 'Register',
    data() {
        return {
            email: '',
            password: '',
            isAdmin: false,
            error: ''
        };
    },
    methods: {
        async register() {
            try {
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
                await axios.post(`${config.apiBaseUrl}/register`, new URLSearchParams({
                    email: this.email,
                    password: this.password,
                    is_admin: this.isAdmin
                }), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                this.$router.push('/login');
            } catch (err) {
                this.error = err.response?.data?.message || 'Registration failed';
            }
        }
    }
};
</script>

<style scoped>
/* Add any Register-specific styles here if needed */
</style>