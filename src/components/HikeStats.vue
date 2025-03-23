<template>
    <div id="tab4" class="tab-content" :class="{ active }">
        <h2>Hike Stats</h2>
        <p>Max Temp: {{ hikeData.stats.maxTemp }}</p>
        <p>Min Temp: {{ hikeData.stats.minTemp }}</p>
        <p>Total Time: {{ hikeData.stats.totalTime }}</p>
        <p>Denivele: {{ hikeData.stats.denivele }}</p>
        <p>Accumulated Rain: {{ hikeData.stats.accumulatedRain }}</p>
        <p>Max Wind: {{ hikeData.stats.maxWind }}</p>
    </div>
</template>

<script setup>

// define props
const props = defineProps({
    hikeData: {
        type: Object,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    }
})


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