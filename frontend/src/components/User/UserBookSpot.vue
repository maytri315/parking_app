<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">Confirm Your Parking Spot Booking</h2>

        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading spot details...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
            {{ error }}
        </div>

        <div v-else-if="!spotDetails || !lotDetails" class="alert alert-warning text-center">
            Could not load parking spot or lot details.
        </div>

        <div v-else class="card shadow p-4">
            <p class="lead text-primary">
                You are about to book: <br>
                <strong>Spot ID: {{ spotDetails.id }}</strong> in <strong>{{ lotDetails.prime_location_name }}</strong>.
            </p>
            <p class="mb-4">
                Price per hour: <strong class="text-success">₹{{ lotDetails.price.toFixed(2) }}</strong>
            </p>

            <form @submit.prevent="confirmBooking">
                <div class="mb-3">
                    <label for="vehicle_no" class="form-label font-weight-bold">Vehicle Number:</label>
                    <input type="text" id="vehicle_no" v-model="vehicleNo" class="form-control" required
                           placeholder="Enter your vehicle number (e.g., UP16AB1234)" maxlength="15">
                </div>

                <div class="mb-3">
                    <label for="hours" class="form-label font-weight-bold">Estimated Hours:</label>
                    <input type="number" id="hours" v-model.number="estimatedHours" class="form-control" required
                           min="0.1" step="0.1" placeholder="e.g., 2.5">
                    <small class="form-text text-muted">Enter the estimated number of hours you will park.</small>
                </div>

                <div class="d-flex justify-content-start mt-4">
                    <button type="submit" class="btn btn-primary btn-lg me-2">Confirm Booking</button>
                    <router-link to="/user/dashboard" class="btn btn-secondary btn-lg">Cancel</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'UserBookSpot',
    props: ['lotId', 'spotId'], // These will be passed from the router
    data() {
        return {
            spotDetails: null,
            lotDetails: null,
            vehicleNo: '',
            estimatedHours: 1.0, // Default value
            loading: true,
            error: '',
        };
    },
    methods: {
        async fetchSpotDetails() {
            try {
                this.loading = true;
                this.error = '';
                // Use the spotId prop to fetch details
                const response = await axios.get(`/api/spot/${this.spotId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.spotDetails = response.data;
                this.lotDetails = response.data.lot_details; // API returns lot details nested
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to fetch spot details.';
                console.error("Error fetching spot details:", err);
                this.spotDetails = null; // Clear data on error
                this.lotDetails = null;
            } finally {
                this.loading = false;
            }
        },
        async confirmBooking() {
            try {
                // Make the API call to reserve the spot
                const response = await axios.post('/api/reserve', {
                    spot_id: this.spotId,
                    vehicle_no: this.vehicleNo,
                    hours: this.estimatedHours, // Pass estimated hours
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert(response.data.message);
                this.$router.push('/user/dashboard'); // Redirect to dashboard on success
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to book spot.';
                alert(this.error);
                console.error("Error booking spot:", err);
            }
        }
    },
    mounted() {
        if (!this.lotId || !this.spotId) {
            this.error = "Missing Lot ID or Spot ID. Please select a lot first.";
            this.loading = false;
            return;
        }
        this.fetchSpotDetails();
    },
};
</script>

<style scoped>
/* Styles for book spot */
</style>