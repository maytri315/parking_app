<template>
    <div class="container mt-5">
        <h1 class="text-center mb-4">Welcome to Vehicle Parking App</h1>
        <p class="text-center">Find and reserve parking spots easily!</p>
        <div class="d-flex justify-content-center gap-3">
            <router-link to="/login" class="btn btn-primary">Login</router-link>
            <router-link to="/register" class="btn btn-secondary">Register</router-link>
            <router-link to="/about" class="btn btn-info">About</router-link>
            <router-link to="/contact" class="btn btn-info">Contact</router-link>
        </div>
        <div class="mt-4 text-center">
            <button @click="testBackend" class="btn btn-success">Test Backend Connection</button>
            <p v-if="testMessage" class="mt-2">{{ testMessage }}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Home',
    data() {
        return {
            testMessage: ''
        };
    },
    methods: {
        async testBackend() {
            try {
                // Using fetch API directly
                const response = await fetch('http://localhost:5000/test');
                const data = await response.json();
                this.testMessage = `Backend Response: ${data.message}`;
                console.log('Backend response:', data);
            } catch (error) {
                this.testMessage = `Error connecting to backend: ${error.message}`;
                console.error('Error fetching from backend:', error);
            }
        }
    },
    // No data, methods, or lifecycle hooks needed for this simple component
};
</script>

<style scoped>
/* Add any Home-specific styles here if needed */
</style>