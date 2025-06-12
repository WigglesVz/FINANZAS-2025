// src/js/eventHandlers.js
import {
    tabButtons, tabContents, changeTitleButton, themeToggleButton,
    addStatusButton, newStatusInput, newStatusError, statusListEl,
    addProjectNameButton, newProjectNameInput, newProjectNameError, projectNameListEl,
    resetDataButton, exportDataButton, importDataButton, importFileInput,
    addTaskButton, taskForm, saveTaskButton, closeTaskModalButton, cancelTaskModalButton, taskModal,
    taskProjectNameSelect, taskStatusSelect, taskNameInput, taskDescriptionInput,
    taskStartDateInput, taskEndDateInput, taskIdInput,
    taskProjectNameError, taskStatusError, taskNameError, taskStartDateError, taskEndDateError,
    projectDetailsTableBody, projectCostTableBody, fixedExpensesTableBody,
    costForm, saveCostButton, closeCostModalButton, cancelCostModalButton, costModal,
    costBudgetInput, costActualInput, costBudgetError, costActualError,
    monthlyIncomeInput, addExpenseForm, addExpenseButton, expenseNameInput, expenseAmountInput,
    expenseNameError, expenseAmountError,
    confirmationModal, closeConfirmationModalButton, cancelConfirmationModalButton, confirmConfirmationButton,
    projectDetailsSortHeaders, projectCostSortHeaders, fixedExpensesSortHeaders,
    projectDetailsTable, projectCostTable, fixedExpensesTable, htmlElement, mainTitleEl,
    chartTypeSelect,
    searchProjectTasksInput, searchProjectCostsInput, searchFixedExpensesInput,
    spotTradeForm, saveSpotTradeButton, spotTradeModal,
    spotTradeIdInput, tradeDateInput, tradeTypeSelect, baseAssetInput,
    quoteAssetInput, priceInput, quantityBaseInput, notesInput, spotTradeFeesInput,
    appModeSelector, modeProjectsRadio, modeCryptoRadio,
    setupStatusListContainer, setupProjectNameListContainer,
    futuresTradeForm, saveFuturesTradeButton, closeFuturesTradeButton, futuresTradeModal,
    futuresTradeIdInput, futuresSymbolInput, futuresDirectionSelect, futuresLeverageInput,
    futuresEntryDateInput, futuresQuantityInput, futuresEntryPriceInput, futuresExitPriceInput,
    futuresNotesInput, futuresEntryFeesInput, futuresExitFeesInput,
    addCoinModal, closeAddCoinModalButton, cancelAddCoinModalButton, searchCoinInput,
    coinSearchResultsContainer, cryptoWatchlistContainer, cryptoPanelContent,
    filterSpotAssetInput, filterSpotStartDateInput, filterSpotEndDateInput, applySpotFiltersBtn, clearSpotFiltersBtn
} from './domElements.js';
import { getAppState, updateAppState } from './state.js';
import {
    renderAll,
    renderProjectDetailsTable, renderProjectCostTable,
    renderFixedExpensesList, renderSetupLists, renderOverview, renderProjectSummaries,
    renderFinanceSummary, renderFinanceTab,
    renderSpotTradesTable,
    renderFuturesTradesTable,
    renderCryptoPanel
} from './uiRender.js';
import {
    openAddTaskModal, openEditTaskModal, openEditCostModal, closeModal,
    openConfirmationModal, closeConfirmationModal, handleChangeAppTitle, updateTaskModalDropdowns,
    openEditSpotTradeModal,
    openEditFuturesTradeModal,
    openAddCoinToWatchlistModal,
    handleCoinSearch
} from './modalHandlers.js';
import db from './db.js';
import { 
    resetToDefaultData, importData, 
    addSpotTrade, updateSpotTrade, deleteSpotTrade,
    addFuturesTrade, updateFuturesTrade, deleteFuturesTrade,
    addToWatchlist,
    removeFromWatchlist
} from './storage.js';
import {
    sanitizeHTML, generateId, showToast,
    clearAllValidationErrors,
    getCurrentDate, 
    setButtonLoadingState,
    debounce, validateForm
} from './utils.js';
import { renderSelectedChart, refreshCurrentChart } from './charts.js';

// --- Handlers de Búsqueda (Ahora con debounce) ---
const _handleSearchProjectTasks = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({
        searchTerms: {
            ...currentState.searchTerms,
            projectDetails: searchTerm
        }
    });
    renderProjectDetailsTable();
};

const _handleSearchProjectCosts = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({
        searchTerms: {
            ...currentState.searchTerms,
            projectCosts: searchTerm
        }
    });
    renderProjectCostTable();
};

const _handleSearchFixedExpenses = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({
        searchTerms: {
            ...currentState.searchTerms,
            fixedExpenses: searchTerm
        }
    });
    renderFixedExpensesList();
};

export const handleSearchProjectTasks = debounce(_handleSearchProjectTasks, 300);
export const handleSearchProjectCosts = debounce(_handleSearchProjectCosts, 300);
export const handleSearchFixedExpenses = debounce(_handleSearchFixedExpenses, 300);
// --- FIN Handlers de Búsqueda ---

export const handleTabClick = (event) => {
    const clickedButton = event.currentTarget;
    const tabId = clickedButton.dataset.tab;

    if (tabButtons) {
        tabButtons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });
    }
    if (tabContents) {
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.hidden = true;
        });
    }

    clickedButton.classList.add('active');
    clickedButton.setAttribute('aria-selected', 'true');
    const activeContent = document.getElementById(`${tabId}-content`);
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.hidden = false;
    }

    if (tabId === 'overview' && chartTypeSelect) {
        renderSelectedChart(chartTypeSelect.value);
    }
    if (tabId === 'details') renderProjectDetailsTable();
    if (tabId === 'cost') renderProjectCostTable();
    if (tabId === 'finance') renderFinanceTab();
    if (tabId === 'spot-trading') {
        requestAnimationFrame(() => {
            renderSpotTradesTable();
        });
    }
    if (tabId === 'futures-trading') {
        requestAnimationFrame(() => {
            renderFuturesTradesTable();
        });
    }
    if (tabId === 'crypto-panel') {
        requestAnimationFrame(() => {
            renderCryptoPanel();
        });
    }
};

// --- Handler para el cambio de color de estado ---
export const handleStatusColorChange = async (event) => {
    const colorInput = event.target;
    if (!colorInput || colorInput.type !== 'color' || !colorInput.classList.contains('status-color-picker')) return;

    const statusId = colorInput.dataset.id;
    const newColor = colorInput.value;
    const currentState = getAppState();

    const statusIndex = currentState.statusList.findIndex(s => s.id === statusId);
    if (statusIndex === -1) {
        showToast("Error: Estado no encontrado para actualizar color.", "error");
        return;
    }

    const updatedStatusList = currentState.statusList.map(s =>
        s.id === statusId ? { ...s, color: newColor } : s
    );
    updateAppState({ statusList: updatedStatusList });

    renderSetupLists();

    try {
        await db.statusList.update(statusId, { color: newColor });
        console.log(`Color de estado actualizado en IndexedDB: Status ID = ${statusId}, Color = ${newColor}`);
        showToast("Color de estado actualizado.", "success");
        refreshCurrentChart();
        renderProjectDetailsTable();
    } catch (error) {
        console.error("Error updating status color in DB:", error);
        showToast("Error al guardar el color del estado.", "error");
    }
};
// --- FIN Handler para el cambio de color de estado ---


const handleAddListItem = async (inputEl, errorEl, listKeyInState, listNameSingular, successMsg, maxLength, renderFn, otherRenderFns = []) => {
    if (!inputEl || !errorEl) {
        console.error(`handleAddListItem (${listNameSingular}): inputEl o errorEl no encontrados.`);
        return false;
    }
    const formOrParentContainer = inputEl.closest('.list-item-adder-container');
    
    if (!formOrParentContainer) { 
        console.error(`handleAddListItem (${listNameSingular}): No se pudo encontrar '.list-item-adder-container' para el inputEl:`, inputEl);
        return false;
    }

    clearAllValidationErrors(formOrParentContainer);
    const newItemName = inputEl.value.trim();
    const currentState = getAppState();
    const list = Array.isArray(currentState[listKeyInState]) ? currentState[listKeyInState] : [];

    const rules = [
        {
            field: inputEl.id,
            errorElementId: errorEl.id, 
            checks: [
                { type: 'required', message: `Ingrese un nombre para el ${listNameSingular}.` },
                { type: 'maxlength', value: maxLength, message: `El nombre no puede exceder ${maxLength} caracteres.` },
                {
                    type: 'custom',
                    message: `El ${listNameSingular} "${sanitizeHTML(newItemName)}" ya existe.`,
                    validate: (value) => !list.some(item => item.name.toLowerCase() === value.toLowerCase() && value !== '')
                }
            ]
        }
    ];

    if (!validateForm(formOrParentContainer, rules)) {
        return false;
    }

    const newItem = { id: generateId(), name: newItemName };
    if (listKeyInState === 'statusList') {
        newItem.color = '#CCCCCC';
    }

    try {
        if (listNameSingular === 'proyecto') {
            const currentProjectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
            const newProjectCostEntry = { id: generateId(), projectName: newItemName, budget: 0, actualCost: 0 };
            await db.transaction('rw', db[listKeyInState], db.projectCosts, async () => {
                await db[listKeyInState].add(newItem);
                if (!currentProjectCosts.some(cost => cost.projectName === newItemName)) {
                    await db.projectCosts.add(newProjectCostEntry);
                }
            });
            const updatedList = [...list, newItem];
            let updatesForState = { [listKeyInState]: updatedList };
            if (!currentProjectCosts.some(cost => cost.projectName === newItemName)) {
                updatesForState.projectCosts = [...currentProjectCosts, newProjectCostEntry];
            }
            updateAppState(updatesForState);
        } else {
            await db[listKeyInState].add(newItem);
            const updatedList = [...list, newItem];
            updateAppState({ [listKeyInState]: updatedList });
        }
        showToast(successMsg, 'success');
        renderFn();
        otherRenderFns.forEach(fn => fn());
        inputEl.value = '';
        inputEl.focus();
        return true;
    } catch (error) {
        console.error(`Error adding ${listNameSingular} to DB:`, error);
        showToast(`Error al guardar ${listNameSingular} en la base de datos.`, 'error');
        return false;
    }
};

export const handleAddStatus = async () => {
    const addButton = addStatusButton;
    if (!addButton) return;
    setButtonLoadingState(addButton, true, 'Agregando...');
    await handleAddListItem(
        newStatusInput, newStatusError, 'statusList', 'estado', "Estado agregado.", 50,
        renderSetupLists,
        [updateTaskModalDropdowns, refreshCurrentChart]
    );
    setButtonLoadingState(addButton, false);
};

export const handleAddProjectName = async () => {
    const addButton = addProjectNameButton;
    if (!addButton) return;
    setButtonLoadingState(addButton, true, 'Agregando...');
    await handleAddListItem(
        newProjectNameInput, newProjectNameError, 'projectNameList', 'proyecto', "Proyecto agregado.", 100,
        renderSetupLists,
        [renderProjectCostTable, renderProjectSummaries, renderOverview, updateTaskModalDropdowns, refreshCurrentChart]
    );
    setButtonLoadingState(addButton, false);
};


const handleDeleteListItem = (itemId, listKeyInState, listNameSingular, dependentCheckFn, successMsg, renderFn, otherRenderFns = []) => {
    const currentState = getAppState();
    const list = Array.isArray(currentState[listKeyInState]) ? currentState[listKeyInState] : [];
    const itemToDelete = list.find(item => item.id === itemId);

    if (!itemToDelete) {
        showToast(`Error: ${listNameSingular} no encontrado.`, "error");
        return;
    }

    if (dependentCheckFn && dependentCheckFn(itemToDelete.name, currentState)) return;

    openConfirmationModal(
        "Confirmar Eliminación",
        `¿Está seguro de eliminar el ${listNameSingular} "<strong>${sanitizeHTML(itemToDelete.name)}</strong>"? ${listNameSingular === 'proyecto' ? 'Sus costos asociados también serán eliminados.' : ''} Esta acción no se puede deshacer.`,
        "Eliminar", "red",
        async () => {
            try {
                const currentData = getAppState();
                if (listNameSingular === 'proyecto') {
                    const costsToDelete = currentData.projectCosts.filter(cost => cost.projectName === itemToDelete.name).map(c => c.id);
                    await db.transaction('rw', db[listKeyInState], db.projectCosts, async () => {
                        await db[listKeyInState].delete(itemId);
                        if (costsToDelete.length > 0) {
                            await db.projectCosts.bulkDelete(costsToDelete);
                        }
                    });
                } else {
                    await db[listKeyInState].delete(itemId);
                }

                let updatesForState = {};
                updatesForState[listKeyInState] = currentData[listKeyInState].filter(item => item.id !== itemId);
                if (listNameSingular === 'proyecto') {
                    updatesForState.projectCosts = currentData.projectCosts.filter(cost => cost.projectName !== itemToDelete.name);
                }
                updateAppState(updatesForState);

                showToast(successMsg, 'success');
                renderFn();
                otherRenderFns.forEach(fn => fn());

            } catch (error) {
                console.error(`Error deleting ${listNameSingular} from DB:`, error);
                showToast(`Error al eliminar ${listNameSingular} de la base de datos.`, 'error');
            }
        }
    );
};

export const handleDeleteStatus = (statusId) => {
    handleDeleteListItem(
        statusId, 'statusList', 'estado',
        (statusName, currentState) => {
            const tasksUsingStatus = currentState.projectDetails.filter(task => task.status === statusName);
            if (tasksUsingStatus.length > 0) {
                showToast(`No se puede eliminar "${sanitizeHTML(statusName)}" porque está en uso por ${tasksUsingStatus.length} tarea(s).`, "error");
                return true;
            }
            return false;
        },
        "Estado eliminado.",
        renderSetupLists,
        [updateTaskModalDropdowns, refreshCurrentChart]
    );
};

export const handleDeleteProjectName = (projectId) => {
     handleDeleteListItem(
        projectId, 'projectNameList', 'proyecto',
        (projectName, currentState) => {
            const tasksUsingProject = currentState.projectDetails.filter(task => task.projectName === projectName);
            if (tasksUsingProject.length > 0) {
                showToast(`No se puede eliminar "${sanitizeHTML(projectName)}" porque tiene ${tasksUsingProject.length} tarea(s) asociadas.`, "error");
                return true;
            }
            return false;
        },
        "Proyecto eliminado.",
        renderSetupLists,
        [renderProjectCostTable, renderProjectSummaries, renderOverview, updateTaskModalDropdowns, refreshCurrentChart]
    );
};

export const handleResetData = async () => {
    openConfirmationModal(
        "¡ADVERTENCIA! Restablecer Datos",
        `¿Está <strong>MUY seguro</strong>? Esto eliminará <strong>TODOS</strong> sus datos actuales y cargará los datos de ejemplo.<br><br>Esta acción es <strong>irreversible</strong>.`,
        "Sí, Restablecer Todo", "red",
        async () => {
            if (!resetDataButton) return;
            setButtonLoadingState(resetDataButton, true, 'Restableciendo...');
            await resetToDefaultData();
            renderAll();
            refreshCurrentChart();
            setButtonLoadingState(resetDataButton, false);
        }
   );
};

export const handleTaskFormSubmit = async (event) => {
    event.preventDefault();
    if (!taskForm) return;

    const appState = getAppState();
    const currentSelectedStatusValue = taskStatusSelect ? taskStatusSelect.value : '';
    const notStartedStatus = appState.statusList.find(s => s.name.toLowerCase().includes('no iniciado'));
    const notStartedStatusName = notStartedStatus ? notStartedStatus.name : "No Iniciado";
    const isNotStarted = currentSelectedStatusValue === notStartedStatusName;

    const validationRules = [
        { field: 'task-project-name', errorElementId: 'task-project-name-error', checks: [{ type: 'selectRequired', message: "Seleccione un proyecto." }] },
        { field: 'task-status', errorElementId: 'task-status-error', checks: [{ type: 'selectRequired', message: "Seleccione un estado." }] },
        { field: 'task-name', errorElementId: 'task-name-error', checks: [ { type: 'required', message: "Ingrese el nombre de la tarea." }, { type: 'maxlength', value: 100, message: "Máx 100 caracteres." } ] },
        { field: 'task-start-date', errorElementId: 'task-start-date-error', checks: [] },
        { field: 'task-end-date', errorElementId: 'task-end-date-error', checks: [ { type: 'required', message: "Ingrese fecha de fin." } ] }
    ];

    const startDateRule = validationRules.find(rule => rule.field === 'task-start-date');
    if (startDateRule && !isNotStarted) {
        startDateRule.checks.push({ type: 'required', message: "Ingrese fecha de inicio." });
    }

    const endDateRule = validationRules.find(rule => rule.field === 'task-end-date');
    const startDateValue = taskStartDateInput ? taskStartDateInput.value : '';
    if (endDateRule && startDateValue) {
        endDateRule.checks.push({ type: 'dateComparison', compareTo: 'task-start-date', operator: 'greaterThanOrEqualTo', message: "La fecha de fin no puede ser anterior a la de inicio." });
    }

    if (!validateForm(taskForm, validationRules)) {
        showToast('Complete los campos requeridos (*).', 'error');
        return;
    }

    const existingTaskId = taskIdInput ? taskIdInput.value : null;
    const taskData = {
        id: existingTaskId || generateId(),
        projectName: taskProjectNameSelect.value,
        task: taskNameInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        startDate: (isNotStarted && !taskStartDateInput.value) ? '' : taskStartDateInput.value,
        endDate: taskEndDateInput.value,
        status: taskStatusSelect.value
    };

    if (!saveTaskButton) return;
    setButtonLoadingState(saveTaskButton, true, 'Guardando...');

    try {
        await db.projectDetails.put(taskData);
        const currentState = getAppState();
        let updatedProjectDetails;
        if (existingTaskId) {
            const index = currentState.projectDetails.findIndex(t => t.id === existingTaskId);
            if (index !== -1) {
                updatedProjectDetails = [...currentState.projectDetails];
                updatedProjectDetails[index] = taskData;
            } else {
                updatedProjectDetails = [...currentState.projectDetails, taskData];
            }
        } else {
            updatedProjectDetails = [...currentState.projectDetails, taskData];
        }
        updateAppState({ projectDetails: updatedProjectDetails });

        showToast(existingTaskId ? "Tarea actualizada." : "Tarea agregada.", 'success');
        renderProjectDetailsTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
        closeModal(taskModal);
    }
     catch (error) {
        console.error("Error saving task to DB:", error);
        showToast("Error al guardar la tarea en la base de datos.", "error");
    } finally {
        setButtonLoadingState(saveTaskButton, false);
    }
};

export const handleDeleteTask = (taskId) => {
    const currentState = getAppState();
    const taskToDelete = currentState.projectDetails.find(task => task.id === taskId);
    if (!taskToDelete) {
        showToast("Error: Tarea no encontrada.", "error");
        return;
    }

    openConfirmationModal(
        "Confirmar Eliminación",
        `¿Eliminar la tarea "<strong>${sanitizeHTML(taskToDelete.task)}</strong>" del proyecto "<strong>${sanitizeHTML(taskToDelete.projectName)}</strong>"?`,
        "Eliminar", "red",
        async () => {
            try {
                await db.projectDetails.delete(taskId);
                const currentData = getAppState();
                const updatedProjectDetails = currentData.projectDetails.filter(task => task.id !== taskId);
                updateAppState({ projectDetails: updatedProjectDetails });
                showToast("Tarea eliminada.", 'success');
                renderProjectDetailsTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
            } catch (error) {
                console.error("Error deleting task from DB:", error);
                showToast("Error al eliminar la tarea de la base de datos.", "error");
            }
        }
    );
};

export const handleCostFormSubmit = async (event) => {
    event.preventDefault();
    if (!costForm) return;

    const validationRules = [
        { field: 'cost-budget', errorElementId: 'cost-budget-error', checks: [ { type: 'required', message: "Presupuesto es requerido." }, { type: 'min', value: 0, message: "Presupuesto inválido (>= 0)." } ] },
        { field: 'cost-actual', errorElementId: 'cost-actual-error', checks: [ { type: 'required', message: "Costo actual es requerido." }, { type: 'min', value: 0, message: "Costo actual inválido (>= 0)." } ] }
    ];

    if (!validateForm(costForm, validationRules)) {
        showToast('Ingrese valores numéricos válidos.', 'error');
        return;
    }

    const budget = parseFloat(costBudgetInput.value);
    const actualCost = parseFloat(costActualInput.value);

    const costId = costForm['cost-id'] ? costForm['cost-id'].value : null;
    if (!costId) {
        showToast("Error: ID de costo no encontrado.", "error");
        return;
    }

    if (!saveCostButton) return;
    setButtonLoadingState(saveCostButton, true, 'Guardando...');

    try {
        await db.projectCosts.update(costId, { budget, actualCost });
        const currentState = getAppState();
        const index = currentState.projectCosts.findIndex(cost => cost.id === costId);
        if (index !== -1) {
            const updatedProjectCosts = [...currentState.projectCosts];
            updatedProjectCosts[index] = { ...updatedProjectCosts[index], budget, actualCost };
            updateAppState({ projectCosts: updatedProjectCosts });
        }
        showToast("Costos actualizados.", 'success');
        renderProjectCostTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
        closeModal(costModal);
    } catch (error) {
        console.error("Error updating costs in DB:", error);
        showToast("Error al actualizar costos en la base de datos.", "error");
    } finally {
        setButtonLoadingState(saveCostButton, false);
    }
};

export const handleIncomeChange = async (event) => {
    const target = event.target;
    if (!target) return;
    const newIncome = parseFloat(target.value);
    const currentState = getAppState();

    if ((!isNaN(newIncome) && newIncome >= 0) || target.value.trim() === '') {
        const finalIncome = isNaN(newIncome) ? 0 : newIncome;
        if (currentState.monthlyIncome !== finalIncome) {
            try {
                await db.appConfig.put({ key: 'monthlyIncome', value: finalIncome });
                updateAppState({ monthlyIncome: finalIncome });
                showToast("Ingreso mensual actualizado.", 'success');
                renderFinanceSummary();
            } catch (error) {
                console.error("Error updating monthly income in DB:", error);
                showToast("Error al guardar ingreso en DB.", 'error');
                 target.value = currentState.monthlyIncome > 0 ? currentState.monthlyIncome.toFixed(2) : '';
            }
        }
    } else {
        showToast("El ingreso debe ser un número no negativo.", "error");
        target.value = currentState.monthlyIncome > 0 ? currentState.monthlyIncome.toFixed(2) : '';
    }
};

export const handleAddFixedExpense = async (event) => {
    event.preventDefault();
    if(!addExpenseForm) return;

    const currentState = getAppState();
    const rules = [
        { field: 'expense-name', errorElementId: 'expense-name-error', checks: [ { type: 'required', message: "Ingrese nombre del gasto." }, { type: 'maxlength', value: 100, message: "Máx 100 caracteres." }, { type: 'custom', message: `El gasto "${sanitizeHTML(expenseNameInput.value.trim())}" ya existe.`, validate: (value) => !currentState.fixedExpenses.some(exp => exp.name.toLowerCase() === value.toLowerCase()) } ] },
        { field: 'expense-amount', errorElementId: 'expense-amount-error', checks: [ { type: 'required', message: "Ingrese un monto." }, { type: 'min', value: 0.01, message: "Monto debe ser positivo." } ] }
    ];

    if (!validateForm(addExpenseForm, rules)) {
        showToast("Complete los campos requeridos (*).", "error");
        return;
    }

    if (!addExpenseButton) return;
    setButtonLoadingState(addExpenseButton, true, 'Agregando...');

    const newExpense = {
        id: generateId(),
        name: expenseNameInput.value.trim(),
        amount: parseFloat(expenseAmountInput.value)
    };
    try {
        await db.fixedExpenses.add(newExpense);
        const updatedFixedExpenses = [...currentState.fixedExpenses, newExpense];
        updateAppState({ fixedExpenses: updatedFixedExpenses });
        showToast("Gasto fijo agregado.", 'success');
        renderFixedExpensesList(); renderFinanceSummary();
        addExpenseForm.reset();
        if(expenseNameInput) expenseNameInput.focus();
    } catch (error) {
        console.error("Error adding fixed expense to DB:", error);
        showToast("Error al guardar gasto fijo en DB.", 'error');
    } finally {
        setButtonLoadingState(addExpenseButton, false);
    }
};

export const handleDeleteFixedExpense = (expenseId) => {
    handleDeleteListItem(
        expenseId, 'fixedExpenses', 'gasto fijo',
        null,
        "Gasto fijo eliminado.",
        renderFixedExpensesList,
        [renderFinanceSummary]
    );
};

export const handleExportData = async () => {
    if(!exportDataButton) return;
    setButtonLoadingState(exportDataButton, true, 'Exportando...');
    try {
        const [
            statusList, projectNameList, projectDetails, projectCosts,
            fixedExpenses, mainTitleConfig, monthlyIncomeConfig, spotTrades,
            activeUserModeConfig, futuresTrades, watchlist
        ] = await db.transaction('r', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => {
            const sList = await db.statusList.toArray();
            const pNameList = await db.projectNameList.toArray();
            const pDetails = await db.projectDetails.toArray();
            const pCosts = await db.projectCosts.toArray();
            const fExpenses = await db.fixedExpenses.toArray();
            const sTrades = await db.spotTrades.toArray();
            const fTrades = await db.futuresTrades.toArray();
            const mTitleConfig = await db.appConfig.get('mainTitle');
            const mIncomeConfig = await db.appConfig.get('monthlyIncome');
            const modeConfig = await db.appConfig.get('activeUserMode');
            const wList = await db.watchlist.toArray();
            return [sList, pNameList, pDetails, pCosts, fExpenses, mTitleConfig, mIncomeConfig, sTrades, modeConfig, fTrades, wList];
        });
        
        const dataToExport = {
            mainTitle: mainTitleConfig ? mainTitleConfig.value : 'Rastreador de Proyectos y Finanzas',
            activeUserMode: activeUserModeConfig ? activeUserModeConfig.value : 'projects',
            statusList: statusList,
            projectNameList: projectNameList,
            projectDetails: projectDetails,
            projectCosts: projectCosts,
            monthlyIncome: (monthlyIncomeConfig && typeof monthlyIncomeConfig.value === 'number') ? monthlyIncomeConfig.value : 0,
            fixedExpenses: fixedExpenses,
            spotTrades: spotTrades,
            futuresTrades: futuresTrades,
            watchlist: watchlist,
            exportDate: new Date().toISOString(),
            appVersion: 'vFin_Optimized_Dexie_1.0'
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenithtrack_datos_${getCurrentDate()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Datos exportados correctamente.', 'success');

    } catch (error) {
        console.error("Error durante la exportación de datos:", error);
        showToast('Error al exportar los datos.', 'error');
    } finally {
        setButtonLoadingState(exportDataButton, false);
    }
};

export const triggerImportFile = () => {
    if (importFileInput) importFileInput.click();
};

export const handleImportFile = (event) => {
    if (!event.target || !event.target.files) return;
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/json') {
        showToast('Tipo de archivo no válido. Seleccione JSON.', 'error');
        if (importFileInput) importFileInput.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!e.target || !e.target.result) return;
        try {
            const importedJson = JSON.parse(e.target.result);
            openConfirmationModal(
                "Confirmar Importación",
                `Importar datos de "<strong>${sanitizeHTML(file.name)}</strong>"?<br>Esto <strong>REEMPLAZARÁ</strong> todos sus datos actuales.`,
                "Sí, Importar", "teal",
                async () => {
                    if (!importDataButton) return;
                    setButtonLoadingState(importDataButton, true, 'Importando...');
                    const success = await importData(importedJson, file.name);
                    if(success) {
                        renderAll();
                        refreshCurrentChart();
                    }
                    setButtonLoadingState(importDataButton, false);
                    if (!success && importFileInput) importFileInput.value = '';
                }
            );
        } catch (error) {
            console.error("Error parsing imported JSON:", error);
            showToast('Error al procesar el archivo JSON.', 'error');
        } finally {
            if (importFileInput) importFileInput.value = '';
        }
    };
    reader.onerror = () => {
        showToast('Error al leer el archivo.', 'error');
        if (importFileInput) importFileInput.value = '';
    };
    reader.readAsText(file);
};

export const handleTableSort = (event) => {
    const sortButton = event.target.closest('.sortable-header');
    if (!sortButton) return;

    const tableId = sortButton.dataset.tableId;
    const sortKey = sortButton.dataset.sortKey;

    let sortConfigKey;
    if (tableId === 'project-details-table') sortConfigKey = 'projectDetails';
    else if (tableId === 'project-cost-table') sortConfigKey = 'projectCosts';
    else if (tableId === 'fixed-expenses-table') sortConfigKey = 'fixedExpenses';
    else {
        console.warn(`handleTableSort: tableId desconocido o no encontrado: ${tableId}`);
        return;
    }

    const currentState = getAppState();
    if (!currentState.sortState || !currentState.sortState[sortConfigKey]) {
        console.warn(`Sort state no configurado para ${sortConfigKey}`);
        return;
    }

    let currentSortDirection = currentState.sortState[sortConfigKey].direction;
    let newSortDirection;

    if (currentState.sortState[sortConfigKey].key === sortKey) {
        newSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        newSortDirection = 'asc';
    }

    const newSortState = {
        ...currentState.sortState,
        [sortConfigKey]: { key: sortKey, direction: newSortDirection }
    };
    updateAppState({ sortState: newSortState });

    if (sortConfigKey === 'projectDetails') renderProjectDetailsTable();
    else if (sortConfigKey === 'projectCosts') renderProjectCostTable();
    else if (sortConfigKey === 'fixedExpenses') renderFixedExpensesList();
};

export const handleConfirmAction = () => {
    const currentState = getAppState();
    if (currentState.currentConfirmationAction && currentState.currentConfirmationAction.callback) {
        currentState.currentConfirmationAction.callback(currentState.currentConfirmationAction.data);
    }
    closeConfirmationModal();
};

export const handleChartTypeChange = () => {
    if (chartTypeSelect) {
        renderSelectedChart(chartTypeSelect.value);
    }
};
export const handleApplySpotFilters = () => {
    const filters = {
        asset: filterSpotAssetInput.value.trim(),
        startDate: filterSpotStartDateInput.value,
        endDate: filterSpotEndDateInput.value,
    };

    updateAppState({
        searchTerms: {
            ...getAppState().searchTerms,
            spotTrades: filters
        }
    });

    renderSpotTradesTable();
};

export const handleClearSpotFilters = () => {
    const defaultSpotFilters = {
        asset: '',
        startDate: '',
        endDate: ''
    };

    // Limpiar los inputs del DOM
    filterSpotAssetInput.value = '';
    filterSpotStartDateInput.value = '';
    filterSpotEndDateInput.value = '';

    // Limpiar el sestado de los filtros
    updateAppState({
        searchTerms: {
            ...getAppState().searchTerms,
            spotTrades: defaultSpotFilters
        }
    });

    renderSpotTradesTable();
};

// --- Spot Trading Handlers ---
export const handleSpotTradeFormSubmit = async (event) => {
    event.preventDefault();
    if (!spotTradeForm) return;

    const id = spotTradeIdInput.value ? parseInt(spotTradeIdInput.value, 10) : null;
    const tradeData = {
        tradeDate: tradeDateInput.value,
        type: tradeTypeSelect.value,
        baseAsset: baseAssetInput.value.trim().toUpperCase(),
        quoteAsset: quoteAssetInput.value.trim().toUpperCase(),
        price: parseFloat(priceInput.value),
        quantityBase: parseFloat(quantityBaseInput.value),
        fees: parseFloat(spotTradeFeesInput.value) || 0,
        notes: notesInput.value.trim()
    };
    
    if (!tradeData.tradeDate || !tradeData.baseAsset || !tradeData.quoteAsset || isNaN(tradeData.price) || tradeData.price <= 0 || isNaN(tradeData.quantityBase) || tradeData.quantityBase <= 0) {
        return showToast("Por favor, complete todos los campos requeridos.", "error");
    }
    
    tradeData.totalQuote = tradeData.price * tradeData.quantityBase;
    
    setButtonLoadingState(saveSpotTradeButton, true, 'Guardando...');
    try {
        if (id) {
            await updateSpotTrade(id, tradeData);
            const updatedTrades = getAppState().spotTrades.map(t => t.id === id ? { ...t, ...tradeData } : t);
            updateAppState({ spotTrades: updatedTrades });
        } else {
            const newTradeWithId = await addSpotTrade(tradeData);
            updateAppState({ spotTrades: [newTradeWithId, ...getAppState().spotTrades] });
        }
        renderSpotTradesTable();
        closeModal(spotTradeModal);
    } catch (error) {
        console.error("Fallo al enviar formulario spot:", error);
    } finally {
        setButtonLoadingState(saveSpotTradeButton, false);
    }
};

export const handleDeleteSpotTrade = (tradeId) => {
    const currentState = getAppState();
    const numericTradeId = parseInt(tradeId, 10);
    const tradeToDelete = currentState.spotTrades.find(t => t.id === numericTradeId);

    if (!tradeToDelete) {
        showToast("Error: Operación no encontrada para eliminar.", "error");
        console.error(`handleDeleteSpotTrade: No se encontró la operación con id ${numericTradeId}`);
        return;
    }
    
    openConfirmationModal(
        "Confirmar Eliminación",
        `¿Está seguro de eliminar la operación <strong>${tradeToDelete.type.toUpperCase()} ${tradeToDelete.quantityBase} ${tradeToDelete.baseAsset}</strong>?`,
        "Eliminar", "red",
        async () => {
            try {
                await deleteSpotTrade(numericTradeId);
                const updatedTrades = getAppState().spotTrades.filter(t => t.id !== numericTradeId);
                updateAppState({ spotTrades: updatedTrades });
                renderSpotTradesTable();
            } catch (error) {
                console.error("Error en el callback de confirmación para eliminar operación:", error);
            }
        }
    );
};
// --- FIN NUEVOS HANDLERS PARA SPOT TRADING ---

// --- Funciones para el Selector de Modo ---
export const updateUIMode = (mode) => {
    if (!mainTitleEl) return;

    const isProjectsMode = mode === 'projects';

    mainTitleEl.textContent = isProjectsMode ? 'Rastreador de Proyectos y Finanzas' : 'Rastreador de Criptomonedas';

    document.getElementById('tab-details')?.classList.toggle('hidden', !isProjectsMode);
    document.getElementById('tab-cost')?.classList.toggle('hidden', !isProjectsMode);
    document.getElementById('tab-finance')?.classList.toggle('hidden', !isProjectsMode);
    document.getElementById('tab-crypto-panel')?.classList.toggle('hidden', isProjectsMode);
    document.getElementById('tab-spot-trading')?.classList.toggle('hidden', isProjectsMode);
    document.getElementById('tab-futures-trading')?.classList.toggle('hidden', isProjectsMode);

    if (setupStatusListContainer) setupStatusListContainer.hidden = !isProjectsMode;
    if (setupProjectNameListContainer) setupProjectNameListContainer.hidden = !isProjectsMode;

    if (isProjectsMode && modeProjectsRadio) modeProjectsRadio.checked = true;
    if (!isProjectsMode && modeCryptoRadio) modeCryptoRadio.checked = true;

    renderOverview();
    
    const activeTabButton = document.querySelector('.tab-button.active');
    if (activeTabButton && activeTabButton.classList.contains('hidden')) {
        document.getElementById('tab-overview')?.click();
    }

    console.log(`UI actualizada al modo: ${mode}`);
};

export const handleAppModeChange = async (event) => {
    const newMode = event.target.value;
    const currentMode = getAppState().activeUserMode;

    if (newMode === currentMode) {
        return;
    }

    console.log(`Cambiando modo de la aplicación a: ${newMode}`);

    try {
        await db.appConfig.put({ key: 'activeUserMode', value: newMode });
        updateAppState({ activeUserMode: newMode });
        updateUIMode(newMode);
        showToast(`Modo cambiado a ${newMode === 'projects' ? 'Proyectos' : 'Criptomonedas'}.`, 'info');
    } catch (error) {
        console.error("Error al cambiar el modo de la aplicación:", error);
        showToast("Error al guardar la preferencia de modo.", "error");
    }
};

// --- INICIO NUEVOS HANDLERS PARA FUTURES TRADING ---

export const handleFuturesTradeFormSubmit = async (event) => {
    event.preventDefault();
    if (!futuresTradeForm) return;

    const id = futuresTradeIdInput.value ? parseInt(futuresTradeIdInput.value, 10) : null;
    const tradeData = {
        symbol: futuresSymbolInput.value.trim().toUpperCase(),
        direction: futuresDirectionSelect.value,
        leverage: parseInt(futuresLeverageInput.value, 10),
        entryDate: futuresEntryDateInput.value,
        quantity: parseFloat(futuresQuantityInput.value),
        entryPrice: parseFloat(futuresEntryPriceInput.value),
        entryFees: parseFloat(futuresEntryFeesInput.value) || 0,
        notes: futuresNotesInput.value.trim()
    };

    if (!tradeData.symbol || !tradeData.entryDate || isNaN(tradeData.leverage) || isNaN(tradeData.quantity) || isNaN(tradeData.entryPrice)) {
        return showToast("Por favor, complete todos los campos requeridos.", "error");
    }
    
    setButtonLoadingState(saveFuturesTradeButton, true, 'Guardando...');
    try {
        if (id) {
            await updateFuturesTrade(id, tradeData);
            const updatedTrades = getAppState().futuresTrades.map(t => t.id === id ? { ...t, ...tradeData } : t);
            updateAppState({ futuresTrades: updatedTrades });
        } else {
            const newTradeData = { ...tradeData, status: 'open', pnl: 0, exitPrice: null, exitDate: null, exitFees: 0 };
            const newTradeWithId = await addFuturesTrade(newTradeData);
            updateAppState({ futuresTrades: [newTradeWithId, ...getAppState().futuresTrades] });
        }
        renderFuturesTradesTable();
        renderOverview();
        closeModal(futuresTradeModal);
    } catch (error) {
        console.error("Fallo al enviar formulario de futuros:", error);
    } finally {
        setButtonLoadingState(saveFuturesTradeButton, false);
    }
};

export const handleCloseFuturesTrade = async () => {
    const id = futuresTradeIdInput.value ? parseInt(futuresTradeIdInput.value, 10) : null;
    if (!id) return;
    
    const exitPrice = parseFloat(futuresExitPriceInput.value);
    if (isNaN(exitPrice) || exitPrice <= 0) {
        return showToast("Ingrese un precio de salida válido.", "error");
    }
    
    const tradeToClose = getAppState().futuresTrades.find(t => t.id === id);
    if (!tradeToClose) return showToast("Error: No se encontró la posición.", "error");

    const entryFees = parseFloat(tradeToClose.entryFees) || 0;
    const exitFees = parseFloat(futuresExitFeesInput.value) || 0;
    const totalFees = entryFees + exitFees;
    const priceDiff = exitPrice - tradeToClose.entryPrice;
    const grossPnl = tradeToClose.direction === 'long' ? priceDiff * tradeToClose.quantity : -priceDiff * tradeToClose.quantity;
    const netPnl = grossPnl - totalFees;
    
    const updates = { exitPrice, exitDate: new Date().toISOString(), status: 'closed', exitFees, pnl: netPnl };
    
    setButtonLoadingState(closeFuturesTradeButton, true, 'Cerrando...');
    try {
        await updateFuturesTrade(id, updates);
        updateAppState({ futuresTrades: getAppState().futuresTrades.map(t => t.id === id ? { ...t, ...updates } : t) });
        renderFuturesTradesTable();
        renderOverview();
        closeModal(futuresTradeModal);
        showToast("Posición cerrada y PnL calculado.", "success");
    } catch (error) {
        console.error("Error al cerrar la posición:", error);
    } finally {
        setButtonLoadingState(closeFuturesTradeButton, false);
    }
};

export const handleDeleteFuturesTrade = (tradeId) => {
    const tradeToDelete = getAppState().futuresTrades.find(t => t.id === tradeId);
    if (!tradeToDelete) {
        showToast("Error: Posición no encontrada para eliminar.", "error");
        return;
    }
    
    openConfirmationModal(
        "Confirmar Eliminación",
        `¿Está seguro de eliminar la posición <strong>${tradeToDelete.direction.toUpperCase()} en ${tradeToDelete.symbol}</strong>? Esta acción es irreversible.`,
        "Eliminar", "red",
        async () => {
            try {
                await deleteFuturesTrade(tradeId);
                const updatedTrades = getAppState().futuresTrades.filter(t => t.id !== tradeId);
                updateAppState({ futuresTrades: updatedTrades });
                renderFuturesTradesTable();
                renderOverview();
            } catch (error) {
                console.error("Error en el callback de confirmación para eliminar posición de futuros:", error);
            }
        }
    );
};