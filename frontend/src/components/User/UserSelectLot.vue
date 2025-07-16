<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">Select a Parking Lot</h2>

        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading parking lots...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
            {{ error }}
        </div>

        <div v-else>
            <div v-if="availableLots.length === 0" class="alert alert-info text-center">
                No parking lots currently have available spots. Please check back later.
            </div>
            <div v-else class="card shadow p-4">
                <form @submit.prevent="proceedToBook">
                    <div class="mb-3">
                        <label for="lot_id" class="form-label font-weight-bold">Choose a Parking Lot:</label>
                        <select id="lot_id" v-model="selectedLotId" class="form-select" required>
                            <option value="" disabled>Select a lot</option>
                            <option v-for="lot in availableLots" :key="lot.id" :value="lot.id">
                                {{ lot.prime_location_name }} ({{ lot.available_spots }} spots available) - ₹{{ lot.price.toFixed(2) }} / hour
                            </option>
                        </select>
                    </div>

                    <div class="d-flex justify-content-start mt-4">
                        <button type="submit" class="btn btn-primary btn-lg me-2" :disabled="!selectedLotId">Proceed to Book</button>
                        <router-link to="/user/dashboard" class="btn btn-secondary btn-lg">Back to Dashboard</router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'UserSelectLot',
    data() {
        return {
            availableLots: [],
            selectedLotId: '',
            loading: true,
            error: '',
        };
    },
    methods: {
        async fetchAvailableLots() {
            try {
                this.loading = true;
                this.error = '';
                const response = await axios.get('/api/parking_lots/available', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.availableLots = response.data.data; // Note: the API returns { "data": [...] }
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to fetch parking lots.';
                console.error("Error fetching available lots:", err);
            } finally {
                this.loading = false;
            }
        },
        async proceedToBook() {
            if (!this.selectedLotId) {
                alert('Please select a parking lot.');
                return;
            }
            try {
                // Instead of getting a single available spot from backend,
                // we'll get all spots for the lot and let the user pick,
                // or just pick the first available one for simplicity
                const spotsResponse = await axios.get(`/api/spots/${this.selectedLotId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const availableSpotsInLot = spotsResponse.data.data.filter(spot => spot.status === 'A');

                if (availableSpotsInLot.length > 0) {
                    const firstAvailableSpotId = availableSpotsInLot[0].id;
                    // Navigate to the Book Spot component, passing lotId and spotId
                    this.$router.push({
                        name: 'BookSpot',
                        params: { lotId: this.selectedLotId, spotId: firstAvailableSpotId }
                    });
                } else {
                    alert('No available spots found in the selected lot. Please choose another lot.');
                    // Refresh data in case status changed
                    this.fetchAvailableLots();
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to get available spot for booking.';
                console.error("Error proceeding to book:", err);
            }
        }
    },
    mounted() {
        this.fetchAvailableLots();
    },
};
</script>

<style scoped>
/* Styles for select lot */
</style>