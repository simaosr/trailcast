<template>
    <div class="chart-wrapper">
        <p class="chart-title">{{ title }}</p>
        <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
    title: { type: String, required: true },
    /**
     * Array of dataset configs:
     * { label, data, color, type ('line'|'bar'), dashed, fill, yAxisID ('y'|'y1'), unit }
     */
    datasets: { type: Array, required: true },
    labels: { type: Array, required: true },
    /** Extra info per point shown in the tooltip footer (e.g. distance) */
    footers: { type: Array, default: () => [] },
    beginAtZero: { type: Boolean, default: true },
});

const chartCanvas = ref(null);
let chart = null;
let lastPayload = '';

// Parent re-renders recreate the inline dataset arrays; skip updates when nothing changed
const payloadKey = () =>
    JSON.stringify([props.labels, props.datasets.map((ds) => [ds.label, ds.data])]);

const createGradient = (ctx, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
};

const buildDatasets = (ctx) =>
    props.datasets.map((ds) => ({
        type: ds.type || 'line',
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.type === 'bar' ? `${ds.color}99` : ds.fill ? createGradient(ctx, ds.color) : 'transparent',
        borderWidth: 2,
        borderDash: ds.dashed ? [5, 4] : [],
        pointRadius: ds.type === 'bar' ? 0 : 2,
        pointBackgroundColor: ds.color,
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        fill: !!ds.fill,
        tension: 0.35,
        yAxisID: ds.yAxisID || 'y',
        borderRadius: ds.type === 'bar' ? 3 : 0,
        unit: ds.unit || '',
    }));

const hasSecondAxis = () => props.datasets.some((ds) => ds.yAxisID === 'y1');

const buildOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.92)',
            titleColor: '#f9fafb',
            bodyColor: '#d1d5db',
            footerColor: '#9ca3af',
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            footerFont: { size: 11, weight: 'normal' },
            padding: 10,
            cornerRadius: 8,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
                label: (item) => {
                    const unit = item.dataset.unit ? ` ${item.dataset.unit}` : '';
                    const val = typeof item.parsed.y === 'number' ? Math.round(item.parsed.y * 10) / 10 : item.parsed.y;
                    return `${item.dataset.label}: ${val}${unit}`;
                },
                footer: (items) => {
                    const idx = items[0]?.dataIndex;
                    return idx !== undefined && props.footers[idx] ? props.footers[idx] : '';
                },
            },
        },
        legend: {
            display: props.datasets.length > 1,
            labels: {
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 11 },
                color: '#6b7280',
            },
        },
    },
    scales: {
        x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            border: { display: false },
        },
        y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { color: '#9ca3af', font: { size: 10 } },
            border: { display: false },
            beginAtZero: props.beginAtZero,
        },
        ...(hasSecondAxis()
            ? {
                  y1: {
                      position: 'right',
                      grid: { display: false },
                      ticks: { color: '#9ca3af', font: { size: 10 } },
                      border: { display: false },
                      beginAtZero: true,
                  },
              }
            : {}),
    },
    animation: { duration: 500, easing: 'easeOutQuart' },
});

const renderChart = () => {
    if (!chartCanvas.value) return;
    const key = payloadKey();
    if (chart && key === lastPayload) return;
    lastPayload = key;
    const ctx = chartCanvas.value.getContext('2d');

    if (chart) {
        // Update in place to avoid flicker
        chart.data.labels = props.labels;
        chart.data.datasets = buildDatasets(ctx);
        chart.options = buildOptions();
        chart.update();
        return;
    }

    chart = new Chart(ctx, {
        data: { labels: props.labels, datasets: buildDatasets(ctx) },
        options: buildOptions(),
    });
};

watch(
    () => [props.datasets, props.labels],
    () => {
        if (props.labels.length > 0) renderChart();
    },
    { deep: true }
);

onMounted(() => {
    if (props.labels.length > 0) renderChart();
});

onUnmounted(() => {
    if (chart) {
        chart.destroy();
        chart = null;
    }
});
</script>

<style scoped>
.chart-wrapper {
    margin-bottom: 1rem;
    background: #fff;
    border-radius: 12px;
    padding: 1rem 1rem 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.chart-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.25rem 0;
}

.chart-container {
    position: relative;
    height: 180px;
}
</style>
