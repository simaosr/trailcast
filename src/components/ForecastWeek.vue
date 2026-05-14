<template>
    <div id="tab2" class="tab-content" :class="{ active }"
        style="padding:20px;background-color:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.08);margin-bottom:20px">
        <!-- Today's Weather Card -->
        <div class="w-full max-w-screen-sm bg-white p-5 rounded-xl ring-8 ring-white ring-opacity-40 shadow-lg">
            <div class="flex justify-between">
                <div class="flex flex-col">
                    <div class="flex items-end">
                        <span class="text-6xl font-bold">{{ forecast.length ? forecast[0].tempMax : '--'
                        }}</span>
                        <span class="text-4xl text-gray-500 ml-2 mb-1">/ {{ forecast.length ? forecast[0].tempMin : '--'
                        }}°C</span>
                    </div>
                    <span class="font-semibold mt-1 text-gray-500">{{ location || 'Loading...' }}</span>
                    <div v-if="forecast.length" class="flex items-center gap-1.5 mt-1">
                        <svg class="w-4 h-4 fill-current text-blue-400" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1,0,0,1,-4,-2)">
                                <path d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z" style="fill-rule:nonzero;" />
                            </g>
                        </svg>
                        <span class="text-sm font-semibold text-blue-500">{{ Math.round(forecast[0].rain) }}%</span>
                        <span class="text-sm text-gray-400">· {{ forecast[0].rainMm?.toFixed(1) ?? '0.0' }} mm</span>
                    </div>
                </div>

                <!-- Weather Icon -->
                <svg class="h-24 w-24 fill-current text-yellow-400" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path
                        d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z" />
                </svg>
            </div>

            <!-- Hourly Forecast -->
            <div class="flex justify-between mt-12">
                <div v-for="(hour, index) in hourlyForecast" :key="index" class="flex flex-col items-center">
                    <span class="font-semibold text-lg">{{ hour.temp }}°C</span>

                    <!-- Weather Icon - changes based on conditions -->
                    <svg v-if="hour.condition === 'sunny'" class="h-10 w-10 fill-current text-gray-400 mt-3"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path
                            d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z" />
                    </svg>

                    <svg v-else-if="hour.condition === 'cloudy'" class="h-10 w-10 fill-current text-gray-400 mt-3"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path
                            d="M12.01 6c2.61 0 4.89 1.86 5.4 4.43l.3 1.5 1.52.11c1.56.11 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3h-13c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.95 6 12.01 6m0-2C9.12 4 6.6 5.64 5.35 8.04 2.35 8.36.01 10.91.01 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96C18.68 6.59 15.65 4 12.01 4z" />
                    </svg>

                    <svg v-else class="h-10 w-10 fill-current text-gray-400 mt-3" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path
                            d="M19.78,17.51c-2.47,0-6.57-1.33-8.68-5.43C8.77,7.57,10.6,3.6,11.63,2.01C6.27,2.2,1.98,6.59,1.98,12 c0,0.14,0.02,0.28,0.02,0.42C2.61,12.16,3.28,12,3.98,12c0,0,0,0,0,0c0-3.09,1.73-5.77,4.3-7.1C7.78,7.09,7.74,9.94,9.32,13 c1.57,3.04,4.18,4.95,6.8,5.86c-1.23,0.74-2.65,1.15-4.13,1.15c-0.5,0-1-0.05-1.48-0.14c-0.37,0.7-0.94,1.27-1.64,1.64 c0.98,0.32,2.03,0.5,3.11,0.5c3.5,0,6.58-1.8,8.37-4.52C20.18,17.5,19.98,17.51,19.78,17.51z" />
                        <path
                            d="M7,16l-0.18,0C6.4,14.84,5.3,14,4,14c-1.66,0-3,1.34-3,3s1.34,3,3,3c0.62,0,2.49,0,3,0c1.1,0,2-0.9,2-2 C9,16.9,8.1,16,7,16z" />
                    </svg>

                    <span class="font-semibold mt-1 text-sm">{{ hour.time }}</span>
                    <span class="text-xs font-semibold text-gray-400">{{ hour.period }}</span>
                </div>
            </div>
        </div>

        <!-- 7-Day Forecast Card -->
        <div
            class="flex flex-col space-y-6 w-full max-w-screen-sm bg-white p-5 mt-10 rounded-xl ring-8 ring-white ring-opacity-40 shadow-lg">
            <div v-for="(day, index) in forecast" :key="index" class="flex justify-between items-center">
                <span class="font-semibold text-lg w-1/4">{{ formatDate(day.date) }}</span>

                <!-- Precipitation chance -->
                <div class="flex flex-col items-end w-1/4 pr-4">
                    <div class="flex items-center">
                        <span class="font-semibold text-blue-500">{{ Math.round(day.rain) }}%</span>
                        <svg class="w-4 h-4 fill-current text-blue-400 ml-1" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1,0,0,1,-4,-2)">
                                <path
                                    d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                                    style="fill-rule:nonzero;" />
                            </g>
                        </svg>
                    </div>
                    <span class="text-xs text-gray-400">{{ day.rainMm?.toFixed(1) ?? '0.0' }} mm</span>
                </div>

                <!-- Weather icon -->
                <svg v-if="day.rain < 0.5" class="h-8 w-8 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path
                        d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z" />
                </svg>

                <svg v-else class="h-8 w-8 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path
                        d="M12.01 6c2.61 0 4.89 1.86 5.4 4.43l.3 1.5 1.52.11c1.56.11 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3h-13c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.95 6 12.01 6m0-2C9.12 4 6.6 5.64 5.35 8.04 2.35 8.36.01 10.91.01 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96C18.68 6.59 15.65 4 12.01 4z" />
                </svg>

                <!-- Temperature range -->
                <span class="font-semibold text-lg w-1/4 text-right">{{ day.tempMin }}° / {{ day.tempMax }}°</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { WeatherService } from '../services/WeatherService';
import { DateService } from '../services/DateService';

const props = defineProps({
    active: {
        type: Boolean,
        default: false
    },
    hikeData: {
        type: Object,
        required: true
    }
});

const forecast = ref([]);
const hourlyForecast = ref([]);
const location = ref('');

const fetchForecast = async (hikeData) => {
    // Use trackPoints if available, otherwise fallback to positions
    const points = hikeData.trackPoints && hikeData.trackPoints.length > 0 ? hikeData.trackPoints : hikeData.positions;
    if (!points || points.length === 0) {
        forecast.value = [];
        location.value = '';
        return;
    }

    try {
        const startPosition = {
            lat: points[0].lat,
            lon: points[0].lon
        };

        const weatherData = await WeatherService.getForecast(startPosition);
        
        forecast.value = weatherData.daily;
        hourlyForecast.value = weatherData.hourly;
        location.value = weatherData.location;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        forecast.value = [];
        hourlyForecast.value = [];
        location.value = 'Error loading location';
    }
};

// Format date using DateService
const formatDate = (dateStr) => DateService.formatDate(dateStr);

// Watch for changes in hikeData and re-initialize the forecast
watch(() => props.hikeData, (newHikeData) => {
    if ((newHikeData.trackPoints && newHikeData.trackPoints.length > 0) || 
        (newHikeData.positions && newHikeData.positions.length > 0)) {
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

<style scoped>
.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

@media (max-width: 600px) {
    .tab-content {
        margin-bottom: 50px;
        padding: 15px !important;
    }
}

@media (min-width: 601px) {
    .tab-content {
        display: block;
        width: 50%;
    }
}
</style>