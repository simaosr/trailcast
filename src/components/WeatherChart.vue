<template>
<div class="">
        <canvas :id="chartId" ref="chartCanvas"></canvas>
    </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
    name: 'WeatherChart',
    props: {
        chartId: {
            type: String,
            required: true
        },
        label: {
            type: String,
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
    },
    setup(props) {
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
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { size: 14 },
                            bodyFont: { size: 12 },
                            padding: 10,
                        },
                        legend: {
                            display: false,
                            position: 'top',
                            labels: {
                                color: '#333',
                                font: { size: 12 },
                            },
                        },
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Time into hike (hours)',
                                color: '#666',
                                font: { size: 12 },
                            },
                            grid: {
                                color: '#eee',
                                borderColor: '#eee',
                            },
                            ticks: {
                                color: '#666',
                                font: { size: 10 },
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: props.label,
                                color: '#666',
                                font: { size: 12 },
                            },
                            grid: {
                                color: '#eee',
                                borderColor: '#eee',
                            },
                            ticks: {
                                color: '#666',
                                font: { size: 10 },
                            },
                            beginAtZero: true,
                        },
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
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

        return {
            chartCanvas
        };
    }
};
</script>

<style scoped>
</style>