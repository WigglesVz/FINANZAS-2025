// src/js/modalHandlers.js
import {
    taskModal, taskModalTitle, taskForm, taskIdInput, taskProjectNameSelect, taskStatusSelect,
    taskNameInput, taskDescriptionInput, taskStartDateInput, taskEndDateInput,
    costModal, costModalTitle, costForm, costIdInput, costProjectNameInput, costBudgetInput, costActualInput,
    confirmationModal, confirmationModalTitle, confirmationModalBody, confirmConfirmationButton,
    mainTitleEl,
    spotTradeModal, spotTradeModalTitle, spotTradeForm, spotTradeIdInput,
    tradeDateInput, tradeTypeSelect, baseAssetInput, quoteAssetInput,
    priceInput, quantityBaseInput, totalQuoteInput, notesInput, spotTradeFeesInput,
    futuresTradeModal, futuresTradeModalTitle, futuresTradeForm, futuresTradeIdInput,
    futuresSymbolInput, futuresDirectionSelect, futuresLeverageInput, futuresEntryDateInput,
    futuresQuantityInput, futuresEntryPriceInput, futuresExitPriceContainer, futuresExitPriceInput,
    futuresNotesInput, saveFuturesTradeButton, closeFuturesTradeButton, futuresEntryFeesInput,
    futuresExitFeesContainer, futuresExitFeesInput,
    addCoinModal, searchCoinInput, coinSearchResultsContainer
} from './domElements.js';
import { getAppState, updateAppState } from './state.js';
import { sanitizeHTML, clearAllValidationErrors, showToast, debounce } from './utils.js';
import db from './db.js';
import { getTop100Coins } from '../api/cryptoAPI.js';

// Variable para almacenar la referencia al listener para poder removerlo si es necesario
let taskStatusChangeListener = null;
let allCoinsCache = []; // Caché para la lista de las 100 monedas principales

/** Abre un modal. @param {HTMLElement} modalElement */
export const openModal = (modalElement) => {
    if (!modalElement) return;
    modalElement.classList.remove('hidden');
    document.body.classList.add('modal-active');
    modalElement.offsetHeight; // Trigger reflow
    modalElement.classList.add('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }
    const firstFocusable = modalElement.querySelector('input:not([readonly]):not([type="hidden"]), select, textarea, button');
    if (firstFocusable) firstFocusable.focus();
};

/** Cierra un modal. @param {HTMLElement} modalElement */
export const closeModal = (modalElement) => {
    if (!modalElement) return;

    if (modalElement.id === 'task-modal' && taskForm) {
        clearAllValidationErrors(taskForm);
        if (taskStatusSelect && taskStatusChangeListener) {
            taskStatusSelect.removeEventListener('change', taskStatusChangeListener);
            taskStatusChangeListener = null;
        }
    }
    if (modalElement.id === 'cost-modal' && costForm) clearAllValidationErrors(costForm);
    if (modalElement.id === 'spot-trade-modal' && spotTradeForm) {
        clearAllValidationErrors(spotTradeForm);
    }
    if (modalElement.id === 'futures-trade-modal' && futuresTradeForm) {
        clearAllValidationErrors(futuresTradeForm);
    }
    if (modalElement.id === 'add-coin-modal') {
        if (searchCoinInput) searchCoinInput.value = '';
        if (coinSearchResultsContainer) coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
    }
    if (modalElement.id === 'confirmation-modal') updateAppState({ currentConfirmationAction: null });

    document.body.classList.remove('modal-active');
    modalElement.classList.remove('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }
    setTimeout(() => modalElement.classList.add('hidden'), 250);
};

/** Populates dropdowns in the Task Modal. */
export const updateTaskModalDropdowns = () => {
    const currentState = getAppState();
    if (!taskProjectNameSelect || !taskStatusSelect) return;
    const currentProjectValue = taskProjectNameSelect.value;
    const currentStatusValue = taskStatusSelect.value;
    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    taskProjectNameSelect.innerHTML = '<option value="">Seleccione Proyecto</option>';
    [...projectNameList].sort((a,b) => a.name.localeCompare(b.name)).forEach(project => {
        taskProjectNameSelect.add(new Option(sanitizeHTML(project.name), project.name));
    });
    taskProjectNameSelect.value = currentProjectValue;
    const statusList = Array.isArray(currentState.statusList) ? currentState.statusList : [];
    taskStatusSelect.innerHTML = '<option value="">Seleccione Estado</option>';
    [...statusList].sort((a,b) => a.name.localeCompare(b.name)).forEach(status => {
         taskStatusSelect.add(new Option(sanitizeHTML(status.name), status.name));
    });
    taskStatusSelect.value = currentStatusValue;
};

/**
 * Función genérica para mostrar diferentes tipos de modales.
 * @param {object} options - Objeto de configuración del modal.
 */
export const showDynamicModal = (options) => {
    const { type, title, data, message, confirmButtonText, confirmButtonClass, actionCallback, actionData } = options;

    let modalElement, modalTitleEl, formElement;

    switch (type) {
        case 'task':
            modalElement = taskModal;
            modalTitleEl = taskModalTitle;
            formElement = taskForm;
            break;
        case 'cost':
            modalElement = costModal;
            modalTitleEl = costModalTitle;
            formElement = costForm;
            break;
        case 'confirmation':
            modalElement = confirmationModal;
            modalTitleEl = confirmationModalTitle;
            formElement = null;
            break;
        case 'spotTrade':
            modalElement = spotTradeModal;
            modalTitleEl = spotTradeModalTitle;
            formElement = spotTradeForm;
            break;
        case 'futuresTrade':
            modalElement = futuresTradeModal;
            modalTitleEl = futuresTradeModalTitle;
            formElement = futuresTradeForm;
            break;
        case 'addCoin':
            modalElement = addCoinModal;
            modalTitleEl = document.getElementById('add-coin-modal-title');
            formElement = null;
            break;
        default:
            console.error(`showDynamicModal: Tipo de modal desconocido: ${type}`);
            return;
    }

    if (!modalElement || !modalTitleEl) {
        console.error(`showDynamicModal: Elementos DOM no encontrados para el tipo ${type}.`);
        return;
    }

    modalTitleEl.textContent = sanitizeHTML(title);

    if (formElement) {
        formElement.reset();
        clearAllValidationErrors(formElement);
    }

    switch (type) {
        case 'task':
            updateTaskModalDropdowns();
            if (taskStatusSelect && taskStartDateInput) {
                if (taskStatusChangeListener) taskStatusSelect.removeEventListener('change', taskStatusChangeListener);
                taskStatusChangeListener = (event) => {
                    const selectedStatusValue = event.target.value;
                    const appState = getAppState();
                    const notStartedStatus = appState.statusList.find(s => s.name.toLowerCase().includes('no iniciado'));
                    const notStartedStatusName = notStartedStatus ? notStartedStatus.name : "No Iniciado";
                    if (selectedStatusValue === notStartedStatusName) taskStartDateInput.value = '';
                };
                taskStatusSelect.addEventListener('change', taskStatusChangeListener);
            }
            if (data) {
                if (!taskIdInput || !taskProjectNameSelect || !taskStatusSelect || !taskNameInput || !taskDescriptionInput || !taskStartDateInput || !taskEndDateInput) return;
                taskIdInput.value = data.id || '';
                taskProjectNameSelect.value = data.projectName || '';
                taskStatusSelect.value = data.status || '';
                taskNameInput.value = data.task || '';
                taskDescriptionInput.value = data.description || '';
                taskStartDateInput.value = data.startDate || '';
                taskEndDateInput.value = data.endDate || '';
                if (taskStatusSelect.value && taskStatusSelect.value === (getAppState().statusList.find(s => s.name.toLowerCase().includes('no iniciado'))?.name || "No Iniciado")) {
                    if (taskStartDateInput) taskStartDateInput.value = '';
                }
            } else {
                if (taskIdInput) taskIdInput.value = '';
                 if (taskStatusSelect && taskStartDateInput) {
                    const initialStatusValue = taskStatusSelect.value;
                    const appState = getAppState();
                    const notStartedStatus = appState.statusList.find(s => s.name.toLowerCase().includes('no iniciado'));
                    const notStartedStatusName = notStartedStatus ? notStartedStatus.name : "No Iniciado";
                    if (initialStatusValue === notStartedStatusName) taskStartDateInput.value = '';
                }
            }
            break;
        case 'cost':
            if (data) {
                if (!costIdInput || !costProjectNameInput || !costBudgetInput || !costActualInput) return;
                costIdInput.value = data.id || '';
                costProjectNameInput.value = data.projectName || '';
                costBudgetInput.value = (data.budget >= 0) ? data.budget.toFixed(2) : '';
                costActualInput.value = (data.actualCost >= 0) ? data.actualCost.toFixed(2) : '';
            }
            break;
        case 'confirmation':
            if (!confirmationModalBody || !confirmConfirmationButton) return;
            confirmationModalBody.innerHTML = message;
            confirmConfirmationButton.textContent = confirmButtonText;
            confirmConfirmationButton.className = `font-medium py-2 px-4 rounded-lg shadow transition duration-300 text-sm text-white bg-${confirmButtonClass}-600 hover:bg-${confirmButtonClass}-700`;
            updateAppState({ currentConfirmationAction: { callback: actionCallback, data: actionData } });
            break;
        case 'spotTrade':
            if (data) {
                spotTradeIdInput.value = data.id || '';
                tradeDateInput.value = data.tradeDate ? new Date(data.tradeDate).toISOString().slice(0, 16) : '';
                tradeTypeSelect.value = data.type || 'buy';
                baseAssetInput.value = data.baseAsset || '';
                quoteAssetInput.value = data.quoteAsset || '';
                priceInput.value = data.price || '';
                quantityBaseInput.value = data.quantityBase || '';
                totalQuoteInput.value = data.totalQuote || '';
                spotTradeFeesInput.value = data.fees || '';
                notesInput.value = data.notes || '';
            } else {
                spotTradeIdInput.value = '';
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                tradeDateInput.value = now.toISOString().slice(0, 16);
            }
            break;
        case 'futuresTrade':
            const isEditingOpenTrade = data && data.status === 'open';
            const isEditingClosedTrade = data && data.status === 'closed';

            futuresTradeModalTitle.textContent = isEditingClosedTrade ? 'Ver Posición Cerrada' : (isEditingOpenTrade ? 'Ver/Cerrar Posición' : 'Abrir Nueva Posición');
            
            saveFuturesTradeButton.classList.toggle('hidden', isEditingClosedTrade);
            saveFuturesTradeButton.textContent = isEditingOpenTrade ? 'Guardar Cambios' : 'Abrir Posición';
            
            closeFuturesTradeButton.classList.toggle('hidden', !isEditingOpenTrade);

            futuresExitPriceContainer.classList.toggle('hidden', !isEditingOpenTrade && !isEditingClosedTrade);
            futuresExitFeesContainer.classList.toggle('hidden', !isEditingOpenTrade && !isEditingClosedTrade);

            if (data) {
                futuresTradeIdInput.value = data.id || '';
                futuresSymbolInput.value = data.symbol || '';
                futuresDirectionSelect.value = data.direction || 'long';
                futuresLeverageInput.value = data.leverage || '';
                futuresEntryDateInput.value = data.entryDate ? new Date(data.entryDate).toISOString().slice(0, 16) : '';
                futuresQuantityInput.value = data.quantity || '';
                futuresEntryPriceInput.value = data.entryPrice || '';
                futuresEntryFeesInput.value = data.entryFees || '';
                futuresExitPriceInput.value = data.exitPrice || '';
                futuresExitFeesInput.value = data.exitFees || '';
                futuresNotesInput.value = data.notes || '';
            } else {
                futuresTradeIdInput.value = '';
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                futuresEntryDateInput.value = now.toISOString().slice(0, 16);
            }
            break;
        case 'addCoin':
            break;
    }

    openModal(modalElement);
};

export const openAddTaskModal = () => {
    showDynamicModal({ type: 'task', title: 'Agregar Nueva Tarea' });
};

export const openEditTaskModal = (taskIdToEdit) => {
    const currentState = getAppState();
    const taskToEdit = currentState.projectDetails.find(task => task.id === taskIdToEdit);
    if (!taskToEdit) return showToast("Error: Tarea no encontrada.", "error");
    showDynamicModal({ type: 'task', title: 'Editar Tarea', data: taskToEdit });
};

export const openEditCostModal = (costIdToEdit) => {
    const currentState = getAppState();
    const costToEdit = currentState.projectCosts.find(cost => cost.id === costIdToEdit);
    if (!costToEdit) return showToast("Error: Costo no encontrado.", "error");
    showDynamicModal({ type: 'cost', title: `Editar Costos: ${sanitizeHTML(costToEdit.projectName)}`, data: costToEdit });
};

export const openAddSpotTradeModal = () => {
    showDynamicModal({
        type: 'spotTrade',
        title: 'Agregar Operación Spot'
    });
};

export const openEditSpotTradeModal = (tradeId) => {
    const currentState = getAppState();
    const tradeToEdit = currentState.spotTrades.find(trade => trade.id === tradeId);
    
    if (!tradeToEdit) {
        showToast("Error: Operación no encontrada.", "error");
        return;
    }
    showDynamicModal({
        type: 'spotTrade',
        title: 'Editar Operación Spot',
        data: tradeToEdit
    });
};

export const openAddFuturesTradeModal = () => {
    showDynamicModal({
        type: 'futuresTrade',
        title: 'Abrir Nueva Posición de Futuros'
    });
};

export const openEditFuturesTradeModal = (tradeId) => {
    const currentState = getAppState();
    const tradeToEdit = currentState.futuresTrades.find(trade => trade.id === tradeId);
    
    if (!tradeToEdit) {
        showToast("Error: Posición de futuros no encontrada.", "error");
        return;
    }
    showDynamicModal({
        type: 'futuresTrade',
        title: 'Ver/Editar Posición de Futuros',
        data: tradeToEdit
    });
};

const renderCoinSearchResults = (results) => {
    if (!coinSearchResultsContainer) return;
    
    if (results.length === 0) {
        coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron monedas.</p>';
        return;
    }

    const { watchlist } = getAppState();
    const watchlistIds = watchlist.map(item => item.coinId);

    coinSearchResultsContainer.innerHTML = `
        <ul class="space-y-2">
            ${results.map(coin => {
                const isAdded = watchlistIds.includes(coin.id);
                return `
                    <li class="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span class="font-medium text-gray-800 dark:text-gray-200">${sanitizeHTML(coin.name)} (${sanitizeHTML(coin.symbol)})</span>
                        <button class="add-coin-to-watchlist-btn text-sm py-1 px-3 rounded-md transition-colors duration-200 ${isAdded ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}" data-coin-id="${coin.id}" data-coin-name="${sanitizeHTML(coin.name)}" ${isAdded ? 'disabled' : ''}>
                            ${isAdded ? 'Añadida' : '<i class="fas fa-plus"></i> Añadir'}
                        </button>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
};

const _handleCoinSearch = async (searchTerm) => {
    if (!coinSearchResultsContainer) return;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    if (!lowerCaseSearchTerm) {
        coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
        return;
    }

    coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Buscando...</p>';

    try {
        if (allCoinsCache.length === 0) {
            allCoinsCache = await getTop100Coins();
        }
        
        const filteredCoins = allCoinsCache.filter(coin => 
            coin.name.toLowerCase().includes(lowerCaseSearchTerm) || 
            coin.symbol.toLowerCase().includes(lowerCaseSearchTerm)
        );
        
        renderCoinSearchResults(filteredCoins);
    } catch (error) {
        coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-red-500 dark:text-red-400">Error al buscar monedas.</p>';
    }
};
export const handleCoinSearch = debounce(_handleCoinSearch, 300);

export const openAddCoinToWatchlistModal = async () => {
    allCoinsCache = [];
    showDynamicModal({ type: 'addCoin', title: 'Añadir Moneda a la Lista' });
    try {
        if (coinSearchResultsContainer) coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Cargando lista de monedas...</p>';
        allCoinsCache = await getTop100Coins();
        if (coinSearchResultsContainer) coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-gray-500 dark:text-gray-400">Comience a escribir para buscar monedas.</p>';
    } catch (error) {
         if (coinSearchResultsContainer) coinSearchResultsContainer.innerHTML = '<p class="text-center py-4 text-red-500 dark:text-red-400">No se pudo cargar la lista de monedas.</p>';
    }
};

export const openConfirmationModal = (title, message, confirmButtonText, confirmButtonClass, actionCallback, actionData = null) => {
    showDynamicModal({ type: 'confirmation', title, message, confirmButtonText, confirmButtonClass, actionCallback, actionData });
};

export const closeConfirmationModal = () => {
    closeModal(confirmationModal);
};

export const handleChangeAppTitle = async () => {
    if (!mainTitleEl) {
         console.error("Elemento H1 del título principal no encontrado.");
         showToast("Error interno: No se pudo encontrar el título.", "error");
         return;
    }
    const currentState = getAppState();
    const currentTitle = currentState.mainTitle || mainTitleEl.textContent.trim();
    const newTitlePrompt = prompt(`Cambiar el título actual:\n"${currentTitle}"\n\nIngrese el nuevo título (máx 100 caracteres):`, currentTitle);
    if (newTitlePrompt !== null) {
        const trimmedTitle = newTitlePrompt.trim();
        if (trimmedTitle === '') {
            showToast("El título no puede estar vacío.", "error");
            return;
        }
        if (trimmedTitle.length > 100) {
             showToast("El título no puede exceder 100 caracteres.", "error");
             return;
        }
        const sanitizedNewTitle = sanitizeHTML(trimmedTitle);
        try {
            await db.appConfig.put({ key: 'mainTitle', value: sanitizedNewTitle });
            mainTitleEl.textContent = sanitizedNewTitle;
            updateAppState({ mainTitle: sanitizedNewTitle });
            showToast("Título actualizado.", 'success');
        } catch (error) {
            console.error("Error saving title to DB:", error);
            showToast("Error al guardar el título en la base de datos.", "error");
        }
    }
};
