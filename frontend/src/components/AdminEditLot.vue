<template>
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
</template>

<script>
import axios from 'axios'; // Don't forget to import axios!

export default {
    name: 'AdminEditLot',
    props: ['id'], // Vue Router passes route params as props if configured
    data() {
        return {
            lot: { id: null, name: '', price: 0, address: '', pinCode: '', spots: 0 },
            error: ''
        };
    },
    methods: {
        async fetchLot() {
            try {
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
                const response = await axios.get(`${config.apiBaseUrl}/api/lots/${this.id}`, {
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
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
                await axios.post(`${config.apiBaseUrl}/admin/edit_lot/${this.id}`, new URLSearchParams({
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
</script>

<style scoped>
/* Add any AdminEditLot-specific styles here if needed */
</style>