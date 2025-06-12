// src/js/main.js

import {
    // Main Structure
    tabButtons, changeTitleButton, themeToggleButton,
    // Setup
    addStatusButton, newStatusInput, statusListEl,
    addProjectNameButton, newProjectNameInput, projectNameListEl,
    resetDataButton, exportDataButton, importDataButton, importFileInput,
    // Task Modal
    addTaskButton, taskForm, taskModal,
    closeTaskModalButton, cancelTaskModalButton,
    // Project Details
    projectDetailsTableBody, searchProjectTasksInput,
    projectDetailsSortHeaders,
    // Cost Modal
    costForm, costModal,
    closeCostModalButton, cancelCostModalButton,
    // Project Costs
    projectCostTableBody, searchProjectCostsInput,
    projectCostSortHeaders,
    // Finance
    monthlyIncomeInput, addExpenseForm, fixedExpensesTableBody, searchFixedExpensesInput,
    fixedExpensesSortHeaders,
    // Confirmation Modal
    confirmationModal, closeConfirmationModalButton, cancelConfirmationModalButton, confirmConfirmationButton,
    // Overview
    chartTypeSelect,
    // Auth
    loginForm, registerForm,
    showRegisterFormButton, logoutButton,
    // Spot Trading
    addSpotTradeButton,
    spotTradeModal,
    spotTradeForm,
    closeSpotTradeModalButton,
    cancelSpotTradeModalButton,
    spotTradesTableBody,
    priceInput,
    quantityBaseInput,
    totalQuoteInput,
    // App Mode
    appModeSelector,
    // Futures Trading
    addFuturesTradeButton,
    futuresTradeModal,
    futuresTradeForm,
    closeFuturesTradeModalButton,
    cancelFuturesTradeModalButton,
    closeFuturesTradeButton,
    futuresTradesTableBody,
    // Crypto Panel & Watchlist
    addCoinModal,
    closeAddCoinModalButton,
    cancelAddCoinModalButton,
    searchCoinInput,
    coinSearchResultsContainer,
    cryptoWatchlistContainer,
    cryptoPanelContent,
    // Spot Filters
    applySpotFiltersBtn,
    clearSpotFiltersBtn
} from './domElements.js';

import { loadData, addToWatchlist, removeFromWatchlist } from './storage.js';
import { getAppState, updateAppState } from './state.js';
import { loadThemePreference, toggleDarkMode } from './theme.js';
import {
    openAddTaskModal, closeModal,
    handleChangeAppTitle, closeConfirmationModal,
    openEditTaskModal, openEditCostModal,
    openAddSpotTradeModal,
    openEditSpotTradeModal,
    openAddFuturesTradeModal,
    openEditFuturesTradeModal,
    openAddCoinToWatchlistModal,
    handleCoinSearch
} from './modalHandlers.js';
import {
    handleTabClick, handleAddStatus, handleAddProjectName,
    handleDeleteStatus, handleDeleteProjectName, handleResetData,
    handleTaskFormSubmit, handleDeleteTask, handleCostFormSubmit,
    handleIncomeChange, handleAddFixedExpense, handleDeleteFixedExpense,
    handleExportData, triggerImportFile, handleImportFile,
    handleTableSort, handleConfirmAction,
    handleChartTypeChange,
    handleSearchProjectTasks,
    handleSearchProjectCosts,
    handleSearchFixedExpenses,
    handleStatusColorChange,
    handleSpotTradeFormSubmit,
    handleDeleteSpotTrade,
    updateUIMode,
    handleAppModeChange,
    handleFuturesTradeFormSubmit,
    handleCloseFuturesTrade,
    handleDeleteFuturesTrade,
    handleApplySpotFilters,
    handleClearSpotFilters
} from './eventHandlers.js';
import {
    handleLogin, handleRegister, handleLogout,
    showLoginForm, showRegisterForm,
    checkAuthStatus, checkForRegisteredUser
} from './auth.js';
import { showToast, setButtonLoadingState } from './utils.js';
import { renderCryptoPanel } from './uiRender.js';

let deferredPrompt;

const attachStaticListeners = () => {
    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
    }

    if(changeTitleButton) changeTitleButton.addEventListener('click', handleChangeAppTitle);
    if(themeToggleButton) themeToggleButton.addEventListener('click', toggleDarkMode);

    if(addStatusButton) addStatusButton.addEventListener('click', handleAddStatus);
    if(newStatusInput) newStatusInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStatus(); }});

    if(addProjectNameButton) addProjectNameButton.addEventListener('click', handleAddProjectName);
    if(newProjectNameInput) newProjectNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProjectName(); }});

    if(resetDataButton) resetDataButton.addEventListener('click', handleResetData);
    if(exportDataButton) exportDataButton.addEventListener('click', handleExportData);
    if(importDataButton) importDataButton.addEventListener('click', triggerImportFile);
    if(importFileInput) importFileInput.addEventListener('change', handleImportFile);

    if(addTaskButton) addTaskButton.addEventListener('click', openAddTaskModal);
    if(taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
    if(closeTaskModalButton) closeTaskModalButton.addEventListener('click', () => closeModal(taskModal));
    if(cancelTaskModalButton) cancelTaskModalButton.addEventListener('click', () => closeModal(taskModal));
    if(taskModal) taskModal.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(taskModal); });

    if(costForm) costForm.addEventListener('submit', handleCostFormSubmit);
    if(closeCostModalButton) closeCostModalButton.addEventListener('click', () => closeModal(costModal));
    if(cancelCostModalButton) cancelCostModalButton.addEventListener('click', () => closeModal(costModal));
    if(costModal) costModal.addEventListener('click', (e) => { if (e.target === costModal) closeModal(costModal); });

    if(closeConfirmationModalButton) closeConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if(cancelConfirmationModalButton) cancelConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if(confirmConfirmationButton) confirmConfirmationButton.addEventListener('click', handleConfirmAction);
    if(confirmationModal) confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); });

    if(monthlyIncomeInput) {
        monthlyIncomeInput.addEventListener('blur', handleIncomeChange);
        monthlyIncomeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleIncomeChange(e); e.target.blur(); }});
    }
    if(addExpenseForm) addExpenseForm.addEventListener('submit', handleAddFixedExpense);

    if(chartTypeSelect) chartTypeSelect.addEventListener('change', handleChartTypeChange);

    if(searchProjectTasksInput) searchProjectTasksInput.addEventListener('input', handleSearchProjectTasks);
    if(searchProjectCostsInput) searchProjectCostsInput.addEventListener('input', handleSearchProjectCosts);
    if(searchFixedExpensesInput) searchFixedExpensesInput.addEventListener('input', handleSearchFixedExpenses);

    if(applySpotFiltersBtn) applySpotFiltersBtn.addEventListener('click', handleApplySpotFilters);
    if(clearSpotFiltersBtn) clearSpotFiltersBtn.addEventListener('click', handleClearSpotFilters);
    
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(registerForm) registerForm.addEventListener('submit', handleRegister);
    if(showRegisterFormButton) showRegisterFormButton.addEventListener('click', showRegisterForm);
    document.querySelectorAll('#show-login-form-button').forEach(btn => {
        if (btn) btn.addEventListener('click', showLoginForm);
    });
    if(logoutButton) logoutButton.addEventListener('click', handleLogout);

    if(addSpotTradeButton) addSpotTradeButton.addEventListener('click', openAddSpotTradeModal);
    if(spotTradeForm) spotTradeForm.addEventListener('submit', handleSpotTradeFormSubmit);
    if(closeSpotTradeModalButton) closeSpotTradeModalButton.addEventListener('click', () => closeModal(spotTradeModal));
    if(cancelSpotTradeModalButton) cancelSpotTradeModalButton.addEventListener('click', () => closeModal(spotTradeModal));
    if(spotTradeModal) spotTradeModal.addEventListener('click', (e) => { if (e.target === spotTradeModal) closeModal(spotTradeModal); });

    const updateTotalQuote = () => {
        if (!priceInput || !quantityBaseInput || !totalQuoteInput) return;
        const price = parseFloat(priceInput.value);
        const quantity = parseFloat(quantityBaseInput.value);
        if (!isNaN(price) && !isNaN(quantity)) {
            totalQuoteInput.value = (price * quantity).toFixed(2);
        } else {
            totalQuoteInput.value = '';
        }
    };
    if (priceInput) priceInput.addEventListener('input', updateTotalQuote);
    if (quantityBaseInput) quantityBaseInput.addEventListener('input', updateTotalQuote);
    
    if(appModeSelector) {
        appModeSelector.addEventListener('change', handleAppModeChange);
    }

    if(addFuturesTradeButton) addFuturesTradeButton.addEventListener('click', openAddFuturesTradeModal);
    if(futuresTradeForm) futuresTradeForm.addEventListener('submit', handleFuturesTradeFormSubmit);
    if(closeFuturesTradeModalButton) closeFuturesTradeModalButton.addEventListener('click', () => closeModal(futuresTradeModal));
    if(cancelFuturesTradeModalButton) cancelFuturesTradeModalButton.addEventListener('click', () => closeModal(futuresTradeModal));
    if(futuresTradeModal) futuresTradeModal.addEventListener('click', (e) => { if (e.target === futuresTradeModal) closeModal(futuresTradeModal); });
    if(closeFuturesTradeButton) closeFuturesTradeButton.addEventListener('click', handleCloseFuturesTrade);
    
    if(closeAddCoinModalButton) closeAddCoinModalButton.addEventListener('click', () => closeModal(addCoinModal));
    if(cancelAddCoinModalButton) cancelAddCoinModalButton.addEventListener('click', () => closeModal(addCoinModal));
    if(addCoinModal) addCoinModal.addEventListener('click', (e) => { if (e.target === addCoinModal) closeModal(addCoinModal); });
    if(searchCoinInput) searchCoinInput.addEventListener('input', (e) => handleCoinSearch(e.target.value));
};

const attachDelegatedListeners = () => {
    const setupListDelegation = (parentElement, selector, handlerFn) => {
        if(parentElement) {
            parentElement.addEventListener('click', (event) => {
                const targetButton = event.target.closest(selector);
                if (targetButton && targetButton.dataset.id) {
                    handlerFn(targetButton.dataset.id);
                }
            });
        }
    };
    setupListDelegation(statusListEl, '.delete-status-button', handleDeleteStatus);
    setupListDelegation(projectNameListEl, '.delete-project-name-button', handleDeleteProjectName);
    setupListDelegation(fixedExpensesTableBody, '.delete-expense-button', handleDeleteFixedExpense);

    if(projectDetailsTableBody) {
        projectDetailsTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-task-button');
            const deleteBtn = event.target.closest('.delete-task-button');
            if (editBtn && editBtn.dataset.id) openEditTaskModal(editBtn.dataset.id);
            else if (deleteBtn && deleteBtn.dataset.id) handleDeleteTask(deleteBtn.dataset.id);
        });
    }

    if(projectCostTableBody) {
        projectCostTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-cost-button');
            if (editBtn && editBtn.dataset.id) openEditCostModal(editBtn.dataset.id);
        });
    }
    
    if(spotTradesTableBody) {
        spotTradesTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-spot-trade-button');
            const deleteBtn = event.target.closest('.delete-spot-trade-button');
            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
            
            if (!id) return;

            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) return;

            if (editBtn) {
                openEditSpotTradeModal(numericId);
            } else if (deleteBtn) {
                handleDeleteSpotTrade(numericId);
            }
        });
    }

    if(futuresTradesTableBody) {
        futuresTradesTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-futures-trade-button');
            const deleteBtn = event.target.closest('.delete-futures-trade-button');
            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;

            if (!id) return;
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) return;
            
            if (editBtn) {
                openEditFuturesTradeModal(numericId);
            } else if (deleteBtn) {
                handleDeleteFuturesTrade(numericId);
            }
        });
    }

    if(statusListEl) {
        statusListEl.addEventListener('input', (event) => {
            const colorInput = event.target.closest('.status-color-picker');
            if (colorInput) {
                handleStatusColorChange(event);
            }
        });
    }

    const setupSortDelegation = (container) => {
        if(container) {
            container.addEventListener('click', (event) => {
                const sortButton = event.target.closest('.sortable-header');
                if (sortButton && sortButton.matches('button')) {
                    handleTableSort(event);
                }
            });
        }
    };
    setupSortDelegation(projectDetailsSortHeaders);
    setupSortDelegation(projectCostSortHeaders);
    setupSortDelegation(fixedExpensesSortHeaders);
    
    if (cryptoPanelContent) {
        cryptoPanelContent.addEventListener('click', async (event) => {
            if (event.target.closest('#add-to-watchlist-button')) {
                openAddCoinToWatchlistModal();
            }
            const removeBtn = event.target.closest('.remove-from-watchlist-button');
            if (removeBtn && removeBtn.dataset.coinId) {
                const coinId = removeBtn.dataset.coinId;
                await removeFromWatchlist(coinId);
                const { watchlist } = getAppState();
                const updatedWatchlist = watchlist.filter(item => item.coinId !== coinId);
                updateAppState({ watchlist: updatedWatchlist });
                renderCryptoPanel();
            }
        });
    }

    if (coinSearchResultsContainer) {
        coinSearchResultsContainer.addEventListener('click', async (event) => {
            const addBtn = event.target.closest('.add-coin-to-watchlist-btn');
            if (addBtn && addBtn.dataset.coinId && !addBtn.disabled) {
                const coinId = addBtn.dataset.coinId;
                const coinName = addBtn.dataset.coinName;

                setButtonLoadingState(addBtn, true, '...');
                const newItem = await addToWatchlist(coinId);
                if (newItem) {
                    const { watchlist } = getAppState();
                    updateAppState({ watchlist: [...watchlist, newItem] });
                }
                setButtonLoadingState(addBtn, false, 'Añadir');
                addBtn.textContent = 'Añadida';
                addBtn.disabled = true;
                addBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                addBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                renderCryptoPanel();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando Rastreador...");

    const installButton = document.getElementById('my-custom-install-button');
    const installContainer = document.getElementById('pwa-install-container');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installContainer) {
            installContainer.classList.remove('hidden');
            showToast("¿Quieres instalar Zenithtrack App?", "info", 5000);
        }
        console.log("Evento beforeinstallprompt disparado.");
    });

    if (installButton) {
        installButton.addEventListener('click', () => {
            if (installContainer) {
                installContainer.classList.add('hidden');
            }
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuario aceptó la instalación de la PWA');
                        showToast("¡Zenithtrack App instalada!", "success");
                    } else {
                        console.log('Usuario canceló la instalación de la PWA');
                        showToast("Instalación cancelada.", "error");
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        console.log('Zenithtrack App instalada exitosamente!');
        if (installContainer) {
            installContainer.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    try {
        loadThemePreference();
        const isAuthenticated = await checkAuthStatus();

        if (isAuthenticated) {
            const { activeUserMode } = getAppState();
            updateUIMode(activeUserMode);
        } else {
            checkForRegisteredUser();
        }

        attachStaticListeners();
        attachDelegatedListeners();

    } catch (error) {
        console.error("Error durante la inicialización de la aplicación:", error);
        showToast("Error crítico al inicializar la aplicación. Revise la consola.", "error");
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;"><h1>Error al cargar la aplicación</h1><p>Ha ocurrido un error inesperado. Por favor, intente recargar la página.</p><p><em>Detalles: ${error.message}</em></p></div>`;
        }
    }
});
