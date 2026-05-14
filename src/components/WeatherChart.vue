<template>
    <div class="chart-wrapper">
        <p class="chart-title">{{ Array.isArray(label) ? label[0] : label }}</p>
        <div class="chart-container">
            <canvas :id="chartId" ref="chartCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
    chartId: {
        type: String,
        required: true
    },
    label: {
        type: Array,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    data: {
        type: Array,
        required: true
    },
    labels: {
        type: Array,
        required: true
    }
});


const chartCanvas = ref(null);
let chart = null;

// Create gradient fill for the chart
const createGradient = (ctx, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${color}33`); // Semi-transparent color
    gradient.addColorStop(1, `${color}00`); // Fully transparent
    return gradient;
};

// Initialize or update chart
const renderChart = () => {
    const canvas = document.getElementById(props.chartId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }

    // Create new chart instance
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: props.labels,
            datasets: [
                {
                    label: props.label,
                    data: props.data,
                    borderColor: props.color,
                    backgroundColor: createGradient(ctx, props.color),
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: props.color,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 8,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                },
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.04)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 10 },
                        maxRotation: 0,
                    },
                    border: { display: false },
                },
                y: {
                    grid: {
                        color: 'rgba(0,0,0,0.04)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 10 },
                    },
                    border: { display: false },
                    beginAtZero: true,
                },
            },
            animation: {
                duration: 600,
                easing: 'easeOutQuart',
            },
        },
    });
};

// Watch for changes in data and labels to update chart
watch(() => [props.data, props.labels], () => {
    if (props.data.length > 0 && props.labels.length > 0) {
        renderChart();
    }
}, { deep: true });

// Initialize chart on component mount
onMounted(() => {
    if (props.data.length > 0 && props.labels.length > 0) {
        renderChart();
    }
});

// Clean up chart when component is unmounted
onUnmounted(() => {
    if (chart) {
        chart.destroy();
    }
});

</script>

<style scoped>
.chart-wrapper {
    margin-bottom: 2rem;
    background: #fff;
    border-radius: 12px;
    padding: 1rem 1rem 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.chart-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
}

.chart-container {
    position: relative;
    height: 160px;
}
</style>