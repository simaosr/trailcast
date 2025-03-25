<template>
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">7-Day Forecast</h2>
        <div v-if="forecast.length" class="space-y-4">
            <div v-for="day in forecast" :key="day.date"
                class="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-md shadow transition hover:shadow-md">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-700">{{ formatDate(day.date) }}</span>
                    <div class="text-right">
                        <span class="text-lg font-bold text-red-500">{{ day.tempMax }}°</span>
                        <span class="text-sm text-gray-500 mx-1">/</span>
                        <span class="text-lg font-bold text-blue-500">{{ day.tempMin }}°</span>
                        <span class="text-xs text-gray-500 ml-1">C</span>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-3 text-sm text-gray-600">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span>Wind: {{ day.wind }} <br /> km/h</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Gust: {{ day.gust }} <br /> km/h</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>Rain: {{ day.rain }} <br /> mm</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="bg-gray-50 rounded-md p-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.599A5.5 5.5 0 003 15z" />
            </svg>
            <p>No forecast data available.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
    hikeData: {
        type: Object,
        required: true
    }
});

const forecast = ref([]);

const fetchForecast = async (hikeData) => {
    const startPosition = hikeData.positions[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${startPosition.lat}&longitude=${startPosition.lon}&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,windgusts_10m_max,precipitation_sum&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        forecast.value = data.daily.time.map((date, index) => ({
            date,
            tempMax: Math.round(data.daily.temperature_2m_max[index]),
            tempMin: Math.round(data.daily.temperature_2m_min[index]),
            wind: Math.round(data.daily.windspeed_10m_max[index]),
            gust: Math.round(data.daily.windgusts_10m_max[index]),
            rain: data.daily.precipitation_sum[index]
        }));
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
};

// Format date to display in a more readable format
const formatDate = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
};

// Watch for changes in hikeData and re-initialize the forecast
watch(() => props.hikeData, (newHikeData) => {
    if (newHikeData.trackPoints && newHikeData.trackPoints.length > 0) {
        fetchForecast(newHikeData);
    }
}, { deep: true });

// Initialize with saved data if available
onMounted(() => {
    const savedData = localStorage.getItem('hikeData');
    if (savedData) {
        fetchForecast(JSON.parse(savedData));
    }
});
</script>