<template>
    <div>
        <nav class="navbar">
            <div class="navbar-brand">
                <a href="/">ParkingApp</a>
            </div>
            <ul class="navbar-links">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/login">Login</a></li>

            </ul>
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