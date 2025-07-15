<template>
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
</template>

<script>
import axios from 'axios'; // Don't forget to import axios!
import Chart from 'chart.js'; // Don't forget to import Chart.js!

export default {
    name: 'UserDashboard',
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
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
            // Ensure the canvas element exists before trying to get its context
            this.$nextTick(() => {
                const ctx = document.getElementById('reservationChart');
                if (ctx) {
                    const context = ctx.getContext('2d');
                    if (this.chart) this.chart.destroy();
                    const active = this.reservations.filter(r => !r.leaving_timestamp).length;
                    const released = this.reservations.filter(r => r.leaving_timestamp).length;
                    this.chart = new Chart(context, {
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
            });
        }
    },
    mounted() {
        this.fetchLots();
        this.fetchReservations();
    }
};
</script>

<style scoped>
/* Add any UserDashboard-specific styles here if needed */
</style>