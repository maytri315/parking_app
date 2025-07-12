<template>
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h2 class="mb-4">Login</h2>
      <div class="card">
        <div class="card-body">
          <form @submit.prevent="login">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input v-model="username" type="text" class="form-control" id="username" required>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" class="form-control" id="password" required>
            </div>
            <div class="mb-3" v-if="isRegister">
              <label for="email" class="form-label">Email</label>
              <input v-model="email" type="email" class="form-control" id="email" required>
            </div>
            <button type="submit" class="btn btn-primary me-2">{{ isRegister ? 'Register' : 'Login' }}</button>
            <button type="button" class="btn btn-secondary" @click="toggleRegister">
              {{ isRegister ? 'Back to Login' : 'Register' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      email: '',
      isRegister: false
    };
  },
  methods: {
    async login() {
      try {
        if (this.isRegister) {
          await axios.post('http://localhost:5000/api/register', {
            username: this.username,
            password: this.password,
            email: this.email
          });
          alert('Registration successful. Please login.');
          this.isRegister = false;
        } else {
          const response = await axios.post('http://localhost:5000/api/login', {
            username: this.username,
            password: this.password
          });
          localStorage.setItem('token', response.data.access_token);
          const role = JSON.parse(atob(response.data.access_token.split('.')[1])).role;
          this.$router.push(role === 'admin' ? '/dashboard' : '/user-dashboard');
        }
      } catch (error) {
        alert(this.isRegister ? 'Registration failed' : 'Login failed');
      }
    },
    toggleRegister() {
      this.isRegister = !this.isRegister;
    }
  }
}
</script>