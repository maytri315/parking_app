<template>
    <div class="login-container">
        <h2>Login</h2>
        <form @submit.prevent="handleLogin">
            <input v-model="username" type="text" placeholder="Username" required />
            <input v-model="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
            <router-link to="/register" class="register-link">Register</router-link>
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
                // CHANGE THIS LINE: Use the proxy path /api/login
                const response = await axios.post('/api/login', {
                    username: this.username,
                    password: this.password,
                })

                const token = response.data.access_token
                localStorage.setItem('token', token)
                localStorage.setItem('user_role', response.data.user_role); // Store user role
                
                // Redirect based on role or to a default page
                if (response.data.user_role === 'admin') {
                    this.$router.push('/admin/dashboard');
                } else {
                    this.$router.push('/user/dashboard');
                }
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
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.login-container h2 {
    text-align: center;
    margin-bottom: 20px;
}

.login-container form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.login-container input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.login-container button {
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.login-container button:hover {
    background-color: #0056b3;
}

.register-link {
    display: block;
    text-align: center;
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #6c757d;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 14px;
}

.register-link:hover {
    background-color: #5a6268;
}

.error {
    color: red;
    text-align: center;
    margin-top: 10px;
}
</style>