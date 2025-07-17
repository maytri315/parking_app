<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">Your Reservation Summary</h2>

        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading summary data...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
            {{ error }}
        </div>

        <div v-else>
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title">Total Reservations</h5>
                            <p class="card-text fs-2 text-primary">{{ totalReservations }}</p>
                            <p class="text-muted">Including both active and released spots.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title">Total Cost Incurred</h5>
                            <p class="card-text fs-2 text-success">₹{{ totalCost.toFixed(2) }}</p>
                            <p class="text-muted">Sum of all released reservation costs.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-4 shadow-sm">
                <div class="card-header">Reservation Status Overview</div>
                <div class="card-body">
                    <canvas id="userReservationChart" width="400" height="200"></canvas>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header">Detailed Reservation History</div>
                <div class="card-body">
                    <div v-if="reservations.length === 0" class="alert alert-info text-center">
                        You have no reservation history yet.
                    </div>
                    <table v-else class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Spot ID</th>
                                <th>Vehicle No</th>
                                <th>Parking Time</th>
                                <th>Leaving Time</th>
                                <th>Cost (₹)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="reservation in reservations" :key="reservation.id">
                                <td>{{ reservation.spot_id }}</td>
                                <td>{{ reservation.vehicle_no }}</td>
                                <td>{{ new Date(reservation.parking_timestamp).toLocaleString('en-IN') }}</td>
                                <td>
                                    <span v-if="reservation.leaving_timestamp">
                                        {{ new Date(reservation.leaving_timestamp).toLocaleString('en-IN') }}
                                    </span>
                                    <span v-else class="text-muted">N/A</span>
                                </td>
                                <td>{{ reservation.parking_cost ? reservation.parking_cost.toFixed(2) : 'N/A' }}</td>
                                <td>
                                    <span :class="{'badge bg-success': reservation.leaving_timestamp, 'badge bg-warning': !reservation.leaving_timestamp}">
                                        {{ reservation.leaving_timestamp ? 'Released' : 'Active' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="d-flex justify-content-center mt-4">
                <router-link to="/user/dashboard" class="btn btn-secondary">Back to Dashboard</router-link>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';
 // Use 'chart.js/auto' for Chart.js 3+ for automatic registration

export default {
    name: 'UserSummary',
    data() {
        return {
            reservations: [],
            totalReservations: 0,
            totalCost: 0,
            error: '',
            loading: true,
            chart: null,
        };
    },
    methods: {
        async fetchUserReservations() {
            try {
                this.loading = true;
                const response = await axios.get('/dashboard', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.reservations = response.data.reservations;
                this.calculateSummary();
                this.renderChart();
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to fetch user reservation summary.';
                console.error("Error fetching user reservations:", err);
            } finally {
                this.loading = false;
            }
        },
        calculateSummary() {
            this.totalReservations = this.reservations.length;
            this.totalCost = this.reservations
                .filter(res => res.parking_cost) // Only count cost if it's available (i.e., released)
                .reduce((sum, res) => sum + res.parking_cost, 0);
        },
        renderChart() {
            this.$nextTick(() => {
                const ctx = document.getElementById('userReservationChart');
                if (ctx) {
                    if (this.chart) {
                        this.chart.destroy(); // Destroy previous chart instance if it exists
                    }

                    const activeReservations = this.reservations.filter(res => !res.leaving_timestamp).length;
                    const releasedReservations = this.reservations.filter(res => res.leaving_timestamp).length;

                    this.chart = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: ['Active Reservations', 'Released Reservations'],
                            datasets: [{
                                data: [activeReservations, releasedReservations],
                                backgroundColor: ['#ffc107', '#28a745'], // Warning for active, Success for released
                                hoverOffset: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Overview of Your Reservation Status'
                                }
                            }
                        }
                    });
                }
            });
        }
    },
    mounted() {
        this.fetchUserReservations();
    },
    // Optional: Destroy chart when component is unmounted to prevent memory leaks
    beforeUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
};
</script>

<style scoped>
/* Add any UserSummary-specific styles here if needed */
</style>