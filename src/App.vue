<template>
  <div class="app">
    <app-header />
    <div class="main-content flex flex-col md:flex-row">
      <upload-tab :active="activeTab === 'tab1' || isDesktop" @hike-loaded="onHikeLoaded" />
      <the-hike-tab :active="activeTab === 'tab2' || isDesktop" :hike-data="hikeData" />
      <forecast-tab :active="activeTab === 'tab3' || isDesktop" :hike-data="hikeData" :chart-types="chartTypes" />
      <hike-stats :active="activeTab === 'tab4' || isDesktop" :hike-data="hikeData" />

      <!-- Mobile navigation - only shown on small screens -->
      <tab-navigation :is-desktop="isDesktop" :active-tab="activeTab" @tab-changed="setActiveTab" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import UploadTab from '@/components/UploadTab.vue';
import ForecastTab from '@/components/ForecastTab.vue';
import TabNavigation from '@/components/TabNavigation.vue';
import MapTab from '@/components/MapTab.vue';
import HikeStats from '@/components/HikeStats.vue';
import TheHikeTab from '@/components/TheHikeTab.vue';

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
  { id: 'weatherChartTemp', label: 'Temperature (°C)', color: '#ff0000' },
  { id: 'weatherChartWind', label: 'Wind (km/h)', color: '#0000ff' },
  { id: 'weatherChartRain', label: 'Rain (mm)', color: '#00ff00' },
  { id: 'weatherChartSun', label: 'Sun (W/m²)', color: '#ffff00' },
  { id: 'weatherChartElevation', label: 'Elevation (m)', color: '#ff00ff' }
];

// Methods
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const onHikeLoaded = (data) => {
  hikeData.positions = data.positions;
  hikeData.weather = data.weather;
  hikeData.trackPoints = data.trackPoints;
  hikeData.stats = data.stats;
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
  padding: 20px;
  overflow-y: auto;
  padding-top: 5rem;
  /* Adjust this value based on the height of your header */
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 50px;
    /* Space for mobile navigation */
  }
}
</style>