// src/js/eventHandlers.js
import { getDomElements } from './domElements.js';
import { getAppState, updateAppState, getConfirmationAction } from './state.js';
import {
    renderAll, renderProjectDetailsTable, renderProjectCostTable,
    renderFixedExpensesList, renderSetupLists, renderOverview,
    renderProjectSummaries, renderFinanceSummary, renderFinanceTab,
    renderSpotTradesTable, renderFuturesTradesTable, renderCryptoPanel
} from './uiRender.js';
import {
    closeModal, openConfirmationModal, openEditTaskModal, openEditCostModal,
    openAddSpotTradeModal, openEditSpotTradeModal, openAddFuturesTradeModal,
    openEditFuturesTradeModal, openAddCoinToWatchlistModal,
    handleCoinSearch as modalHandleCoinSearch,
    updateTaskModalDropdowns
} from './modalHandlers.js';
import db from './db.js';
import {
    resetToDefaultData as storageResetToDefaultData,
    importData as storageImportData,
    addSpotTrade, updateSpotTrade, deleteSpotTrade,
    addFuturesTrade, updateFuturesTrade, deleteFuturesTrade,
    addToWatchlist, removeFromWatchlist
} from './storage.js';
import { 
    sanitizeHTML, generateId, showToast, clearAllValidationErrors,
    getCurrentDate, setButtonLoadingState, debounce, validateForm,
    updateSortIcons, formatCurrency, 
    calculateSpotTargetMetrics
} from './utils.js';
import { renderSelectedChart, refreshCurrentChart } from './charts.js';

// --- Handlers de Búsqueda (con debounce) ---
const _handleSearchProjectTasks = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({ searchTerms: { ...currentState.searchTerms, projectDetails: searchTerm } });
    renderProjectDetailsTable();
};
export const handleSearchProjectTasks = debounce(_handleSearchProjectTasks, 300);

const _handleSearchProjectCosts = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({ searchTerms: { ...currentState.searchTerms, projectCosts: searchTerm } });
    renderProjectCostTable();
};
export const handleSearchProjectCosts = debounce(_handleSearchProjectCosts, 300);

const _handleSearchFixedExpenses = (event) => {
    const searchTerm = event.target.value;
    const currentState = getAppState();
    updateAppState({ searchTerms: { ...currentState.searchTerms, fixedExpenses: searchTerm } });
    renderFixedExpensesList();
};
export const handleSearchFixedExpenses = debounce(_handleSearchFixedExpenses, 300);

// --- Manejador de Click en Pestañas ---
export const handleTabClick = (event) => {
    const dom = getDomElements();
    const clickedButton = event.currentTarget;
    const tabId = clickedButton.dataset.tab;
    if (dom.tabButtons && dom.tabButtons.length) {
        dom.tabButtons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });
    }
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabContents.forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });
    clickedButton.classList.add('active');
    clickedButton.setAttribute('aria-selected', 'true');
    const activeContent = document.getElementById(`${tabId}-content`);
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.hidden = false;
    }
    requestAnimationFrame(() => {
        if (tabId === 'overview') {
            renderOverview();
            const currentMode = getAppState().activeUserMode;
            if (currentMode === 'projects' && dom.chartTypeSelect) {
                renderSelectedChart(dom.chartTypeSelect.value);
            } else if (currentMode === 'crypto') {
                renderSelectedChart('cryptoPerformance');
            }
        } else if (tabId === 'details') { renderProjectDetailsTable(); }
        else if (tabId === 'cost') { renderProjectCostTable(); }
        else if (tabId === 'finance') { renderFinanceTab(); }
        else if (tabId === 'spot-trading') { renderSpotTradesTable(); }
        else if (tabId === 'futures-trading') { renderFuturesTradesTable(); }
        else if (tabId === 'crypto-panel') { renderCryptoPanel(); }
        else if (tabId === 'setup') { renderSetupLists(); renderFinanceTab(); }
    });
    const allModals = document.querySelectorAll('.modal:not(.hidden)');
    allModals.forEach(modal => closeModal(modal));
};

export const handleStatusColorChange = async (event) => {
    const colorInput = event.target;
    if (!colorInput || colorInput.type !== 'color' || !colorInput.classList.contains('status-color-picker')) return;
    const statusId = colorInput.dataset.id;
    const newColor = colorInput.value;
    const currentState = getAppState();
    const statusIndex = currentState.statusList.findIndex(s => s.id === statusId);
    if (statusIndex === -1) { showToast("Error: Estado no encontrado.", "error"); return; }
    const updatedStatusList = currentState.statusList.map(s => s.id === statusId ? { ...s, color: newColor } : s);
    updateAppState({ statusList: updatedStatusList });
    renderSetupLists(); refreshCurrentChart(); renderProjectDetailsTable();
    try { await db.statusList.update(statusId, { color: newColor });
    } catch (error) { console.error("Error updating status color in DB:", error); showToast("Error al guardar el color.", "error"); }
};

const handleAddListItem = async (inputEl, errorEl, listKeyInState, itemNameSingularParam, successMsg, maxLength, mainRenderFn, otherRenderFns = []) => {
    const localItemNameSingular = itemNameSingularParam;
    if (!inputEl || !errorEl) { console.error(`handleAddListItem (${localItemNameSingular}): inputEl o errorEl no encontrados.`); return false; }
    const formOrParentContainer = inputEl.closest('.list-item-adder-container');
    if (!formOrParentContainer) { console.error(`handleAddListItem (${localItemNameSingular}): No se pudo encontrar '.list-item-adder-container'.`); return false; }
    const newItemName = inputEl.value.trim();
    const currentState = getAppState();
    const list = Array.isArray(currentState[listKeyInState]) ? currentState[listKeyInState] : [];
    const rules = [{
        field: inputEl.id, errorElementId: errorEl.id,
        checks: [
            { type: 'required', message: `Ingrese un nombre para el ${localItemNameSingular}.` },
            { type: 'maxlength', value: maxLength, message: `El nombre no puede exceder ${maxLength} caracteres.` },
            { type: 'custom', message: `El ${localItemNameSingular} "${sanitizeHTML(newItemName)}" ya existe.`,
              validate: (value) => !list.some(item => item.name.toLowerCase() === value.toLowerCase() && value.trim() !== '') }
        ]
    }];
    if (!validateForm(formOrParentContainer, rules)) return false;
    const newItem = { id: generateId(), name: newItemName };
    if (listKeyInState === 'statusList') newItem.color = '#CCCCCC';
    try {
        if (localItemNameSingular === 'proyecto') {
            const currentProjectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
            const projectCostExists = currentProjectCosts.some(cost => cost.projectName === newItemName);
            const newProjectCostEntry = projectCostExists ? null : { id: generateId(), projectName: newItemName, budget: 0, actualCost: 0 };
            await db.transaction('rw', db[listKeyInState], db.projectCosts, async () => {
                await db[listKeyInState].add(newItem);
                if (newProjectCostEntry) await db.projectCosts.add(newProjectCostEntry);
            });
            updateAppState({ [listKeyInState]: [...list, newItem], ...(newProjectCostEntry && { projectCosts: [...currentProjectCosts, newProjectCostEntry] }) });
        } else {
            await db[listKeyInState].add(newItem);
            updateAppState({ [listKeyInState]: [...list, newItem] });
        }
        showToast(successMsg, 'success'); mainRenderFn(); otherRenderFns.forEach(fn => fn());
        inputEl.value = ''; inputEl.focus(); return true;
    } catch (error) { console.error(`Error adding ${localItemNameSingular} to DB:`, error); showToast(`Error al guardar ${localItemNameSingular}.`, 'error'); return false; }
};

export const handleAddStatus = async () => {
    const dom = getDomElements();
    if (!dom.addStatusButton || !dom.newStatusInput || !dom.newStatusError) { showToast("Error interno: Elementos de estado faltantes.", "error"); return; }
    setButtonLoadingState(dom.addStatusButton, true, 'Agregando...');
    await handleAddListItem(dom.newStatusInput, dom.newStatusError, 'statusList', 'estado', "Estado agregado.", 50, renderSetupLists, [updateTaskModalDropdowns, refreshCurrentChart]);
    setButtonLoadingState(dom.addStatusButton, false);
};

export const handleAddProjectName = async () => {
    const dom = getDomElements();
    if (!dom.addProjectNameButton || !dom.newProjectNameInput || !dom.newProjectNameError) { showToast("Error interno: Elementos de proyecto faltantes.", "error"); return; }
    setButtonLoadingState(dom.addProjectNameButton, true, 'Agregando...');
    await handleAddListItem(dom.newProjectNameInput, dom.newProjectNameError, 'projectNameList', 'proyecto', "Proyecto agregado.", 100, renderSetupLists, [renderProjectCostTable, renderProjectSummaries, renderOverview, updateTaskModalDropdowns, refreshCurrentChart, renderFinanceSummary]);
    setButtonLoadingState(dom.addProjectNameButton, false);
};

const handleDeleteListItem = (itemId, listKeyInState, itemNameSingularParam, dependentCheckFn, successMsg, mainRenderFn, otherRenderFns = []) => {
    const localItemNameSingular = itemNameSingularParam;
    console.log(`EVENT_HANDLER (handleDeleteListItem): Iniciando borrado para item ID: ${itemId}, tipo: ${localItemNameSingular}`);
    const currentState = getAppState();
    const list = Array.isArray(currentState[listKeyInState]) ? currentState[listKeyInState] : [];
    const itemToDelete = list.find(item => item.id === itemId);
    if (!itemToDelete) {
        showToast(`Error: ${localItemNameSingular} no encontrado.`, "error");
        console.error(`handleDeleteListItem: Item with ID ${itemId} not found in ${listKeyInState}.`);
        return;
    }
    console.log(`EVENT_HANDLER (handleDeleteListItem): Item a borrar encontrado:`, itemToDelete);
    if (dependentCheckFn && dependentCheckFn(itemToDelete.name, currentState)) {
        console.log(`EVENT_HANDLER (handleDeleteListItem): Comprobación de dependencia falló para ${itemToDelete.name}.`);
        return;
    }
    openConfirmationModal("Confirmar Eliminación", `¿Eliminar ${localItemNameSingular === 'proyecto' ? 'el proyecto' : 'la entrada'} "<strong>${sanitizeHTML(itemToDelete.name)}</strong>"? ${localItemNameSingular === 'proyecto' ? 'Sus costos asociados también serán eliminados.' : ''} Esta acción no se puede deshacer.`, "Eliminar", "red",
        async () => { // Este es el actionCallback
            console.log(`EVENT_HANDLER (handleDeleteListItem - Callback Confirmación): Confirmado borrado para ID: ${itemId}`);
            try {
                const currentDataForDelete = getAppState(); 
                if (localItemNameSingular === 'proyecto') {
                    const costsToDelete = currentDataForDelete.projectCosts.filter(cost => cost.projectName === itemToDelete.name).map(c => c.id);
                    console.log(`EVENT_HANDLER (handleDeleteListItem - Callback): Proyecto. Costos a borrar:`, costsToDelete);
                    await db.transaction('rw', db[listKeyInState], db.projectCosts, async () => {
                        await db[listKeyInState].delete(itemId);
                        if (costsToDelete.length > 0) await db.projectCosts.bulkDelete(costsToDelete);
                    });
                } else {
                    console.log(`EVENT_HANDLER (handleDeleteListItem - Callback): Borrando de DB (${listKeyInState}) ID: ${itemId}`);
                    await db[listKeyInState].delete(itemId);
                }
                let updatesForState = {};
                updatesForState[listKeyInState] = currentDataForDelete[listKeyInState].filter(item => item.id !== itemId);
                if (localItemNameSingular === 'proyecto') {
                    updatesForState.projectCosts = currentDataForDelete.projectCosts.filter(cost => cost.projectName !== itemToDelete.name);
                }
                updateAppState(updatesForState); 
                console.log(`EVENT_HANDLER (handleDeleteListItem - Callback): Estado actualizado.`);
                showToast(successMsg, 'success');
                mainRenderFn();
                otherRenderFns.forEach(fn => fn());
            } catch (error) {
                console.error(`EVENT_HANDLER (handleDeleteListItem - Callback): Error deleting ${localItemNameSingular} (ID: ${itemId}) from DB:`, error);
                showToast(`Error al eliminar ${localItemNameSingular}.`, 'error');
            }
        },
        itemId 
    );
    console.log(`EVENT_HANDLER (handleDeleteListItem): Modal de confirmación abierto para ID: ${itemId}`);
};

export const handleDeleteStatus = (statusId) => {
    console.log('EVENT_HANDLER (handleDeleteStatus): Llamado con statusId:', statusId);
    handleDeleteListItem(statusId, 'statusList', 'estado', (statusName, currentState) => {
        const tasksUsingStatus = currentState.projectDetails.filter(task => task.status === statusName);
        if (tasksUsingStatus.length > 0) { showToast(`No se puede eliminar "${sanitizeHTML(statusName)}" porque está en uso por ${tasksUsingStatus.length} tarea(s).`, "error"); return true; } return false;
    }, "Estado eliminado.", renderSetupLists, [updateTaskModalDropdowns, refreshCurrentChart]);
};

export const handleDeleteProjectName = (projectId) => {
    console.log('EVENT_HANDLER (handleDeleteProjectName): Llamado con projectId:', projectId);
    handleDeleteListItem(projectId, 'projectNameList', 'proyecto', (projectName, currentState) => {
        const tasksUsingProject = currentState.projectDetails.filter(task => task.projectName === projectName);
        if (tasksUsingProject.length > 0) { showToast(`No se puede eliminar "${sanitizeHTML(projectName)}" porque tiene ${tasksUsingProject.length} tarea(s) asociadas.`, "error"); return true; } return false;
    }, "Proyecto eliminado.", renderSetupLists, [renderProjectCostTable, renderProjectSummaries, renderOverview, updateTaskModalDropdowns, refreshCurrentChart, renderFinanceSummary]);
};

export const handleResetData = async () => {
    const dom = getDomElements();
    if (!dom.resetDataButton) return;
    openConfirmationModal("¡ADVERTENCIA! Restablecer Datos", `¿Está <strong>MUY seguro</strong>? Esto eliminará <strong>TODOS</strong> sus datos actuales y cargará los datos de ejemplo.<br><br>Esta acción es <strong>irreversible</strong>.`, "Sí, Restablecer Todo", "red",
        async () => {
            setButtonLoadingState(dom.resetDataButton, true, 'Restableciendo...');
            await storageResetToDefaultData(); renderAll();
            setButtonLoadingState(dom.resetDataButton, false);
        }
    );
};

export const handleTaskFormSubmit = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.taskForm || !dom.taskProjectNameSelect || !dom.taskStatusSelect || !dom.taskNameInput || !dom.taskStartDateInput || !dom.taskEndDateInput || !dom.taskPrioritySelect || !dom.saveTaskButton) {
        showToast("Error interno: Formulario de tarea incompleto.", "error"); return;
    }
    const appState = getAppState();
    const notStartedStatus = appState.statusList.find(s => s.name.toLowerCase().includes('no iniciado'));
    const notStartedStatusName = notStartedStatus ? notStartedStatus.name : "No Iniciado";
    const isNotStarted = dom.taskStatusSelect.value === notStartedStatusName;
    const rules = [
        { field: 'task-project-name', errorElementId: 'task-project-name-error', checks: [{ type: 'selectRequired', message: "Seleccione un proyecto." }] },
        { field: 'task-status', errorElementId: 'task-status-error', checks: [{ type: 'selectRequired', message: "Seleccione un estado." }] },
        { field: 'task-priority', errorElementId: 'task-priority-error', checks: [{ type: 'selectRequired', message: "Seleccione una prioridad." }] },
        { field: 'task-name', errorElementId: 'task-name-error', checks: [{ type: 'required', message: "Ingrese nombre de la tarea." }, { type: 'maxlength', value: 100, message: "Máx 100 chars." }] },
        { field: 'task-description', errorElementId: null, checks: [{ type: 'maxlength', value: 500, message: "Máx 500 chars." }] },
        { field: 'task-start-date', errorElementId: 'task-start-date-error', checks: isNotStarted ? [] : [{ type: 'required', message: "Ingrese fecha de inicio." }] },
        { field: 'task-end-date', errorElementId: 'task-end-date-error', checks: [ { type: 'required', message: "Ingrese fecha de fin." }, ...(dom.taskStartDateInput.value ? [{ type: 'dateComparison', compareTo: 'task-start-date', operator: 'greaterThanOrEqualTo', message: "Fin no puede ser antes de inicio." }] : []) ]}
    ];
    if (!validateForm(dom.taskForm, rules)) { showToast('Complete los campos requeridos o corrija errores.', 'error'); return; }
    const existingTaskId = dom.taskIdInput.value || null;
    const taskData = {
        id: existingTaskId || generateId(), projectName: dom.taskProjectNameSelect.value, task: dom.taskNameInput.value.trim(),
        description: dom.taskDescriptionInput.value.trim(), startDate: (isNotStarted && !dom.taskStartDateInput.value.trim()) ? '' : dom.taskStartDateInput.value,
        endDate: dom.taskEndDateInput.value, status: dom.taskStatusSelect.value, priority: dom.taskPrioritySelect.value
    };
    setButtonLoadingState(dom.saveTaskButton, true, 'Guardando...');
    try {
        await db.projectDetails.put(taskData);
        const currentState = getAppState();
        const updatedDetails = existingTaskId ? currentState.projectDetails.map(t => t.id === existingTaskId ? taskData : t) : [...currentState.projectDetails, taskData];
        updateAppState({ projectDetails: updatedDetails });
        showToast(existingTaskId ? "Tarea actualizada." : "Tarea agregada.", 'success');
        renderProjectDetailsTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
        closeModal(dom.taskModal);
    } catch (error) { console.error("Error saving task:", error); showToast("Error al guardar la tarea.", "error");
    } finally { setButtonLoadingState(dom.saveTaskButton, false); }
};

export const handleDeleteTask = (taskId) => {
    console.log('EVENT_HANDLER (handleDeleteTask): Llamado con taskId:', taskId);
    const idToDelete = taskId;
    const currentState = getAppState();
    const taskToDelete = currentState.projectDetails.find(task => task.id === idToDelete);
    if (!taskToDelete) { showToast("Error: Tarea no encontrada.", "error"); console.error(`handleDeleteTask: Task with ID ${idToDelete} not found.`); return; }
    console.log('EVENT_HANDLER (handleDeleteTask): Tarea a borrar encontrada:', taskToDelete);
    openConfirmationModal("Confirmar Eliminación", `¿Eliminar la tarea "<strong>${sanitizeHTML(taskToDelete.task)}</strong>" del proyecto "<strong>${sanitizeHTML(taskToDelete.projectName)}</strong>"?`, "Eliminar", "red",
        async () => {
            console.log('EVENT_HANDLER (handleDeleteTask - Callback Confirmación): Confirmado borrado para tarea ID:', idToDelete);
            try {
                await db.projectDetails.delete(idToDelete);
                updateAppState({ projectDetails: getAppState().projectDetails.filter(task => task.id !== idToDelete) });
                console.log('EVENT_HANDLER (handleDeleteTask - Callback): Tarea borrada y estado actualizado.');
                showToast("Tarea eliminada.", 'success');
                renderProjectDetailsTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
            } catch (error) { console.error("Error deleting task from DB:", error); showToast("Error al eliminar la tarea.", "error"); }
        },
        taskId
    );
    console.log('EVENT_HANDLER (handleDeleteTask): Modal de confirmación abierto para tarea ID:', taskId);
};

export const handleCostFormSubmit = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.costForm || !dom.costBudgetInput || !dom.costActualInput || !dom.saveCostButton) { showToast("Error: Formulario de costos incompleto.", "error"); return; }
    const rules = [
        { field: 'cost-budget', errorElementId: 'cost-budget-error', checks: [{ type: 'required', message: "Presupuesto requerido." }, { type: 'min', value: 0, message: "Presupuesto >= 0." }] },
        { field: 'cost-actual', errorElementId: 'cost-actual-error', checks: [{ type: 'required', message: "Costo actual requerido." }, { type: 'min', value: 0, message: "Costo actual >= 0." }] }
    ];
    if (!validateForm(dom.costForm, rules)) { showToast('Ingrese valores válidos.', 'error'); return; }
    const budget = parseFloat(dom.costBudgetInput.value);
    const actualCost = parseFloat(dom.costActualInput.value);
    const costId = dom.costIdInput ? dom.costIdInput.value : null;
    if (!costId) { showToast("Error: ID de costo inválido.", "error"); console.error("handleCostFormSubmit: costId es null o vacío"); return; }
    console.log('EVENT_HANDLER (handleCostFormSubmit): Guardando costos para ID:', costId);
    setButtonLoadingState(dom.saveCostButton, true, 'Guardando...');
    try {
        await db.projectCosts.update(costId, { budget, actualCost });
        const currentState = getAppState();
        const index = currentState.projectCosts.findIndex(cost => cost.id === costId);
        if (index !== -1) {
            const updatedCosts = [...currentState.projectCosts];
            updatedCosts[index] = { ...updatedCosts[index], budget, actualCost };
            updateAppState({ projectCosts: updatedCosts });
        }
        showToast("Costos actualizados.", 'success');
        renderProjectCostTable(); renderOverview(); renderProjectSummaries(); refreshCurrentChart();
        closeModal(dom.costModal);
    } catch (error) { console.error("Error updating costs:", error); showToast("Error al actualizar costos.", "error");
    } finally { setButtonLoadingState(dom.saveCostButton, false); }
};

export const handleIncomeChange = async (event) => {
    const target = event.target; if (!target) return;
    const rawValue = target.value.trim();
    const newIncome = parseFloat(rawValue);
    const currentState = getAppState();
    if ((!isNaN(newIncome) && newIncome >= 0) || rawValue === '') {
        const finalIncome = isNaN(newIncome) ? 0 : newIncome;
        if (currentState.monthlyIncome !== finalIncome) {
            try {
                await db.appConfig.put({ key: 'monthlyIncome', value: finalIncome });
                updateAppState({ monthlyIncome: finalIncome });
                showToast("Ingreso mensual actualizado.", 'success');
                renderFinanceSummary();
            } catch (error) { console.error("Error updating income:", error); showToast("Error al guardar ingreso.", 'error'); target.value = currentState.monthlyIncome > 0 ? currentState.monthlyIncome.toFixed(2) : ''; }
        }
        target.value = (rawValue === '' || finalIncome === 0) ? '' : finalIncome.toFixed(2);
    } else { showToast("Ingreso debe ser no negativo.", "error"); target.value = currentState.monthlyIncome > 0 ? currentState.monthlyIncome.toFixed(2) : ''; }
};

export const handleAddFixedExpense = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.addExpenseForm || !dom.expenseNameInput || !dom.expenseAmountInput || !dom.addExpenseButton) { showToast("Error: Formulario de gasto incompleto.", "error"); return; }
    const currentState = getAppState();
    const rules = [
        { field: 'expense-name', errorElementId: 'expense-name-error', checks: [ { type: 'required', message: "Ingrese nombre del gasto." }, { type: 'maxlength', value: 100, message: "Máx 100 chars." }, { type: 'custom', message: `El gasto "${sanitizeHTML(dom.expenseNameInput.value.trim())}" ya existe.`, validate: (value) => !currentState.fixedExpenses.some(exp => exp.name.toLowerCase() === value.toLowerCase()) } ] },
        { field: 'expense-amount', errorElementId: 'expense-amount-error', checks: [ { type: 'required', message: "Ingrese un monto." }, { type: 'min', value: 0, message: "Monto >= 0." } ] }
    ];
    if (!validateForm(dom.addExpenseForm, rules)) { showToast("Complete campos o corrija errores.", "error"); return; }
    setButtonLoadingState(dom.addExpenseButton, true, 'Agregando...');
    const newExpense = { id: generateId(), name: dom.expenseNameInput.value.trim(), amount: parseFloat(dom.expenseAmountInput.value) };
    try {
        await db.fixedExpenses.add(newExpense);
        updateAppState({ fixedExpenses: [...currentState.fixedExpenses, newExpense] });
        showToast("Gasto fijo agregado.", 'success');
        renderFixedExpensesList(); renderFinanceSummary();
        dom.addExpenseForm.reset(); if (dom.expenseNameInput) dom.expenseNameInput.focus();
    } catch (error) { console.error("Error adding expense:", error); showToast("Error al guardar gasto.", 'error');
    } finally { setButtonLoadingState(dom.addExpenseButton, false); }
};

export const handleDeleteFixedExpense = (expenseId) => {
    console.log('EVENT_HANDLER (handleDeleteFixedExpense): Llamado con expenseId:', expenseId);
    handleDeleteListItem(expenseId, 'fixedExpenses', 'gasto fijo', null, "Gasto fijo eliminado.", renderFixedExpensesList, [renderFinanceSummary]);
};

export const handleExportData = async () => {
    const dom = getDomElements();
    if (!dom.exportDataButton) return;
    setButtonLoadingState(dom.exportDataButton, true, 'Exportando...');
    try {
        const dataToExport = await db.transaction('r', db.tables, async () => {
            const allData = {};
            for (const table of db.tables) { allData[table.name] = await table.toArray(); }
            const appConfigTable = allData.appConfig || [];
            allData.appConfig = appConfigTable.reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {});
            return allData;
        });
        dataToExport.exportDate = new Date().toISOString();
        dataToExport.appVersion = 'ZenithTrack_vCurrent_ExportTest';
        console.log("[EXPORT] JSON final a exportar:", dataToExport);
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `zenithtrack_datos_${getCurrentDate().replace(/-/g, '')}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('Datos exportados correctamente.', 'success');
    } catch (error) { console.error("[EXPORT] Error durante la exportación de datos:", error); showToast('Error al exportar los datos. Revise la consola.', 'error');
    } finally { setButtonLoadingState(dom.exportDataButton, false); console.log("[EXPORT] Proceso de exportación finalizado."); }
};

export const triggerImportFile = () => {
    const dom = getDomElements();
    if (dom.importFileInput) dom.importFileInput.click();
};

export const handleImportFile = (event) => {
    const dom = getDomElements();
    if (!event.target || !event.target.files || event.target.files.length === 0) {
        if (dom.importFileInput) dom.importFileInput.value = ''; return;
    }
    const file = event.target.files[0];
    if (!file) { if (dom.importFileInput) dom.importFileInput.value = ''; return; }
    if (file.type !== 'application/json') {
        showToast('Tipo de archivo no válido. Seleccione un archivo JSON.', 'error');
        if (dom.importFileInput) dom.importFileInput.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        if (!e.target || !e.target.result) { if (dom.importFileInput) dom.importFileInput.value = ''; return; }
        try {
            const jsonString = e.target.result;
            console.log("[IMPORT] JSON String leído del archivo:", jsonString.substring(0, 200) + "...");
            const importedJson = JSON.parse(jsonString);
            console.log("[IMPORT] Objeto JSON parseado (importedJson):", importedJson);
            let isValidStructure = true; let validationMessage = 'Estructura del archivo JSON no válida o incompleta.';
            if (typeof importedJson !== 'object' || importedJson === null) {
                isValidStructure = false; validationMessage = 'El archivo no es un objeto JSON.'; console.error("[IMPORT VALIDATION] Falla: No es un objeto o es null.");
            } else {
                console.log("[IMPORT VALIDATION] Pasa: Es un objeto y no es null.");
                if (!importedJson.hasOwnProperty('projectDetails')) { isValidStructure = false; validationMessage = 'Falta "projectDetails".'; console.error("[IMPORT VALIDATION] Falla: Falta projectDetails.");
                } else if (!Array.isArray(importedJson.projectDetails)) { isValidStructure = false; validationMessage = '"projectDetails" debe ser array.'; console.error("[IMPORT VALIDATION] Falla: projectDetails no es array. Tipo:", typeof importedJson.projectDetails);
                } else { console.log("[IMPORT VALIDATION] Pasa: projectDetails es un array."); }
                if (isValidStructure && (!importedJson.hasOwnProperty('appConfig') || typeof importedJson.appConfig !== 'object' || importedJson.appConfig === null)) {
                    isValidStructure = false; validationMessage = 'Falta "appConfig" (objeto) o no es objeto.'; console.error("[IMPORT VALIDATION] Falla: appConfig no es objeto o es null. Tipo:", typeof importedJson.appConfig);
                } else if (isValidStructure) { console.log("[IMPORT VALIDATION] Pasa: appConfig es un objeto y no es null."); }
            }
            if (!isValidStructure) { showToast(validationMessage, 'error'); if (dom.importFileInput) dom.importFileInput.value = ''; return; }
            console.log("[IMPORT] La estructura del JSON parece válida. Abriendo modal de confirmación.");
            openConfirmationModal("Confirmar Importación", `Importar datos de "<strong>${sanitizeHTML(file.name)}</strong>"?<br>Esto <strong>REEMPLAZARÁ</strong> todos sus datos actuales.`, "Sí, Importar", "teal",
                async () => {
                    console.log("[IMPORT - CALLBACK] Iniciando proceso de importación en storage.");
                    if (!dom.importDataButton) { console.error("[IMPORT - CALLBACK] Botón de importación no encontrado."); return; }
                    setButtonLoadingState(dom.importDataButton, true, 'Importando...');
                    let success = false;
                    try {
                        success = await storageImportData(importedJson, file.name);
                        console.log(`[IMPORT - CALLBACK] storageImportData retornó: ${success}`);
                        if (success) {
                            console.log("[IMPORT - CALLBACK] Importación exitosa, llamando a renderAll().");
                            renderAll(); showToast(`Datos importados correctamente desde ${sanitizeHTML(file.name)}.`, 'success');
                        } else {
                            console.error("[IMPORT - CALLBACK] storageImportData retornó false. La importación falló silenciosamente.");
                            showToast("Falló la importación de datos. Revise la consola para detalles.", "error");
                        }
                    } catch (importError) {
                        console.error("[IMPORT - CALLBACK] Error durante storageImportData:", importError);
                        showToast("Error crítico durante la importación de datos.", "error"); success = false;
                    } finally {
                        setButtonLoadingState(dom.importDataButton, false);
                        if (dom.importFileInput) dom.importFileInput.value = '';
                        console.log("[IMPORT - CALLBACK] Proceso de importación finalizado en el callback.");
                    }
                },
                null
            );
        } catch (error) { console.error("Error parsing imported JSON:", error); showToast('Error al procesar el archivo JSON.', 'error'); if (dom.importFileInput) dom.importFileInput.value = ''; }
    };
    reader.onerror = () => { showToast('Error al leer el archivo.', 'error'); if (dom.importFileInput) dom.importFileInput.value = ''; };
    reader.readAsText(file);
};

export const handleTableSort = (event) => {
    const dom = getDomElements();
    const sortButton = event.target.closest('.sortable-header');
    if (!sortButton || !sortButton.dataset.tableId || !sortButton.dataset.sortKey) return;
    const tableId = sortButton.dataset.tableId;
    const sortKey = sortButton.dataset.sortKey;
    let sortConfigKey;
    if (tableId === 'project-details-table') sortConfigKey = 'projectDetails';
    else if (tableId === 'project-cost-table') sortConfigKey = 'projectCosts';
    else if (tableId === 'fixed-expenses-table') sortConfigKey = 'fixedExpenses';
    else { console.warn(`handleTableSort: tableId desconocido: ${tableId}`); return; }
    const currentState = getAppState();
    const currentSortForTable = currentState.sortState?.[sortConfigKey];
    if (!currentSortForTable) { console.warn(`Sort state no configurado para ${sortConfigKey}`); return; }
    const newDirection = (currentSortForTable.key === sortKey && currentSortForTable.direction === 'asc') ? 'desc' : 'asc';
    updateAppState({ sortState: { ...currentState.sortState, [sortConfigKey]: { key: sortKey, direction: newDirection } } });
    if (sortConfigKey === 'projectDetails') renderProjectDetailsTable();
    else if (sortConfigKey === 'projectCosts') renderProjectCostTable();
    else if (sortConfigKey === 'fixedExpenses') renderFixedExpensesList();
    const headersContainer = { 'projectDetails': dom.projectDetailsSortHeaders, 'projectCosts': dom.projectCostSortHeaders, 'fixedExpenses': dom.fixedExpensesSortHeaders }[sortConfigKey];
    if (headersContainer) updateSortIcons(headersContainer, sortKey, newDirection);
};

export const handleConfirmAction = () => {
    console.log('EVENT_HANDLER (handleConfirmAction): Función llamada.');
    const actionToExecute = getConfirmationAction();
    console.log('EVENT_HANDLER (handleConfirmAction): actionToExecute obtenido de getConfirmationAction():', actionToExecute ? `{ callback: ${typeof actionToExecute.callback}, data: ${JSON.stringify(actionToExecute.data)} }` : "null o undefined");
    if (actionToExecute && typeof actionToExecute.callback === 'function') {
        console.log('EVENT_HANDLER (handleConfirmAction): Callback de confirmación VÁLIDO encontrado. Ejecutando...');
        updateAppState({ currentConfirmationAction: null });
        console.log('EVENT_HANDLER (handleConfirmAction): currentConfirmationAction limpiado del estado global.');
        const promise = actionToExecute.callback(actionToExecute.data);
        if (promise && typeof promise.then === 'function') {
            promise.catch(error => {
                console.error("EVENT_HANDLER (handleConfirmAction): Error en el callback de confirmación (promesa):", error);
            }).finally(() => {
                console.log('EVENT_HANDLER (handleConfirmAction): Callback (promesa) invocado y finalizado/manejado.');
                const dom = getDomElements();
                if (dom.confirmationModal && !dom.confirmationModal.classList.contains('hidden')) {
                    closeModal(dom.confirmationModal);
                }
            });
        } else {
             console.log('EVENT_HANDLER (handleConfirmAction): Callback invocado (síncrono).');
             const dom = getDomElements();
             if (dom.confirmationModal && !dom.confirmationModal.classList.contains('hidden')) {
                closeModal(dom.confirmationModal);
            }
        }
    } else {
        console.warn('EVENT_HANDLER (handleConfirmAction): No se encontró callback válido. actionToExecute fue:', actionToExecute);
        const dom = getDomElements();
        if (dom.confirmationModal && !dom.confirmationModal.classList.contains('hidden')) {
            closeModal(dom.confirmationModal);
        }
    }
};

export const handleChartTypeChange = () => {
    const dom = getDomElements();
    renderSelectedChart(dom.chartTypeSelect ? dom.chartTypeSelect.value : 'statusDistribution');
};

export const handleApplySpotFilters = () => {
    const dom = getDomElements();
    if (!dom.filterSpotAssetInput || !dom.filterSpotStartDateInput || !dom.filterSpotEndDateInput) { showToast("Error: Elementos de filtro no encontrados.", "error"); return; }
    const filters = { asset: dom.filterSpotAssetInput.value.trim(), startDate: dom.filterSpotStartDateInput.value, endDate: dom.filterSpotEndDateInput.value };
    updateAppState({ searchTerms: { ...getAppState().searchTerms, spotTrades: filters } });
    renderSpotTradesTable(); showToast("Filtros aplicados.", "info");
};

export const handleClearSpotFilters = () => {
    const dom = getDomElements();
    if (!dom.filterSpotAssetInput || !dom.filterSpotStartDateInput || !dom.filterSpotEndDateInput) { showToast("Error: Elementos de filtro no encontrados.", "error"); return; }
    const defaultSpotFilters = { asset: '', startDate: '', endDate: '' };
    dom.filterSpotAssetInput.value = ''; dom.filterSpotStartDateInput.value = ''; dom.filterSpotEndDateInput.value = '';
    updateAppState({ searchTerms: { ...getAppState().searchTerms, spotTrades: defaultSpotFilters } });
    renderSpotTradesTable(); showToast("Filtros limpiados.", "info");
};

export const handleSpotTradeFormSubmit = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.spotTradeForm || !dom.tradeDateInput || !dom.tradeTypeSelect || !dom.baseAssetInput || !dom.quoteAssetInput || !dom.priceInput || !dom.quantityBaseInput || !dom.spotTradeFeesInput || !dom.notesInput || !dom.saveSpotTradeButton) {
        showToast("Error interno: Formulario Spot incompleto.", "error"); return;
    }
    const rules = [
        { field: 'trade-date', errorElementId: null, checks: [{ type: 'required', message: 'Fecha es requerida.' }] },
        { field: 'trade-type', errorElementId: null, checks: [{ type: 'selectRequired', message: 'Tipo es requerido.' }] },
        { field: 'base-asset', errorElementId: null, checks: [{ type: 'required', message: 'Activo Base es requerido.' }, { type: 'maxlength', value: 10, message: 'Máx 10 caracteres.' }] },
        { field: 'quote-asset', errorElementId: null, checks: [{ type: 'required', message: 'Activo Cotización es requerido.' }, { type: 'maxlength', value: 10, message: 'Máx 10 caracteres.' }] },
        { field: 'price', errorElementId: null, checks: [{ type: 'required', message: 'Precio es requerido.' }, { type: 'min', value: 0, message: 'Precio inválido (>= 0).' }] },
        { field: 'quantity-base', errorElementId: null, checks: [{ type: 'required', message: 'Cantidad es requerida.' }, { type: 'min', value: 0, message: 'Cantidad inválida (>= 0).' }] },
        { field: 'spot-trade-fees', errorElementId: null, checks: [{ type: 'min', value: 0, message: 'Comisiones inválidas (>= 0).' }] },
        { field: 'notes', errorElementId: null, checks: [{ type: 'maxlength', value: 500, message: 'Notas muy largas (Máx 500).' }] },
    ];
    if (!validateForm(dom.spotTradeForm, rules)) { showToast("Complete campos o corrija errores.", "error"); return; }
    const id = dom.spotTradeIdInput.value ? parseInt(dom.spotTradeIdInput.value, 10) : null;
    const tradeData = {
        tradeDate: dom.tradeDateInput.value, type: dom.tradeTypeSelect.value, baseAsset: dom.baseAssetInput.value.trim().toUpperCase(),
        quoteAsset: dom.quoteAssetInput.value.trim().toUpperCase(), price: parseFloat(dom.priceInput.value),
        quantityBase: parseFloat(dom.quantityBaseInput.value), fees: parseFloat(dom.spotTradeFeesInput.value) || 0,
        notes: dom.notesInput.value.trim()
    };
    tradeData.totalQuote = (tradeData.price || 0) * (tradeData.quantityBase || 0);
    setButtonLoadingState(dom.saveSpotTradeButton, true, 'Guardando...');
    try {
        if (id) {
            await updateSpotTrade(id, tradeData);
            updateAppState({ spotTrades: getAppState().spotTrades.map(t => t.id === id ? { ...t, ...tradeData } : t) });
        } else {
            const newTradeWithId = await addSpotTrade(tradeData);
            updateAppState({ spotTrades: [newTradeWithId, ...getAppState().spotTrades] });
        }
        renderSpotTradesTable(); closeModal(dom.spotTradeModal);
    } catch (error) { console.error("Fallo al enviar form spot:", error); showToast("Error al guardar operación spot.", "error");
    } finally { setButtonLoadingState(dom.saveSpotTradeButton, false); }
};

export const handleDeleteSpotTrade = (tradeId) => {
    const numericTradeId = parseInt(tradeId, 10);
    if (isNaN(numericTradeId)) { showToast("Error: ID de operación inválido.", "error"); return; }
    const tradeToDelete = getAppState().spotTrades.find(t => t.id === numericTradeId);
    if (!tradeToDelete) { showToast("Error: Operación no encontrada.", "error"); return; }
    console.log('EVENT_HANDLER (handleDeleteSpotTrade): Llamado con tradeId:', numericTradeId);
    openConfirmationModal("Confirmar Eliminación", `¿Eliminar la operación <strong>${tradeToDelete.type.toUpperCase()} ${tradeToDelete.quantityBase} ${tradeToDelete.baseAsset}</strong>?`, "Eliminar", "red",
        async () => {
            console.log('EVENT_HANDLER (handleDeleteSpotTrade - Callback): Confirmado borrado para ID:', numericTradeId);
            try {
                await deleteSpotTrade(numericTradeId);
                updateAppState({ spotTrades: getAppState().spotTrades.filter(t => t.id !== numericTradeId) });
                renderSpotTradesTable();
                renderOverview(); refreshCurrentChart();
                showToast("Operación Spot eliminada.", "success");
            } catch (error) { console.error("Error eliminando operación spot:", error); showToast("Error al eliminar la operación.", "error"); }
        },
        numericTradeId
    );
    console.log('EVENT_HANDLER (handleDeleteSpotTrade): Modal de confirmación abierto para ID:', numericTradeId);
};

export const handleFuturesTradeFormSubmit = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.futuresTradeForm || !dom.futuresSymbolInput || !dom.futuresDirectionSelect || !dom.futuresLeverageInput || !dom.futuresEntryDateInput || !dom.futuresQuantityInput || !dom.futuresEntryPriceInput || !dom.futuresEntryFeesInput || !dom.futuresNotesInput || !dom.saveFuturesTradeButton) {
        showToast("Error interno: Formulario Futuros incompleto.", "error"); return;
    }
    const id = dom.futuresTradeIdInput.value ? parseInt(dom.futuresTradeIdInput.value, 10) : null;
    const isEdit = id !== null;
    const tradeData = {
        symbol: dom.futuresSymbolInput.value.trim().toUpperCase(), direction: dom.futuresDirectionSelect.value,
        leverage: parseInt(dom.futuresLeverageInput.value, 10), entryDate: dom.futuresEntryDateInput.value,
        quantity: parseFloat(dom.futuresQuantityInput.value), entryPrice: parseFloat(dom.futuresEntryPriceInput.value),
        entryFees: parseFloat(dom.futuresEntryFeesInput.value) || 0, notes: dom.futuresNotesInput.value.trim()
    };
    const rules = [
        { field: 'futures-symbol', errorElementId: null, checks: [{ type: 'required', message: 'Símbolo es requerido.' }, { type: 'maxlength', value: 20, message: 'Máx 20 caracteres.' }] },
        { field: 'futures-direction', errorElementId: null, checks: [{ type: 'selectRequired', message: 'Dirección es requerida.' }] },
        { field: 'futures-leverage', errorElementId: null, checks: [{ type: 'required', message: 'Apalancamiento es requerido.' }, { type: 'min', value: 1, message: 'Apalancamiento inválido (>= 1).' }] },
        { field: 'futures-entry-date', errorElementId: null, checks: [{ type: 'required', message: 'Fecha de entrada es requerida.' }] },
        { field: 'futures-quantity', errorElementId: null, checks: [{ type: 'required', message: 'Cantidad es requerida.' }, { type: 'min', value: 0, message: 'Cantidad inválida (>= 0).' }] },
        { field: 'futures-entry-price', errorElementId: null, checks: [{ type: 'required', message: 'Precio de entrada es requerido.' }, { type: 'min', value: 0, message: 'Precio inválido (>= 0).' }] },
        { field: 'futures-entry-fees', errorElementId: null, checks: [{ type: 'min', value: 0, message: 'Comisión de entrada inválida (>= 0).' }] },
        { field: 'futures-notes', errorElementId: null, checks: [{ type: 'maxlength', value: 500, message: 'Notas muy largas (Máx 500).' }] },
    ];
    if (!validateForm(dom.futuresTradeForm, rules)) { showToast("Complete campos o corrija errores.", "error"); return; }
    setButtonLoadingState(dom.saveFuturesTradeButton, true, isEdit ? 'Guardando...' : 'Abriendo...');
    try {
        if (isEdit) {
            await updateFuturesTrade(id, tradeData);
            updateAppState({ futuresTrades: getAppState().futuresTrades.map(t => t.id === id ? { ...t, ...tradeData } : t) });
            showToast("Posición actualizada.", "success");
        } else {
            const newTradeData = { ...tradeData, status: 'open', pnl: 0, exitPrice: null, exitDate: null, exitFees: 0 };
            const newTradeWithId = await addFuturesTrade(newTradeData);
            updateAppState({ futuresTrades: [newTradeWithId, ...getAppState().futuresTrades] });
        }
        renderFuturesTradesTable(); renderOverview(); closeModal(dom.futuresTradeModal);
    } catch (error) { console.error("Fallo al enviar form futuros:", error); showToast("Error al guardar posición de futuros.", "error");
    } finally { setButtonLoadingState(dom.saveFuturesTradeButton, false, isEdit ? 'Guardar Cambios' : 'Abrir Posición'); }
};

export const handleCloseFuturesTrade = async () => {
    const dom = getDomElements();
    console.log("[EVENT_HANDLER] handleCloseFuturesTrade: Iniciado."); 
    if (!dom.futuresTradeIdInput || !dom.futuresExitPriceInput || !dom.futuresExitFeesInput || !dom.closeFuturesTradeButton || !dom.futuresTradeModal) { // Añadir futuresTradeModal a la verificación
        showToast("Error interno al intentar cerrar posición.", "error");
        console.error("[EVENT_HANDLER] handleCloseFuturesTrade: Elementos DOM faltantes.");
        return;
    }
    const id = dom.futuresTradeIdInput.value ? parseInt(dom.futuresTradeIdInput.value, 10) : null;
    if (id === null || isNaN(id)) { showToast("Error: ID de posición inválido.", "error"); return; }
    const exitPrice = parseFloat(dom.futuresExitPriceInput.value);
    const exitFees = parseFloat(dom.futuresExitFeesInput.value) || 0;
    if (isNaN(exitPrice) || exitPrice <= 0) { return showToast("Ingrese un precio de salida válido.", "error"); }
    if (isNaN(exitFees) || exitFees < 0) { return showToast("Comisión de salida inválida.", "error"); }
    const tradeToClose = getAppState().futuresTrades.find(t => t.id === id);
    if (!tradeToClose || tradeToClose.status === 'closed') { showToast(tradeToClose ? "Posición ya cerrada." : "Posición no encontrada.", "info"); return; }
    
    const entryFees = parseFloat(tradeToClose.entryFees) || 0;
    const totalFees = entryFees + exitFees;
    let grossPnl;
    if (tradeToClose.direction === 'long') {
        grossPnl = (exitPrice - tradeToClose.entryPrice) * tradeToClose.quantity;
    } else { 
        grossPnl = (tradeToClose.entryPrice - exitPrice) * tradeToClose.quantity;
    }
    const netPnl = grossPnl - totalFees;
    console.log(`[EVENT_HANDLER] Cerrando Futuros: ID=${id}, Entrada=${tradeToClose.entryPrice}, Salida=${exitPrice}, Cantidad=${tradeToClose.quantity}, Dirección=${tradeToClose.direction}, Apalanc.=${tradeToClose.leverage}`);
    console.log(`[EVENT_HANDLER] PnL Bruto=${grossPnl}, ComisionesTotales=${totalFees}, PnL Neto=${netPnl}`);
    const updates = { status: 'closed', exitPrice, exitDate: new Date().toISOString(), exitFees, pnl: netPnl };
    
    // Cerrar el modal de edición/cierre de futuros ANTES de abrir el de confirmación
    closeModal(dom.futuresTradeModal); 
    console.log("[EVENT_HANDLER] handleCloseFuturesTrade: Modal de futuros cerrado.");

    console.log("[EVENT_HANDLER] handleCloseFuturesTrade: Llamando a openConfirmationModal.");
    openConfirmationModal("Confirmar Cierre", `¿Cerrar <strong>${tradeToClose.direction.toUpperCase()} en ${tradeToClose.symbol}</strong> al precio ${exitPrice}? PnL estimado: ${formatCurrency(netPnl)}`, "Cerrar Posición", "red",
        async () => {
            console.log(`[EVENT_HANDLER] handleCloseFuturesTrade - Callback: Confirmado cierre para ID: ${id}`);
            // El botón closeFuturesTradeButton podría no ser relevante aquí si el modal ya se cerró,
            // pero si se quisiera un estado de carga en el botón del modal de confirmación, se necesitaría otra referencia.
            // Por ahora, asumimos que el proceso es rápido o el feedback visual es suficiente.
            // setButtonLoadingState(dom.closeFuturesTradeButton, true, 'Cerrando...'); // Esto no funcionará porque el botón está en el modal que acabamos de cerrar.
            try {
                await updateFuturesTrade(id, updates);
                updateAppState({ futuresTrades: getAppState().futuresTrades.map(t => t.id === id ? { ...t, ...updates } : t) });
                renderFuturesTradesTable(); renderOverview(); 
                // Ya no necesitamos cerrar dom.futuresTradeModal aquí porque se cerró antes de openConfirmationModal.
                // El modal de confirmación se cierra a través de su propio flujo o en handleConfirmAction.
                showToast("Posición cerrada y PnL calculado.", "success");
            } catch (error) { 
                console.error("Error al cerrar posición:", error); 
                showToast("Error al cerrar posición.", "error");
            } 
            // finally { 
            //     setButtonLoadingState(dom.closeFuturesTradeButton, false, 'Cerrar Posición'); 
            // }
        },
        id 
    );
    console.log("[EVENT_HANDLER] handleCloseFuturesTrade: Llamada a openConfirmationModal realizada.");
};

export const handleDeleteFuturesTrade = (tradeId) => {
    const numericTradeId = parseInt(tradeId, 10);
    if (isNaN(numericTradeId)) { showToast("Error: ID de posición inválido.", "error"); return; }
    const tradeToDelete = getAppState().futuresTrades.find(t => t.id === numericTradeId);
    if (!tradeToDelete) { showToast("Error: Posición no encontrada.", "error"); return; }
    console.log('EVENT_HANDLER (handleDeleteFuturesTrade): Llamado con tradeId:', numericTradeId);
    openConfirmationModal("Confirmar Eliminación", `¿Eliminar <strong>${tradeToDelete.direction.toUpperCase()} en ${tradeToDelete.symbol}</strong>? Esta acción es irreversible.`, "Eliminar", "red",
        async () => {
            console.log('EVENT_HANDLER (handleDeleteFuturesTrade - Callback): Confirmado borrado para ID:', numericTradeId);
            try {
                await deleteFuturesTrade(numericTradeId);
                updateAppState({ futuresTrades: getAppState().futuresTrades.filter(t => t.id !== numericTradeId) });
                renderFuturesTradesTable(); renderOverview();
                showToast("Posición eliminada.", "success");
            } catch (error) { console.error("Error eliminando posición de futuros:", error); showToast("Error al eliminar posición.", "error"); }
        },
        numericTradeId
    );
    console.log('EVENT_HANDLER (handleDeleteFuturesTrade): Modal de confirmación abierto para ID:', numericTradeId);
};

export const handleAppModeChange = async (event) => {
    const newMode = event.target.value;
    const currentMode = getAppState().activeUserMode;
    if (newMode === currentMode) return;
    try {
        await db.appConfig.put({ key: 'activeUserMode', value: newMode });
        updateAppState({ activeUserMode: newMode });
        updateUIMode(newMode);
        showToast(`Modo cambiado a ${newMode === 'projects' ? 'Proyectos' : 'Criptomonedas'}.`, 'info');
    } catch (error) {
        console.error("Error al cambiar el modo:", error); showToast("Error al guardar preferencia de modo.", "error");
        const dom = getDomElements(); updateUIMode(currentMode);
        if (currentMode === 'projects' && dom.modeProjectsRadio) dom.modeProjectsRadio.checked = true;
        if (currentMode === 'crypto' && dom.modeCryptoRadio) dom.modeCryptoRadio.checked = true;
    }
};

export const updateUIMode = (mode) => {
    const dom = getDomElements();
    if (!dom.mainTitleEl) return;
    const isProjectsMode = mode === 'projects';
    dom.mainTitleEl.textContent = isProjectsMode ? 'Rastreador de Proyectos y Finanzas' : 'Rastreador de Criptomonedas';
    const tabsConfig = {
        'overview': true, 'details': isProjectsMode, 'cost': isProjectsMode, 'finance': isProjectsMode,
        'crypto-panel': !isProjectsMode, 'spot-trading': !isProjectsMode, 'futures-trading': !isProjectsMode, 'setup': true
    };
    if (dom.tabButtons && dom.tabButtons.length) {
        dom.tabButtons.forEach(button => {
            const tabId = button.dataset.tab;
            button.classList.toggle('hidden', !tabsConfig[tabId]);
        });
    }
    if (dom.setupStatusListContainer) dom.setupStatusListContainer.hidden = !isProjectsMode;
    if (dom.setupProjectNameListContainer) dom.setupProjectNameListContainer.hidden = !isProjectsMode;
    if (isProjectsMode && dom.modeProjectsRadio) dom.modeProjectsRadio.checked = true;
    if (!isProjectsMode && dom.modeCryptoRadio) dom.modeCryptoRadio.checked = true;
    renderOverview();
    const activeTabButton = document.querySelector('.tab-button.active');
    if (activeTabButton && activeTabButton.classList.contains('hidden')) {
        const overviewTab = document.getElementById('tab-overview');
        if (overviewTab) overviewTab.click();
    }
    console.log(`UI actualizada al modo: ${mode}`);
};

// --- Watchlist Handlers ---
export const handleAddCoinToWatchlistFromModal = async (coinId, coinName, addButtonElement) => {
    console.log(`[EVENT_HANDLER] handleAddCoinToWatchlistFromModal: Intentando añadir coinId: ${coinId}, coinName: ${coinName}`);
    if (!addButtonElement) { console.error("[EVENT_HANDLER] addButtonElement no fue provisto para handleAddCoinToWatchlistFromModal."); showToast("Error interno al añadir moneda.", "error"); return; }
    setButtonLoadingState(addButtonElement, true, '...');
    try {
        const newItem = await addToWatchlist(coinId);
        console.log("[EVENT_HANDLER] addToWatchlist retornó:", newItem);
        if (newItem) {
            const { watchlist } = getAppState();
            updateAppState({ watchlist: [...watchlist, newItem] });
            console.log("[EVENT_HANDLER] Watchlist actualizada en estado:", getAppState().watchlist);
            addButtonElement.textContent = 'Añadida';
            addButtonElement.disabled = true;
            addButtonElement.classList.remove('bg-green-600', 'hover:bg-green-700');
            addButtonElement.classList.add('bg-gray-400', 'cursor-not-allowed');
            renderCryptoPanel();
            showToast(`${sanitizeHTML(coinName)} añadida a la lista.`, "success");
        }
    } catch (error) {
        console.error(`[EVENT_HANDLER] Error añadiendo ${coinId} a la watchlist:`, error);
        showToast(`Error al añadir ${sanitizeHTML(coinName)} a la lista.`, "error");
    } finally {
        if (addButtonElement.textContent !== 'Añadida') {
            setButtonLoadingState(addButtonElement, false, '<i class="fas fa-plus"></i> Añadir');
        }
    }
};

export const handleRemoveCoinFromWatchlist = (coinId) => {
    console.log(`[EVENT_HANDLER] handleRemoveCoinFromWatchlist: Intentando eliminar coinId: ${coinId}`);
    if (!coinId) { showToast("Error: No se proporcionó ID de moneda para eliminar.", "error"); return; }
    const { watchlist } = getAppState();
    const coinInWatchlist = watchlist.find(item => item.coinId === coinId);
    const displayName = coinInWatchlist ? (coinInWatchlist.name || coinId) : coinId;
    openConfirmationModal("Confirmar Eliminación", `¿Está seguro de eliminar <strong>${sanitizeHTML(displayName)}</strong> de su lista de seguimiento?`, "Eliminar", "red",
        async () => {
            console.log(`[EVENT_HANDLER] handleRemoveCoinFromWatchlist - Callback: Confirmado borrado para coinId: ${coinId}`);
            try {
                await removeFromWatchlist(coinId);
                const currentWatchlist = getAppState().watchlist;
                const updatedWatchlist = currentWatchlist.filter(item => item.coinId !== coinId);
                updateAppState({ watchlist: updatedWatchlist });
                renderCryptoPanel();
                showToast(`${sanitizeHTML(displayName)} eliminada de la lista.`, "success");
                console.log(`[EVENT_HANDLER] handleRemoveCoinFromWatchlist - Callback: ${coinId} eliminada y panel renderizado.`);
            } catch (error) {
                console.error(`[EVENT_HANDLER] handleRemoveCoinFromWatchlist - Callback: Error eliminando ${coinId}:`, error);
                showToast("Error al eliminar la moneda de la lista.", "error");
            }
        },
        coinId
    );
};
// --- NUEVA FUNCIÓN PARA EL CALCULADOR SPOT ---
export const handleSpotCalculatorChange = (buyTradeData) => {
    const dom = getDomElements();

    // Asegurarse de que los elementos DOM necesarios para el calculador y los datos de compra existan
    if (!dom.calcTargetProfitUsdInput || !dom.calcEstimatedSellFeeInput || 
        !dom.calcSellPriceNeeded || !dom.calcTotalSellValue || !buyTradeData) {
        
        // console.warn("Calculador Spot: Faltan elementos DOM o datos de la operación de compra base.");
        // Si los elementos de salida existen, mostrar un error o 'N/A'
        if(dom.calcSellPriceNeeded) dom.calcSellPriceNeeded.textContent = 'Error';
        if(dom.calcTotalSellValue) dom.calcTotalSellValue.textContent = 'Error';
        return;
    }

    const targetProfitUSD = dom.calcTargetProfitUsdInput.value;
    const estimatedSellFeeUSD = dom.calcEstimatedSellFeeInput.value;

    // Extraer datos de la operación de compra original
    const buyQuantity = parseFloat(buyTradeData.quantityBase);
    const buyPricePerToken = parseFloat(buyTradeData.price);
    const buyFeesUSD = parseFloat(buyTradeData.fees) || 0;

    // Llamar a la función de cálculo
    const results = calculateSpotTargetMetrics({
        buyQuantity,
        buyPricePerToken,
        buyFeesUSD,
        targetProfitUSD,
        estimatedSellFeeUSD
    });

    // Actualizar la UI con los resultados
    if (results.error) {
        dom.calcSellPriceNeeded.textContent = 'N/A';
        dom.calcTotalSellValue.textContent = 'N/A';
        // Opcional: mostrar results.error en algún toast o span de error específico del calculador
        // showToast(`Error en cálculo: ${results.error}`, 'error');
        return;
    }

    if (results.sellPricePerTokenNeeded !== null && !isNaN(results.sellPricePerTokenNeeded)) {
        dom.calcSellPriceNeeded.textContent = formatCurrency(results.sellPricePerTokenNeeded);
    } else {
        dom.calcSellPriceNeeded.textContent = '-';
    }

    if (results.totalSellValue !== null && !isNaN(results.totalSellValue)) {
        dom.calcTotalSellValue.textContent = formatCurrency(results.totalSellValue);
    } else {
        dom.calcTotalSellValue.textContent = '-';
    }
};