<<<<<<< HEAD
<template>
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
</template>

<script>
import axios from 'axios'; // Don't forget to import axios!
import Chart from 'chart.js'; // Don't forget to import Chart.js!

export default {
    name: 'AdminDashboard',
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
            // Ensure the canvas element exists before trying to get its context
            this.$nextTick(() => {
                const ctx = document.getElementById('summaryChart');
                if (ctx) {
                    const context = ctx.getContext('2d');
                    if (this.chart) this.chart.destroy();
                    const labels = this.lots.map(lot => lot.name);
                    const spots = this.lots.map(lot => lot.spots);
                    this.chart = new Chart(context, {
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
            });
        }
    },
    mounted() {
        this.fetchLots();
        this.fetchUsers();
    }
};
</script>

<style scoped>
/* Add any AdminDashboard-specific styles here if needed */
</style>
=======
<template>
  <div class="container">
    <h2 class="mb-4">Admin Dashboard</h2>
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Create/Edit Parking Lot</h5>
        <form @submit.prevent="createOrUpdateLot">
          <div class="mb-3">
            <label for="name" class="form-label">Location Name</label>
            <input v-model="lot.prime_location_name" type="text" class="form-control" id="name" required>
          </div>
          <div class="mb-3">
            <label for="price" class="form-label">Price</label>
            <input v-model="lot.price" type="number" step="0.01" class="form-control" id="price" required>
          </div>
          <div class="mb-3">
            <label for="address" class="form-label">Address</label>
            <input v-model="lot.address" type="text" class="form-control" id="address" required>
          </div>
          <div class="mb-3">
            <label for="pin_code" class="form-label">Pin Code</label>
            <input v-model="lot.pin_code" type="text" class="form-control" id="pin_code" required>
          </div>
          <div class="mb-3">
            <label for="spots" class="form-label">Number of Spots</label>
            <input v-model="lot.number_of_spots" type="number" class="form-control" id="spots" required>
          </div>
          <button type="submit" class="btn btn-primary">{{ editMode ? 'Update' : 'Create' }}</button>
          <button v-if="editMode" type="button" class="btn btn-secondary ms-2" @click="resetForm">Cancel</button>
        </form>
      </div>
    </div>
    <h5>Parking Lots</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Spots</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lot in parkingLots" :key="lot.id">
          <td>{{ lot.prime_location_name }}</td>
          <td>{{ lot.price }}</td>
          <td>{{ lot.number_of_spots }}</td>
          <td>
            <button class="btn btn-sm btn-warning me-2" @click="editLot(lot)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteLot(lot.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <h5>Users</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </tbody>
    </table>
    <h5>Parking Spots Status</h5>
    <div v-for="lot in parkingLots" :key="lot.id" class="mb-3">
      <h6>{{ lot.prime_location_name }}</h6>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Spot ID</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="spot in spots[lot.id]" :key="spot.id">
            <td>{{ spot.id }}</td>
            <td>{{ spot.status === 'A' ? 'Available' : 'Occupied' }}</td>
            <td>
              <span v-if="spot.status === 'O'">
                <!-- Placeholder for vehicle details -->
                Occupied by User ID: {{ spot.reservations?.[0]?.user_id }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      lot: { prime_location_name: '', price: 0, address: '', pin_code: '', number_of_spots: 0 },
      parkingLots: [],
      users: [],
      spots: {},
      editMode: false,
      editLotId: null
    };
  },
  async mounted() {
    await this.fetchParkingLots();
    await this.fetchUsers();
    for (const lot of this.parkingLots) {
      await this.fetchSpots(lot.id);
    }
  },
  methods: {
    async fetchParkingLots() {
      const response = await axios.get('http://localhost:5000/api/parking_lots', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.parkingLots = response.data;
    },
    async fetchUsers() {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.users = response.data;
    },
    async fetchSpots(lotId) {
      const response = await axios.get(`http://localhost:5000/api/spots/${lotId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.spots[lotId] = response.data;
    },
    async createOrUpdateLot() {
      const url = this.editMode ? `http://localhost:5000/api/parking_lots/${this.editLotId}` : 'http://localhost:5000/api/parking_lots';
      const method = this.editMode ? 'put' : 'post';
      await axios[method](url, this.lot, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await this.fetchParkingLots();
      this.resetForm();
    },
    editLot(lot) {
      this.lot = { ...lot };
      this.editMode = true;
      this.editLotId = lot.id;
    },
    async deleteLot(id) {
      await axios.delete(`http://localhost:5000/api/parking_lots/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await this.fetchParkingLots();
    },
    resetForm() {
      this.lot = { prime_location_name: '', price: 0, address: '', pin_code: '', number_of_spots: 0 };
      this.editMode = false;
      this.editLotId = null;
    }
  }
}
</script>
>>>>>>> 5502e8d886c999ddaeffcf58535fa94b9f22fcec
