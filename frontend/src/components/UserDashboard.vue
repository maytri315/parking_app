<template>
  <div class="container">
    <h2 class="mb-4">User Dashboard</h2>
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Reserve Parking Spot</h5>
        <form @submit.prevent="reserveSpot">
          <div class="mb-3">
            <label for="lot" class="form-label">Select Parking Lot</label>
            <select v-model="selectedLot" class="form-select" id="lot" required>
              <option v-for="lot in parkingLots" :key="lot.id" :value="lot.id">
                {{ lot.prime_location_name }} (Price: ${{ lot.price }})
              </option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Reserve</button>
        </form>
      </div>
    </div>
    <h5>Parking History</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Spot ID</th>
          <th>Parking Time</th>
          <th>Leaving Time</th>
          <th>Cost</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reservation in reservations" :key="reservation.id">
          <td>{{ reservation.spot_id }}</td>
          <td>{{ reservation.parking_timestamp }}</td>
          <td>{{ reservation.leaving_timestamp || 'Still Parked' }}</td>
          <td>{{ reservation.parking_cost }}</td>
          <td>
            <button v-if="!reservation.leaving_timestamp" class="btn btn-sm btn-danger" @click="releaseSpot(reservation.id)">Release</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="btn btn-primary" @click="exportCSV">Export Parking History as CSV</button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      parkingLots: [],
      selectedLot: null,
      reservations: []
    };
  },
  async mounted() {
    await this.fetchParkingLots();
    await this.fetchReservations();
  },
  methods: {
    async fetchParkingLots() {
      const response = await axios.get('http://localhost:5000/api/parking_lots', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.parkingLots = response.data;
    },
    async fetchReservations() {
      const response = await axios.get('http://localhost:5000/api/reservations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.reservations = response.data;
    },
    async reserveSpot() {
      try {
        const response = await axios.post('http://localhost:5000/api/reserve', { lot_id: this.selectedLot }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert(`Spot ${response.data.spot_id} reserved!`);
        await this.fetchReservations();
      } catch (error) {
        alert('No available spots');
      }
    },
    async releaseSpot(reservationId) {
      await axios.post(`http://localhost:5000/api/release/${reservationId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await this.fetchReservations();
    },
    async exportCSV() {
      await axios.post('http://localhost:5000/api/export_csv', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('CSV export job started. Check your email.');
    }
  }
}
</script>