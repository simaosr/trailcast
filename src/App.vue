<template>
  <div class="app">
    <app-header />
    <div class="main-content flex flex-col md:flex-row">
      <upload-tab :active="activeTab === 'tab1' || isDesktop" :hike-data="hikeData" @hike-loaded="onHikeLoaded" />
      <forecast-week :active="activeTab === 'tab2' || isDesktop" :hike-data="hikeData" :selected-date="selectedDate"
        @day-selected="onDaySelected" />
      <forecast-tab :active="activeTab === 'tab3' || isDesktop" :hike-data="hikeData" :selected-date="selectedDate"
        @forecast-loaded="onForecastLoaded" />
      <!-- Mobile navigation - only shown on small screens -->
      <tab-navigation :is-desktop="isDesktop" :active-tab="activeTab" @tab-changed="setActiveTab" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import UploadTab from '@/components/UploadTab.vue';
import ForecastWeek from '@/components/ForecastWeek.vue';
import ForecastTab from '@/components/ForecastTab.vue';
import TabNavigation from '@/components/TabNavigation.vue';

// State
const activeTab = ref('tab1');
const isDesktop = ref(window.innerWidth > 600);
const selectedDate = ref('');

const hikeData = reactive({
  name: '',
  positions: [],
  weather: [],
  trackPoints: [],
});

// Methods
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const onForecastUpdated = ({ positions, weather }) => {
  hikeData.positions = positions;
  hikeData.weather = weather;
};

const onHikeLoaded = (data) => {
  hikeData.trackPoints = data.trackPoints;
  hikeData.name = data.name || '';
  hikeData.positions = [];
  hikeData.weather = [];
};

const onForecastLoaded = ({ positions, weather }) => {
  hikeData.positions = positions;
  hikeData.weather = weather;
};

const onDaySelected = (date) => {
  selectedDate.value = date;
  // On mobile, jump to the forecast tab so the choice is visible
  if (!isDesktop.value) activeTab.value = 'tab3';
};

const handleResize = () => {
  isDesktop.value = window.innerWidth > 600;
};

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('resize', handleResize);

  // Load saved hike if available
  try {
    const savedData = localStorage.getItem('hikeData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (Array.isArray(parsedData?.trackPoints) && parsedData.trackPoints.length > 1) {
        onHikeLoaded(parsedData);
      }
    }
  } catch (e) {
    console.error('Could not restore saved hike:', e);
    localStorage.removeItem('hikeData');
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f4f6f5;
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
