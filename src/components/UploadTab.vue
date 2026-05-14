<template>
    <div id="tab1" class="tab-content" :class="{ active }">
        <div class="flex flex-col gap-3">

            <!-- Upload area -->
            <div>
                <label for="gpxInput"
                    class="flex items-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors px-4"
                    :class="hasTrack
                        ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'">

                    <!-- Empty state -->
                    <div v-if="!hasTrack" class="flex items-center justify-between w-full">
                        <p class="text-sm text-gray-400">Drop a GPX file or click to browse</p>
                        <span class="shrink-0 ml-3 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-md flex items-center gap-1.5">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Upload
                        </span>
                    </div>

                    <!-- Loaded state: filename left, stats right -->
                    <div v-else class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2 min-w-0">
                            <svg class="w-5 h-5 shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span class="text-sm font-semibold text-emerald-700 truncate">{{ loadedFileName }}</span>
                        </div>
                        <div class="flex flex-col items-end gap-0.5 shrink-0 ml-3 text-xs font-medium text-emerald-700">
                            <span>{{ trackStats.distance }} km</span>
                            <span>↑ {{ trackStats.elevationGain }} m</span>
                            <span>↓ {{ trackStats.elevationLoss }} m</span>
                        </div>
                    </div>

                    <input type="file" id="gpxInput" accept=".gpx" @change="handleFileChange" class="hidden" />
                </label>
            </div>

            <!-- Map (shown once a track is loaded) -->
            <div v-if="hasTrack" class="map-wrapper">
                <div class="map-container" ref="mapContainer"></div>
                <button class="fullscreen-btn" @click="toggleFullscreen" title="Toggle fullscreen">
                    <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                    </svg>
                </button>
            </div>

            <!-- Placeholder when no track loaded -->
            <div v-else
                class="map-placeholder flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                Map will appear here after loading a GPX file
            </div>

        </div>
    </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import HikeService from '@/services/HikeService';

const props = defineProps({
    active: { type: Boolean, required: true }
});

const emit = defineEmits(['hike-loaded']);

const mapContainer = ref(null);
const hasTrack = ref(false);
const loadedFileName = ref('');
const isFullscreen = ref(false);
const trackStats = ref({ distance: 0, elevationGain: 0, elevationLoss: 0 });

let map = null;
let trackLayer = null;
const hikeService = new HikeService();

const initMap = (points) => {
    if (!mapContainer.value || !points?.length) return;

    nextTick(() => {
        if (map) map.remove();

        map = L.map(mapContainer.value).setView([points[0].lat, points[0].lon], 13);

        L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }).addTo(map);

        if (trackLayer) trackLayer.remove();
        trackLayer = L.polyline(points.map(p => [p.lat, p.lon]), { color: '#3b82f6', weight: 3 }).addTo(map);
        map.fitBounds(trackLayer.getBounds(), { padding: [20, 20] });

        const iconHtml = (color) =>
            `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`;

        L.marker([points[0].lat, points[0].lon], {
            icon: L.divIcon({ className: '', html: iconHtml('#22c55e'), iconSize: [12, 12], iconAnchor: [6, 6] })
        }).addTo(map).bindPopup('Start');

        L.marker([points[points.length - 1].lat, points[points.length - 1].lon], {
            icon: L.divIcon({ className: '', html: iconHtml('#ef4444'), iconSize: [12, 12], iconAnchor: [6, 6] })
        }).addTo(map).bindPopup('Finish');

        setTimeout(() => map.invalidateSize(), 0);
    });
};

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    loadedFileName.value = file.name;
    const gpxText = await file.text();
    const trackPoints = hikeService.parseGPX(gpxText);
    const stats = hikeService.calculateBasicStats(trackPoints);
    trackStats.value = {
        distance: Math.round(stats.distance * 10) / 10,
        elevationGain: Math.round(stats.elevationGain),
        elevationLoss: Math.round(Math.abs(stats.elevationLoss)),
    };

    const hikeData = { trackPoints, positions: [], weather: [] };
    localStorage.setItem('hikeData', JSON.stringify(hikeData));
    emit('hike-loaded', hikeData);

    hasTrack.value = true;
    initMap(trackPoints);
};

const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
        await mapContainer.value.requestFullscreen();
        isFullscreen.value = true;
    } else {
        await document.exitFullscreen();
        isFullscreen.value = false;
    }
    setTimeout(() => map?.invalidateSize(), 150);
};

onMounted(() => {
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) isFullscreen.value = false;
    });

    const savedData = localStorage.getItem('hikeData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.trackPoints?.length) {
            hasTrack.value = true;
            loadedFileName.value = 'Saved hike';
            initMap(parsed.trackPoints);
        }
    }
});

onUnmounted(() => {
    if (map) map.remove();
});
</script>

<style scoped>
.tab-content {
    display: none;
    padding: 20px;
    margin-bottom: 20px;
}

.tab-content.active {
    display: block;
}

.map-wrapper {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
}

.map-container {
    height: 400px;
    width: 100%;
    border-radius: 12px;
}

@media (max-width: 600px) {
    .map-container {
        height: calc(100dvh - 310px);
        min-height: 220px;
    }
}

.map-placeholder {
    height: 160px;
    border-radius: 12px;
}

.fullscreen-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: white;
    border: none;
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
    transition: background 0.15s;
}

.fullscreen-btn:hover {
    background: #f3f4f6;
}

/* When the map-container goes fullscreen via browser API */
.map-container:fullscreen {
    height: 100vh;
    width: 100vw;
    border-radius: 0;
}

@media (max-width: 600px) {
    .tab-content {
        margin-bottom: 50px;
        height: 100%;
        padding: 15px;
    }
}

@media (min-width: 601px) {
    .tab-content {
        display: block;
        width: 50%;
    }
}
</style>
