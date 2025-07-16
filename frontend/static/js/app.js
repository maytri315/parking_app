console.log("App.js is running!");
const { createApp } = Vue
const { createRouter, createWebHistory } = VueRouter
const Home = {
    template: `
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
    `,
    name: 'Home',
};

const Login = {
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <h2 class="mb-4 text-center">Login</h2>
          <form @submit.prevent="login" class="border p-4 rounded shadow">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input v-model="username" type="text" class="form-control" id="username" placeholder="Enter username" required>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" class="form-control" id="password" placeholder="Enter password" required>
            </div>
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button type="submit" class="btn btn-primary">Login</button>
              <button type="button" class="btn btn-secondary" @click="goToRegister">Register</button>
            </div>
            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
          </form>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('http://127.0.0.1:5000/api/login', {
          username: this.username,
          password: this.password
        })
        localStorage.setItem('token', response.data.access_token)
        const decoded = JSON.parse(atob(response.data.access_token.split('.')[1]))
        const role = decoded.role
        this.$router.push(role === 'admin' ? '/dashboard' : '/user-dashboard')
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
      }
    },
    goToRegister() {
      this.$router.push('/register')
    }
  }
}

const Register = {
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <h2 class="mb-4 text-center">Register</h2>
          <form @submit.prevent="register" class="border p-4 rounded shadow">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input v-model="username" type="text" class="form-control" id="username" placeholder="Enter username" required>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" class="form-control" id="password" placeholder="Enter password" required>
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input v-model="email" type="email" class="form-control" id="email" placeholder="Enter email" required>
            </div>
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button type="submit" class="btn btn-primary">Register</button>
              <button type="button" class="btn btn-secondary" @click="$router.push('/')">Back to Login</button>
            </div>
            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
          </form>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: '',
      password: '',
      email: '',
      error: ''
    }
  },
  methods: {
    async register() {
      try {
        await axios.post('http://127.0.0.1:5000/api/register', {
          username: this.username,
          password: this.password,
          email: this.email
        })
        this.$router.push('/')
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed'
      }
    }
  }
}

const AdminDashboard = {
  template: `
    <div class="container mt-5">
      <h2 class="mb-4 text-center">Admin Dashboard</h2>
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-danger" @click="logout">Logout</button>
      </div>
      <div class="card mb-4">
        <div class="card-header">Create Parking Lot</div>
        <div class="card-body">
          <form @submit.prevent="createLot">
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="name" class="form-label">Location Name</label>
                <input v-model="lot.name" type="text" class="form-control" id="name" placeholder="Enter location name" required>
              </div>
              <div class="col-md-6">
                <label for="price" class="form-label">Price</label>
                <input v-model.number="lot.price" type="number" class="form-control" id="price" placeholder="Enter price" required>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="address" class="form-label">Address</label>
                <input v-model="lot.address" type="text" class="form-control" id="address" placeholder="Enter address" required>
              </div>
              <div class="col-md-6">
                <label for="pinCode" class="form-label">Pin Code</label>
                <input v-model="lot.pinCode" type="text" class="form-control" id="pinCode" placeholder="Enter pin code" required>
              </div>
            </div>
            <div class="mb-3">
              <label for="spots" class="form-label">Number of Spots</label>
              <input v-model.number="lot.spots" type="number" class="form-control" id="spots" placeholder="Enter number of spots" required>
            </div>
            <button type="submit" class="btn btn-primary">Create Lot</button>
          </form>
        </div>
      </div>
      <h3 class="mb-3">Parking Lots</h3>
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Address</th>
            <th>Pin Code</th>
            <th>Spots</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lot in lots" :key="lot.id">
            <td>{{ lot.id }}</td>
            <td>{{ lot.prime_location_name }}</td>
            <td>{{ lot.price }}</td>
            <td>{{ lot.address }}</td>
            <td>{{ lot.pin_code }}</td>
            <td>{{ lot.number_of_spots }}</td>
            <td>
              <button class="btn btn-warning btn-sm me-2" @click="editLot(lot)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteLot(lot.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="error" class="text-danger mt-3">{{ error }}</p>
    </div>
  `,
  data() {
    return {
      lot: { name: '', price: 0, address: '', pinCode: '', spots: 0 },
      lots: [],
      error: ''
    }
  },
  methods: {
    async fetchLots() {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/parking_lots', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.lots = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch lots'
      }
    },
    async createLot() {
      try {
        await axios.post('http://127.0.0.1:5000/api/parking_lots', {
          prime_location_name: this.lot.name,
          price: this.lot.price,
          address: this.lot.address,
          pin_code: this.lot.pinCode,
          number_of_spots: this.lot.spots
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.lot = { name: '', price: 0, address: '', pinCode: '', spots: 0 }
        this.fetchLots()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create lot'
      }
    },
    async editLot(lot) {
      this.lot = {
        id: lot.id,
        name: lot.prime_location_name,
        price: lot.price,
        address: lot.address,
        pinCode: lot.pin_code,
        spots: lot.number_of_spots
      }
      await this.createLot()
    },
    async deleteLot(id) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/parking_lots/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.fetchLots()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete lot'
      }
    },
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/')
    }
  },
  mounted() {
    this.fetchLots()
  }
}

const UserDashboard = {
  template: `
    <div class="container mt-5">
      <h2 class="mb-4 text-center">User Dashboard</h2>
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-danger" @click="logout">Logout</button>
      </div>
      <div class="card mb-4">
        <div class="card-header">Available Parking Lots</div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lot in lots" :key="lot.id">
                <td>{{ lot.prime_location_name }}</td>
                <td>{{ lot.price }}</td>
                <td>{{ lot.address }}</td>
                <td>
                  <button class="btn btn-primary btn-sm" @click="viewSpots(lot.id)">View Spots</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="spots.length" class="card mb-4">
        <div class="card-header">Spots for {{ selectedLot?.prime_location_name }}</div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spot in spots" :key="spot.id">
                <td>{{ spot.id }}</td>
                <td>{{ spot.status === 'A' ? 'Available' : 'Occupied' }}</td>
                <td>
                  <button v-if="spot.status === 'A'" class="btn btn-success btn-sm" @click="reserveSpot(spot.id, selectedLot.id)">Reserve</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Your Reservations</div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Spot ID</th>
                <th>Parking Time</th>
                <th>Cost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reservation in reservations" :key="reservation.id">
                <td>{{ reservation.spot_id }}</td>
                <td>{{ reservation.parking_timestamp }}</td>
                <td>{{ reservation.parking_cost }}</td>
                <td>
                  <button v-if="!reservation.leaving_timestamp" class="btn btn-danger btn-sm" @click="releaseSpot(reservation.id)">Release</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" @click="exportCSV">Export Reservations</button>
          </div>
        </div>
      </div>
      <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
    </div>
  `,
  data() {
    return {
      lots: [],
      spots: [],
      selectedLot: null,
      reservations: [],
      error: ''
    }
  },
  methods: {
    async fetchLots() {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/parking_lots', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.lots = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch lots'
      }
    },
    async viewSpots(lotId) {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/spots/${lotId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.spots = response.data
        this.selectedLot = this.lots.find(lot => lot.id === lotId)
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch spots'
      }
    },
    async reserveSpot(spotId, lotId) {
      try {
        await axios.post('http://127.0.0.1:5000/api/reserve', { lot_id: lotId }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.viewSpots(lotId)
        this.fetchReservations()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to reserve spot'
      }
    },
    async releaseSpot(reservationId) {
      try {
        await axios.post(`http://127.0.0.1:5000/api/release/${reservationId}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.fetchReservations()
        if (this.selectedLot) this.viewSpots(this.selectedLot.id)
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to release spot'
      }
    },
    async fetchReservations() {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/reservations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.reservations = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch reservations'
      }
    },
    async exportCSV() {
      try {
        await axios.post('http://127.0.0.1:5000/api/export_csv', {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        this.error = 'Export job started. Check your email.'
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to start export'
      }
    },
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/')
    }
  },
  mounted() {
    this.fetchLots()
    this.fetchReservations()
  }
}

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: AdminDashboard, beforeEnter: (to, from, next) => {
    const token = localStorage.getItem('token')
    if (!token) return next('/')
    const decoded = JSON.parse(atob(token.split('.')[1]))
    if (decoded.role !== 'admin') return next('/')
    next()
  }},
  { path: '/user-dashboard', component: UserDashboard, beforeEnter: (to, from, next) => {
    if (!localStorage.getItem('token')) return next('/')
    next()
  }}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp({})
app.use(router)
app.mount('#app')