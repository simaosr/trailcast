<template>
    <div class="forecast-week">
        <h2 class="text-xl font-bold mb-4">7-Day Forecast</h2>
        <div v-if="forecast.length">
            <div v-for="day in forecast" :key="day.date" class="forecast-day">
                <p>{{ day.date }}</p>
                <p>Temperature: {{ day.temp }}°C</p>
                <p>Wind: {{ day.wind }} km/h</p>
                <p>Rain: {{ day.rain }} mm</p>
            </div>
        </div>
        <div v-else>
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${startPosition.lat}&longitude=${startPosition.lon}&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum&timezone=auto`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        forecast.value = data.daily.time.map((date, index) => ({
            date,
            temp: data.daily.temperature_2m_max[index],
            wind: data.daily.windspeed_10m_max[index],
            rain: data.daily.precipitation_sum[index]
        }));
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
};


// Watch for changes in hikeData and re-initialize the forecast
watch(() => props.hikeData, (newHikeData) => {
    if (newHikeData.trackPoints && newHikeData.trackPoints.length > 0) {
        fetchForecast(newHikeData);
    }
}, { deep: true });

// Initialize map with saved data if available
onMounted(() => {
    const savedData = localStorage.getItem('hikeData');
    if (savedData) {
        fetchForecast(JSON.parse(savedData));
    }
});


</script>

<style scoped>
.forecast-week {
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
}

.forecast-day {
    margin-bottom: 10px;
}
</style>