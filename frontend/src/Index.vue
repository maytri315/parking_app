<template>
    <div>
        <Navbar />
        <div class="home-page">
            <h1>Welcome to Parking App</h1>
            <p>Your solution for easy parking management.</p>
            <router-link to="/login">
                <button>Login</button>
            </router-link>
            <router-link to="/register">
                <button>Register</button>
            </router-link>
        </div>


    </div>
</template>

<script>
import Navbar from './components/Navbar.vue';

export default {
  name: 'Index',
  components: {
    Navbar
  }
};
</script>