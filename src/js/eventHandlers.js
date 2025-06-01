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
    searchProjectTasksInput, searchProjectCostsInput, searchFixedExpensesInput
} from './domElements.js';
import { getAppState, updateAppState } from './state.js';
import {
    renderProjectDetailsTable, renderProjectCostTable,
    renderFixedExpensesList, renderSetupLists, renderOverview, renderProjectSummaries,
    renderFinanceSummary, renderFinanceTab
} from './uiRender.js';
import {
    openAddTaskModal, openEditTaskModal, openEditCostModal, closeModal,
    openConfirmationModal, closeConfirmationModal, handleChangeAppTitle, updateTaskModalDropdowns
} from './modalHandlers.js';
import db from './db.js';
import { resetToDefaultData, importData } from './storage.js';
import {
    sanitizeHTML, generateId, showToast,
    clearAllValidationErrors,
    getCurrentDate, setButtonLoadingState,
    debounce, validateForm 
} from './utils.js';
import { renderSelectedChart, refreshCurrentChart } from './charts.js';

// --- Handlers de Búsqueda (Ahora con debounce) ---

// Funciones internas que contienen la lógica real de búsqueda
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

// Exportar las versiones debounced de los handlers de búsqueda
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

    // Optimistic UI update
    const updatedStatusList = currentState.statusList.map(s => 
        s.id === statusId ? { ...s, color: newColor } : s
    );
    updateAppState({ statusList: updatedStatusList });
    
    // Re-render la lista de setup para mostrar el nuevo color inmediatamente
    renderSetupLists(); 

    try {
        await db.statusList.update(statusId, { color: newColor });
        showToast("Color de estado actualizado.", "success");
        // Refrescar componentes que usan colores de estado
        refreshCurrentChart();
        renderProjectDetailsTable(); // Para actualizar badges de estado
    } catch (error) {
        console.error("Error updating status color in DB:", error);
        showToast("Error al guardar el color del estado.", "error");
        // Revertir el cambio en el estado si la DB falla (opcional, pero bueno para consistencia)
        // Para esto, necesitarías guardar el color original antes de la actualización optimista.
        // Por simplicidad, por ahora solo mostramos error.
    }
};
// --- FIN Handler para el cambio de color de estado ---


const handleAddListItem = async (inputEl, errorEl, listKeyInState, listNameSingular, successMsg, maxLength, renderFn, otherRenderFns = []) => {
    if (!inputEl || !errorEl) return false;
    clearAllValidationErrors(inputEl.closest('form') || inputEl.parentNode); // Limpiar errores del contenedor o formulario
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
                    validate: (value) => !list.some(item => item.name.toLowerCase() === value.toLowerCase())
                }
            ]
        }
    ];

    if (!validateForm(inputEl.closest('form') || inputEl.parentNode, rules)) { // Validar el input en su contexto
        return false;
    }
    
    // Para nuevos estados, asignar un color por defecto
    const newItem = { id: generateId(), name: newItemName };
    if (listKeyInState === 'statusList') {
        newItem.color = '#CCCCCC'; // Color gris por defecto para nuevos estados
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

export const handleResetData = () => {
    openConfirmationModal(
        "¡ADVERTENCIA! Restablecer Datos",
        `¿Está <strong>MUY seguro</strong>? Esto eliminará <strong>TODOS</strong> sus datos actuales y cargará los datos de ejemplo.<br><br>Esta acción es <strong>irreversible</strong>.`,
        "Sí, Restablecer Todo", "red",
        async () => { 
            if (!resetDataButton) return; 
            setButtonLoadingState(resetDataButton, true, 'Restableciendo...');
            await resetToDefaultData(); 
            setButtonLoadingState(resetDataButton, false);
        }
   );
};

export const handleTaskFormSubmit = async (event) => { 
    event.preventDefault();
    if (!taskForm) return; 
    
    const validationRules = [
        {
            field: 'task-project-name',
            errorElementId: 'task-project-name-error',
            checks: [{ type: 'selectRequired', message: "Seleccione un proyecto." }]
        },
        {
            field: 'task-status',
            errorElementId: 'task-status-error',
            checks: [{ type: 'selectRequired', message: "Seleccione un estado." }]
        },
        {
            field: 'task-name',
            errorElementId: 'task-name-error',
            checks: [
                { type: 'required', message: "Ingrese el nombre de la tarea." },
                { type: 'maxlength', value: 100, message: "Máx 100 caracteres." }
            ]
        },
        {
            field: 'task-start-date',
            errorElementId: 'task-start-date-error',
            checks: [{ type: 'required', message: "Ingrese fecha de inicio." }]
        },
        {
            field: 'task-end-date',
            errorElementId: 'task-end-date-error',
            checks: [
                { type: 'required', message: "Ingrese fecha de fin." },
                { type: 'dateComparison', compareTo: 'task-start-date', operator: 'greaterThanOrEqualTo', message: "La fecha de fin no puede ser anterior a la de inicio." }
            ]
        }
    ];

    if (!validateForm(taskForm, validationRules)) {
        showToast('Complete los campos requeridos (*).', 'error'); // Mantener este toast general
        return;
    }

    const existingTaskId = taskIdInput ? taskIdInput.value : null;
    const taskData = {
        id: existingTaskId || generateId(),
        projectName: taskProjectNameSelect.value,
        task: taskNameInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        startDate: taskStartDateInput.value,
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
     catch (error) { // ¡CORREGIDO! Asegurar el catch block
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
        {
            field: 'cost-budget',
            errorElementId: 'cost-budget-error',
            checks: [
                { type: 'required', message: "Presupuesto es requerido." },
                { type: 'min', value: 0, message: "Presupuesto inválido (>= 0)." }
            ]
        },
        {
            field: 'cost-actual',
            errorElementId: 'cost-actual-error',
            checks: [
                { type: 'required', message: "Costo actual es requerido." },
                { type: 'min', value: 0, message: "Costo actual inválido (>= 0)." }
            ]
        }
    ];

    if (!validateForm(costForm, validationRules)) {
        showToast('Ingrese valores numéricos válidos.', 'error'); // Mantener este toast general
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
        } else {
            console.warn("Costo actualizado en DB pero no encontrado en estado para actualizar UI inmediatamente.");
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
        {
            field: 'expense-name',
            errorElementId: 'expense-name-error',
            checks: [
                { type: 'required', message: "Ingrese nombre del gasto." },
                { type: 'maxlength', value: 100, message: "Máx 100 caracteres." },
                {
                    type: 'custom',
                    message: `El gasto "${sanitizeHTML(expenseNameInput.value.trim())}" ya existe.`,
                    validate: (value) => !currentState.fixedExpenses.some(exp => exp.name.toLowerCase() === value.toLowerCase())
                }
            ]
        },
        {
            field: 'expense-amount',
            errorElementId: 'expense-amount-error',
            checks: [
                { type: 'required', message: "Ingrese un monto." },
                { type: 'min', value: 0.01, message: "Monto debe ser positivo." }
            ]
        }
    ];

    if (!validateForm(addExpenseForm, rules)) {
        showToast("Complete los campos requeridos (*).", "error"); // Mantener este toast general
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
            fixedExpenses, mainTitleConfig, monthlyIncomeConfig
        ] = await db.transaction('r', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            return await Promise.all([
                db.statusList.toArray(),
                db.projectNameList.toArray(),
                db.projectDetails.toArray(),
                db.projectCosts.toArray(),
                db.fixedExpenses.toArray(),
                db.appConfig.get('mainTitle'),
                db.appConfig.get('monthlyIncome')
            ]);
        });

        const dataToExport = {
            mainTitle: mainTitleConfig ? mainTitleConfig.value : 'Rastreador de Proyectos y Finanzas',
            statusList: statusList, 
            projectNameList: projectNameList,
            projectDetails: projectDetails,
            projectCosts: projectCosts,
            monthlyIncome: monthlyIncomeConfig ? monthlyIncomeConfig.value : 0,
            fixedExpenses: fixedExpenses,
            exportDate: new Date().toISOString(),
            appVersion: 'vFin_Optimized_Dexie_1.0'
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `datos_proyectos_finanzas_${getCurrentDate()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Datos exportados correctamente.', 'success');
    } catch (error) {
        console.error("Error exporting data:", error);
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
                    setButtonLoadingState(importDataButton, false);
                    if (!success && importFileInput) importFileInput.value = ''; 
                }
            );
        } catch (error) { // ¡CORREGIDO! Asegurar el catch block
            console.error("Error parsing imported JSON:", error);
            showToast('Error al procesar el archivo JSON.', 'error');
        } finally { // ¡CORREGIDO! Asegurar el finally block
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
    const sortButton = event.target.closest('.sortable-header'); // El elemento clicado es el botón
    if (!sortButton) return;

    // Obtener tableId y sortKey directamente del botón
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

    // Disparar la re-renderización de la tabla para que los cambios se visualicen
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