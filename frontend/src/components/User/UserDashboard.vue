<template>
    <div class="container mt-5">
        <h1 class="text-center mb-4">Welcome, {{ userEmail }}!</h1>

        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading dashboard data...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
            {{ error }}
        </div>

        <div v-else class="row">
            <div class="col-md-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Find & Book Parking</h5>
                    </div>
                    <div class="card-body d-flex flex-column justify-content-between">
                        <p class="card-text">Quickly find and book an available parking spot.</p>
                        <div class="mt-auto text-center">
                            <router-link to="/user/select-lot" class="btn btn-success btn-lg">Book a Spot Now</router-link>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-4">
                <div class="card shadow h-100">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">Your Parking Overview</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <h6>Total Cost Incurred</h6>
                                <p class="display-5 text-success">₹{{ totalCostIncurred.toFixed(2) }}</p>
                            </div>
                            <div class="col-6">
                                <h6>Active Reservations</h6>
                                <p class="display-5 text-warning">{{ activeReservationsCount }}</p>
                            </div>
                        </div>
                        <hr>
                        <canvas id="userReservationChart"></canvas>
                        <div class="mt-3 text-center">
                            <router-link to="/user/summary" class="btn btn-info btn-sm">View Detailed Summary</router-link>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12">
                <div class="card shadow mb-4">
                    <div class="card-header bg-secondary text-white">
                        <h5 class="mb-0">Your Recent Parking History</h5>
                    </div>
                    <div class="card-body">
                        <div v-if="recentHistory.length === 0" class="alert alert-info text-center">
                            No recent parking history found.
                        </div>
                        <div v-else class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Lot Name</th>
                                        <th>Spot ID</th>
                                        <th>Vehicle No</th>
                                        <th>Parking Time</th>
                                        <th>Leaving Time</th>
                                        <th>Cost (₹)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="reservation in recentHistory" :key="reservation.id">
                                        <td>{{ reservation.lot ? reservation.lot.prime_location_name : 'N/A' }}</td>
                                        <td>{{ reservation.spot_id }}</td>
                                        <td>{{ reservation.vehicle_no }}</td>
                                        <td>{{ new Date(reservation.parking_timestamp).toLocaleString('en-IN') }}</td>
                                        <td>
                                            <span v-if="reservation.leaving_timestamp">
                                                {{ new Date(reservation.leaving_timestamp).toLocaleString('en-IN') }}
                                            </span>
                                            <span v-else class="text-muted">Active</span>
                                        </td>
                                        <td>{{ reservation.parking_cost !== null ? reservation.parking_cost.toFixed(2) : 'N/A' }}</td>
                                        <td>
                                            <button v-if="!reservation.leaving_timestamp"
                                                    @click="confirmRelease(reservation.id)"
                                                    class="btn btn-danger btn-sm">Release</button>
                                            <span v-else class="text-muted">--</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto'; // For Chart.js v3+

export default {
    name: 'UserDashboard',
    data() {
        return {
            userEmail: '',
            recentHistory: [],
            totalCostIncurred: 0,
            activeReservationsCount: 0,
            reservationStatusChartData: null,
            loading: true,
            error: '',
            chartInstance: null, // To store the Chart.js instance
        };
    },
    methods: {
        async fetchDashboardData() {
            try {
                this.loading = true;
                this.error = '';
                const response = await axios.get('/api/user/dashboard_data', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const data = response.data;
                this.userEmail = data.user_email;
                this.recentHistory = data.recent_history;
                this.totalCostIncurred = data.total_cost_incurred;
                this.reservationStatusChartData = data.user_reservation_chart_data;

                // Calculate active reservations count from chart data for display
                const activeIndex = this.reservationStatusChartData.labels.indexOf('Active Reservations');
                if (activeIndex !== -1) {
                    this.activeReservationsCount = this.reservationStatusChartData.datasets[0].data[activeIndex];
                }

                this.$nextTick(() => {
                    this.renderChart();
                });

            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to load dashboard data.';
                console.error("Dashboard data fetch error:", err);
            } finally {
                this.loading = false;
            }
        },
        renderChart() {
            const ctx = document.getElementById('userReservationChart');
            if (ctx && this.reservationStatusChartData) {
                // Destroy existing chart instance to prevent duplicates/errors
                if (this.chartInstance) {
                    this.chartInstance.destroy();
                }

                this.chartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: this.reservationStatusChartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false, // Allows chart to resize freely
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    font: {
                                        size: 14
                                    }
                                }
                            },
                            title: {
                                display: false, // Title already in card header
                            }
                        }
                    }
                });
            }
        },
        confirmRelease(reservationId) {
            if (confirm('Are you sure you want to release this spot? This action cannot be undone.')) {
                this.releaseSpot(reservationId);
            }
        },
        async releaseSpot(reservationId) {
            try {
                const response = await axios.post(`/api/release/${reservationId}`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert(response.data.message);
                // Refresh dashboard data after successful release
                this.fetchDashboardData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to release spot.');
                console.error("Error releasing spot:", err);
            }
        },
    },
    mounted() {
        this.fetchDashboardData();
    },
    // Optional: Destroy chart instance when component is unmounted
    beforeUnmount() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }
};
</script>

<style scoped>
/* Add specific styles for the dashboard here if needed */
#userReservationChart {
    max-height: 200px; /* Adjust as needed */
}
</style>