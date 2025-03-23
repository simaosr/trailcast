<template>
    <div id="tab2" class="tab-content" :class="{ active }">
        <div id="map-container" class="p-3 h-full">
            <div id="map" class="h-full" ref="mapContainer"></div>
        </div>
    </div>
</template>


<script setup>
//primevue
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';

const mapContainer = ref(null);
let map = null;
let trackLayer = null;

// Props
const props = defineProps({
    active: {
        type: Boolean,
        required: true
    },
    hikeData: {
        type: Object,
        required: true
    },
});

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
        }, 0);
    }
};

// Watch for changes in hikeData and re-initialize the map
watch(() => props.hikeData, (newHikeData) => {
    if (newHikeData.trackPoints && newHikeData.trackPoints.length > 0) {
        initMap(newHikeData.trackPoints);
    }
}, { deep: true });

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
    /* border: 1px solid #ccc; */
}

.tab-content {
    display: none;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
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