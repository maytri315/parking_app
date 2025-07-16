<template>
    <div class="container mt-5">
        <h2 class="mb-4 text-center">View Parking Lot</h2>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">{{ lot.name }}</h5>
                <p><strong>Price:</strong> ₹{{ lot.price }}/hr</p>
                <p><strong>Address:</strong> {{ lot.address }}</p>
                <p><strong>Pin Code:</strong> {{ lot.pin_code }}</p>
                <p><strong>Spots:</strong> {{ lot.spots }}</p>
                <h6 class="mt-4">Spots</h6>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="spot in spots" :key="spot.id">
                            <td>{{ spot.id }}</td>
                            <td>{{ spot.status }}</td>
                            <td>
                                <router-link :to="'/admin/spot-details/' + spot.id" class="btn btn-info btn-sm">Details</router-link>
                                <router-link :to="'/admin/edit-spot/' + spot.id" class="btn btn-warning btn-sm ms-2">Edit</router-link>
                                <button class="btn btn-danger btn-sm ms-2" @click="deleteSpot(spot.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <router-link to="/admin/dashboard" class="btn btn-secondary">Back to Dashboard</router-link>
                <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'; // Don't forget to import axios!

export default {
    name: 'AdminViewLot',
    props: ['id'], // Vue Router passes route params as props if configured
    data() {
        return {
            lot: {},
            spots: [],
            error: ''
        };
    },
    methods: {
        async fetchLotDetails() {
            try {
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
                const response = await axios.get(`${config.apiBaseUrl}/api/lots/${this.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.lot = response.data;
                this.spots = response.data.spots_details || []; // Assuming spots_details comes with lot data
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to fetch lot details';
            }
        },
        async deleteSpot(spotId) {
            try {
                const config = window.config || { apiBaseUrl: 'http://localhost:5000' }; // Fallback
                await axios.post(`${config.apiBaseUrl}/admin/delete_spot/${spotId}`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.fetchLotDetails(); // Refresh list after deletion
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to delete spot';
            }
        }
    },
    mounted() {
        this.fetchLotDetails();
    }
};
</script>

<style scoped>
/* Add any AdminViewLot-specific styles here if needed */
</style>