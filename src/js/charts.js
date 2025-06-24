// src/js/charts.js
import Chart from 'chart.js/auto';
import { getDomElements } from './domElements.js'; // Importar la función getter
import { getAppState, getFuturesTradesStats } from './state.js';
import { getCurrentChartColors } from './utils.js'; // Ya usa getDomElements internamente

let projectChartInstance = null;
let cryptoChartInstance = null;

const CHART_TITLES = {
    statusDistribution: "Distribución de Estados de Tarea",
    tasksPerProject: "Número de Tareas por Proyecto",
    projectCostsComparison: "Comparativa de Costos (Presupuesto vs Actual)",
    cryptoPerformance: "Rendimiento Acumulado (PnL)"
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

const showNoDataMessage = (show = true, isCryptoChart = false) => {
    const dom = getDomElements();
    const noDataEl = isCryptoChart ? dom.cryptoChartNoData : dom.chartNoDataEl;
    const canvasEl = isCryptoChart ? dom.cryptoOverviewChartCanvas : dom.overviewChartCanvas;

    if (noDataEl) {
        noDataEl.classList.toggle('hidden', !show);
    }
    if (canvasEl) {
        canvasEl.classList.toggle('hidden', show);
    }
};

const updateChartTitle = (chartType) => {
    const dom = getDomElements();
    // Solo actualiza el título si es un gráfico de proyectos, ya que el de cripto tiene su propio título en el HTML.
    if (dom.chartTitleEl && CHART_TITLES[chartType] && chartType !== 'cryptoPerformance') {
        dom.chartTitleEl.textContent = CHART_TITLES[chartType];
    }
};

const renderStatusDistributionChart = () => {
    const dom = getDomElements();
    destroyCurrentChart(); // Asegura que solo un gráfico esté activo
    updateChartTitle('statusDistribution');

    const appData = getAppState();
    const tasks = Array.isArray(appData.projectDetails) ? appData.projectDetails : [];
    const statusListFromState = Array.isArray(appData.statusList) ? appData.statusList : [];
    
    if (!tasks.length || !statusListFromState.length) {
        showNoDataMessage(true, false); return;
    }
    showNoDataMessage(false, false);

    const statusCounts = statusListFromState.reduce((acc, status) => {
        acc[status.name] = 0;
        return acc;
    }, {});
    tasks.forEach(task => {
        if (statusCounts.hasOwnProperty(task.status)) statusCounts[task.status]++;
    });

    const currentColors = getCurrentChartColors(statusListFromState);
    const backgroundColors = statusListFromState.map(status =>
        currentColors.status[status.name.toLowerCase().replace(/\s+/g, '')] || currentColors.status.default
    );

    if (!dom.overviewChartCanvas) { console.error("Canvas 'overviewChartCanvas' no encontrado."); return; }
    projectChartInstance = new Chart(dom.overviewChartCanvas, {
        type: 'doughnut',
        data: {
            labels: statusListFromState.map(s => s.name),
            datasets: [{
                label: 'Distribución de Estados',
                data: statusListFromState.map(s => statusCounts[s.name] || 0),
                backgroundColor: backgroundColors,
                borderColor: currentColors.border,
                borderWidth: 2
            }]
        },
        options: { /* ... opciones ... */ } // Opciones de Chart.js como las tenías
    });
};

const renderTasksPerProjectChart = () => {
    const dom = getDomElements();
    destroyCurrentChart();
    updateChartTitle('tasksPerProject');
    const appData = getAppState();
    const tasks = Array.isArray(appData.projectDetails) ? appData.projectDetails : [];
    const projectNames = Array.isArray(appData.projectNameList) ? appData.projectNameList.map(p => p.name) : [];

    if (!projectNames.length) { showNoDataMessage(true, false); return; }
    showNoDataMessage(false, false);

    const projectTaskCounts = projectNames.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    tasks.forEach(task => {
        if (projectTaskCounts.hasOwnProperty(task.projectName)) projectTaskCounts[task.projectName]++;
    });

    const currentColors = getCurrentChartColors();
    if (!dom.overviewChartCanvas) { console.error("Canvas 'overviewChartCanvas' no encontrado."); return; }
    projectChartInstance = new Chart(dom.overviewChartCanvas, {
        type: 'bar',
        data: {
            labels: projectNames,
            datasets: [{
                label: 'Tareas por Proyecto',
                data: projectNames.map(name => projectTaskCounts[name] || 0),
                backgroundColor: currentColors.projectTasks,
                borderColor: currentColors.projectTasks,
                borderWidth: 1
            }]
        },
        options: { /* ... opciones ... */ }
    });
};

const renderProjectCostsComparisonChart = () => {
    const dom = getDomElements();
    destroyCurrentChart();
    updateChartTitle('projectCostsComparison');
    const appData = getAppState();
    const projectCosts = Array.isArray(appData.projectCosts) ? appData.projectCosts : [];

    if (!projectCosts.length) { showNoDataMessage(true, false); return; }
    showNoDataMessage(false, false);

    const currentColors = getCurrentChartColors();
    if (!dom.overviewChartCanvas) { console.error("Canvas 'overviewChartCanvas' no encontrado."); return; }
    projectChartInstance = new Chart(dom.overviewChartCanvas, {
        type: 'bar',
        data: {
            labels: projectCosts.map(pc => pc.projectName),
            datasets: [
                { label: 'Presupuesto', data: projectCosts.map(pc => pc.budget), backgroundColor: currentColors.budget, borderColor: currentColors.budget, borderWidth: 1 },
                { label: 'Costo Actual', data: projectCosts.map(pc => pc.actualCost), backgroundColor: currentColors.actualCost, borderColor: currentColors.actualCost, borderWidth: 1 }
            ]
        },
        options: { /* ... opciones ... */ }
    });
};

const renderCryptoPerformanceChart = () => {
    const dom = getDomElements();
    destroyCurrentChart(); // Asegura que solo un gráfico esté activo
    if (!dom.cryptoOverviewChartCanvas) { console.error("Canvas 'cryptoOverviewChartCanvas' no encontrado."); return; }

    const stats = getFuturesTradesStats();
    if (stats.pnlHistory.length < 2) {
        showNoDataMessage(true, true); return;
    }
    showNoDataMessage(false, true);

    const labels = stats.pnlHistory.map(p => new Date(p.date).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}));
    const data = stats.pnlHistory.map(p => p.pnl);
    const currentColors = getCurrentChartColors();
    const finalPnl = data[data.length - 1];
    const chartLineColor = finalPnl >= 0 ? currentColors.profit : currentColors.loss;

    const ctx = dom.cryptoOverviewChartCanvas.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, dom.cryptoOverviewChartCanvas.height);
    gradient.addColorStop(0, `${chartLineColor}80`); // Opacidad ~0.5
    gradient.addColorStop(1, `${chartLineColor}00`); // Opacidad 0

    cryptoChartInstance = new Chart(dom.cryptoOverviewChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'PnL Acumulado', data: data, borderColor: chartLineColor,
                backgroundColor: gradient, fill: true, tension: 0.1,
                pointBackgroundColor: chartLineColor, pointRadius: 3,
            }]
        },
        options: { /* ... opciones ... */ }
    });
};

export const renderSelectedChart = (chartType) => {
    const dom = getDomElements();
    const appData = getAppState();
    
    // Limpiar cualquier gráfico anterior
    destroyCurrentChart();

    if (appData.activeUserMode === 'crypto') {
        // Ocultar el selector de tipo de gráfico de proyectos
        if (dom.chartTypeSelect && dom.chartTitleEl) {
            dom.chartTypeSelect.parentElement.classList.add('hidden'); // Oculta el div que contiene label y select
            dom.chartTitleEl.classList.add('hidden'); // Oculta el título del gráfico de proyectos
        }
        // Asegurar que el canvas de proyectos esté oculto y el de cripto visible
        if(dom.overviewChartCanvas) dom.overviewChartCanvas.classList.add('hidden');
        if(dom.cryptoOverviewChartCanvas) dom.cryptoOverviewChartCanvas.classList.remove('hidden');
        renderCryptoPerformanceChart();
    } else { // Modo Proyectos
        // Mostrar el selector de tipo de gráfico de proyectos
        if (dom.chartTypeSelect && dom.chartTitleEl) {
            dom.chartTypeSelect.parentElement.classList.remove('hidden');
            dom.chartTitleEl.classList.remove('hidden');
        }
        // Asegurar que el canvas de cripto esté oculto y el de proyectos visible
        if(dom.cryptoOverviewChartCanvas) dom.cryptoOverviewChartCanvas.classList.add('hidden');
        if(dom.overviewChartCanvas) dom.overviewChartCanvas.classList.remove('hidden');

        const effectiveChartType = chartType || (dom.chartTypeSelect ? dom.chartTypeSelect.value : 'statusDistribution');
        if (!dom.overviewChartCanvas) {
            showNoDataMessage(true, false); return;
        }
        switch (effectiveChartType) {
            case 'statusDistribution': renderStatusDistributionChart(); break;
            case 'tasksPerProject': renderTasksPerProjectChart(); break;
            case 'projectCostsComparison': renderProjectCostsComparisonChart(); break;
            default: console.warn(`Tipo de gráfico desconocido: ${effectiveChartType}`); renderStatusDistributionChart();
        }
    }
};

export const refreshCurrentChart = () => {
    const dom = getDomElements();
    const appData = getAppState();
    if (appData.activeUserMode === 'crypto') {
        renderSelectedChart('cryptoPerformance'); // Siempre renderiza este gráfico en modo crypto
    } else {
        const currentChartType = dom.chartTypeSelect ? dom.chartTypeSelect.value : 'statusDistribution';
        renderSelectedChart(currentChartType);
    }
};

// Opciones de Chart.js (puedes re-insertar tus opciones específicas aquí si las tenías fuera)
// Ejemplo:
/*
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { padding: 15, font: { family: 'Inter, sans-serif'} } },
        tooltip: { bodyFont: { family: 'Inter, sans-serif' }, titleFont: { family: 'Inter, sans-serif' }}
    }
};
// y luego usarlas en cada new Chart(...)
// options: { ...defaultChartOptions, scales: { ... }, cutout: '60%' } // para doughnut
// options: { ...defaultChartOptions, scales: { y: { ... }, x: { ... } } } // para bar
*/
// Por ahora, mantendré las opciones dentro de cada función de renderizado de gráfico
// como las tenías, ya que getCurrentChartColors() se llama dentro de ellas para los colores dinámicos.