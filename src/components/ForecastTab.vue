<template>
    <div id="tab3" class="tab-content p-2 pb-16" :class="{ active }">
        <!-- Controls -->
        <div class="bg-white rounded-xl shadow-sm p-3 mb-4">
            <div class="flex items-center gap-2">
                <input type="datetime-local" v-model="startTime"
                    class="flex-1 min-w-0 text-sm p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <div class="flex border border-gray-300 rounded overflow-hidden shrink-0">
                    <button v-for="act in activities" :key="act.value" @click="activity = act.value"
                        :class="activity === act.value ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                        class="px-2.5 py-1.5 text-base transition-colors" :title="act.label">
                        {{ act.icon }}
                    </button>
                </div>
                <button @click="fetchForecast" :disabled="loading || !hasTrack"
                    class="shrink-0 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title="Fetch forecast along the hike">
                    <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <svg v-else class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {{ loading ? 'Loading' : 'Forecast' }}
                </button>
            </div>
            <p v-if="etaText" class="text-xs text-gray-500 mt-2">{{ etaText }}</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {{ error }}
        </div>

        <template v-if="hasWeather">
            <!-- Summary cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div v-for="card in summaryCards" :key="card.label" class="bg-white rounded-xl shadow-sm p-3">
                    <div class="text-lg leading-none mb-1">{{ card.icon }}</div>
                    <div class="text-sm font-bold text-gray-800">{{ card.value }}</div>
                    <div class="text-[11px] text-gray-400 uppercase tracking-wide">{{ card.label }}</div>
                </div>
            </div>

            <!-- Warnings -->
            <div v-if="warnings.length" class="flex flex-wrap gap-1.5 mb-4">
                <span v-for="(w, i) in warnings" :key="i"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-full">
                    {{ w }}
                </span>
            </div>

            <!-- Charts -->
            <weather-chart title="Temperature" :labels="timeLabels" :footers="footers" :begin-at-zero="false"
                :datasets="[
                    { label: 'Temperature', data: series('temp'), color: '#ef4444', fill: true, unit: '°C' },
                    { label: 'Feels like', data: series('feelsLike'), color: '#f97316', dashed: true, unit: '°C' },
                ]" />
            <weather-chart title="Precipitation" :labels="timeLabels" :footers="footers" :datasets="[
                { label: 'Rain', data: series('rain'), color: '#3b82f6', type: 'bar', unit: 'mm' },
                { label: 'Probability', data: series('rainProbability'), color: '#1d4ed8', yAxisID: 'y1', unit: '%' },
            ]" />
            <weather-chart title="Wind" :labels="timeLabels" :footers="footers" :datasets="[
                { label: 'Wind', data: series('wind'), color: '#10b981', fill: true, unit: 'km/h' },
                { label: 'Gusts', data: series('gust'), color: '#059669', dashed: true, unit: 'km/h' },
            ]" />
            <weather-chart title="UV Index" :labels="timeLabels" :footers="footers" :datasets="[
                { label: 'UV index', data: series('sun'), color: '#f59e0b', type: 'bar' },
            ]" />
            <weather-chart title="Elevation Profile" :labels="timeLabels" :footers="footers" :begin-at-zero="false"
                :datasets="[
                    { label: 'Elevation', data: series('elevation'), color: '#8b5cf6', fill: true, unit: 'm' },
                ]" />
        </template>

        <div v-else-if="!error" class="text-center text-gray-400 text-sm py-12 px-4">
            <p v-if="!hasTrack">Load a GPX file first, then fetch the forecast along your route.</p>
            <p v-else>Pick a start time and activity, then hit <span class="font-semibold">Forecast</span> to see the
                weather along your hike.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import WeatherChart from '@/components/WeatherChart.vue';
import HikeService from '@/services/HikeService';

const props = defineProps({
    active: { type: Boolean, default: false },
    hikeData: { type: Object, required: true },
    selectedDate: { type: String, default: '' },
});

const emit = defineEmits(['forecast-loaded']);

const hikeService = new HikeService();

const activities = [
    { value: 'hiking', icon: '🥾', label: 'Hiking (5 km/h)', speed: 5 },
    { value: 'trail_running', icon: '🏃', label: 'Trail Running (9 km/h)', speed: 9 },
    { value: 'cycling', icon: '🚴', label: 'Cycling (18 km/h)', speed: 18 },
];

// Default to tomorrow at 09:00 local time — the most common planning case
const defaultStartTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInputValue(d);
};

function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const startTime = ref(defaultStartTime());
const activity = ref('hiking');
const loading = ref(false);
const error = ref('');

const hasTrack = computed(() => props.hikeData.trackPoints?.length > 0);
const hasWeather = computed(() => props.hikeData.weather?.length > 0);

const timeLabels = computed(() =>
    (props.hikeData.positions || []).map((pos) =>
        new Date(pos.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
);

const footers = computed(() =>
    (props.hikeData.positions || []).map((pos) =>
        pos.distance !== undefined ? `${pos.distance.toFixed(1)} km from start` : ''
    )
);

const series = (key) => (props.hikeData.weather || []).map((w) => w[key] ?? 0);

const etaText = computed(() => {
    if (!hasTrack.value) return '';
    const speed = activities.find((a) => a.value === activity.value)?.speed ?? 5;
    const stats = hikeService.calculateBasicStats(props.hikeData.trackPoints);
    const durationH = stats.distance / speed;
    const start = new Date(startTime.value);
    if (isNaN(start.getTime())) return '';
    const end = new Date(start.getTime() + durationH * 3_600_000);
    const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const h = Math.floor(durationH);
    const m = Math.round((durationH - h) * 60);
    return `${stats.distance.toFixed(1)} km · ~${h}h${String(m).padStart(2, '0')} · ${fmt(start)} → ${fmt(end)}`;
});

const summaryCards = computed(() => {
    const weather = props.hikeData.weather || [];
    if (!weather.length) return [];
    const temps = weather.map((w) => w.temp);
    const totalRain = weather.reduce((sum, w) => sum + w.rain / 4, 0); // 15-min steps → mm/h ÷ 4
    const maxProb = Math.max(...weather.map((w) => w.rainProbability ?? 0));
    const maxWind = Math.max(...weather.map((w) => w.wind));
    const maxGust = Math.max(...weather.map((w) => w.gust ?? 0));
    const maxUv = Math.max(...weather.map((w) => w.sun ?? 0));
    return [
        { icon: '🌡️', label: 'Temp range', value: `${Math.round(Math.min(...temps))}° to ${Math.round(Math.max(...temps))}°` },
        { icon: '🌧️', label: 'Rain', value: `${totalRain.toFixed(1)} mm · ${Math.round(maxProb)}%` },
        { icon: '💨', label: 'Wind / gusts', value: `${Math.round(maxWind)} / ${Math.round(maxGust)} km/h` },
        { icon: '☀️', label: 'Max UV', value: `${Math.round(maxUv * 10) / 10}` },
    ];
});

const warnings = computed(() => {
    const weather = props.hikeData.weather || [];
    const positions = props.hikeData.positions || [];
    if (!weather.length) return [];
    const result = [];
    const timeAt = (i) =>
        new Date(positions[i]?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const firstRain = weather.findIndex((w) => w.rain >= 0.3);
    if (firstRain >= 0) result.push(`🌧️ Rain expected around ${timeAt(firstRain)}`);

    const storm = weather.findIndex((w) => w.weathercode >= 95);
    if (storm >= 0) result.push(`⛈️ Thunderstorm risk around ${timeAt(storm)}`);

    const strongWind = weather.findIndex((w) => w.gust >= 50);
    if (strongWind >= 0) result.push(`💨 Strong gusts (50+ km/h) around ${timeAt(strongWind)}`);

    const maxUv = Math.max(...weather.map((w) => w.sun ?? 0));
    if (maxUv >= 6) result.push('🧴 High UV — bring sun protection');

    const minTemp = Math.min(...weather.map((w) => w.temp));
    if (minTemp <= 0) result.push(`🥶 Freezing temperatures (${Math.round(minTemp)}°C)`);
    const maxTemp = Math.max(...weather.map((w) => w.temp));
    if (maxTemp >= 30) result.push(`🥵 Heat (${Math.round(maxTemp)}°C) — bring extra water`);

    const snow = weather.findIndex((w) => w.weathercode >= 71 && w.weathercode <= 86);
    if (snow >= 0) result.push(`🌨️ Snow possible around ${timeAt(snow)}`);

    return result;
});

const fetchForecast = async () => {
    error.value = '';
    if (!hasTrack.value) {
        error.value = 'No hike loaded. Upload a GPX file first.';
        return;
    }
    const start = new Date(startTime.value);
    if (isNaN(start.getTime())) {
        error.value = 'Please pick a valid start date and time.';
        return;
    }
    const maxForecast = new Date();
    maxForecast.setDate(maxForecast.getDate() + 15);
    if (start > maxForecast) {
        error.value = 'Forecasts are only available up to ~15 days ahead.';
        return;
    }

    loading.value = true;
    try {
        const speed = activities.find((a) => a.value === activity.value)?.speed ?? 5;
        const positions = hikeService.calculatePositions(props.hikeData.trackPoints, start, speed);
        const weather = await hikeService.fetchWeatherData(positions);
        emit('forecast-loaded', { positions, weather });
        saveSettings();
    } catch (e) {
        console.error('Forecast fetch failed:', e);
        error.value = e?.message || 'Could not fetch the forecast. Please try again.';
    } finally {
        loading.value = false;
    }
};

const saveSettings = () => {
    try {
        localStorage.setItem('forecastSettings', JSON.stringify({
            startTime: startTime.value,
            activity: activity.value,
        }));
    } catch { /* storage full or unavailable — not critical */ }
};

// Clicking a day in the week view jumps the start date there (keeps the hour)
watch(() => props.selectedDate, (date) => {
    if (!date) return;
    const currentHour = startTime.value.split('T')[1] || '09:00';
    startTime.value = `${date}T${currentHour}`;
});

onMounted(() => {
    try {
        const saved = JSON.parse(localStorage.getItem('forecastSettings') || 'null');
        if (saved?.activity && activities.some((a) => a.value === saved.activity)) {
            activity.value = saved.activity;
        }
        if (saved?.startTime && new Date(saved.startTime) > new Date()) {
            startTime.value = saved.startTime;
        }
    } catch { /* ignore corrupted settings */ }
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
