<template>
    <div>
        <nav class="navbar">
            <div class="navbar-brand">
                <router-link to="/">ParkingApp</router-link> </div>
            <ul class="navbar-links">
                <li><router-link to="/">Home</router-link></li> <li><router-link to="/about">About</router-link></li> <li><router-link to="/contact">Contact</router-link></li> <li><router-link to="/login">Login</router-link></li> </ul>
        </nav>
    </div>
</template>

<script>
export default {
    name: 'Navbar'
}
</script>

<style scoped>
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2c3e50;
    padding: 1rem 2rem;
    color: #fff;
}

.navbar-brand a {
    color: #fff;
    font-size: 1.5rem;
    text-decoration: none;
    font-weight: bold;
}

.navbar-links {
    list-style: none;
    display: flex;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
}

.navbar-links a {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
}

.navbar-links a:hover {
    text-decoration: underline;
}
</style>