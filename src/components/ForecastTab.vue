<template>
    <div id="tab3" class=" tab-content p-2 pb-16" :class="{ active }">
        <div class="flex items-center gap-2 mb-4">
            <input type="datetime-local" v-model="startTime"
                class="flex-1 min-w-0 text-sm p-1.5 border border-gray-300 rounded" />
            <div class="flex border border-gray-300 rounded overflow-hidden shrink-0">
                <button v-for="act in activities" :key="act.value" @click="activity = act.value"
                    :class="activity === act.value ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                    class="px-2.5 py-1.5 text-base transition-colors" :title="act.label">
                    {{ act.icon }}
                </button>
            </div>
            <button @click="fetchForecast" :disabled="!isStale"
                :class="isStale ? 'bg-emerald-500 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-400 cursor-default'"
                class="shrink-0 p-1.5 rounded transition-colors"
                title="Fetch Forecast">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </button>
        </div>

        <div v-if="hikeData.weather && hikeData.weather.length > 0">
            <weather-chart v-for="chart in chartTypes" :key="chart.id" :chart-id="chart.id" :label="chart.label"
                :color="chart.color" :data="chartDataMap[chart.id] ?? []" :labels="timeLabels"
                :data2="chart.id === 'weatherChartWind' ? chartDataMap.weatherChartGust : null"
                :color2="chart.id === 'weatherChartWind' ? '#fb923c' : null"
                :label2="chart.id === 'weatherChartWind' ? 'Gusts (km/h)' : null" />
        </div>
        <div v-else class="text-gray-500">No forecast data available. Please select a start date/time and fetch forecast.</div>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import WeatherChart from '@/components/WeatherChart.vue';
import HikeService from '@/services/HikeService';

export default {
    name: 'ForecastTab',
    components: {
        WeatherChart
    },
    props: {
        active: {
            type: Boolean,
            default: false
        },
        hikeData: {
            type: Object,
            required: true
        },
        chartTypes: {
            type: Array,
            required: true
        }
    },
    emits: ['forecast-updated'],
    setup(props, { emit }) {
        const startTime = ref(new Date().toISOString().slice(0, 16));
        const activity = ref('hiking');
        const hikeService = new HikeService();

        const activities = [
            { value: 'hiking',        icon: '🥾', label: 'Hiking (5 km/h)',        speed: 5  },
            { value: 'trail_running', icon: '🏃', label: 'Trail Running (9 km/h)', speed: 9  },
            { value: 'cycling',       icon: '🚴', label: 'Cycling (18 km/h)',       speed: 18 },
        ];

        // Tracks what settings produced the currently displayed charts
        const committedTime = ref(null);
        const committedActivity = ref(null);

        // Green when inputs differ from last fetch (or nothing fetched yet)
        const isStale = computed(() =>
            startTime.value !== committedTime.value || activity.value !== committedActivity.value
        );

        // Time labels — only recomputes when positions actually change
        const timeLabels = computed(() => {
            if (!props.hikeData.positions || props.hikeData.positions.length === 0) return [];
            return props.hikeData.positions.map((pos) => {
                const d = new Date(pos.time);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
        });

        // Chart data as a stable computed map — avoids spurious WeatherChart re-renders
        const chartDataMap = computed(() => {
            const w = props.hikeData.weather;
            if (!w || w.length === 0) return {};
            return {
                weatherChartTemp:      w.map(x => x.temp),
                weatherChartWind:      w.map(x => x.wind),
                weatherChartGust:      w.map(x => x.gust),
                weatherChartRainProb:  w.map(x => x.rainProbability),
                weatherChartRain:      w.map(x => x.rain),
                weatherChartSun:       w.map(x => x.sun),
                weatherChartElevation: w.map(x => x.elevation),
            };
        });

        // Fetch forecast for the hike
        const fetchForecast = async () => {
            if (!props.hikeData.trackPoints || props.hikeData.trackPoints.length === 0) {
                alert('No hike loaded.');
                return;
            }
            const speed = activities.find(a => a.value === activity.value)?.speed ?? 5;
            const positions = hikeService.calculatePositions(props.hikeData.trackPoints, new Date(startTime.value), speed);
            const weather = await hikeService.fetchWeatherData(positions);
            emit('forecast-updated', { positions, weather });
            // Mark these settings as committed so button goes gray
            committedTime.value = startTime.value;
            committedActivity.value = activity.value;
        };

        return {
            startTime,
            activity,
            activities,
            isStale,
            timeLabels,
            chartDataMap,
            fetchForecast
        };
    }
};
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