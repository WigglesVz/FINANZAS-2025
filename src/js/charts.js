// src/js/charts.js
import Chart from 'chart.js/auto';
// La importación ya es correcta según tu domElements.js corregido:
import { overviewChartCanvas, chartNoDataEl, chartTitleEl, chartTypeSelect } from './domElements.js';
import { getAppState } from './state.js';
import { getCurrentChartColors } from './utils.js';

let currentChartInstance = null;

const CHART_TITLES = {
    statusDistribution: "Distribución de Estados de Tarea",
    tasksPerProject: "Número de Tareas por Proyecto",
    projectCostsComparison: "Comparativa de Costos (Presupuesto vs Actual)"
};

const destroyCurrentChart = () => {
    if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
    }
};

const showNoDataMessage = (show = true) => {
    if (chartNoDataEl) { // Usar chartNoDataEl como se importa
        chartNoDataEl.classList.toggle('hidden', !show);
    }
    if (overviewChartCanvas) {
        overviewChartCanvas.classList.toggle('hidden', show);
    }
};

const updateChartTitle = (chartType) => {
    if (chartTitleEl && CHART_TITLES[chartType]) { // chartTitleEl se importa correctamente
        chartTitleEl.textContent = CHART_TITLES[chartType];
    }
};

const renderStatusDistributionChart = () => {
    destroyCurrentChart();
    updateChartTitle('statusDistribution');
    const appData = getAppState();
    const tasks = Array.isArray(appData.projectDetails) ? appData.projectDetails : [];
    const taskStatusOptions = Array.isArray(appData.statusList) ? appData.statusList.map(s => s.name) : [];

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

    const currentColors = getCurrentChartColors();
    const statusColorKeys = Object.keys(currentColors.status);
    const backgroundColors = taskStatusOptions.map((status, index) => {
        const normalizedStatusForLookup = status.toLowerCase().replace(/\s+/g, '');
        const matchingColorKey = Object.keys(currentColors.status).find(key =>
            key.toLowerCase().replace(/\s+/g, '') === normalizedStatusForLookup
        );
        return currentColors.status[matchingColorKey] ||
               currentColors.status[statusColorKeys[index % statusColorKeys.length]] ||
               currentColors.status.default;
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
    currentChartInstance = new Chart(overviewChartCanvas, {
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
                    callbacks: { label: (c) => `${c.label || ''}: ${c.parsed || 0} (${tasks.length > 0 ? ((c.parsed / tasks.length) * 100).toFixed(1) + '%' : '0%'})`},
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
    currentChartInstance = new Chart(overviewChartCanvas, {
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
    currentChartInstance = new Chart(overviewChartCanvas, {
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

export const renderSelectedChart = (chartType = 'statusDistribution') => {
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
    if (chartTypeSelect && chartTypeSelect.value) {
        renderSelectedChart(chartTypeSelect.value);
    } else {
        renderSelectedChart(); 
    }
};