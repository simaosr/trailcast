<template>
    <div id="tab2" class="tab-content" :class="{ active }">
        <!-- Today's Weather Card -->
        <div class="w-full bg-white p-5 rounded-xl shadow-sm">
            <div v-if="loading" class="flex items-center justify-center py-8 text-gray-400 text-sm">
                <svg class="w-5 h-5 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading forecast…
            </div>

            <div v-else-if="errorMsg" class="text-sm text-red-500 py-4">{{ errorMsg }}</div>

            <div v-else-if="forecast.length">
                <div class="flex justify-between items-start">
                    <div class="flex flex-col">
                        <div class="flex items-end">
                            <span class="text-6xl font-bold text-gray-800">{{ forecast[0].tempMax }}</span>
                            <span class="text-3xl text-gray-400 ml-2 mb-1">/ {{ forecast[0].tempMin }}°C</span>
                        </div>
                        <span class="font-semibold mt-1 text-gray-500">{{ location || '…' }}</span>
                        <span v-if="forecast[0].sunrise" class="text-xs text-gray-400 mt-1">
                            🌅 {{ formatClock(forecast[0].sunrise) }} · 🌇 {{ formatClock(forecast[0].sunset) }}
                        </span>
                    </div>
                    <span class="text-7xl leading-none" :title="describeCode(forecast[0].weathercode).label">
                        {{ describeCode(forecast[0].weathercode).icon }}
                    </span>
                </div>

                <!-- Hourly Forecast -->
                <div v-if="hourlyForecast.length" class="flex justify-between mt-8">
                    <div v-for="(hour, index) in hourlyForecast" :key="index" class="flex flex-col items-center">
                        <span class="font-semibold text-base text-gray-700">{{ hour.temp }}°</span>
                        <span class="text-2xl my-1.5" :title="hour.condition">{{ hour.icon }}</span>
                        <span class="font-medium text-xs text-gray-500">{{ hour.time }}</span>
                    </div>
                </div>
            </div>

            <div v-else class="text-sm text-gray-400 py-4">
                Load a hike to see the forecast at the trailhead.
            </div>
        </div>

        <!-- 7-Day Forecast Card -->
        <div v-if="forecast.length" class="flex flex-col w-full bg-white p-2 mt-4 rounded-xl shadow-sm">
            <p class="text-[11px] text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">
                Tap a day to plan your hike then
            </p>
            <button v-for="(day, index) in forecast" :key="index" @click="selectDay(day)"
                class="flex justify-between items-center px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-emerald-50"
                :class="{ 'bg-emerald-50 ring-1 ring-emerald-200': day.date === selectedDate }">
                <span class="font-semibold text-sm w-[4.5rem] text-gray-700">{{ formatDate(day.date) }}</span>

                <span class="text-2xl shrink-0" :title="describeCode(day.weathercode).label">
                    {{ describeCode(day.weathercode).icon }}
                </span>

                <!-- Precipitation -->
                <div class="flex flex-col items-end w-16">
                    <span class="text-sm font-semibold text-blue-500">{{ Math.round(day.rain) }}%</span>
                    <span class="text-[11px] text-gray-400">{{ (day.rainMm ?? 0).toFixed(1) }} mm</span>
                </div>

                <!-- Wind -->
                <div class="hidden sm:flex flex-col items-end w-16">
                    <span class="text-sm font-medium text-emerald-600">{{ day.wind }}</span>
                    <span class="text-[11px] text-gray-400">km/h</span>
                </div>

                <!-- Temperature range -->
                <span class="font-semibold text-sm w-20 text-right text-gray-700">
                    <span class="text-gray-400">{{ day.tempMin }}°</span> / {{ day.tempMax }}°
                </span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { WeatherService } from '../services/WeatherService';
import { DateService } from '../services/DateService';
import HikeService from '../services/HikeService';

const props = defineProps({
    active: { type: Boolean, default: false },
    hikeData: { type: Object, required: true },
    selectedDate: { type: String, default: '' },
});

const emit = defineEmits(['day-selected']);

const forecast = ref([]);
const hourlyForecast = ref([]);
const location = ref('');
const loading = ref(false);
const errorMsg = ref('');

const describeCode = (code) => WeatherService.describeWeatherCode(code);
const formatDate = (dateStr) => DateService.formatDate(dateStr);
const formatClock = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const selectDay = (day) => emit('day-selected', day.date);

const fetchForecast = async (trackPoints) => {
    if (!trackPoints?.length) {
        forecast.value = [];
        location.value = '';
        bestStart.value = null;
        availableDates.value = new Set();
        return;
    }

    loading.value = true;
    errorMsg.value = '';
    try {
        const start = { lat: trackPoints[0].lat, lon: trackPoints[0].lon };
        const weatherData = await WeatherService.getForecast(start);
        forecast.value = weatherData.daily;
        hourlyForecast.value = weatherData.hourly;
        location.value = weatherData.location;
        bestStart.value = bestStartData;

        // Default to all days enabled
        availableDates.value = new Set(bestStartData.dayScores.map(s => s.date));
        activePreset.value = 'any';
    } catch (error) {
        console.error('Error fetching forecast:', error);
        errorMsg.value = 'Could not load the forecast. Check your connection and try again.';
        forecast.value = [];
        hourlyForecast.value = [];
    } finally {
        loading.value = false;
    }
};

// Only refetch when the actual track changes — not on every weather/chart update
watch(
    () => props.hikeData.trackPoints,
    (trackPoints) => {
        if (trackPoints?.length) fetchForecast(trackPoints);
    }
);

onMounted(() => {
    if (props.hikeData.trackPoints?.length) {
        fetchForecast(props.hikeData.trackPoints);
    }
});
</script>

<style scoped>
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
