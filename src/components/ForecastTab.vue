<template>
    <div id="tab3" class=" tab-content p-2 pb-16" :class="{ active }">
        <!-- <div class="flex flex-row items-start justify-evenly">
            <input type="datetime-local" v-model="startTime" class="mb-4 p-2 border border-gray-300 rounded" />
            <button @click="loadHike"
                class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-700">Forecast</button>
        </div> -->

        <weather-chart v-for="chart in chartTypes" :key="chart.id" :chart-id="chart.id" :label="chart.label"
            :color="chart.color" :data="chartData(chart.id)" :labels="timeLabels" />
    </div>
</template>

<script>
import { computed } from 'vue';
import WeatherChart from '@/components/WeatherChart.vue';

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
    setup(props) {
        // Create time labels for x-axis
        const timeLabels = computed(() => {
            if (!props.hikeData.positions || props.hikeData.positions.length === 0) {
                return [];
            }

            return props.hikeData.positions.map((_, i) => `${i * 0.5}h`);
        });

        // Function to get appropriate data for each chart type
        const chartData = (chartId) => {
            if (!props.hikeData.weather || props.hikeData.weather.length === 0) {
                return [];
            }

            switch (chartId) {
                case 'weatherChartTemp':
                    return props.hikeData.weather.map(w => w.temp);
                case 'weatherChartWind':
                    return props.hikeData.weather.map(w => w.wind);
                case 'weatherChartRain':
                    return props.hikeData.weather.map(w => w.rain);
                case 'weatherChartSun':
                    return props.hikeData.weather.map(w => w.sun);
                case 'weatherChartElevation':
                    return props.hikeData.weather.map(w => w.elevation);
                default:
                    return [];
            }
        };

        return {
            timeLabels,
            chartData
        };
    }
};
</script>

<style scoped>
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