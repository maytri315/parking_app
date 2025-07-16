<!-- src/components/User/Login.vue -->
<template>
    <div class="login-container">
        <h2>Login</h2>
        <form @submit.prevent="handleLogin">
            <input v-model="username" type="text" placeholder="Username" required />
            <input v-model="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Login',
    data() {
        return {
            username: '',
            password: '',
            error: '',
        }
    },
    methods: {
        async handleLogin() {
            try {
                const response = await axios.post('http://localhost:5000/login', {
                    username: this.username,
                    password: this.password,
                })

                const token = response.data.access_token
                localStorage.setItem('token', token)
                this.$router.push('/') // Redirect after login
            } catch (err) {
                this.error = err.response?.data?.message || 'Login failed'
            }
        },
    },
}
</script>

<style scoped>
.login-container {
    max-width: 300px;
    margin: auto;
    padding: 1rem;
    border: 1px solid #ccc;
}

.error {
    color: red;
}
</style>
