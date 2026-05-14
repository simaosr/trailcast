<template>
  <div class="app">
    <app-header />
    <div class="main-content flex flex-col md:flex-row">
      <upload-tab :active="activeTab === 'tab1' || isDesktop" @hike-loaded="onHikeLoaded" />
      <forecast-week :active="activeTab === 'tab2' || isDesktop" :hike-data="hikeData" />
      <forecast-tab :active="activeTab === 'tab3' || isDesktop" :hike-data="hikeData" :chart-types="chartTypes" />
      <!-- Mobile navigation - only shown on small screens -->
      <tab-navigation :is-desktop="isDesktop" :active-tab="activeTab" @tab-changed="setActiveTab" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import UploadTab from '@/components/UploadTab.vue';
import ForecastWeek from '@/components/ForecastWeek.vue';
import ForecastTab from '@/components/ForecastTab.vue';
import TabNavigation from '@/components/TabNavigation.vue';

// State
const activeTab = ref('tab1');
const isDesktop = ref(window.innerWidth > 600);

const hikeData = reactive({
  positions: [],
  weather: [],
  trackPoints: [],
  stats: {
    maxTemp: null,
    minTemp: null,
    totalTime: null,
    denivele: null,
    accumulatedRain: null,
    maxWind: null
  }
});

const chartTypes = [
  { id: 'weatherChartTemp', label: ['Temperature (°C)'], color: '#ef4444' },
  { id: 'weatherChartRainProb', label: ['Rain Probability (%)'], color: '#3b82f6' },
  { id: 'weatherChartRain', label: ['Precipitation (mm)'], color: '#60a5fa' },
  { id: 'weatherChartWind', label: ['Wind (km/h)'], color: '#10b981' },
  { id: 'weatherChartSun', label: ['UV Index'], color: '#f59e0b' },
  { id: 'weatherChartElevation', label: ['Elevation (m)'], color: '#8b5cf6' }
];

// Methods
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const onHikeLoaded = (data) => {
  hikeData.trackPoints = data.trackPoints;
  hikeData.stats = data.stats;
  hikeData.positions = [];
  hikeData.weather = [];
};

// Lifecycle hooks
onMounted(() => {
  const handleResize = () => {
    isDesktop.value = window.innerWidth > 600;
  };

  window.addEventListener('resize', handleResize);

  // Load saved data if available
  const savedData = localStorage.getItem('hikeData');
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    onHikeLoaded(parsedData);
  }

  // Cleanup event listener when component is unmounted
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  padding-top: 5rem;
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 50px;
    /* Space for mobile navigation */
  }
}
</style>