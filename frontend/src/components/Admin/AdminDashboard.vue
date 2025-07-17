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
