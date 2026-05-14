<template>
    <div :style="{ display: isDesktop ? 'none' : 'flex' }"
        class="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div class="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
            <button type="button" @click.prevent="$emit('tab-changed', 'tab1')"
                class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                :class="activeTab === 'tab1' ? 'text-emerald-600' : ''">
                <svg class="w-5 h-5 mb-1" :class="activeTab === 'tab1' ? 'text-emerald-600' : 'text-gray-400'"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <span class="text-xs font-medium"
                    :class="activeTab === 'tab1' ? 'text-emerald-600' : 'text-gray-500 group-hover:text-blue-600'">Hike</span>
            </button>
            <button type="button" @click.prevent="$emit('tab-changed', 'tab2')"
                class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                :class="activeTab === 'tab2' ? 'text-emerald-600' : ''">
                <svg class="w-5 h-5 mb-1" :class="activeTab === 'tab2' ? 'text-emerald-600' : 'text-gray-400'"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-4.9-6H7a4 4 0 0 0-4 4Z M8 6l4-4 4 4M12 2v10" />
                </svg>
                <span class="text-xs font-medium"
                    :class="activeTab === 'tab2' ? 'text-emerald-600' : 'text-gray-500 group-hover:text-blue-600'">Week</span>
            </button>
            <button type="button" @click.prevent="$emit('tab-changed', 'tab3')"
                class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                :class="activeTab === 'tab3' ? 'text-emerald-600' : ''">
                <svg class="w-5 h-5 mb-1" :class="activeTab === 'tab3' ? 'text-emerald-600' : 'text-gray-400'"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
                <span class="text-xs font-medium"
                    :class="activeTab === 'tab3' ? 'text-emerald-600' : 'text-gray-500 group-hover:text-blue-600'">Forecast</span>
            </button>
        </div>
    </div>


    <!-- <nav class="navbar nav tabs" :style="{ display: isDesktop ? 'none' : 'flex' }">
        <a href="#tab1" class="" :class="{ active: activeTab === 'tab1' }"
            @click.prevent="$emit('tab-changed', 'tab1')">
            Upload Hike
        </a>
        <a href="#tab2" class="nav-link tab-link" :class="{ active: activeTab === 'tab2' }"
            @click.prevent="$emit('tab-changed', 'tab2')">
            Map
        </a>
        <a href="#tab3" class="nav-link tab-link" :class="{ active: activeTab === 'tab3' }"
            @click.prevent="$emit('tab-changed', 'tab3')">
            Forecast
        </a>
        <a href="#tab4" class="nav-link tab-link" :class="{ active: activeTab === 'tab4' }"
            @click.prevent="$emit('tab-changed', 'tab4')">
            Hike Stats
        </a>
    </nav> -->
</template>


<script setup>

defineProps({
    isDesktop: {
        type: Boolean,
        required: true
    },
    activeTab: {
        type: String,
        required: true
    }
});
defineEmits(['tab-changed']);
</script>

<style scoped>
.nav.tabs {
    display: flex;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ccc;
}

.nav.tabs a {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    text-decoration: none;
    color: #333;
    border-bottom: 2px solid transparent;
}

.nav.tabs a.active {
    border-bottom-color: blue;
    font-weight: bold;
}

@media (max-width: 600px) {
    .nav.tabs {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
    }
}
</style>
