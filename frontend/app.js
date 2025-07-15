```javascript
const { createApp } = Vue;
const { createRouter, createWebHistory } = VueRouter;
```

axios.get('/jsonfiles/config.json').then(response => {
    window.config = response.data;

    // Home Component
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
        `
    };

    // Contact Component
    const Contact = {
        template: `
            <div class="container mt-5">
                <h2 class="text-center mb-4">Contact Us</h2>
                <p class="text-center">Email: support@parkingapp.com</p>
                <p class="text-center">Phone: +91-123-456-7890</p>
                <div class="d-flex justify-content-center">
                    <router-link to="/" class="btn btn-secondary">Back to Home</router-link>
                </div>
            </div>
        `
    };

    // About Component
    const About = {
        template: `
            <div class="container mt-5">
                <h2 class="text-center mb-4">About Vehicle Parking App</h2>
                <p class="text-center">Our app provides a seamless way to find, reserve, and manage parking spots in various locations.</p>
                <div class="d-flex justify-content-center">
                    <router-link to="/" class="btn btn-secondary">Back to Home</router-link>
                </div>
            </div>
        `
    };

    // Login Component
    const Login = {
        template: `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <h2 class="mb-4 text-center">Login</h2>
                        <form @submit.prevent="login" class="border p-4 rounded shadow">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input v-model="email" type="email" class="form-control" id="email" placeholder="Enter email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input v-model="password" type="password" class="form-control" id="password" placeholder="Enter password" required>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Login</button>
                                <router-link to="/register" class="btn btn-secondary">Register</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                email: '',
                password: '',
                error: ''
            };
        },
        methods: {
            async login() {
                try {
                    const response = await axios.post(`${config.apiBaseUrl}/login`, new URLSearchParams({
                        email: this.email,
                        password: this.password
                    }), {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    localStorage.setItem('token', response.data.access_token);
                    const decoded = JSON.parse(atob(response.data.access_token.split('.')[1]));
                    this.$router.push(decoded.is_admin ? '/admin/dashboard' : '/user/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.message || 'Login failed';
                }
            }
        }
    };

    // Register Component
    const Register = {
        template: `
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
        `,
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

    // AdminDashboard Component
    const AdminDashboard = {
        template: `
            <div class="corner-ribbon top-right sticky red">Admin</div>
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
                                    <label for="price" class="form-label">Price (₹/hr)</label>
                                    <input v-model.number="lot.price" type="number" step="0.01" class="form-control" id="price" placeholder="Enter price" required>
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
                                <label for="spots" class="form-label">Maximum Spots</label>
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
                            <td>{{ lot.name }}</td>
                            <td>{{ lot.price }}</td>
                            <td>{{ lot.address }}</td>
                            <td>{{ lot.pin_code }}</td>
                            <td>{{ lot.spots }}</td>
                            <td>
                                <router-link :to="'/admin/edit-lot/' + lot.id" class="btn btn-warning btn-sm me-2">Edit</router-link>
                                <button class="btn btn-danger btn-sm" @click="deleteLot(lot.id)">Delete</button>
                                <router-link :to="'/admin/view-lot/' + lot.id" class="btn btn-info btn-sm ms-2">View</router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <h3 class="mb-3">Users</h3>
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.email }}</td>
                            <td>{{ user.is_admin ? 'Admin' : 'User' }}</td>
                            <td>{{ user.is_blocked ? 'Blocked' : 'Active' }}</td>
                            <td>
                                <router-link :to="'/admin/edit-user/' + user.id" class="btn btn-warning btn-sm me-2">Edit</router-link>
                                <button v-if="!user.is_blocked" class="btn btn-danger btn-sm" @click="blockUser(user.id)">Block</button>
                                <button v-else class="btn btn-success btn-sm" @click="unblockUser(user.id)">Unblock</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <h3 class="mb-3">Summary</h3>
                <canvas id="summaryChart" width="400" height="200"></canvas>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                <div class="mt-3">
                    <router-link to="/admin/summary" class="btn btn-primary">View Detailed Summary</router-link>
                    <router-link to="/admin/occupied-spots" class="btn btn-info ms-2">View Occupied Spots</router-link>
                    <router-link to="/admin/search" class="btn btn-info ms-2">Search</router-link>
                    <router-link to="/admin/view-delete-spot" class="btn btn-info ms-2">View/Delete Spot</router-link>
                    <button class="btn btn-warning ms-2" @click="cleanupOldData">Cleanup Old Data</button>
                </div>
            </div>
        `,
        data() {
            return {
                lot: { name: '', price: 0, address: '', pinCode: '', spots: 0 },
                lots: [],
                users: [],
                error: '',
                chart: null
            };
        },
        methods: {
            async fetchLots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lots = response.data;
                    this.renderChart();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lots';
                }
            },
            async fetchUsers() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/view_users`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.users = response.data.users;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch users';
                }
            },
            async createLot() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/create_lot`, new URLSearchParams({
                        location_name: this.lot.name,
                        price: this.lot.price,
                        address: this.lot.address,
                        pin_code: this.lot.pinCode,
                        maximum_number_of_spots: this.lot.spots
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.lot = { name: '', price: 0, address: '', pinCode: '', spots: 0 };
                    this.fetchLots();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to create lot';
                }
            },
            async deleteLot(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/delete_lot/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchLots();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to delete lot';
                }
            },
            async blockUser(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/block_user/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchUsers();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to block user';
                }
            },
            async unblockUser(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/unblock_user/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchUsers();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to unblock user';
                }
            },
            async cleanupOldData() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/cleanup_old_data`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.error = 'Old data cleanup initiated';
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to cleanup old data';
                }
            },
            logout() {
                localStorage.removeItem('token');
                this.$router.push('/');
            },
            renderChart() {
                const ctx = document.getElementById('summaryChart').getContext('2d');
                if (this.chart) this.chart.destroy();
                const labels = this.lots.map(lot => lot.name);
                const spots = this.lots.map(lot => lot.spots);
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Number of Spots per Lot',
                            data: spots,
                            backgroundColor: '#007bff',
                            borderColor: '#0056b3',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        },
        mounted() {
            this.fetchLots();
            this.fetchUsers();
        }
    };

    // UserDashboard Component
    const UserDashboard = {
        template: `
            <div class="corner-ribbon top-right sticky red">User</div>
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
                                    <td>{{ lot.name }}</td>
                                    <td>{{ lot.price }}</td>
                                    <td>{{ lot.address }}</td>
                                    <td>
                                        <router-link :to="'/user/select-lot/' + lot.id" class="btn btn-primary btn-sm">Select</router-link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card mb-4">
                    <div class="card-header">Your Reservations</div>
                    <div class="card-body">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>Spot ID</th>
                                    <th>Vehicle No</th>
                                    <th>Parking Time</th>
                                    <th>Cost</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="reservation in reservations" :key="reservation.id">
                                    <td>{{ reservation.spot_id }}</td>
                                    <td>{{ reservation.vehicle_no }}</td>
                                    <td>{{ new Date(reservation.parking_timestamp).toLocaleString('en-IN') }}</td>
                                    <td>{{ reservation.parking_cost }}</td>
                                    <td>{{ reservation.leaving_timestamp ? 'Released' : 'Active' }}</td>
                                    <td>
                                        <router-link v-if="!reservation.leaving_timestamp" :to="'/user/release-reservation/' + reservation.id" class="btn btn-danger btn-sm">Release</router-link>
                                        <button v-if="!reservation.leaving_timestamp" class="btn btn-warning btn-sm ms-2" @click="cancelReservation(reservation.id)">Cancel</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <h3 class="mb-3">Reservation Summary</h3>
                <canvas id="reservationChart" width="400" height="200"></canvas>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                <div class="mt-3">
                    <router-link to="/user/summary" class="btn btn-primary">View Detailed Summary</router-link>
                </div>
            </div>
        `,
        data() {
            return {
                lots: [],
                reservations: [],
                error: '',
                chart: null
            };
        },
        methods: {
            async fetchLots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lots = response.data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lots';
                }
            },
            async fetchReservations() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/dashboard`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.reservations = response.data.reservations;
                    this.renderChart();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch reservations';
                }
            },
            async cancelReservation(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/user/cancel_reservation/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchReservations();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to cancel reservation';
                }
            },
            logout() {
                localStorage.removeItem('token');
                this.$router.push('/');
            },
            renderChart() {
                const ctx = document.getElementById('reservationChart').getContext('2d');
                if (this.chart) this.chart.destroy();
                const active = this.reservations.filter(r => !r.leaving_timestamp).length;
                const released = this.reservations.filter(r => r.leaving_timestamp).length;
                this.chart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Active Reservations', 'Released Reservations'],
                        datasets: [{
                            data: [active, released],
                            backgroundColor: ['#007bff', '#6c757d'],
                            borderColor: ['#0056b3', '#5a6268'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            }
        },
        mounted() {
            this.fetchLots();
            this.fetchReservations();
        }
    };

    // AdminEditLot Component
    const AdminEditLot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Edit Parking Lot</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="updateLot">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="name" class="form-label">Location Name</label>
                                    <input v-model="lot.name" type="text" class="form-control" id="name" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="price" class="form-label">Price (₹/hr)</label>
                                    <input v-model.number="lot.price" type="number" step="0.01" class="form-control" id="price" required>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="address" class="form-label">Address</label>
                                    <input v-model="lot.address" type="text" class="form-control" id="address" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="pinCode" class="form-label">Pin Code</label>
                                    <input v-model="lot.pinCode" type="text" class="form-control" id="pinCode" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="spots" class="form-label">Maximum Spots</label>
                                <input v-model.number="lot.spots" type="number" class="form-control" id="spots" required>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Update Lot</button>
                                <router-link to="/admin/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                lot: { id: null, name: '', price: 0, address: '', pinCode: '', spots: 0 },
                error: ''
            };
        },
        methods: {
            async fetchLot() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lot = {
                        id: response.data.id,
                        name: response.data.name,
                        price: response.data.price,
                        address: response.data.address,
                        pinCode: response.data.pin_code,
                        spots: response.data.spots
                    };
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lot';
                }
            },
            async updateLot() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/edit_lot/${this.lot.id}`, new URLSearchParams({
                        location_name: this.lot.name,
                        price: this.lot.price,
                        address: this.lot.address,
                        pin_code: this.lot.pinCode,
                        maximum_number_of_spots: this.lot.spots
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/admin/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to update lot';
                }
            }
        },
        mounted() {
            this.fetchLot();
        }
    };

    // AdminViewLot Component
    const AdminViewLot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">View Parking Lot</h2>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">{{ lot.name }}</h5>
                        <p><strong>Price:</strong> ₹{{ lot.price }}/hr</p>
                        <p><strong>Address:</strong> {{ lot.address }}</p>
                        <p><strong>Pin Code:</strong> {{ lot.pin_code }}</p>
                        <p><strong>Spots:</strong> {{ lot.spots }}</p>
                        <h6 class="mt-4">Spots</h6>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="spot in spots" :key="spot.id">
                                    <td>{{ spot.id }}</td>
                                    <td>{{ spot.status }}</td>
                                    <td>
                                        <router-link :to="'/admin/spot-details/' + spot.id" class="btn btn-info btn-sm">Details</router-link>
                                        <router-link :to="'/admin/edit-spot/' + spot.id" class="btn btn-warning btn-sm ms-2">Edit</router-link>
                                        <button class="btn btn-danger btn-sm ms-2" @click="deleteSpot(spot.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <router-link :to="'/admin/create-spot/' + lot.id" class="btn btn-primary">Add Spot</router-link>
                        <router-link to="/admin/dashboard" class="btn btn-secondary ms-2">Back</router-link>
                        <p v-if="error" class="text-danger mt-3">{{ error }}</p>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                lot: {},
                spots: [],
                error: ''
            };
        },
        methods: {
            async fetchLot() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lot = response.data;
                    this.fetchSpots();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lot';
                }
            },
            async fetchSpots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots/${this.$route.params.id}/spots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.spots = response.data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch spots';
                }
            },
            async deleteSpot(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/delete_spot/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchSpots();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to delete spot';
                }
            }
        },
        mounted() {
            this.fetchLot();
        }
    };

    // AdminCreateSpot Component
    const AdminCreateSpot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Create Parking Spot</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="createSpot">
                            <div class="mb-3">
                                <label for="lotId" class="form-label">Parking Lot</label>
                                <select v-model="spot.lotId" class="form-control" id="lotId" required>
                                    <option v-for="lot in lots" :value="lot.id" :key="lot.id">{{ lot.name }}</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="status" class="form-label">Status</label>
                                <select v-model="spot.status" class="form-control" id="status" required>
                                    <option value="A">Available</option>
                                    <option value="O">Occupied</option>
                                </select>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Create Spot</button>
                                <router-link to="/admin/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                spot: { lotId: this.$route.params.lotId || '', status: 'A' },
                lots: [],
                error: ''
            };
        },
        methods: {
            async fetchLots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lots = response.data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lots';
                }
            },
            async createSpot() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/create_spot/${this.spot.lotId}`, new URLSearchParams({
                        lot_id: this.spot.lotId,
                        status: this.spot.status
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/admin/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to create spot';
                }
            }
        },
        mounted() {
            this.fetchLots();
        }
    };

    // AdminEditSpot Component
    const AdminEditSpot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Edit Parking Spot</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="updateSpot">
                            <div class="mb-3">
                                <label for="lotId" class="form-label">Parking Lot</label>
                                <select v-model="spot.lotId" class="form-control" id="lotId" required>
                                    <option v-for="lot in lots" :value="lot.id" :key="lot.id">{{ lot.name }}</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="status" class="form-label">Status</label>
                                <select v-model="spot.status" class="form-control" id="status" required>
                                    <option value="A">Available</option>
                                    <option value="O">Occupied</option>
                                </select>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Update Spot</button>
                                <router-link to="/admin/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                spot: { id: null, lotId: '', status: 'A' },
                lots: [],
                error: ''
            };
        },
        methods: {
            async fetchSpot() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/spot_details/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.spot = {
                        id: response.data.id,
                        lotId: response.data.lot_id,
                        status: response.data.status === 'Available' ? 'A' : 'O'
                    };
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch spot';
                }
            },
            async fetchLots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/api/lots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lots = response.data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lots';
                }
            },
            async updateSpot() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/edit_spot/${this.spot.id}`, new URLSearchParams({
                        lot_id: this.spot.lotId,
                        status: this.spot.status
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/admin/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to update spot';
                }
            }
        },
        mounted() {
            this.fetchSpot();
            this.fetchLots();
        }
    };

    // AdminSpotDetails Component
    const AdminSpotDetails = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Spot Details</h2>
                <div class="card">
                    <div class="card-body">
                        <p><strong>ID:</strong> {{ spot.id }}</p>
                        <p><strong>Lot:</strong> {{ spot.lot_name }}</p>
                        <p><strong>Status:</strong> {{ spot.status }}</p>
                        <p><strong>Occupying User:</strong> {{ spot.occupying_user_email }}</p>
                        <router-link to="/admin/dashboard" class="btn btn-secondary">Back</router-link>
                        <p v-if="error" class="text-danger mt-3">{{ error }}</p>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                spot: {},
                error: ''
            };
        },
        methods: {
            async fetchSpot() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/spot_details/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.spot = response.data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch spot details';
                }
            }
        },
        mounted() {
            this.fetchSpot();
        }
    };

    // AdminOccupiedSpots Component
    const AdminOccupiedSpots = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Occupied Spots</h2>
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Reservation ID</th>
                            <th>Spot ID</th>
                            <th>Lot Name</th>
                            <th>Customer Email</th>
                            <th>Vehicle No</th>
                            <th>Parking Time</th>
                            <th>Current Cost</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="spot in spots" :key="spot.reservation_id">
                            <td>{{ spot.reservation_id }}</td>
                            <td>{{ spot.spot_id }}</td>
                            <td>{{ spot.lot_name }}</td>
                            <td>{{ spot.customer_email }}</td>
                            <td>{{ spot.vehicle_no }}</td>
                            <td>{{ spot.parking_timestamp }}</td>
                            <td>{{ spot.current_cost_estimate }}</td>
                            <td>
                                <router-link :to="'/admin/edit-reservation/' + spot.reservation_id" class="btn btn-warning btn-sm">Edit</router-link>
                                <button class="btn btn-danger btn-sm ms-2" @click="deleteReservation(spot.reservation_id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <router-link to="/admin/dashboard" class="btn btn-secondary">Back</router-link>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </div>
        `,
        data() {
            return {
                spots: [],
                error: ''
            };
        },
        methods: {
            async fetchSpots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/occupied_spots`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.spots = response.data.occupied_spot_data;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch occupied spots';
                }
            },
            async deleteReservation(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/delete_reservation/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchSpots();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to delete reservation';
                }
            }
        },
        mounted() {
            this.fetchSpots();
        }
    };

    // AdminEditUser Component
    const AdminEditUser = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Edit User</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="updateUser">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input v-model="user.email" type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3 form-check">
                                <input v-model="user.isAdmin" type="checkbox" class="form-check-input" id="isAdmin" :disabled="isCurrentUser">
                                <label for="isAdmin" class="form-check-label">Admin</label>
                            </div>
                            <div class="mb-3 form-check">
                                <input v-model="user.isBlocked" type="checkbox" class="form-check-input" id="isBlocked" :disabled="isCurrentUser">
                                <label for="isBlocked" class="form-check-label">Blocked</label>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Update User</button>
                                <router-link to="/admin/view-users" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                user: { id: null, email: '', isAdmin: false, isBlocked: false },
                isCurrentUser: false,
                error: ''
            };
        },
        methods: {
            async fetchUser() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/edit_user/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.user = {
                        id: response.data.id,
                        email: response.data.email,
                        isAdmin: response.data.is_admin,
                        isBlocked: response.data.is_blocked
                    };
                    const token = localStorage.getItem('token');
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    this.isCurrentUser = decoded.sub === this.user.id;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch user';
                }
            },
            async updateUser() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/edit_user/${this.user.id}`, new URLSearchParams({
                        email: this.user.email,
                        is_admin: this.user.isAdmin,
                        is_blocked: this.user.isBlocked
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/admin/view-users');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to update user';
                }
            }
        },
        mounted() {
            this.fetchUser();
        }
    };

    // AdminViewUsers Component
    const AdminViewUsers = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">View Users</h2>
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.email }}</td>
                            <td>{{ user.is_admin ? 'Admin' : 'User' }}</td>
                            <td>{{ user.is_blocked ? 'Blocked' : 'Active' }}</td>
                            <td>
                                <router-link :to="'/admin/edit-user/' + user.id" class="btn btn-warning btn-sm me-2">Edit</router-link>
                                <button v-if="!user.is_blocked" class="btn btn-danger btn-sm" @click="blockUser(user.id)">Block</button>
                                <button v-else class="btn btn-success btn-sm" @click="unblockUser(user.id)">Unblock</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <router-link to="/admin/dashboard" class="btn btn-secondary">Back</router-link>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </div>
        `,
        data() {
            return {
                users: [],
                error: ''
            };
        },
        methods: {
            async fetchUsers() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/view_users`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.users = response.data.users;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch users';
                }
            },
            async blockUser(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/block_user/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchUsers();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to block user';
                }
            },
            async unblockUser(id) {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/unblock_user/${id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.fetchUsers();
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to unblock user';
                }
            }
        },
        mounted() {
            this.fetchUsers();
        }
    };

    // AdminEditReservation Component
    const AdminEditReservation = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Edit Reservation</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="updateReservation">
                            <div class="mb-3">
                                <label for="vehicleNo" class="form-label">Vehicle Number</label>
                                <input v-model="reservation.vehicle_no" type="text" class="form-control" id="vehicleNo" required>
                            </div>
                            <div class="mb-3">
                                <label for="hours" class="form-label">Hours</label>
                                <input v-model.number="reservation.hours" type="number" step="0.1" class="form-control" id="hours" required>
                            </div>
                            <div class="mb-3">
                                <label for="parkingCost" class="form-label">Parking Cost</label>
                                <input v-model.number="reservation.parking_cost" type="number" step="0.01" class="form-control" id="parkingCost" required>
                            </div>
                            <div class="mb-3">
                                <label for="parkingTimestamp" class="form-label">Parking Timestamp</label>
                                <input v-model="reservation.parking_timestamp" type="datetime-local" class="form-control" id="parkingTimestamp" required>
                            </div>
                            <div class="mb-3">
                                <label for="leavingTimestamp" class="form-label">Leaving Timestamp (optional)</label>
                                <input v-model="reservation.leaving_timestamp" type="datetime-local" class="form-control" id="leavingTimestamp">
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Update Reservation</button>
                                <router-link to="/admin/occupied-spots" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                reservation: { vehicle_no: '', hours: 1, parking_cost: 0, parking_timestamp: '', leaving_timestamp: '' },
                error: ''
            };
        },
        methods: {
            async fetchReservation() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/edit_reservation/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.reservation = {
                        vehicle_no: response.data.vehicle_no,
                        hours: response.data.hours,
                        parking_cost: response.data.parking_cost,
                        parking_timestamp: response.data.parking_timestamp ? new Date(response.data.parking_timestamp).toISOString().slice(0, 16) : '',
                        leaving_timestamp: response.data.leaving_timestamp ? new Date(response.data.leaving_timestamp).toISOString().slice(0, 16) : ''
                    };
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch reservation';
                }
            },
            async updateReservation() {
                try {
                    await axios.post(`${config.apiBaseUrl}/admin/edit_reservation/${this.$route.params.id}`, new URLSearchParams({
                        vehicle_no: this.reservation.vehicle_no,
                        hours: this.reservation.hours,
                        parking_cost: this.reservation.parking_cost,
                        parking_timestamp: this.reservation.parking_timestamp,
                        leaving_timestamp: this.reservation.leaving_timestamp || null
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/admin/occupied-spots');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to update reservation';
                }
            }
        },
        mounted() {
            this.fetchReservation();
        }
    };

    // AdminSearch Component
    const AdminSearch = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Search</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="search">
                            <div class="mb-3">
                                <label for="searchType" class="form-label">Search Type</label>
                                <select v-model="search.type" class="form-control" id="searchType">
                                    <option value="user_email">User Email</option>
                                    <option value="vehicle_no">Vehicle Number</option>
                                    <option value="lot_location">Lot Location/ID</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="queryText" class="form-label">Query</label>
                                <input v-model="search.query" type="text" class="form-control" id="queryText" required>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Search</button>
                                <router-link to="/admin/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                        </form>
                        <div v-if="results.users.length || results.spots.length || results.reservations.length" class="mt-4">
                            <h4>Results</h4>
                            <h5 v-if="results.users.length">Users</h5>
                            <table v-if="results.users.length" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="user in results.users" :key="user.id">
                                        <td>{{ user.id }}</td>
                                        <td>{{ user.email }}</td>
                                        <td>{{ user.is_admin ? 'Admin' : 'User' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <h5 v-if="results.spots.length">Spots</h5>
                            <table v-if="results.spots.length" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Lot</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="spot in results.spots" :key="spot.id">
                                        <td>{{ spot.id }}</td>
                                        <td>{{ spot.lot_id }}</td>
                                        <td>{{ spot.status }}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <h5 v-if="results.reservations.length">Reservations</h5>
                            <table v-if="results.reservations.length" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Spot ID</th>
                                        <th>Vehicle No</th>
                                        <th>Parking Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="reservation in results.reservations" :key="reservation.id">
                                        <td>{{ reservation.id }}</td>
                                        <td>{{ reservation.spot_id }}</td>
                                        <td>{{ reservation.vehicle_no }}</td>
                                        <td>{{ new Date(reservation.parking_timestamp).toLocaleString('en-IN') }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                search: { type: 'user_email', query: '' },
                results: { users: [], spots: [], reservations: [] },
                error: ''
            };
        },
        methods: {
            async search() {
                try {
                    const response = await axios.post(`${config.apiBaseUrl}/admin/search`, new URLSearchParams({
                        search_type: this.search.type,
                        query_text: this.search.query
                    }), {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.results = response.data.search_results;
                    if (!this.results.users.length && !this.results.spots.length && !this.results.reservations.length) {
                        this.error = 'No results found';
                    }
                } catch (err) {
                    this.error = err.response?.data?.error || 'Search failed';
                }
            }
        }
    };

    // AdminSummary Component
    const AdminSummary = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Admin Summary</h2>
                <div class="card mb-4">
                    <div class="card-body">
                        <p><strong>Total Users:</strong> {{ summary.total_users }}</p>
                        <p><strong>Total Lots:</strong> {{ summary.total_lots }}</p>
                        <p><strong>Total Spots:</strong> {{ summary.total_spots }}</p>
                        <p><strong>Total Reservations:</strong> {{ summary.total_reservations }}</p>
                        <p><strong>Total Revenue:</strong> ₹{{ summary.total_revenue }}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h4>Spot Status</h4>
                        <canvas id="spotChart" width="400" height="200"></canvas>
                    </div>
                    <div class="col-md-6">
                        <h4>Reservation Status</h4>
                        <canvas id="reservationChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <router-link to="/admin/dashboard" class="btn btn-secondary mt-3">Back</router-link>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </div>
        `,
        data() {
            return {
                summary: { total_users: 0, total_lots: 0, total_spots: 0, total_reservations: 0, total_revenue: 0 },
                spotChart: null,
                reservationChart: null,
                error: ''
            };
        },
        methods: {
            async fetchSummary() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/admin/summary`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.summary = {
                        total_users: response.data.total_users,
                        total_lots: response.data.total_lots,
                        total_spots: response.data.total_spots,
                        total_reservations: response.data.total_reservations,
                        total_revenue: response.data.total_revenue
                    };
                    this.renderCharts(response.data.spot_status_data, response.data.reservation_status_data);
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch summary';
                }
            },
            renderCharts(spotData, reservationData) {
                const spotCtx = document.getElementById('spotChart').getContext('2d');
                if (this.spotChart) this.spotChart.destroy();
                this.spotChart = new Chart(spotCtx, {
                    type: 'pie',
                    data: {
                        labels: spotData.labels,
                        datasets: [{
                            data: spotData.datasets[0].data,
                            backgroundColor: spotData.datasets[0].backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true }
                });

                const resCtx = document.getElementById('reservationChart').getContext('2d');
                if (this.reservationChart) this.reservationChart.destroy();
                this.reservationChart = new Chart(resCtx, {
                    type: 'pie',
                    data: {
                        labels: reservationData.labels,
                        datasets: [{
                            data: reservationData.datasets[0].data,
                            backgroundColor: reservationData.datasets[0].backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true }
                });
            }
        },
        mounted() {
            this.fetchSummary();
        }
    };

    // AdminViewDeleteSpot Component
    const AdminViewDeleteSpot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">View/Delete Spot</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="viewOrDelete">
                            <div class="mb-3">
                                <label for="spotId" class="form-label">Spot ID</label>
                                <input v-model="spotId" type="text" class="form-control" id="spotId" placeholder="Enter spot ID" required>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" name="action" value="view" class="btn btn-primary">View</button>
                                <button type="submit" name="action" value="delete" class="btn btn-danger">Delete</button>
                                <router-link to="/admin/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                        </form>
                        <div v-if="spotDetails" class="mt-4">
                            <h4>Spot Details</h4>
                            <p><strong>ID:</strong> {{ spotDetails.id }}</p>
                            <p><strong>Lot:</strong> {{ spotDetails.lot_name }}</p>
                            <p><strong>Status:</strong> {{ spotDetails.status }}</p>
                            <p><strong>Occupying User:</strong> {{ spotDetails.occupying_user_email }}</p>
                        </div>
                        <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                spotId: '',
                spotDetails: null,
                error: ''
            };
        },
        methods: {
            async viewOrDelete(event) {
                const action = event.submitter.value;
                try {
                    if (action === 'view') {
                        const response = await axios.get(`${config.apiBaseUrl}/admin/spot_details/${this.spotId}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        this.spotDetails = response.data;
                    } else if (action === 'delete') {
                        await axios.post(`${config.apiBaseUrl}/admin/delete_spot/${this.spotId}`, {}, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        this.spotDetails = null;
                        this.error = 'Spot deleted successfully';
                    }
                } catch (err) {
                    this.error = err.response?.data?.error || `Failed to ${action} spot`;
                }
            }
        }
    };

    // UserSelectLot Component
    const UserSelectLot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Select Parking Lot</h2>
                <div class="card">
                    <div class="card-body">
                        <form @submit.prevent="selectLot">
                            <div class="mb-3">
                                <label for="lotId" class="form-label">Parking Lot</label>
                                <select v-model="lotId" class="form-control" id="lotId" required>
                                    <option v-for="lot in lots" :value="lot.id" :key="lot.id">{{ lot.name }} ({{ lot.address }}) - ₹{{ lot.price }}/hr</option>
                                </select>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Select</button>
                                <router-link to="/user/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                lotId: '',
                lots: [],
                error: ''
            };
        },
        methods: {
            async fetchLots() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/user/select_lot`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lots = response.data.available_lots;
                    if (!this.lots.length) this.error = 'No parking lots with available spots';
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lots';
                }
            },
            selectLot() {
                this.$router.push(`/user/book-spot/${this.lotId}`);
            }
        },
        mounted() {
            this.fetchLots();
        }
    };

    // UserBookSpot Component
    const UserBookSpot = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Book Parking Spot</h2>
                <div class="card">
                    <div class="card-body">
                        <p><strong>Lot:</strong> {{ lot.name }}</p>
                        <p><strong>Spot ID:</strong> {{ spot.id }}</p>
                        <form @submit.prevent="bookSpot">
                            <div class="mb-3">
                                <label for="vehicleNo" class="form-label">Vehicle Number</label>
                                <input v-model="reservation.vehicleNo" type="text" class="form-control" id="vehicleNo" placeholder="Enter vehicle number" required>
                            </div>
                            <div class="mb-3">
                                <label for="hours" class="form-label">Hours</label>
                                <input v-model.number="reservation.hours" type="number" step="0.1" class="form-control" id="hours" placeholder="Enter hours" required>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-primary">Book Spot</button>
                                <router-link to="/user/select-lot" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                lot: {},
                spot: {},
                reservation: { vehicleNo: '', hours: 1 },
                error: ''
            };
        },
        methods: {
            async fetchLotAndSpot() {
                try {
                    const lotResponse = await axios.get(`${config.apiBaseUrl}/api/lots/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.lot = lotResponse.data;
                    const spotResponse = await axios.get(`${config.apiBaseUrl}/user/book_spot/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.spot = spotResponse.data.spot;
                    this.reservation.vehicleNo = spotResponse.data.vehicle_no || '';
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch lot or spot';
                }
            },
            async bookSpot() {
                try {
                    const token = localStorage.getItem('token');
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    await axios.post(`${config.apiBaseUrl}/user/book_spot/${this.$route.params.id}`, new URLSearchParams({
                        spot_id: this.spot.id,
                        user_id: decoded.sub,
                        vehicle_no: this.reservation.vehicleNo,
                        hours: this.reservation.hours
                    }), {
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    this.$router.push('/user/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to book spot';
                }
            }
        },
        mounted() {
            this.fetchLotAndSpot();
        }
    };

    // UserReleaseReservation Component
    const UserReleaseReservation = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">Release Reservation</h2>
                <div class="card">
                    <div class="card-body">
                        <p><strong>Reservation ID:</strong> {{ reservation.id }}</p>
                        <p><strong>Spot ID:</strong> {{ reservation.spot_id }}</p>
                        <p><strong>Lot:</strong> {{ lot.name }}</p>
                        <p><strong>Parking Time:</strong> {{ new Date(reservation.parking_timestamp).toLocaleString('en-IN') }}</p>
                        <form @submit.prevent="releaseSpot">
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="submit" class="btn btn-danger">Release Spot</button>
                                <router-link to="/user/dashboard" class="btn btn-secondary">Cancel</router-link>
                            </div>
                            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
                        </form>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                reservation: {},
                lot: {},
                error: ''
            };
        },
        methods: {
            async fetchReservation() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/user/release_reservation_page/${this.$route.params.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.reservation = response.data.reservation;
                    this.lot = response.data.lot;
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch reservation';
                }
            },
            async releaseSpot() {
                try {
                    await axios.post(`${config.apiBaseUrl}/user/release_spot/${this.$route.params.id}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.$router.push('/user/dashboard');
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to release spot';
                }
            }
        },
        mounted() {
            this.fetchReservation();
        }
    };

    // UserSummary Component
    const UserSummary = {
        template: `
            <div class="container mt-5">
                <h2 class="mb-4 text-center">User Summary</h2>
                <div class="card mb-4">
                    <div class="card-body">
                        <p><strong>Total Reservations:</strong> {{ summary.total_reservations }}</p>
                        <p><strong>Active Reservations:</strong> {{ summary.active_reservations }}</p>
                        <p><strong>Released Reservations:</strong> {{ summary.released_reservations }}</p>
                        <p><strong>Total Cost Spent:</strong> ₹{{ summary.total_cost }}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h4>Reservation Status</h4>
                        <canvas id="reservationStatusChart" width="400" height="200"></canvas>
                    </div>
                    <div class="col-md-6">
                        <h4>Total Cost</h4>
                        <canvas id="costChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <router-link to="/user/dashboard" class="btn btn-secondary mt-3">Back</router-link>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </div>
        `,
        data() {
            return {
                summary: { total_reservations: 0, active_reservations: 0, released_reservations: 0, total_cost: 0 },
                reservationChart: null,
                costChart: null,
                error: ''
            };
        },
        methods: {
            async fetchSummary() {
                try {
                    const response = await axios.get(`${config.apiBaseUrl}/user/summary`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    this.summary = {
                        total_reservations: response.data.total_reservations,
                        active_reservations: response.data.active_reservations_count,
                        released_reservations: response.data.released_reservations_count,
                        total_cost: response.data.total_cost_spent
                    };
                    this.renderCharts(response.data.reservation_status_chart_data, response.data.total_cost_chart_data);
                } catch (err) {
                    this.error = err.response?.data?.error || 'Failed to fetch summary';
                }
            },
            renderCharts(reservationData, costData) {
                const resCtx = document.getElementById('reservationStatusChart').getContext('2d');
                if (this.reservationChart) this.reservationChart.destroy();
                this.reservationChart = new Chart(resCtx, {
                    type: 'pie',
                    data: {
                        labels: reservationData.labels,
                        datasets: [{
                            data: reservationData.datasets[0].data,
                            backgroundColor: reservationData.datasets[0].backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true }
                });

                const costCtx = document.getElementById('costChart').getContext('2d');
                if (this.costChart) this.costChart.destroy();
                this.costChart = new Chart(costCtx, {
                    type: 'bar',
                    data: {
                        labels: costData.labels,
                        datasets: [{
                            label: 'Total Cost (₹)',
                            data: costData.datasets[0].data,
                            backgroundColor: costData.datasets[0].backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        },
        mounted() {
            this.fetchSummary();
        }
    };

    // Router Configuration
    const routes = [
        { path: '/', component: Home },
        { path: '/contact', component: Contact },
        { path: '/about', component: About },
        { path: '/login', component: Login },
        { path: '/register', component: Register },
        { 
            path: '/admin/dashboard', 
            component: AdminDashboard,
            beforeEnter: (to, from, next) => {
                const token = localStorage.getItem('token');
                if (!token) return next('/login');
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    if (!decoded.is_admin) return next('/user/dashboard');
                    next();
                } catch (err) {
                    return next('/login');
                }
            }
        },
        { 
            path: '/user/dashboard', 
            component: UserDashboard,
            beforeEnter: (to, from, next) => {
                const token = localStorage.getItem('token');
                if (!token) return next('/login');
                next();
            }
        },
        { 
            path: '/admin/edit-lot/:id', 
            component: AdminEditLot,
            beforeEnter: (to, from, next) => {
                const token = localStorage.getItem('token');
                if (!token) return next('/login');
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    if (!decoded.is_admin) return next('/user/dashboard');
                    next();
                } catch (err) {
                    return next('/login');
                }
            }
        },
        { 
            path: '/admin/view-lot/:id', 
            component: AdminViewLot,
            beforeEnter: (to, from, next) => {
                const token = localStorage.getItem('token');
                if (!token) return next('/login');
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    if (!decoded.is_admin) return next('/user/dashboard');
                    next();
            { 
                path: '/admin/view-lot/:id', 
                component: AdminViewLot,
                beforeEnter: (to, from, next) => {
                    const token = localStorage.getItem('token');
                    if (!token) return next('/login');
                    try {
                        const decoded = JSON.parse(atob(token.split('.')[1]));
                        if (!decoded.is_admin) return next('/user/dashboard');
                        next();
                    } catch (err) {
                        return next('/login');
                    }
                }
            }
        ];
    
        const router = createRouter({
            history: createWebHistory(),
            routes
        });
    
        createApp({})
            .use(router)
            .mount('#app');