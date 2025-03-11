<template>
    <nav class="nav nav-pills nav-fill tabs" :style="{ display: isDesktop ? 'none' : 'flex' }">
        <a href="#tab1" class="nav-link tab-link" :class="{ active: activeTab === 'tab1' }"
            @click.prevent="$emit('tab-changed', 'tab1')">
            Upload Hike
        </a>
        <a href="#tab2" class="nav-link tab-link" :class="{ active: activeTab === 'tab2' }"
            @click.prevent="$emit('tab-changed', 'tab2')">
            Hike forecast
        </a>
    </nav>
</template>

<script>
export default {
    name: 'TabNavigation',
    props: {
        isDesktop: {
            type: Boolean,
            required: true
        },
        activeTab: {
            type: String,
            required: true
        }
    },
    emits: ['tab-changed']
}
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