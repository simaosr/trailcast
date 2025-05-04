<template>
    <div id="tab1" class="tab-content" :class="{ active }">
        <div class="flex flex-col justify-top p-3">
            <div class="flex flex-col">
                <h2 class="text-xl font-bold mb-4 ">1. Upload GPX file</h2>

                <div class="flex items-center justify-center w-full">
                    <label for="gpxInput"
                        class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                            </svg>
                            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click
                                    to upload</span> or drag and drop</p>
                        </div>
                        <input type="file" id="gpxInput" accept=".gpx" @change="handleFileChange" class="hidden" />
                    </label>
                </div>


                <!-- <input type="file" id="gpxInput" accept=".gpx" @change="handleFileChange"
                    class="mb-4 p-2 border border-gray-300 rounded" />
                 -->

                <h2 class="text-xl font-bold mb-4">2. Select starting date and time</h2>

                <input type="datetime-local" v-model="startTime" class="mb-4 p-2 border border-gray-300 rounded" />

                <h2 class="text-xl font-bold mb-4">3. Fetch weather forecast</h2>
                <button @click="loadHike" class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-700">Load
                    Hike</button>
            </div>
            <div class="flex flex-col align-">
                <!-- separator -->
                <div class="flex justify-center items-center pt-3 pb-3">
                    <div class="w-1/2 h-px bg-gray-300"></div>
                    <div class="mx-4 text-gray-500">and</div>
                    <div class="w-1/2 h-px bg-gray-300"></div>
                </div>
            </div>
            <div class="flex flex-col">
                <button class="px-4 mb-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Share
                    Hike</button>
                <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Save Hike</button>
            </div>
        </div>
    </div>
</template>


<script setup>
//primevue
import { ref } from 'vue';
import HikeService from '@/services/HikeService';

const gpxInput = ref(null);
const startTime = ref(new Date().toISOString().slice(0, 16));
const selectedFile = ref(null);
const fileIsSelected = ref(false)

const hikeService = new HikeService();

// Props
const props = defineProps({
    active: {
        type: Boolean,
        required: true
    }
});

// Emits
const emit = defineEmits(['hike-loaded']);


// Methods

// // Handle file selection
const handleFileChange = (event) => {
    selectedFile.value = event.target.files[0];
    fileIsSelected.value = true;
};


// Process GPX and calculate route
const loadHike = async () => {
    if (!selectedFile.value) {
        alert('Please select a GPX file');
        return;
    }
    if (!startTime.value) {
        alert('Please select a start time');
        return;
    }

    // try {
    // Process file and calculate positions
    const gpxText = await selectedFile.value.text();
    const trackPoints = hikeService.parseGPX(gpxText);
    const positions = hikeService.calculatePositions(trackPoints, new Date(startTime.value));

    // Fetch weather for calculated positions
    const weather = await hikeService.fetchWeatherData(positions);


    // Create complete hike data object
    const hikeData = {
        trackPoints,
        positions,
        weather
    };

    // calculate hike stats
    const hikeStats = await hikeService.calculateHikeStats(hikeData);
    hikeData.stats = hikeStats;

    // Save to local storage
    localStorage.setItem('hikeData', JSON.stringify(hikeData));

    // Emit event to parent component
    emit('hike-loaded', hikeData);
    // } catch (error) {
    //     console.error('Error loading hike:', error);
    //     alert('Error processing GPX file');
    // }
};
</script>

<style scoped>
#controls {
    margin-bottom: 15px;
}

.tab-content {
    display: none;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 20px;
    margin-bottom: 20px;
}

.tab-content.active {
    display: block;
}

@media (max-width: 600px) {
    .tab-content {
        margin-bottom: 50px;
        height: 100%;
        padding: 15px;
    }

    #map-container {
        height: calc(100% - 50px);
    }
}

@media (min-width: 601px) {
    .tab-content {
        display: block;
        width: 50%;
    }
}
</style>