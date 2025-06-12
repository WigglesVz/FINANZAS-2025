// src/js/uiRender.js

import {
    totalProjectsEl, totalActualCostEl, cumulativeTasksEl, projectSummaryContainer,
    projectDetailsTableBody, searchProjectTasksInput,
    projectCostTableBody, searchProjectCostsInput,
    statusListEl, newStatusInput, projectNameListEl, newProjectNameInput,
    monthlyIncomeInput, totalFixedExpensesEl, netMonthlyAmountEl,
    fixedExpensesTableBody, searchFixedExpensesInput,
    footerYearSpan,
    projectDetailsSortHeaders, projectCostSortHeaders, fixedExpensesSortHeaders,
    spotTradesTableBody,
    filterSpotAssetInput, filterSpotStartDateInput, filterSpotEndDateInput,
    futuresTradesTableBody,
    projectsOverviewDashboard, cryptoOverviewDashboard,
    cryptoTotalPnl, cryptoWinRate, cryptoTotalTrades, cryptoWinLossRatio,
    cryptoChartNoData,
    cryptoWatchlistContainer
} from './domElements.js';
import { getAppState, getFilteredAndSortedData, calculateProjectSummary, getFuturesTradesStats } from './state.js';
import {
    formatCurrency,
    getStatusStyle,
    getCurrentDate, sanitizeHTML,
    updateSortIcons,
    formatCryptoPrice
} from './utils.js';
import { SORT_STATE_DEFAULTS } from './config.js';
import { getMarketDataForCoins } from '../api/cryptoAPI.js';
import Chart from 'chart.js/auto';


const TABLE_HEADERS = {
    projectDetails: ['Proyecto', 'Tarea', 'Descripción', 'Inicio', 'Fin', 'Estado', 'Acciones'],
    projectCosts: ['Proyecto', 'Presupuesto', 'Costo Actual', 'Diferencia', 'Acciones'],
    fixedExpenses: ['Nombre Gasto', 'Monto', 'Acciones'],
    spotTrades: ['Par', 'Tipo', 'Fecha', 'Precio', 'Cantidad', 'Total', 'Acciones'],
    futuresTrades: ['Símbolo', 'Dirección', 'Estado', 'PnL', 'Apalanc.', 'Acciones'],
    cryptoWatchlist: ['Activo', 'Precio', 'Cambio 24h', 'Gráfico 7d', 'Acciones']
};

export const renderAll = () => {
    console.log("Rendering all components...");
    const currentState = getAppState();
    renderOverview(currentState);
    renderProjectSummaries(currentState);
    renderProjectDetailsTable(currentState);
    renderProjectCostTable(currentState);
    renderFinanceTab(currentState);
    renderSetupLists(currentState);
    renderSpotTradesTable(currentState);
    renderFuturesTradesTable(currentState);
    renderCryptoPanel();
    updateFooterYear();
    console.log("Rendering complete.");
};

export const renderOverview = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    
    if (currentState.activeUserMode === 'crypto') {
        if(projectsOverviewDashboard) projectsOverviewDashboard.classList.add('hidden');
        if(cryptoOverviewDashboard) cryptoOverviewDashboard.classList.remove('hidden');
        renderCryptoDashboard();
    } else {
        if(cryptoOverviewDashboard) cryptoOverviewDashboard.classList.add('hidden');
        if(projectsOverviewDashboard) projectsOverviewDashboard.classList.remove('hidden');
        renderProjectsDashboard(currentState);
    }
};

const renderProjectsDashboard = (currentState) => {
    if (!totalProjectsEl || !totalActualCostEl || !cumulativeTasksEl) return;
    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    const projectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
    const projectDetails = Array.isArray(currentState.projectDetails) ? currentState.projectDetails : [];
    totalProjectsEl.textContent = projectNameList.length.toString();
    const totalCost = projectCosts.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
    totalActualCostEl.textContent = formatCurrency(totalCost);
    cumulativeTasksEl.textContent = projectDetails.length.toString();
};

const renderCryptoDashboard = () => {
    const stats = getFuturesTradesStats();

    if (cryptoTotalPnl) {
        cryptoTotalPnl.textContent = formatCurrency(stats.totalPnl);
        cryptoTotalPnl.classList.remove('text-green-600', 'dark:text-green-400', 'text-red-600', 'dark:text-red-400', 'text-gray-900', 'dark:text-gray-100');
        if (stats.totalPnl > 0) {
            cryptoTotalPnl.classList.add('text-green-600', 'dark:text-green-400');
        } else if (stats.totalPnl < 0) {
            cryptoTotalPnl.classList.add('text-red-600', 'dark:text-red-400');
        } else {
            cryptoTotalPnl.classList.add('text-gray-900', 'dark:text-gray-100');
        }
    }

    if (cryptoWinRate) cryptoWinRate.textContent = `${stats.winRate.toFixed(1)}%`;
    if (cryptoTotalTrades) cryptoTotalTrades.textContent = stats.totalTrades.toString();
    if (cryptoWinLossRatio) cryptoWinLossRatio.innerHTML = `<span class="text-green-600 dark:text-green-400">${stats.winningTrades}</span> / <span class="text-red-600 dark:text-red-400">${stats.losingTrades}</span>`;
    if (cryptoChartNoData) cryptoChartNoData.classList.toggle('hidden', stats.pnlHistory.length > 1);
};

export const renderEmptyStateMessage = (parentElement, message, colspan) => {
    if (!parentElement) return;
    parentElement.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="text-center py-10 text-gray-500 dark:text-gray-400 italic">
                ${message}
            </td>
        </tr>
    `;
};

export const renderProjectDetailsTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectDetailsTableBody) return;
    
    const searchTerm = currentState.searchTerms?.projectDetails || '';
    const sortConfig = currentState.sortState?.projectDetails || SORT_STATE_DEFAULTS.projectDetails;
    const itemsToRender = getFilteredAndSortedData('projectDetails', searchTerm, sortConfig);
    
    updateSortIcons(projectDetailsSortHeaders, sortConfig.key, sortConfig.direction);

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay tareas que coincidan.' : 'No hay tareas registradas.';
        renderEmptyStateMessage(projectDetailsTableBody, message, 7);
        if(searchProjectTasksInput) searchProjectTasksInput.value = searchTerm;
        return;
    }
    
    const today = getCurrentDate();
    const completedStatusName = (currentState.statusList.find(s => s.name.toLowerCase() === 'completado') || {name: 'Completado'}).name;
    const rowsHtml = itemsToRender.map(task => {
        const isOverdue = task.endDate && task.endDate < today && task.status !== completedStatusName;
        const statusStyle = getStatusStyle(task.status, currentState.statusList);
        return `
            <tr class="${isOverdue ? 'overdue-task' : ''}">
                <td data-label="${TABLE_HEADERS.projectDetails[0]}"><span class="value-wrapper">${sanitizeHTML(task.projectName)}</span></td>
                <td data-label="${TABLE_HEADERS.projectDetails[1]}"><span class="value-wrapper">${sanitizeHTML(task.task)}</span></td>
                <td data-label="${TABLE_HEADERS.projectDetails[2]}"><span class="value-wrapper">${sanitizeHTML(task.description) || '-'}</span></td>
                <td data-label="${TABLE_HEADERS.projectDetails[3]}"><span class="value-wrapper">${task.startDate || '-'}</span></td>
                <td data-label="${TABLE_HEADERS.projectDetails[4]}"><span class="value-wrapper">${task.endDate || '-'}</span></td>
                <td data-label="${TABLE_HEADERS.projectDetails[5]}">
                    <span class="value-wrapper">
                        <span class="status-badge px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${statusStyle.backgroundColor}; color: ${statusStyle.textColor};">${sanitizeHTML(task.status)}</span>
                    </span>
                </td>
                <td data-label="${TABLE_HEADERS.projectDetails[6]}">
                    <span class="value-wrapper flex justify-center items-center space-x-4">
                        <button class="text-blue-500 hover:text-blue-700 edit-task-button" data-id="${task.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="text-red-500 hover:text-red-700 delete-task-button" data-id="${task.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    projectDetailsTableBody.innerHTML = rowsHtml;
    if(searchProjectTasksInput) searchProjectTasksInput.value = searchTerm;
};

export const renderProjectCostTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectCostTableBody) return;

    const searchTerm = currentState.searchTerms?.projectCosts || '';
    const sortConfig = currentState.sortState?.projectCosts || SORT_STATE_DEFAULTS.projectCosts;
    const itemsToRender = getFilteredAndSortedData('projectCosts', searchTerm, sortConfig);

    updateSortIcons(projectCostSortHeaders, sortConfig.key, sortConfig.direction);

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay costos que coincidan.' : 'No hay costos registrados.';
        renderEmptyStateMessage(projectCostTableBody, message, 5);
        if(searchProjectCostsInput) searchProjectCostsInput.value = searchTerm;
        return;
    }

    const rowsHtml = itemsToRender.map(cost => {
        const budget = Number(cost.budget) || 0;
        const actual = Number(cost.actualCost) || 0;
        const difference = budget - actual;
        const diffColorClass = difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        return `
            <tr>
                <td data-label="${TABLE_HEADERS.projectCosts[0]}"><span class="value-wrapper">${sanitizeHTML(cost.projectName)}</span></td>
                <td data-label="${TABLE_HEADERS.projectCosts[1]}"><span class="value-wrapper">${formatCurrency(budget)}</span></td>
                <td data-label="${TABLE_HEADERS.projectCosts[2]}"><span class="value-wrapper">${formatCurrency(actual)}</span></td>
                <td data-label="${TABLE_HEADERS.projectCosts[3]}"><span class="value-wrapper ${diffColorClass}">${formatCurrency(difference)}</span></td>
                <td data-label="${TABLE_HEADERS.projectCosts[4]}">
                    <span class="value-wrapper flex justify-center items-center">
                        <button class="text-blue-600 hover:text-blue-800 edit-cost-button" data-id="${cost.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    projectCostTableBody.innerHTML = rowsHtml;
    if(searchProjectCostsInput) searchProjectCostsInput.value = searchTerm;
};

export const renderSpotTradesTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!spotTradesTableBody) return;

    const filters = currentState.searchTerms?.spotTrades || { asset: '', startDate: '', endDate: '' };
    const sortConfig = currentState.sortState?.spotTrades || { key: 'tradeDate', direction: 'desc' };
    
    if(filterSpotAssetInput) filterSpotAssetInput.value = filters.asset;
    if(filterSpotStartDateInput) filterSpotStartDateInput.value = filters.startDate;
    if(filterSpotEndDateInput) filterSpotEndDateInput.value = filters.endDate;

    const tradesToRender = getFilteredAndSortedData('spotTrades', filters, sortConfig);

    if (tradesToRender.length === 0) {
        const isAnyFilterActive = filters.asset || filters.startDate || filters.endDate;
        const message = isAnyFilterActive ? 'No hay operaciones que coincidan con los filtros.' : 'No hay operaciones spot registradas.';
        renderEmptyStateMessage(spotTradesTableBody, message, 7);
        return;
    }

    const rowsHtml = tradesToRender.map(trade => {
        const typeClass = trade.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const formattedDate = new Date(trade.tradeDate).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `
            <tr>
                <td data-label="${TABLE_HEADERS.spotTrades[0]}"><span class="value-wrapper">${sanitizeHTML(trade.baseAsset)}/${sanitizeHTML(trade.quoteAsset)}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[1]}"><span class="value-wrapper ${typeClass}">${trade.type === 'buy' ? 'Compra' : 'Venta'}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[2]}"><span class="value-wrapper">${formattedDate}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[3]}"><span class="value-wrapper">${formatCurrency(trade.price)}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[4]}"><span class="value-wrapper">${trade.quantityBase.toLocaleString('en-US', {maximumFractionDigits: 8})}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[5]}"><span class="value-wrapper">${formatCurrency(trade.totalQuote)}</span></td>
                <td data-label="${TABLE_HEADERS.spotTrades[6]}">
                    <span class="value-wrapper flex justify-center items-center space-x-4">
                        <button class="text-blue-500 hover:text-blue-700 edit-spot-trade-button" data-id="${trade.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="text-red-500 hover:text-red-700 delete-spot-trade-button" data-id="${trade.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    spotTradesTableBody.innerHTML = rowsHtml;
};

export const renderFuturesTradesTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!futuresTradesTableBody) return;
    const futuresTrades = currentState.futuresTrades || [];

    if (futuresTrades.length === 0) {
        renderEmptyStateMessage(futuresTradesTableBody, 'No hay posiciones de futuros registradas.', 6);
        return;
    }

    const tradesToRender = [...futuresTrades].sort((a,b) => (a.status === 'open' ? -1 : 1) - (b.status === 'open' ? -1 : 1) || new Date(b.entryDate) - new Date(a.entryDate));
    const rowsHtml = tradesToRender.map(trade => {
        const isOpen = trade.status === 'open';
        const dirColor = trade.direction === 'long' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const pnl = Number(trade.pnl) || 0;
        let pnlColor = 'text-gray-500 dark:text-gray-400';
        if (!isOpen && pnl > 0) pnlColor = 'text-green-600 dark:text-green-400';
        if (!isOpen && pnl < 0) pnlColor = 'text-red-600 dark:text-red-400';
        const statusHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isOpen ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">${isOpen ? 'Abierta' : 'Cerrada'}</span>`;
        
        return `
            <tr class="${isOpen ? 'bg-blue-50/50 dark:bg-blue-900/40' : ''}">
                <td data-label="${TABLE_HEADERS.futuresTrades[0]}"><span class="value-wrapper">${sanitizeHTML(trade.symbol)}</span></td>
                <td data-label="${TABLE_HEADERS.futuresTrades[1]}"><span class="value-wrapper ${dirColor}"><i class="fas fa-arrow-${trade.direction === 'long' ? 'up' : 'down'} mr-1"></i> ${trade.direction === 'long' ? 'Long' : 'Short'}</span></td>
                <td data-label="${TABLE_HEADERS.futuresTrades[2]}"><span class="value-wrapper">${statusHtml}</span></td>
                <td data-label="${TABLE_HEADERS.futuresTrades[3]}"><span class="value-wrapper ${pnlColor}">${isOpen ? '-' : formatCurrency(pnl)}</span></td>
                <td data-label="${TABLE_HEADERS.futuresTrades[4]}"><span class="value-wrapper">${trade.leverage}x</span></td>
                <td data-label="${TABLE_HEADERS.futuresTrades[5]}">
                    <span class="value-wrapper flex justify-center items-center space-x-4">
                        <button class="text-blue-500 hover:text-blue-700 edit-futures-trade-button" data-id="${trade.id}" title="Ver/Editar"><i class="fas fa-eye"></i></button>
                        <button class="text-red-500 hover:text-red-700 delete-futures-trade-button" data-id="${trade.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    futuresTradesTableBody.innerHTML = rowsHtml;
};

const renderSparklineChart = (canvasElement, priceData, priceChange) => {
    if (!canvasElement || !priceData || priceData.length === 0) return;

    const lineColor = priceChange >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';

    new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: priceData.map((_, index) => index),
            datasets: [{
                data: priceData,
                borderColor: lineColor,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false } },
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            layout: { padding: { top: 5, bottom: 5 } }
        }
    });
};

export const renderCryptoPanel = async () => {
    if (!cryptoWatchlistContainer) return;
    cryptoWatchlistContainer.innerHTML = `<p class="text-center py-10 text-gray-500 dark:text-gray-400">Cargando datos del mercado...</p>`;

    const currentState = getAppState();
    const watchlistIds = currentState.watchlist.map(item => item.coinId);

    const addCoinButtonHtml = `<div class="p-4 text-center"><button id="add-to-watchlist-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow transition duration-300"><i class="fas fa-plus mr-2"></i>Añadir Moneda</button></div>`;

    if (watchlistIds.length === 0) {
        cryptoWatchlistContainer.innerHTML = `<p class="text-center py-10 text-gray-500 dark:text-gray-400 italic">Tu lista de seguimiento está vacía.</p>${addCoinButtonHtml}`;
        return;
    }

    try {
        const marketData = await getMarketDataForCoins(watchlistIds);
        const tableHtml = `
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                <table class="min-w-full bg-white dark:bg-gray-800">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activo</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cambio 24h</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gráfico 7d</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${marketData.map((coin, index) => {
                            const priceChange = coin.price_change_percentage_24h || 0;
                            const priceChangeColor = priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                            const assetCellHtml = `<div class="flex items-center"><img src="${coin.image}" alt="${coin.name}" class="h-6 w-6 rounded-full mr-3"><div><div class="text-sm font-medium text-gray-900 dark:text-gray-100">${sanitizeHTML(coin.name)}</div><div class="text-xs text-gray-500 dark:text-gray-400">${sanitizeHTML(coin.symbol.toUpperCase())}</div></div></div>`;
                            const sparklineCanvasHtml = `<div class="h-10 w-full sm:w-24 mx-auto"><canvas id="sparkline-${index}"></canvas></div>`;
                            const actionButtonHtml = `<button class="remove-from-watchlist-button text-red-500 hover:text-red-700" data-coin-id="${coin.id}" title="Eliminar"><i class="fas fa-trash"></i></button>`;
                            return `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td data-label="${TABLE_HEADERS.cryptoWatchlist[0]}"><span class="value-wrapper">${assetCellHtml}</span></td>
                                    <td data-label="${TABLE_HEADERS.cryptoWatchlist[1]}"><span class="value-wrapper">${formatCryptoPrice(coin.current_price)}</span></td>
                                    <td data-label="${TABLE_HEADERS.cryptoWatchlist[2]}"><span class="value-wrapper ${priceChangeColor}">${priceChange.toFixed(2)}%</span></td>
                                    <td data-label="${TABLE_HEADERS.cryptoWatchlist[3]}" class="p-2"><span class="value-wrapper">${sparklineCanvasHtml}</span></td>
                                    <td data-label="${TABLE_HEADERS.cryptoWatchlist[4]}"><span class="value-wrapper">${actionButtonHtml}</span></td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${addCoinButtonHtml}`;
        
        cryptoWatchlistContainer.innerHTML = tableHtml;

        marketData.forEach((coin, index) => {
            const canvas = document.getElementById(`sparkline-${index}`);
            if (canvas && coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
                renderSparklineChart(canvas, coin.sparkline_in_7d.price, coin.price_change_percentage_24h);
            }
        });
    } catch (error) {
        cryptoWatchlistContainer.innerHTML = `<p class="text-center py-10 text-red-500 dark:text-red-400">No se pudieron cargar los datos del mercado.</p>`;
    }
};

export const renderGenericSetupList = (listEl, dataList, deleteButtonClass, itemNameSingular, inputElToClear = null, isStatusList = false) => {
    if (!listEl) return;
    const sortedList = [...(Array.isArray(dataList) ? dataList : [])].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedList.length === 0) {
        listEl.innerHTML = `<li class="text-xs text-gray-500 dark:text-gray-400 italic p-2 text-center">No hay ${itemNameSingular}s definidos.</li>`;
        return;
    }
    const listHtml = sortedList.map(item => {
        const safeName = sanitizeHTML(item.name);
        let colorPickerHtml = '';
        if (isStatusList) {
            const currentColor = item.color || '#CCCCCC';
            colorPickerHtml = `<input type="color" value="${currentColor}" class="status-color-picker w-6 h-6 p-0 border-none rounded cursor-pointer ml-2 mr-2" data-id="${item.id}" title="Cambiar color">`;
        }
        const statusIndicator = isStatusList ? `<span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${item.color || '#CCCCCC'};"></span>` : '';
        
        return `<li class="flex justify-between items-center text-sm py-1.5 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">${statusIndicator}<span class="flex-grow pr-2 truncate" title="${safeName}">${safeName}</span>${colorPickerHtml}<button class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs ${deleteButtonClass}" data-id="${item.id}" data-name="${safeName}" title="Eliminar"><i class="fas fa-times-circle"></i></button></li>`;
    }).join('');
    listEl.innerHTML = listHtml;
    if (inputElToClear) inputElToClear.value = '';
};

export const renderSetupLists = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    renderGenericSetupList(statusListEl, currentState.statusList, 'delete-status-button', 'estado', newStatusInput, true);
    renderGenericSetupList(projectNameListEl, currentState.projectNameList, 'delete-project-name-button', 'proyecto', newProjectNameInput, false);
};

export const renderProjectSummaries = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectSummaryContainer) return;
    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    if (projectNameList.length === 0) {
        projectSummaryContainer.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-4">No hay proyectos definidos en Configuración.</p>`;
        return;
    }
    const sortedProjectNames = [...projectNameList].sort((a,b) => a.name.localeCompare(b.name));
    const summariesHtml = sortedProjectNames.map(project => {
        const projectName = project.name;
        const summaryData = calculateProjectSummary(projectName);
        const safeProjectName = sanitizeHTML(projectName);
        return `
            <div class="project-summary-item bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-150 mb-2 cursor-pointer" data-project-name="${projectName}">
                <h4 class="font-semibold text-indigo-700 dark:text-indigo-300 truncate text-base mb-1 pointer-events-none" title="${safeProjectName}">${safeProjectName}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300 pointer-events-none">Costo Actual: <span class="font-medium">${formatCurrency(summaryData.actualCost)}</span></p>
                <p class="text-sm text-gray-600 dark:text-gray-300 pointer-events-none">Tareas Totales: <span class="font-medium">${summaryData.taskCount}</span></p>
            </div>
        `;
    }).join('');
    projectSummaryContainer.innerHTML = summariesHtml;
};

export const renderFinanceTab = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!monthlyIncomeInput) return;
    const monthlyIncome = typeof currentState.monthlyIncome === 'number' ? currentState.monthlyIncome : 0;
    monthlyIncomeInput.value = monthlyIncome > 0 ? monthlyIncome.toFixed(2) : '';
    renderFixedExpensesList(currentState);
    renderFinanceSummary(currentState);
};

export const renderFixedExpensesList = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!fixedExpensesTableBody) return;
    
    const searchTerm = currentState.searchTerms?.fixedExpenses || '';
    const sortConfig = currentState.sortState?.fixedExpenses || SORT_STATE_DEFAULTS.fixedExpenses;
    const itemsToRender = getFilteredAndSortedData('fixedExpenses', searchTerm, sortConfig);
    
    if (fixedExpensesSortHeaders) updateSortIcons(fixedExpensesSortHeaders, sortConfig.key, sortConfig.direction);

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay gastos que coincidan.' : 'No hay gastos fijos registrados.';
        renderEmptyStateMessage(fixedExpensesTableBody, message, 3);
        if(searchFixedExpensesInput) searchFixedExpensesInput.value = searchTerm;
        return;
    }

    const rowsHtml = itemsToRender.map(expense => {
        const safeName = sanitizeHTML(expense.name);
        return `
            <tr>
                <td data-label="${TABLE_HEADERS.fixedExpenses[0]}"><span class="value-wrapper">${safeName}</span></td>
                <td data-label="${TABLE_HEADERS.fixedExpenses[1]}"><span class="value-wrapper">${formatCurrency(expense.amount)}</span></td>
                <td data-label="${TABLE_HEADERS.fixedExpenses[2]}">
                    <span class="value-wrapper flex justify-center items-center">
                        <button class="text-red-500 hover:text-red-700 delete-expense-button" data-id="${expense.id}" data-name="${safeName}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    fixedExpensesTableBody.innerHTML = rowsHtml;
    if(searchFixedExpensesInput) searchFixedExpensesInput.value = searchTerm;
};

export const renderFinanceSummary = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!totalFixedExpensesEl || !netMonthlyAmountEl) return;
    const fixedExpenses = Array.isArray(currentState.fixedExpenses) ? currentState.fixedExpenses : [];
    const monthlyIncome = typeof currentState.monthlyIncome === 'number' ? currentState.monthlyIncome : 0;
    
    const totalExpenses = fixedExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const netAmount = monthlyIncome - totalExpenses;
    
    totalFixedExpensesEl.textContent = formatCurrency(totalExpenses);
    netMonthlyAmountEl.textContent = formatCurrency(netAmount);
    netMonthlyAmountEl.className = 'text-2xl font-bold';
    
    if (netAmount > 0) {
        netMonthlyAmountEl.classList.add('text-green-600', 'dark:text-green-400');
    } else if (netAmount < 0) {
        netMonthlyAmountEl.classList.add('text-red-600', 'dark:text-red-400');
    } else {
        netMonthlyAmountEl.classList.add('text-gray-700', 'dark:text-gray-300');
    }
};

export const updateFooterYear = () => {
    if (footerYearSpan) footerYearSpan.textContent = new Date().getFullYear().toString();
};