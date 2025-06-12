// src/js/charts.js
import Chart from 'chart.js/auto';
// --- INICIO MODIFICACIÓN ---
import { 
    overviewChartCanvas, chartNoDataEl, chartTitleEl, chartTypeSelect,
    cryptoOverviewChartCanvas, cryptoChartNoData
} from './domElements.js';
import { getAppState, getFuturesTradesStats } from './state.js';
// --- FIN MODIFICACIÓN ---
import { getCurrentChartColors } from './utils.js';

let projectChartInstance = null;
// --- INICIO MODIFICACIÓN ---
let cryptoChartInstance = null;

const CHART_TITLES = {
    statusDistribution: "Distribución de Estados de Tarea",
    tasksPerProject: "Número de Tareas por Proyecto",
    projectCostsComparison: "Comparativa de Costos (Presupuesto vs Actual)",
    cryptoPerformance: "Rendimiento Acumulado (PnL)" // Título para el nuevo gráfico
};

const destroyCurrentChart = () => {
    if (projectChartInstance) {
        projectChartInstance.destroy();
        projectChartInstance = null;
    }
    if (cryptoChartInstance) {
        cryptoChartInstance.destroy();
        cryptoChartInstance = null;
    }
};
// --- FIN MODIFICACIÓN ---

const showNoDataMessage = (show = true) => {
    if (chartNoDataEl) {
        chartNoDataEl.classList.toggle('hidden', !show);
    }
    if (overviewChartCanvas) {
        overviewChartCanvas.classList.toggle('hidden', show);
    }
};

const updateChartTitle = (chartType) => {
    if (chartTitleEl && CHART_TITLES[chartType]) {
        chartTitleEl.textContent = CHART_TITLES[chartType];
    }
};

const renderStatusDistributionChart = () => {
    destroyCurrentChart();
    updateChartTitle('statusDistribution');
    const appData = getAppState();
    const tasks = Array.isArray(appData.projectDetails) ? appData.projectDetails : [];
    const statusListFromState = Array.isArray(appData.statusList) ? appData.statusList : [];
    const taskStatusOptions = statusListFromState.map(s => s.name);


    if (!tasks || tasks.length === 0 || !taskStatusOptions || taskStatusOptions.length === 0) {
        showNoDataMessage(true);
        return;
    }
    showNoDataMessage(false);

    const statusCounts = taskStatusOptions.reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {});

    tasks.forEach(task => {
        if (statusCounts.hasOwnProperty(task.status)) {
            statusCounts[task.status]++;
        }
    });

    const currentColors = getCurrentChartColors(statusListFromState); 
    
    const backgroundColors = taskStatusOptions.map((statusName) => {
        const normalizedStatusForLookup = statusName.toLowerCase().replace(/\s+/g, '');
        let color = currentColors.status[normalizedStatusForLookup];
        if (!color) {
            color = currentColors.status.default || '#CCCCCC';
        }
        return color;
    });
    
    const chartData = {
        labels: taskStatusOptions,
        datasets: [{
            label: 'Distribución de Estados',
            data: taskStatusOptions.map(status => statusCounts[status] || 0),
            backgroundColor: backgroundColors,
            borderColor: currentColors.border,
            borderWidth: 2
        }]
    };

    if (!overviewChartCanvas) {
        console.error("Canvas element 'overviewChartCanvas' not found for StatusDistributionChart.");
        return;
    }
    projectChartInstance = new Chart(overviewChartCanvas, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: currentColors.text, padding: 15, font: { family: 'Inter, sans-serif'} }
                },
                tooltip: {
                    callbacks: { label: (c) => {
                        const totalTasksInChart = c.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return `${c.label || ''}: ${c.parsed || 0} (${totalTasksInChart > 0 ? ((c.parsed / totalTasksInChart) * 100).toFixed(1) + '%' : '0%'})`;
                    }},
                    bodyFont: { family: 'Inter, sans-serif' }, titleFont: { family: 'Inter, sans-serif' },
                    backgroundColor: currentColors.border === '#ffffff' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.95)', 
                    borderColor: currentColors.grid,
                    borderWidth: 1, titleColor: currentColors.text, bodyColor: currentColors.text
                }
            },
            cutout: '60%'
        }
    });
};

const renderTasksPerProjectChart = () => {
    destroyCurrentChart();
    updateChartTitle('tasksPerProject');
    const appData = getAppState();
    const tasks = Array.isArray(appData.projectDetails) ? appData.projectDetails : [];
    const projectNames = Array.isArray(appData.projectNameList) ? appData.projectNameList.map(p => p.name) : [];

    if (!projectNames || projectNames.length === 0) {
        showNoDataMessage(true);
        return;
    }
    showNoDataMessage(false);

    const projectTaskCounts = projectNames.reduce((acc, name) => {
        acc[name] = 0;
        return acc;
    }, {});
    tasks.forEach(task => {
        if (projectTaskCounts.hasOwnProperty(task.projectName)) {
            projectTaskCounts[task.projectName]++;
        }
    });
    
    const currentColors = getCurrentChartColors(); 
    const chartData = {
        labels: projectNames,
        datasets: [{
            label: 'Tareas por Proyecto',
            data: projectNames.map(name => projectTaskCounts[name] || 0),
            backgroundColor: currentColors.projectTasks,
            borderColor: currentColors.projectTasks,
            borderWidth: 1
        }]
    };

    if (!overviewChartCanvas) {
        console.error("Canvas element 'overviewChartCanvas' not found for TasksPerProjectChart.");
        return;
    }
    projectChartInstance = new Chart(overviewChartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: currentColors.text, stepSize: 1 },
                    grid: { color: currentColors.grid }
                },
                x: {
                    ticks: { color: currentColors.text, font: { family: 'Inter, sans-serif'} },
                    grid: { display: false }
                }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    bodyFont: { family: 'Inter, sans-serif' }, titleFont: { family: 'Inter, sans-serif' },
                    backgroundColor: currentColors.border === '#ffffff' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.95)',
                    borderColor: currentColors.grid,
                    borderWidth: 1, titleColor: currentColors.text, bodyColor: currentColors.text
                }
            }
        }
    });
};

const renderProjectCostsComparisonChart = () => {
    destroyCurrentChart();
    updateChartTitle('projectCostsComparison');
    const appData = getAppState();
    const projectCosts = Array.isArray(appData.projectCosts) ? appData.projectCosts : [];

    if (!projectCosts || projectCosts.length === 0) {
        showNoDataMessage(true);
        return;
    }
    showNoDataMessage(false);

    const labels = projectCosts.map(pc => pc.projectName);
    const budgetData = projectCosts.map(pc => pc.budget);
    const actualCostData = projectCosts.map(pc => pc.actualCost);
    const currentColors = getCurrentChartColors(); 

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Presupuesto',
                data: budgetData,
                backgroundColor: currentColors.budget,
                borderColor: currentColors.budget,
                borderWidth: 1
            },
            {
                label: 'Costo Actual',
                data: actualCostData,
                backgroundColor: currentColors.actualCost,
                borderColor: currentColors.actualCost,
                borderWidth: 1
            }
        ]
    };

    if (!overviewChartCanvas) {
        console.error("Canvas element 'overviewChartCanvas' not found for ProjectCostsComparisonChart.");
        return;
    }
    projectChartInstance = new Chart(overviewChartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: currentColors.text, font: { family: 'Inter, sans-serif'} },
                    grid: { color: currentColors.grid }
                },
                x: {
                    ticks: { color: currentColors.text, font: { family: 'Inter, sans-serif'} },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: currentColors.text, font: { family: 'Inter, sans-serif'} }
                },
                 tooltip: {
                    bodyFont: { family: 'Inter, sans-serif' }, titleFont: { family: 'Inter, sans-serif' },
                    backgroundColor: currentColors.border === '#ffffff' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.95)',
                    borderColor: currentColors.grid,
                    borderWidth: 1, titleColor: currentColors.text, bodyColor: currentColors.text
                }
            }
        }
    });
};

// --- INICIO MODIFICACIÓN ---
const renderCryptoPerformanceChart = () => {
    destroyCurrentChart();
    
    if (!cryptoOverviewChartCanvas) return;

    const stats = getFuturesTradesStats();
    if (stats.pnlHistory.length < 2) {
        if (cryptoChartNoData) cryptoChartNoData.classList.remove('hidden');
        cryptoOverviewChartCanvas.classList.add('hidden');
        return;
    }
    
    if (cryptoChartNoData) cryptoChartNoData.classList.add('hidden');
    cryptoOverviewChartCanvas.classList.remove('hidden');

    const labels = stats.pnlHistory.map(p => new Date(p.date).toLocaleDateString('es-ES'));
    const data = stats.pnlHistory.map(p => p.pnl);

    const currentColors = getCurrentChartColors();
    const finalPnl = data[data.length - 1];
    const chartLineColor = finalPnl >= 0 ? currentColors.profit : currentColors.loss;
    
    const ctx = cryptoOverviewChartCanvas.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, cryptoOverviewChartCanvas.height);
    gradient.addColorStop(0, `${chartLineColor}80`); // Opacidad ~0.5
    gradient.addColorStop(1, `${chartLineColor}00`); // Opacidad 0

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'PnL Acumulado',
            data: data,
            borderColor: chartLineColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.1,
            pointBackgroundColor: chartLineColor,
            pointRadius: 3,
        }]
    };

    cryptoChartInstance = new Chart(cryptoOverviewChartCanvas, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: { color: currentColors.text },
                    grid: { color: currentColors.grid }
                },
                x: {
                    ticks: { color: currentColors.text },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            }
        }
    });
}

export const renderSelectedChart = (chartType = 'statusDistribution') => {
    destroyCurrentChart();
    const appData = getAppState(); 

    if (appData.activeUserMode === 'crypto') {
        renderCryptoPerformanceChart();
        return;
    }
    
    if (!overviewChartCanvas) {
        console.warn("Canvas para 'overview-chart' no encontrado.");
        showNoDataMessage(true);
        return;
    }

    switch (chartType) {
        case 'statusDistribution':
            renderStatusDistributionChart();
            break;
        case 'tasksPerProject':
            renderTasksPerProjectChart();
            break;
        case 'projectCostsComparison':
            renderProjectCostsComparisonChart();
            break;
        default:
            console.warn(`Tipo de gráfico desconocido: ${chartType}`);
            renderStatusDistributionChart();
    }
};

export const refreshCurrentChart = () => {
    const appData = getAppState();
    if (appData.activeUserMode === 'crypto') {
        renderSelectedChart();
    } else {
        if (chartTypeSelect && chartTypeSelect.value) {
            renderSelectedChart(chartTypeSelect.value);
        } else {
            renderSelectedChart(); 
        }
    }
};
// --- FIN MODIFICACIÓN ---