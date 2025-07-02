// src/js/modalHandlers.js
import { getDomElements } from './domElements.js';
import { getAppState, updateAppState } from './state.js';
import { sanitizeHTML, clearAllValidationErrors, showToast, debounce, formatCurrency, formatDuration, calculateFuturesMetrics } from './utils.js';
import db from './db.js';
import { getTop100Coins } from '../api/cryptoAPI.js';
import { DEFAULT_TASK_PRIORITIES } from './config.js';
import { handleSpotCalculatorChange } from './eventHandlers.js'; 

let taskStatusChangeListener = null;
let spotCalculatorInputListeners = []; 
let allCoinsCache = [];
let lastAllCoinsFetchTime = 0;
const ALL_COINS_CACHE_DURATION = 15 * 60 * 1000;

export const openModal = (modalElement) => {
    if (!modalElement) {
        console.warn("MODAL_HANDLER (openModal): modalElement no encontrado. No se puede abrir el modal.");
        return;
    }
    modalElement.classList.remove('hidden');
    document.body.classList.add('modal-active');
    modalElement.offsetHeight;
    modalElement.classList.add('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }
    const firstFocusable = modalElement.querySelector(
        'input:not([readonly]):not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)'
    );
    if (firstFocusable) firstFocusable.focus();
};

const removeSpotCalculatorListeners = () => {
    const dom = getDomElements();
    if (spotCalculatorInputListeners.length > 0) {
        if (dom.calcTargetProfitUsdInput && spotCalculatorInputListeners[0]) { 
            dom.calcTargetProfitUsdInput.removeEventListener('input', spotCalculatorInputListeners[0]);
        }
        if (dom.calcEstimatedSellFeeInput && spotCalculatorInputListeners[1]) { 
            dom.calcEstimatedSellFeeInput.removeEventListener('input', spotCalculatorInputListeners[1]);
        }
        spotCalculatorInputListeners = [];
    }
};

export const closeModal = (modalElement) => {
    const dom = getDomElements();
    if (!modalElement) {
        console.warn("MODAL_HANDLER (closeModal): modalElement no encontrado. No se puede cerrar.");
        return;
    }

    if (modalElement === dom.taskModal && dom.taskForm) {
        clearAllValidationErrors(dom.taskForm);
        if (dom.taskStatusSelect && taskStatusChangeListener) {
            dom.taskStatusSelect.removeEventListener('change', taskStatusChangeListener);
            taskStatusChangeListener = null;
        }
    } else if (modalElement === dom.costModal && dom.costForm) {
        clearAllValidationErrors(dom.costForm);
    } else if (modalElement === dom.spotTradeModal && dom.spotTradeForm) {
        clearAllValidationErrors(dom.spotTradeForm);
        removeSpotCalculatorListeners(); 
        if (dom.spotTargetCalculatorSection) dom.spotTargetCalculatorSection.classList.add('hidden');
    } else if (modalElement === dom.futuresTradeModal && dom.futuresTradeForm) {
        clearAllValidationErrors(dom.futuresTradeForm);
        if (dom.futuresExitPriceInput) dom.futuresExitPriceInput.disabled = false;
        if (dom.futuresExitFeesInput) dom.futuresExitFeesInput.disabled = false;
    } else if (modalElement === dom.addCoinModal) {
        if (dom.searchCoinInput) dom.searchCoinInput.value = '';
        if (dom.coinSearchResultsContainer) dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
    } else if (modalElement === dom.confirmationModal) {
        updateAppState({ currentConfirmationAction: null });
    }

    document.body.classList.remove('modal-active');
    modalElement.classList.remove('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }
    const scrollableContent = modalElement.querySelector('.modal-content .overflow-y-auto');
    if (scrollableContent) scrollableContent.scrollTop = 0;
    
    setTimeout(() => {
        if (modalElement) modalElement.classList.add('hidden');
    } , 250);
};

export const updateTaskModalDropdowns = () => {
    const dom = getDomElements();
    const currentState = getAppState();
    if (!dom.taskProjectNameSelect || !dom.taskStatusSelect || !dom.taskPrioritySelect) {
        console.warn("updateTaskModalDropdowns: Uno o más selectores del modal de tarea no encontrados.");
        return;
    }
    const currentProjectValue = dom.taskProjectNameSelect.value;
    const currentStatusValue = dom.taskStatusSelect.value;
    const currentPriorityValue = dom.taskPrioritySelect.value;

    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    dom.taskProjectNameSelect.innerHTML = '<option value="">Seleccione Proyecto</option>';
    [...projectNameList].sort((a, b) => a.name.localeCompare(b.name)).forEach(project => {
        dom.taskProjectNameSelect.add(new Option(sanitizeHTML(project.name), project.name));
    });
    if (currentProjectValue) dom.taskProjectNameSelect.value = currentProjectValue;

    const statusList = Array.isArray(currentState.statusList) ? currentState.statusList : [];
    dom.taskStatusSelect.innerHTML = '<option value="">Seleccione Estado</option>';
    [...statusList].sort((a, b) => a.name.localeCompare(b.name)).forEach(status => {
        dom.taskStatusSelect.add(new Option(sanitizeHTML(status.name), status.name));
    });
    if (currentStatusValue) dom.taskStatusSelect.value = currentStatusValue;

    dom.taskPrioritySelect.innerHTML = '<option value="">Seleccione Prioridad</option>';
    DEFAULT_TASK_PRIORITIES.forEach(priority => {
        dom.taskPrioritySelect.add(new Option(priority, priority));
    });
    if (currentPriorityValue) dom.taskPrioritySelect.value = currentPriorityValue;
};

export const showDynamicModal = (options) => {
    const dom = getDomElements();
    const { type, title, data, message, confirmButtonText, confirmButtonClass } = options;
    let modalElement, modalTitleEl, formElement;

    switch (type) {
        case 'task': modalElement = dom.taskModal; modalTitleEl = dom.taskModalTitle; formElement = dom.taskForm; break;
        case 'cost': modalElement = dom.costModal; modalTitleEl = dom.costModalTitle; formElement = dom.costForm; break;
        case 'confirmation':
            modalElement = dom.confirmationModal;
            modalTitleEl = dom.confirmationModalTitle;
            formElement = null; 
            if (modalTitleEl) modalTitleEl.textContent = title;
            if (dom.confirmationModalBody) {
                dom.confirmationModalBody.innerHTML = message; 
            }
            if (dom.confirmConfirmationButton) {
                dom.confirmConfirmationButton.textContent = confirmButtonText;
                dom.confirmConfirmationButton.className = 'text-white font-medium py-2 px-4 rounded-lg shadow transition duration-300 text-sm'; 
                if (confirmButtonClass === 'red') {
                    dom.confirmConfirmationButton.classList.add('bg-red-600', 'hover:bg-red-700');
                } else if (confirmButtonClass === 'teal') {
                    dom.confirmConfirmationButton.classList.add('bg-teal-600', 'hover:bg-teal-700');
                } else { 
                    dom.confirmConfirmationButton.classList.add('bg-red-600', 'hover:bg-red-700');
                }
            }
            break;
        case 'spotTrade': modalElement = dom.spotTradeModal; modalTitleEl = dom.spotTradeModalTitle; formElement = dom.spotTradeForm; break;
        case 'futuresTrade': modalElement = dom.futuresTradeModal; modalTitleEl = dom.futuresTradeModalTitle; formElement = dom.futuresTradeForm; break;
        case 'addCoin': modalElement = dom.addCoinModal; modalTitleEl = dom.addCoinModal?.querySelector('#add-coin-modal-title'); formElement = null; break;
        default: console.error(`showDynamicModal: Tipo de modal desconocido: ${type}`); return;
    }
    
    if (!modalElement) { 
      console.error(`MODAL_HANDLER (showDynamicModal): modalElement NO ENCONTRADO para tipo '${type}'.`); 
      return; 
    }
    if (modalTitleEl && type !== 'confirmation') {
        modalTitleEl.textContent = sanitizeHTML(title); 
    }
    
    if (formElement) { formElement.reset(); clearAllValidationErrors(formElement); }

    if (type !== 'spotTrade' || !data || data.type !== 'buy') {
        removeSpotCalculatorListeners();
        if(dom.spotTargetCalculatorSection) dom.spotTargetCalculatorSection.classList.add('hidden');
    }
    switch (type) {
        case 'task':
            updateTaskModalDropdowns();
            if (data) { 
                dom.taskIdInput.value = data.id || '';
                dom.taskProjectNameSelect.value = data.projectName || '';
                dom.taskStatusSelect.value = data.status || '';
                dom.taskPrioritySelect.value = data.priority || '';
                dom.taskNameInput.value = data.task || '';
                dom.taskDescriptionInput.value = data.description || '';
                dom.taskStartDateInput.value = data.startDate || '';
                dom.taskEndDateInput.value = data.endDate || '';
            } else { 
                dom.taskIdInput.value = ''; 
                const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                const todayISO = now.toISOString().slice(0, 10);
                dom.taskStartDateInput.value = todayISO;
                dom.taskEndDateInput.value = todayISO;
            }
            break;
        case 'cost':
             if (data) {
                dom.costIdInput.value = data.id || '';
                dom.costProjectNameInput.value = data.projectName || 'N/A';
                dom.costBudgetInput.value = data.budget || '0';
                dom.costActualInput.value = data.actualCost || '0';
            }
            break;
        case 'spotTrade':
            if (data) { 
                dom.spotTradeIdInput.value = data.id || '';
                dom.tradeDateInput.value = data.tradeDate ? new Date(data.tradeDate).toISOString().slice(0, 16) : '';
                dom.tradeTypeSelect.value = data.type || 'buy';
                dom.baseAssetInput.value = data.baseAsset || '';
                dom.quoteAssetInput.value = data.quoteAsset || '';
                dom.priceInput.value = data.price || '';
                dom.quantityBaseInput.value = data.quantityBase || '';
                dom.totalQuoteInput.value = data.totalQuote || '';
                dom.spotTradeFeesInput.value = data.fees || '';
                dom.notesInput.value = data.notes || '';
                if (data.type === 'buy') {
                    dom.spotTargetCalculatorSection.classList.remove('hidden');
                    const quantity = parseFloat(data.quantityBase) || 0;
                    const price = parseFloat(data.price) || 0;
                    const fees = parseFloat(data.fees) || 0;
                    const totalCost = (quantity * price) + fees;
                    dom.calcBaseQuantity.textContent = quantity.toLocaleString(undefined, {maximumFractionDigits: 8});
                    dom.calcBaseTotalCost.textContent = formatCurrency(totalCost);
                    dom.calcTargetProfitUsdInput.value = '';
                    dom.calcEstimatedSellFeeInput.value = '0';
                    dom.calcSellPriceNeeded.textContent = '-';
                    dom.calcTotalSellValue.textContent = '-';
                    removeSpotCalculatorListeners(); 
                    const listenerProfit = () => handleSpotCalculatorChange(data); 
                    const listenerFee = () => handleSpotCalculatorChange(data);
                    dom.calcTargetProfitUsdInput.addEventListener('input', listenerProfit);
                    dom.calcEstimatedSellFeeInput.addEventListener('input', listenerFee);
                    spotCalculatorInputListeners = [listenerProfit, listenerFee];
                } else { 
                    dom.spotTargetCalculatorSection.classList.add('hidden');
                    removeSpotCalculatorListeners();
                }
            } else { 
                dom.spotTradeIdInput.value = ''; 
                const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                dom.tradeDateInput.value = now.toISOString().slice(0, 16); 
                dom.tradeTypeSelect.value = 'buy';
                dom.baseAssetInput.value = ''; dom.quoteAssetInput.value = ''; dom.priceInput.value = '';
                dom.quantityBaseInput.value = ''; dom.totalQuoteInput.value = ''; dom.spotTradeFeesInput.value = ''; dom.notesInput.value = '';
                dom.spotTargetCalculatorSection.classList.add('hidden');
                removeSpotCalculatorListeners();
            }
            break;
        case 'futuresTrade':
            // === BLOQUE CORREGIDO ===
            const isNewTrade = !data;
            const isEditingOpenTrade = data && data.status === 'open';
            const isEditingClosedTrade = data && data.status === 'closed';

            // 1. Configurar Título y Botones
            dom.futuresTradeModalTitle.textContent = title || (isEditingOpenTrade ? 'Ver/Cerrar Posición' : (isEditingClosedTrade ? 'Ver Posición Cerrada' : 'Abrir Nueva Posición'));
            
            // --- ESTA ES LA CORRECCIÓN CLAVE ---
            dom.saveFuturesTradeButton.classList.remove('hidden'); // Siempre asegúrate de que sea visible primero
            if (isEditingClosedTrade) {
                dom.saveFuturesTradeButton.classList.add('hidden'); // Y luego ocúltalo si es necesario
            }
            // --- FIN DE LA CORRECCIÓN CLAVE ---

            dom.saveFuturesTradeButton.textContent = isNewTrade ? 'Abrir Posición' : 'Guardar Cambios';
            dom.closeFuturesTradeButton.classList.toggle('hidden', !isEditingOpenTrade);
            
            // 2. Poblar/Resetear el Formulario
            dom.futuresTradeIdInput.value = data?.id || ''; 
            dom.futuresSymbolInput.value = data?.symbol || '';
            dom.futuresDirectionSelect.value = data?.direction || 'long'; 
            dom.futuresLeverageInput.value = data?.leverage || '';
            dom.futuresEntryDateInput.value = data?.entryDate ? new Date(data.entryDate).toISOString().slice(0, 16) : new Date(new Date().setMinutes(new Date().getMinutes() - new Date().getTimezoneOffset())).toISOString().slice(0, 16);
            dom.futuresQuantityInput.value = data?.quantity || ''; 
            dom.futuresEntryPriceInput.value = data?.entryPrice || '';
            dom.futuresEntryFeesInput.value = data?.entryFees || ''; 
            dom.futuresExitPriceInput.value = data?.exitPrice || ''; 
            dom.futuresExitFeesInput.value = data?.exitFees || '';   
            dom.futuresNotesInput.value = data?.notes || '';
            dom.futuresExitDateInput.value = data?.exitDate ? new Date(data.exitDate).toISOString().slice(0, 16) : '';
            
            // 3. Configurar Visibilidad y Estado de los Campos
            const allEntryFields = [dom.futuresSymbolInput, dom.futuresDirectionSelect, dom.futuresLeverageInput, dom.futuresEntryDateInput, dom.futuresQuantityInput, dom.futuresEntryPriceInput, dom.futuresEntryFeesInput, dom.futuresNotesInput];
            const allExitInputFields = [dom.futuresExitPriceInput, dom.futuresExitFeesInput];
            
            dom.futuresExitPriceContainer.classList.toggle('hidden', isNewTrade);
            dom.futuresExitFeesContainer.classList.toggle('hidden', isNewTrade);
            dom.futuresExitDateContainer.classList.toggle('hidden', !isEditingClosedTrade);
            dom.futuresDurationContainer.classList.toggle('hidden', !isEditingClosedTrade);
            dom.futuresMarginContainer.classList.toggle('hidden', !isEditingClosedTrade);
            dom.futuresRoiContainer.classList.toggle('hidden', !isEditingClosedTrade);

            [...allEntryFields, ...allExitInputFields].forEach(input => { 
                if(input) input.disabled = isEditingClosedTrade;
            });

            // 4. Calcular y mostrar métricas para trades cerrados
            if (isEditingClosedTrade) {
                const metrics = calculateFuturesMetrics(data);
                dom.futuresDurationInput.value = formatDuration(data.entryDate, data.exitDate);
                dom.futuresMarginInput.value = formatCurrency(metrics.margin);
                dom.futuresRoiInput.value = `${metrics.roi.toFixed(2)}%`;

                dom.futuresRoiInput.classList.remove('text-green-600', 'dark:text-green-400', 'text-red-600', 'dark:text-red-400', 'text-gray-500', 'dark:text-gray-400', 'font-semibold');
                if (metrics.roi > 0) {
                    dom.futuresRoiInput.classList.add('text-green-600', 'dark:text-green-400', 'font-semibold');
                } else if (metrics.roi < 0) {
                    dom.futuresRoiInput.classList.add('text-red-600', 'dark:text-red-400', 'font-semibold');
                } else {
                    dom.futuresRoiInput.classList.add('text-gray-500', 'dark:text-gray-400');
                }
            }
            break;
        case 'addCoin': 
            break; 
    }
    openModal(modalElement);
};

export const openAddTaskModal = () => showDynamicModal({ type: 'task', title: 'Agregar Nueva Tarea' });

export const openEditTaskModal = (taskIdToEdit) => {
    const currentState = getAppState();
    const taskToEdit = currentState.projectDetails.find(task => task.id === taskIdToEdit);
    if (!taskToEdit) return showToast("Error: Tarea no encontrada.", "error");
    showDynamicModal({ type: 'task', title: 'Editar Tarea', data: taskToEdit });
};

export const openEditCostModal = (costIdToEdit) => {
    const currentState = getAppState();
    const costToEdit = currentState.projectCosts.find(cost => cost.id === costIdToEdit);
    if (!costToEdit) {
        showToast("Error: Costo no encontrado.", "error");
        return;
    }
    showDynamicModal({ type: 'cost', title: `Editar Costos: ${sanitizeHTML(costToEdit.projectName)}`, data: costToEdit });
};

export const openConfirmationModal = (title, message, confirmButtonText, confirmButtonClass, actionCallback, actionData = null) => {
    updateAppState({ currentConfirmationAction: { callback: actionCallback, data: actionData } });
    showDynamicModal({ 
        type: 'confirmation', 
        title: sanitizeHTML(title), 
        message: message,
        confirmButtonText: sanitizeHTML(confirmButtonText), 
        confirmButtonClass, 
    });
};

export const closeConfirmationModal = () => closeModal(getDomElements().confirmationModal);
export const openAddSpotTradeModal = () => showDynamicModal({ type: 'spotTrade', title: 'Agregar Operación Spot' });
export const openEditSpotTradeModal = (tradeId) => {
    const currentState = getAppState();
    const tradeToEdit = currentState.spotTrades.find(trade => trade.id === tradeId);
    if (!tradeToEdit) return showToast("Error: Operación no encontrada.", "error");
    showDynamicModal({ type: 'spotTrade', title: 'Editar Operación Spot', data: tradeToEdit });
};
export const openAddFuturesTradeModal = () => showDynamicModal({ type: 'futuresTrade', title: 'Abrir Nueva Posición de Futuros' });
export const openEditFuturesTradeModal = (tradeId) => {
    const currentState = getAppState();
    const tradeToEdit = currentState.futuresTrades.find(trade => trade.id === tradeId);
    if (!tradeToEdit) return showToast("Error: Posición de futuros no encontrada.", "error");
    showDynamicModal({ type: 'futuresTrade', title: '', data: tradeToEdit });
};

const renderCoinSearchResults = (results) => {
    const dom = getDomElements();
    const { watchlist } = getAppState();
    const watchlistCoinIds = new Set(watchlist.map(item => item.coinId));

    if (results.length === 0) {
        dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron monedas.</p>';
        return;
    }

    dom.coinSearchResultsContainer.innerHTML = `
        <ul class="space-y-2 max-h-60 overflow-y-auto">
            ${results.map(coin => `
                <li class="flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150">
                    <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">${sanitizeHTML(coin.name)} (${sanitizeHTML(coin.symbol.toUpperCase())})</span>
                    </div>
                    <button 
                        class="add-coin-to-watchlist-btn text-xs font-semibold py-1.5 px-3 rounded-md transition-all duration-200 ease-in-out
                               ${watchlistCoinIds.has(coin.id) 
                                   ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                                   : 'bg-green-500 hover:bg-green-600 text-white focus:ring-2 focus:ring-green-400 focus:ring-opacity-50'}"
                        data-coin-id="${coin.id}"
                        data-coin-name="${sanitizeHTML(coin.name)}"
                        ${watchlistCoinIds.has(coin.id) ? 'disabled' : ''}>
                        ${watchlistCoinIds.has(coin.id) ? 'Añadida' : '<i class="fas fa-plus mr-1"></i> Añadir'}
                    </button>
                </li>
            `).join('')}
        </ul>
    `;
};

const _handleCoinSearch = async (searchTerm) => {
    const dom = getDomElements();
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
        dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
        return;
    }
    if (allCoinsCache.length === 0) {
         dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Cargando lista de monedas...</p>';
         await openAddCoinToWatchlistModal(); 
         if (allCoinsCache.length === 0) return;
    }
    const filteredResults = allCoinsCache.filter(coin =>
        coin.name.toLowerCase().includes(term) ||
        coin.symbol.toLowerCase().includes(term) ||
        coin.id.toLowerCase().includes(term)
    ).slice(0, 50);

    renderCoinSearchResults(filteredResults);
};
export const handleCoinSearch = debounce(_handleCoinSearch, 300);


export const openAddCoinToWatchlistModal = async () => {
    const dom = getDomElements();
    showDynamicModal({ type: 'addCoin', title: 'Añadir Moneda a la Lista' });

    const now = Date.now();
    if (allCoinsCache.length === 0 || (now - lastAllCoinsFetchTime > ALL_COINS_CACHE_DURATION)) {
        dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Cargando monedas disponibles...</p>';
        try {
            allCoinsCache = await getTop100Coins();
            lastAllCoinsFetchTime = now;
            if (allCoinsCache.length === 0) {
                dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-red-500 dark:text-red-400">No se pudieron cargar las monedas.</p>';
            } else {
                 if (dom.coinSearchResultsContainer && !dom.searchCoinInput.value) {
                    dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
                 }
            }
        } catch (error) {
            console.error("Error al obtener la lista de todas las monedas:", error);
            dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-red-500 dark:text-red-400">Error al cargar monedas.</p>';
        }
    } else {
        if (dom.coinSearchResultsContainer && !dom.searchCoinInput.value) {
            dom.coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
        }
    }
     if (dom.searchCoinInput) dom.searchCoinInput.focus();
};

export const handleChangeAppTitle = async () => {
    const dom = getDomElements();
    const oldTitle = dom.mainTitleEl.textContent;
    const newTitle = prompt("Ingrese el nuevo título para la aplicación:", oldTitle);
    if (newTitle !== null && newTitle.trim() !== "") {
        const sanitizedTitle = sanitizeHTML(newTitle.trim());
        dom.mainTitleEl.textContent = sanitizedTitle;
        try {
            await db.appConfig.put({ key: 'mainTitle', value: sanitizedTitle });
            updateAppState({ mainTitle: sanitizedTitle });
            showToast("Título actualizado.", 'success');
        } catch (error) {
            console.error("Error guardando nuevo título en DB:", error);
            dom.mainTitleEl.textContent = oldTitle; // Revertir si hay error
            showToast("Error al guardar el título.", 'error');
        }
    }
};