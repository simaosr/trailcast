<template>
  <div class="app">
    <app-header />
    <div id="main-container" class="container-md">
      <upload-map-tab :active="activeTab === 'tab1' || isDesktop" @hike-loaded="onHikeLoaded" />
      <forecast-tab :active="activeTab === 'tab2' || isDesktop" :hike-data="hikeData" :chart-types="chartTypes" />

      <!-- Mobile navigation - only shown on small screens -->
      <tab-navigation :is-desktop="isDesktop" :active-tab="activeTab" @tab-changed="setActiveTab" />

    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import UploadMapTab from '@/components/UploadMapTab.vue';
import ForecastTab from '@/components/ForecastTab.vue';
import TabNavigation from '@/components/TabNavigation.vue';

export default {
  name: 'App',
  components: {
    AppHeader,
    UploadMapTab,
    ForecastTab,
    TabNavigation
  },
  setup() {
    const activeTab = ref('tab1');
    const isDesktop = ref(window.innerWidth > 600);

    const hikeData = reactive({
      positions: [],
      weather: [],
      trackPoints: []
    });

    const chartTypes = [
      { id: 'weatherChartTemp', label: 'Temperature (°C)', color: '#ff0000' },
      { id: 'weatherChartWind', label: 'Wind (km/h)', color: '#0000ff' },
      { id: 'weatherChartRain', label: 'Rain (mm)', color: '#00ff00' },
      { id: 'weatherChartSun', label: 'Sun (W/m²)', color: '#ffff00' },
      { id: 'weatherChartElevation', label: 'Elevation (m)', color: '#ff00ff' }
    ];

    const setActiveTab = (tab) => {
      activeTab.value = tab;
    };

    const onHikeLoaded = (data) => {
      hikeData.positions = data.positions;
      hikeData.weather = data.weather;
      hikeData.trackPoints = data.trackPoints;
    };

    // Check screen size and add resize listener
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

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    return {
      activeTab,
      isDesktop,
      hikeData,
      chartTypes,
      setActiveTab,
      onHikeLoaded
    };
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#main-container {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  #main-container {
    width: 100%;
    height: calc(100vh - 50px);
    padding-bottom: 50px;
  }
}

@media (min-width: 601px) {
  #main-container {
    flex-direction: row;
    width: 1600px;
    height: 100vh;
    padding: 10px;
    margin: 0 auto;
  }
}
</style>