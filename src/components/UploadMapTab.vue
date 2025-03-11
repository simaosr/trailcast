<template>
    <div id="tab1" class="tab-content" :class="{ active }">
        <div id="controls" class="row">
            <div class="col">
                <input type="file" id="gpxInput" accept=".gpx" hidden ref="gpxInput" @change="handleFileChange" />
                <label for="gpxInput" class="btn btn-primary">Load GPX file</label>
            </div>
            <div class="col">
                <input type="datetime-local" id="startTime" v-model="startTime">
            </div>
            <div class="col">
                <button :disabled="!fileIsSelected" type="button" class="btn btn-primary" id="load-hike-button"
                    @click="loadHike">
                    Analyse Hike
                </button>
            </div>
        </div>
        <div id="map-container">
            <div id="map" ref="mapContainer"></div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import HikeService from '@/services/HikeService';

export default {
    name: 'UploadMapTab',
    props: {
        active: {
            type: Boolean,
            default: true
        }
    },
    emits: ['hike-loaded'],
    setup(props, { emit }) {
        const mapContainer = ref(null);
        const gpxInput = ref(null);
        const startTime = ref(new Date().toISOString().slice(0, 16));
        const selectedFile = ref(null);

        const fileIsSelected = ref(false)

        let map = null;
        let trackLayer = null;
        const hikeService = new HikeService();

        // Handle file selection
        const handleFileChange = (event) => {
            selectedFile.value = event.target.files[0];
            fileIsSelected.value = true;
        };

        // Process GPX and calculate route
        const loadHike = async () => {
            if (!selectedFile.value || !startTime.value) {
                alert('Please select both GPX file and start time');
                return;
            }

            try {
                // Process file and calculate positions
                const gpxText = await selectedFile.value.text();
                const trackPoints = hikeService.parseGPX(gpxText);
                const positions = hikeService.calculatePositions(trackPoints, new Date(startTime.value));

                // Fetch weather for calculated positions
                const weather = await hikeService.fetchWeatherData(positions);

                // Initialize map
                initMap(trackPoints);

                // Create complete hike data object
                const hikeData = {
                    trackPoints,
                    positions,
                    weather
                };

                // Save to local storage
                localStorage.setItem('hikeData', JSON.stringify(hikeData));

                // Emit event to parent component
                emit('hike-loaded', hikeData);
            } catch (error) {
                console.error('Error loading hike:', error);
                alert('Error processing GPX file');
            }
        };

        // Initialize the map with route
        const initMap = (points) => {
            if (map) map.remove();

            if (mapContainer.value && points && points.length > 0) {
                map = L.map(mapContainer.value).setView([points[0].lat, points[0].lon], 13);
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

                if (trackLayer) trackLayer.remove();
                trackLayer = L.polyline(points.map(p => [p.lat, p.lon]), { color: 'blue' }).addTo(map);

                // Ensure map is properly sized
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        };

        // Initialize map with saved data if available
        onMounted(() => {
            const savedData = localStorage.getItem('hikeData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.trackPoints && parsedData.trackPoints.length > 0) {
                    initMap(parsedData.trackPoints);
                }
            }
        });

        // Clean up map when component is unmounted
        onUnmounted(() => {
            if (map) {
                map.remove();
            }
        });

        return {
            mapContainer,
            gpxInput,
            startTime,
            handleFileChange,
            loadHike,
            fileIsSelected
        };
    }
};
</script>

<style scoped>
#map-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0 auto;
}

#map {
    height: 500px;
    border: 1px solid #ccc;
}

#controls {
    margin-bottom: 15px;
}

.tab-content {
    display: none;
    padding: 20px;
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