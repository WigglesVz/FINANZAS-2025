// src/js/charts.js
import Chart from 'chart.js/auto';
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

    // MODIFICADO: Pasar appData.statusList a getCurrentChartColors
    const currentColors = getCurrentChartColors(statusListFromState); 
    
    // console.log("Task Status Options for Chart:", taskStatusOptions);
    // console.log("Current Colors Object for Chart:", currentColors);
    // console.log("Status colors from currentColors:", currentColors.status);


    const backgroundColors = taskStatusOptions.map((statusName) => {
        const normalizedStatusForLookup = statusName.toLowerCase().replace(/\s+/g, '');
        // Intentar encontrar el color usando la clave normalizada en el objeto status de currentColors
        let color = currentColors.status[normalizedStatusForLookup];
        
        // Si no se encuentra, intentar un fallback a un color default dentro del objeto status
        if (!color) {
            // console.warn(`Color not found for status: ${statusName} (normalized: ${normalizedStatusForLookup}). Using default.`);
            color = currentColors.status.default || '#CCCCCC'; // Fallback si 'default' tampoco está
        }
        return color;
    });
    
    // console.log("Generated Background Colors for Chart:", backgroundColors);


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
    
    // No es necesario pasar statusList aquí si este gráfico no usa colores de estado dinámicos
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
    // No es necesario pasar statusList aquí
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
    // Se obtiene el estado aquí para pasarlo a las funciones de renderizado si lo necesitan
    // y para asegurar que getCurrentChartColors (llamado dentro de cada renderXChart) tenga acceso a statusList
    const appData = getAppState(); 

    switch (chartType) {
        case 'statusDistribution':
            renderStatusDistributionChart(); // Ya llama a getAppState internamente, y ahora pasará statusList a getCurrentChartColors
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