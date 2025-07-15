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
    </div>
</template>

<script>
export default {
    name: 'Home',
    // No data, methods, or lifecycle hooks needed for this simple component
};
</script>

<style scoped>
/* Add any Home-specific styles here if needed */
</style>