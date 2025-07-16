<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">Release Parking Spot</h2>

        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading reservation details...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
            {{ error }}
        </div>

        <div v-else-if="!reservationDetails" class="alert alert-warning text-center">
            Reservation not found or already released.
        </div>

        <div v-else class="card shadow p-4">
            <p class="lead text-primary">
                You are about to release: <br>
                <strong>Spot ID: {{ reservationDetails.spot_id }}</strong> in <strong>{{ reservationDetails.lot ? reservationDetails.lot.prime_location_name : 'N/A' }}</strong>.
            </p>
            <p class="mb-4">
                This will mark the spot as available for others and calculate the final cost.
            </p>

            <form @submit.prevent="confirmRelease">
                <div class="mb-3">
                    <label for="reservation_id_display" class="form-label font-weight-bold">Reservation ID:</label>
                    <input type="text" id="reservation_id_display" class="form-control" :value="reservationDetails.id" readonly>
                </div>

                <div class="mb-3">
                    <label for="vehicle_no_display" class="form-label font-weight-bold">Vehicle Number:</label>
                    <input type="text" id="vehicle_no_display" class="form-control" :value="reservationDetails.vehicle_no" readonly>
                </div>

                <div class="mb-3">
                    <label for="parking_time_display" class="form-label font-weight-bold">Parking Start Time:</label>
                    <input type="text" id="parking_time_display" class="form-control" :value="new Date(reservationDetails.parking_timestamp).toLocaleString('en-IN')" readonly>
                </div>

                <div class="mb-3">
                    <label for="current_time_display" class="form-label font-weight-bold">Current Time (Recorded as Leaving Time):</label>
                    <input type="text" id="current_time_display" class="form-control" :value="currentTime" readonly>
                    <small class="form-text text-muted">This will be recorded as your actual leaving time.</small>
                </div>

                <div class="d-flex justify-content-start mt-4">
                    <button type="submit" class="btn btn-success btn-lg me-2">Confirm Release</button>
                    <router-link to="/user/dashboard" class="btn btn-secondary btn-lg">Cancel</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'UserReleaseSpot',
    props: ['reservationId'], // This will be passed from the router
    data() {
        return {
            reservationDetails: null,
            currentTime: new Date().toLocaleString('en-IN'),
            loading: true,
            error: '',
            intervalId: null, // To store interval for updating current time
        };
    },
    methods: {
        async fetchReservationDetails() {
            try {
                this.loading = true;
                this.error = '';
                // Fetch all reservations and find the specific one
                // A dedicated /api/reservation/<id> endpoint would be more efficient here
                const response = await axios.get('/api/reservations', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const allReservations = response.data.reservations;
                this.reservationDetails = allReservations.find(r => r.id == this.reservationId);

                if (!this.reservationDetails) {
                    this.error = "Reservation not found or access denied.";
                } else if (this.reservationDetails.leaving_timestamp) {
                    this.error = "This spot has already been released.";
                }

            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to fetch reservation details.';
                console.error("Error fetching reservation details:", err);
                this.reservationDetails = null;
            } finally {
                this.loading = false;
            }
        },
        async confirmRelease() {
            if (confirm('Are you sure you want to release this spot? This action cannot be undone.')) {
                try {
                    const response = await axios.post(`/api/release/${this.reservationId}`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    alert(response.data.message + `\nTotal Cost: ₹${response.data.final_cost.toFixed(2)}`);
                    this.$router.push('/user/dashboard'); // Redirect to dashboard on success
                } catch (err) {
                    this.error = err.response?.data?.message || 'Failed to release spot.';
                    alert(this.error);
                    console.error("Error releasing spot:", err);
                }
            }
        },
        updateCurrentTime() {
            this.currentTime = new Date().toLocaleString('en-IN');
        }
    },
    mounted() {
        if (!this.reservationId) {
            this.error = "Missing Reservation ID.";
            this.loading = false;
            return;
        }
        this.fetchReservationDetails();
        // Update current time every second
        this.intervalId = setInterval(this.updateCurrentTime, 1000);
    },
    beforeUnmount() {
        // Clear the interval to prevent memory leaks
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
};
</script>

<style scoped>
/* Styles for release spot */
</style>