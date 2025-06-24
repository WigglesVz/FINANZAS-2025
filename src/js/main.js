// src/js/main.js

import { initializeDomElements, getDomElements } from './domElements.js';
import { loadThemePreference, toggleDarkMode } from './theme.js';
import {
    openAddTaskModal, closeModal, handleChangeAppTitle,
    openEditTaskModal, openEditCostModal, openAddSpotTradeModal,
    openEditSpotTradeModal, openAddFuturesTradeModal, openEditFuturesTradeModal,
    openAddCoinToWatchlistModal, // VERIFICAR ESTA IMPORTACIÓN
    handleCoinSearch as modalHandleCoinSearch,
    closeConfirmationModal
} from './modalHandlers.js';
import {
    handleTabClick, handleAddStatus, handleAddProjectName,
    handleDeleteStatus, handleDeleteProjectName, handleResetData,
    handleTaskFormSubmit, handleDeleteTask, handleCostFormSubmit,
    handleIncomeChange, handleAddFixedExpense, handleDeleteFixedExpense,
    handleExportData, triggerImportFile, handleImportFile,
    handleTableSort, handleConfirmAction, handleChartTypeChange,
    handleSearchProjectTasks, handleSearchProjectCosts, handleSearchFixedExpenses,
    handleStatusColorChange, handleSpotTradeFormSubmit, handleDeleteSpotTrade,
    updateUIMode, handleAppModeChange, handleFuturesTradeFormSubmit,
    handleCloseFuturesTrade, handleDeleteFuturesTrade,
    handleApplySpotFilters, handleClearSpotFilters,
    handleAddCoinToWatchlistFromModal,
    handleRemoveCoinFromWatchlist
} from './eventHandlers.js';
import {
    handleLogin, handleRegister, handleLogout,
    showLoginForm, showRegisterForm,
    checkAuthStatus, checkForRegisteredUser
} from './auth.js';
import { showToast, sanitizeHTML } from './utils.js';

let deferredPrompt;

const attachStaticListeners = () => {
    const dom = getDomElements();

    if (dom.tabButtons && dom.tabButtons.length) {
        dom.tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
    }
    if (dom.changeTitleButton) dom.changeTitleButton.addEventListener('click', handleChangeAppTitle);
    if (dom.themeToggleButton) dom.themeToggleButton.addEventListener('click', toggleDarkMode);
    if (dom.addStatusButton) dom.addStatusButton.addEventListener('click', handleAddStatus);
    if (dom.newStatusInput) dom.newStatusInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStatus(); }});
    if (dom.addProjectNameButton) dom.addProjectNameButton.addEventListener('click', handleAddProjectName);
    if (dom.newProjectNameInput) dom.newProjectNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProjectName(); }});
    if (dom.resetDataButton) dom.resetDataButton.addEventListener('click', handleResetData);
    if (dom.exportDataButton) dom.exportDataButton.addEventListener('click', handleExportData);
    if (dom.importDataButton) dom.importDataButton.addEventListener('click', triggerImportFile);
    if (dom.importFileInput) dom.importFileInput.addEventListener('change', handleImportFile);
    if (dom.addTaskButton) dom.addTaskButton.addEventListener('click', openAddTaskModal);
    if (dom.taskForm) dom.taskForm.addEventListener('submit', handleTaskFormSubmit);
    if (dom.closeTaskModalButton) dom.closeTaskModalButton.addEventListener('click', () => closeModal(dom.taskModal));
    if (dom.cancelTaskModalButton) dom.cancelTaskModalButton.addEventListener('click', () => closeModal(dom.taskModal));
    if (dom.taskModal) dom.taskModal.addEventListener('click', (e) => { if (e.target === dom.taskModal) closeModal(dom.taskModal); });
    if (dom.costForm) dom.costForm.addEventListener('submit', handleCostFormSubmit);
    if (dom.closeCostModalButton) dom.closeCostModalButton.addEventListener('click', () => closeModal(dom.costModal));
    if (dom.cancelCostModalButton) dom.cancelCostModalButton.addEventListener('click', () => closeModal(dom.costModal));
    if (dom.costModal) dom.costModal.addEventListener('click', (e) => { if (e.target === dom.costModal) closeModal(dom.costModal); });
    if (dom.closeConfirmationModalButton) dom.closeConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if (dom.cancelConfirmationModalButton) dom.cancelConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if (dom.confirmConfirmationButton) {
        console.log("MAIN.JS: Adjuntando listener a confirmConfirmationButton");
        dom.confirmConfirmationButton.addEventListener('click', handleConfirmAction);
    } else {
        console.error("MAIN.JS: confirmConfirmationButton NO ENCONTRADO para adjuntar listener.");
    }
    if (dom.confirmationModal) dom.confirmationModal.addEventListener('click', (e) => { if (e.target === dom.confirmationModal) closeModal(dom.confirmationModal); });
    if (dom.monthlyIncomeInput) {
        dom.monthlyIncomeInput.addEventListener('blur', handleIncomeChange);
        dom.monthlyIncomeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleIncomeChange(e); e.target.blur(); }});
    }
    if (dom.addExpenseForm) dom.addExpenseForm.addEventListener('submit', handleAddFixedExpense);
    if (dom.chartTypeSelect) dom.chartTypeSelect.addEventListener('change', handleChartTypeChange);
    if (dom.searchProjectTasksInput) dom.searchProjectTasksInput.addEventListener('input', handleSearchProjectTasks);
    if (dom.searchProjectCostsInput) dom.searchProjectCostsInput.addEventListener('input', handleSearchProjectCosts);
    if (dom.searchFixedExpensesInput) dom.searchFixedExpensesInput.addEventListener('input', handleSearchFixedExpenses);
    if (dom.applySpotFiltersBtn) dom.applySpotFiltersBtn.addEventListener('click', handleApplySpotFilters);
    if (dom.clearSpotFiltersBtn) dom.clearSpotFiltersBtn.addEventListener('click', handleClearSpotFilters);
    if (dom.loginForm) dom.loginForm.addEventListener('submit', handleLogin);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', handleRegister);
    if (dom.showRegisterFormButton) dom.showRegisterFormButton.addEventListener('click', showRegisterForm);
    if (dom.showLoginFormButton && dom.showLoginFormButton.length > 0) {
        dom.showLoginFormButton.forEach(btn => { if (btn) btn.addEventListener('click', showLoginForm); });
    }
    if (dom.logoutButton) dom.logoutButton.addEventListener('click', handleLogout);
    if (dom.addSpotTradeButton) dom.addSpotTradeButton.addEventListener('click', openAddSpotTradeModal);
    if (dom.spotTradeForm) dom.spotTradeForm.addEventListener('submit', handleSpotTradeFormSubmit);
    if (dom.closeSpotTradeModalButton) dom.closeSpotTradeModalButton.addEventListener('click', () => closeModal(dom.spotTradeModal));
    if (dom.cancelSpotTradeModalButton) dom.cancelSpotTradeModalButton.addEventListener('click', () => closeModal(dom.spotTradeModal));
    if (dom.spotTradeModal) dom.spotTradeModal.addEventListener('click', (e) => { if (e.target === dom.spotTradeModal) closeModal(dom.spotTradeModal); });
    const updateTotalQuote = () => {
        const currentDom = getDomElements();
        if (!currentDom.priceInput || !currentDom.quantityBaseInput || !currentDom.totalQuoteInput) return;
        const price = parseFloat(currentDom.priceInput.value);
        const quantity = parseFloat(currentDom.quantityBaseInput.value);
        if (!isNaN(price) && !isNaN(quantity)) { currentDom.totalQuoteInput.value = (price * quantity).toFixed(2); }
        else { currentDom.totalQuoteInput.value = ''; }
    };
    if (dom.priceInput) dom.priceInput.addEventListener('input', updateTotalQuote);
    if (dom.quantityBaseInput) dom.quantityBaseInput.addEventListener('input', updateTotalQuote);
    if (dom.appModeSelector) dom.appModeSelector.addEventListener('change', handleAppModeChange);
    if (dom.addFuturesTradeButton) dom.addFuturesTradeButton.addEventListener('click', openAddFuturesTradeModal);
    if (dom.futuresTradeForm) dom.futuresTradeForm.addEventListener('submit', handleFuturesTradeFormSubmit);
    if (dom.closeFuturesTradeModalButton) dom.closeFuturesTradeModalButton.addEventListener('click', () => closeModal(dom.futuresTradeModal));
    if (dom.cancelFuturesTradeModalButton) dom.cancelFuturesTradeModalButton.addEventListener('click', () => closeModal(dom.futuresTradeModal));
    if (dom.futuresTradeModal) dom.futuresTradeModal.addEventListener('click', (e) => { if (e.target === dom.futuresTradeModal) closeModal(dom.futuresTradeModal); });
    if (dom.closeFuturesTradeButton) dom.closeFuturesTradeButton.addEventListener('click', handleCloseFuturesTrade);
    if (dom.closeAddCoinModalButton) dom.closeAddCoinModalButton.addEventListener('click', () => closeModal(dom.addCoinModal));
    if (dom.cancelAddCoinModalButton) dom.cancelAddCoinModalButton.addEventListener('click', () => closeModal(dom.addCoinModal));
    if (dom.addCoinModal) dom.addCoinModal.addEventListener('click', (e) => { if (e.target === dom.addCoinModal) closeModal(dom.addCoinModal); });
    if (dom.searchCoinInput) dom.searchCoinInput.addEventListener('input', (e) => modalHandleCoinSearch(e.target.value));
    
    // --- INICIO DE LA MODIFICACIÓN ---
    if (dom.cryptoPanelContent) {
        dom.cryptoPanelContent.addEventListener('click', (event) => {
            console.log('[MAIN.JS DEBUG] Clic detectado en cryptoPanelContent. Target:', event.target);
            
            const addToWatchlistButton = event.target.closest('#add-to-watchlist-button');
            
            if (addToWatchlistButton) {
                console.log('[MAIN.JS DEBUG] Botón #add-to-watchlist-button encontrado y clickeado.');
                openAddCoinToWatchlistModal(); // Esta es la función que abre el modal
            } else {
                console.log('[MAIN.JS DEBUG] Botón #add-to-watchlist-button NO encontrado por .closest().');
            }
        });
    }
    // --- FIN DE LA MODIFICACIÓN ---
};

const attachDelegatedListeners = () => {
    const dom = getDomElements();
    const setupListDelegation = (parentElement, selector, handlerFn) => {
        if (parentElement) {
            parentElement.addEventListener('click', (event) => {
                const targetButton = event.target.closest(selector);
                if (targetButton && targetButton.dataset.id) {
                    if (selector === '.delete-expense-button') console.log('DELEGATION (main.js): Botón Delete Fixed Expense clickeado. ID:', targetButton.dataset.id);
                    handlerFn(targetButton.dataset.id);
                } else if (targetButton && selector === '.delete-expense-button') {
                    console.log('DELEGATION (main.js): Botón Delete Fixed Expense clickeado, PERO SIN data-id. Botón:', targetButton);
                }
            });
        }
    };
    if (dom.statusListEl) setupListDelegation(dom.statusListEl, '.delete-status-button', handleDeleteStatus);
    if (dom.projectNameListEl) setupListDelegation(dom.projectNameListEl, '.delete-project-name-button', handleDeleteProjectName);
    if (dom.fixedExpensesTableBody) {
        console.log("MAIN.JS: Adjuntando listener delegado a fixedExpensesTableBody.");
        setupListDelegation(dom.fixedExpensesTableBody, '.delete-expense-button', handleDeleteFixedExpense);
    } else { console.error("MAIN.JS: fixedExpensesTableBody NO ENCONTRADO para adjuntar listener delegado."); }

    if (dom.projectDetailsTableBody) {
        dom.projectDetailsTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-task-button');
            const deleteBtn = event.target.closest('.delete-task-button');
            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
            if (!id && (editBtn || deleteBtn)) console.log('DELEGATION (main.js): Botón Tarea (Editar/Borrar) clickeado, PERO SIN data-id. Botón:', editBtn || deleteBtn);
            if (!id) return;
            if (editBtn) { console.log('DELEGATION (main.js): Botón Edit Task clickeado, ID:', id); openEditTaskModal(id); }
            else if (deleteBtn) { console.log('DELEGATION (main.js): Botón Delete Task clickeado, ID:', id); handleDeleteTask(id); }
        });
    }
    if (dom.projectCostTableBody) {
        dom.projectCostTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-cost-button');
            if (editBtn && editBtn.dataset.id) {
                const costId = editBtn.dataset.id;
                console.log('DELEGATION (main.js): Botón Edit Cost clickeado, ID:', costId);
                openEditCostModal(costId);
            } else if (editBtn) { console.log('DELEGATION (main.js): Botón Edit Cost clickeado, PERO SIN data-id. Botón:', editBtn); }
        });
    }
    if (dom.spotTradesTableBody) {
        dom.spotTradesTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-spot-trade-button');
            const deleteBtn = event.target.closest('.delete-spot-trade-button');
            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
            if (!id && (editBtn || deleteBtn)) console.log('DELEGATION (main.js): Botón Spot (Editar/Borrar) clickeado, PERO SIN data-id. Botón:', editBtn || deleteBtn);
            if (!id) return;
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) { console.log('DELEGATION (main.js): Botón Spot (Editar/Borrar) clickeado, PERO data-id NO NUMÉRICO:', id); return; }
            if (editBtn) { console.log('DELEGATION (main.js): Botón Edit Spot Trade clickeado, ID:', numericId); openEditSpotTradeModal(numericId); }
            else if (deleteBtn) { console.log('DELEGATION (main.js): Botón Delete Spot Trade clickeado, ID:', numericId); handleDeleteSpotTrade(numericId); }
        });
    }
    if (dom.futuresTradesTableBody) {
        dom.futuresTradesTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-futures-trade-button');
            const deleteBtn = event.target.closest('.delete-futures-trade-button');
            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
            if (!id && (editBtn || deleteBtn)) console.log('DELEGATION (main.js): Botón Futuros (Editar/Borrar) clickeado, PERO SIN data-id. Botón:', editBtn || deleteBtn);
            if (!id) return;
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) { console.log('DELEGATION (main.js): Botón Futuros (Editar/Borrar) clickeado, PERO data-id NO NUMÉRICO:', id); return; }
            if (editBtn) { console.log('DELEGATION (main.js): Botón Edit Futures Trade clickeado, ID:', numericId); openEditFuturesTradeModal(numericId); }
            else if (deleteBtn) { console.log('DELEGATION (main.js): Botón Delete Futures Trade clickeado, ID:', numericId); handleDeleteFuturesTrade(numericId); }
        });
    }
    if (dom.statusListEl) {
        dom.statusListEl.addEventListener('input', (event) => {
            const colorInput = event.target.closest('.status-color-picker');
            if (colorInput) handleStatusColorChange(event);
        });
    }
    const setupSortDelegation = (container) => {
        if (container) {
            container.addEventListener('click', (event) => {
                const sortButton = event.target.closest('.sortable-header');
                if (sortButton && sortButton.matches('button')) handleTableSort(event);
            });
        }
    };
    if (dom.projectDetailsSortHeaders) setupSortDelegation(dom.projectDetailsSortHeaders);
    if (dom.projectCostSortHeaders) setupSortDelegation(dom.projectCostSortHeaders);
    if (dom.fixedExpensesSortHeaders) setupSortDelegation(dom.fixedExpensesSortHeaders);

    if (dom.cryptoWatchlistContainer) {
        dom.cryptoWatchlistContainer.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('.remove-from-watchlist-button');
            if (removeBtn && removeBtn.dataset.coinId) {
                handleRemoveCoinFromWatchlist(removeBtn.dataset.coinId);
            }
        });
    }
    if (dom.coinSearchResultsContainer) {
        dom.coinSearchResultsContainer.addEventListener('click', (event) => {
            const addBtn = event.target.closest('.add-coin-to-watchlist-btn');
             if (addBtn && addBtn.dataset.coinId && addBtn.dataset.coinName && !addBtn.disabled) {
                handleAddCoinToWatchlistFromModal(addBtn.dataset.coinId, addBtn.dataset.coinName, addBtn);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando ZenithTrack...");
    initializeDomElements();
    const dom = getDomElements();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installContainer = document.getElementById('pwa-install-container');
        if (installContainer) {
            installContainer.classList.remove('hidden');
            showToast("¿Quieres instalar Zenithtrack App?", "info", 5000);
        } else {
            console.warn("Elemento 'pwa-install-container' no encontrado en el DOM en beforeinstallprompt.");
        }
        console.log("Evento beforeinstallprompt disparado.");
    });

    window.addEventListener('appinstalled', () => {
        console.log('Zenithtrack App instalada exitosamente!');
        const installContainer = document.getElementById('pwa-install-container');
        if (installContainer) {
            installContainer.classList.add('hidden');
        }
        deferredPrompt = null;
        showToast("¡Zenithtrack App instalada!", "success");
    });

    const installButton = document.getElementById('my-custom-install-button');
    if (installButton) {
        installButton.addEventListener('click', () => {
            const installContainer = document.getElementById('pwa-install-container');
            if (installContainer) installContainer.classList.add('hidden');
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuario aceptó la instalación de la PWA');
                    } else {
                        console.log('Usuario canceló la instalación de la PWA');
                        showToast("Instalación cancelada.", "error");
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    try {
        loadThemePreference();
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
            checkForRegisteredUser();
        }
        attachStaticListeners();
        attachDelegatedListeners();
        console.log("ZenithTrack inicializado y listo.");
    } catch (error) {
        console.error("Error crítico durante la inicialización de la aplicación:", error);
        showToast("Error crítico al inicializar. Revise la consola.", "error");
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;"><h1>Error al cargar la aplicación</h1><p>Ha ocurrido un error inesperado.</p><p><em>${sanitizeHTML(error.message)}</em></p></div>`;
        }
    }
});