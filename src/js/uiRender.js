// src/js/uiRender.js

import {
    totalProjectsEl, totalActualCostEl, cumulativeTasksEl, projectSummaryContainer,
    chartNoDataEl, 
    projectDetailsTable, projectDetailsTableBody, searchProjectTasksInput,
    projectCostTable, projectCostTableBody, searchProjectCostsInput,
    statusListEl, newStatusInput, projectNameListEl, newProjectNameInput,
    monthlyIncomeInput, totalFixedExpensesEl, netMonthlyAmountEl,
    fixedExpensesTable, fixedExpensesTableBody, searchFixedExpensesInput,
    htmlElement, footerYearSpan, tabButtons, // Importar elementos comunes
    // Importar los nuevos contenedores de títulos/ordenación
    projectDetailsSortHeaders, projectCostSortHeaders, fixedExpensesSortHeaders
} from './domElements.js';
// Importar getFilteredAndSortedData y calculateProjectSummary
import { getAppState, getFilteredAndSortedData, calculateProjectSummary } from './state.js';
import {
    formatCurrency, 
    getStatusStyle, 
    getCurrentDate, sanitizeHTML,
    updateSortIcons, // La función que vamos a usar y modificar
    getContrastingTextColor
} from './utils.js';
import { DEFAULT_STATUS_LIST, SORT_STATE_DEFAULTS } from './config.js';

// Definición de las cabeceras de las tablas para usar como data-labels en móvil
// El orden aquí debe coincidir con el orden de las columnas en el HTML y la renderización
const TABLE_HEADERS = {
    projectDetails: [
        'Proyecto', 'Tarea', 'Descripción', 'Inicio', 'Fin', 'Estado', 'Acciones'
    ],
    projectCosts: [
        'Proyecto', 'Presupuesto', 'Costo Actual', 'Diferencia', 'Acciones'
    ],
    fixedExpenses: [
        'Nombre', 'Monto', 'Acción'
    ]
};

// ... (renderAll, renderOverview, createTableCell se mantienen igual) ...
export const renderAll = () => {
    console.log("Rendering all components...");
    const currentState = getAppState();

    renderSetupLists(currentState);
    renderProjectDetailsTable(currentState); // Llama a updateSortIcons
    renderProjectCostTable(currentState);   // Llama a updateSortIcons
    renderFinanceTab(currentState);         // Llama a renderFixedExpensesList que llama a updateSortIcons
    renderOverview(currentState);
    renderProjectSummaries(currentState);
    updateFooterYear();
    console.log("Rendering complete.");
};

export const renderOverview = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!totalProjectsEl || !totalActualCostEl || !cumulativeTasksEl) return;

    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    const projectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
    const projectDetails = Array.isArray(currentState.projectDetails) ? currentState.projectDetails : [];

    totalProjectsEl.textContent = projectNameList.length.toString();
    const totalCost = projectCosts.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
    totalActualCostEl.textContent = formatCurrency(totalCost);
    cumulativeTasksEl.textContent = projectDetails.length.toString();
};

// Modificado createTableCell para aceptar un dataLabel directamente
const createTableCell = (text, classes = [], isHtml = false, dataLabel = null) => {
    const cell = document.createElement('td');
    cell.className = `px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm ${classes.join(' ')}`;
    if (isHtml) {
        cell.innerHTML = text;
    } else {
        cell.textContent = text;
    }
    if (dataLabel) {
        cell.setAttribute('data-label', dataLabel); 
    }
    return cell;
};

/**
 * Renders a message indicating that there are no items to display.
 * @param {HTMLElement} parentElement - The element where the message will be rendered (e.g., tbody, ul, div).
 * @param {string} message - The message to display.
 * @param {number|null} [colspan=null] - Optional. If rendering inside a table body, the colspan for the TD element.
 */
export const renderEmptyStateMessage = (parentElement, message, colspan = null) => {
    if (!parentElement) return;

    parentElement.innerHTML = ''; // Clear existing content

    if (parentElement.tagName === 'TBODY') {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.className = 'text-center py-10 text-gray-500 dark:text-gray-400 italic';
        if (colspan !== null) {
            td.setAttribute('colspan', colspan);
        }
        td.textContent = message;
        tr.appendChild(td);
        parentElement.appendChild(tr);
    } else if (parentElement.tagName === 'UL') {
        const li = document.createElement('li');
        li.className = 'text-xs text-gray-500 dark:text-gray-400 italic p-2 text-center';
        li.textContent = message;
        parentElement.appendChild(li);
    } else {
        // Fallback for other container types (like div for project summaries)
        const p = document.createElement('p');
        p.className = 'text-sm text-gray-500 dark:text-gray-400 italic text-center mt-4';
        p.textContent = message;
        parentElement.appendChild(p);
    }
};


export const renderProjectDetailsTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectDetailsTableBody || !projectDetailsTable) return;
    projectDetailsTableBody.innerHTML = ''; // Limpiar antes de renderizar

    const searchTerm = currentState.searchTerms?.projectDetails || '';
    const sortConfig = currentState.sortState?.projectDetails || SORT_STATE_DEFAULTS.projectDetails;
    
    const itemsToRender = getFilteredAndSortedData('projectDetails', searchTerm, sortConfig);
    
    // ¡MODIFICADO! updateSortIcons ahora se llama con el contenedor de los botones
    if (projectDetailsSortHeaders) { // Asegurarse de que el elemento existe
        updateSortIcons(projectDetailsSortHeaders, sortConfig.key, sortConfig.direction);
    }

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay tareas que coincidan con su búsqueda.' : 'No hay tareas registradas.';
        renderEmptyStateMessage(projectDetailsTableBody, message, 7);
        if(searchProjectTasksInput) searchProjectTasksInput.value = searchTerm;
        return;
    }

    const today = getCurrentDate();
    const statusListToUse = Array.isArray(currentState.statusList) && currentState.statusList.length > 0 
                            ? currentState.statusList 
                            : DEFAULT_STATUS_LIST;
    const completedStatusObject = statusListToUse.find(s => s.name.toLowerCase() === 'completado');
    const completedStatusName = completedStatusObject ? completedStatusObject.name : 'Completado';

    const fragment = document.createDocumentFragment();
    itemsToRender.forEach(task => { // Iterar sobre los datos ya filtrados y ordenados
        const isOverdue = task.endDate && task.endDate < today && task.status !== completedStatusName;
        const row = document.createElement('tr');
        row.className = `hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isOverdue ? 'overdue-task' : ''}`;
        row.dataset.taskId = task.id;

        // Pasar dataLabel directamente a createTableCell
        row.appendChild(createTableCell(sanitizeHTML(task.projectName), [], false, TABLE_HEADERS.projectDetails[0]));
        row.appendChild(createTableCell(sanitizeHTML(task.task), ['font-medium'], false, TABLE_HEADERS.projectDetails[1]));
        const descriptionCell = createTableCell(sanitizeHTML(task.description) || '-', ['text-gray-600', 'dark:text-gray-400', 'max-w-xs', 'truncate'], false, TABLE_HEADERS.projectDetails[2]);
        descriptionCell.title = task.description || ''; // Mantener el title aquí, no en createTableCell
        row.appendChild(descriptionCell);
        
        row.appendChild(createTableCell(task.startDate || '-', ['whitespace-nowrap'], false, TABLE_HEADERS.projectDetails[3]));
        row.appendChild(createTableCell(task.endDate || '-', ['whitespace-nowrap'], false, TABLE_HEADERS.projectDetails[4]));
        
        const statusStyle = getStatusStyle(task.status, currentState.statusList);
        row.appendChild(
            createTableCell(
                `<span class="status-badge px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${statusStyle.backgroundColor}; color: ${statusStyle.textColor};">${sanitizeHTML(task.status) || '-'}</span>`,
                [], true, TABLE_HEADERS.projectDetails[5]
            )
        );
        row.appendChild(
            createTableCell(
                `<button class="text-blue-500 hover:text-blue-700 edit-task-button dark:text-blue-400 dark:hover:text-blue-300" data-id="${task.id}" title="Editar Tarea" aria-label="Editar tarea ${sanitizeHTML(task.task)}">
                    <i class="fas fa-edit fa-fw" aria-hidden="true"></i>
                </button>
                <button class="text-red-500 hover:text-red-700 delete-task-button dark:text-red-400 dark:hover:text-red-300" data-id="${task.id}" title="Eliminar Tarea" aria-label="Eliminar tarea ${sanitizeHTML(task.task)}">
                    <i class="fas fa-trash fa-fw" aria-hidden="true"></i>
                </button>`,
                ['space-x-2', 'whitespace-nowrap'], true, TABLE_HEADERS.projectDetails[6]
            )
        );
        fragment.appendChild(row);
    });
    projectDetailsTableBody.appendChild(fragment);
    if(searchProjectTasksInput) searchProjectTasksInput.value = searchTerm;
};

export const renderProjectCostTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectCostTableBody || !projectCostTable) return;
    projectCostTableBody.innerHTML = ''; // Limpiar antes de renderizar

    const searchTerm = currentState.searchTerms?.projectCosts || '';
    const sortConfig = currentState.sortState?.projectCosts || SORT_STATE_DEFAULTS.projectCosts;

    // Usar getFilteredAndSortedData
    const itemsToRender = getFilteredAndSortedData('projectCosts', searchTerm, sortConfig);
    
    // ¡MODIFICADO! updateSortIcons ahora se llama con el contenedor de los botones
    if (projectCostSortHeaders) { // Asegurarse de que el elemento existe
        updateSortIcons(projectCostSortHeaders, sortConfig.key, sortConfig.direction);
    }

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay costos de proyecto que coincidan.' : 'No hay costos de proyecto definidos.';
        renderEmptyStateMessage(projectCostTableBody, message, 5);
        if(searchProjectCostsInput) searchProjectCostsInput.value = searchTerm;
        return;
    }
    const fragment = document.createDocumentFragment();
    itemsToRender.forEach(cost => { // Iterar sobre los datos ya filtrados y ordenados
        const budget = Number(cost.budget) || 0;
        const actual = Number(cost.actualCost) || 0;
        const difference = budget - actual;
        const diffColorClass = difference >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150';
        row.dataset.costId = cost.id;

        // Pasar dataLabel directamente a createTableCell
        row.appendChild(createTableCell(sanitizeHTML(cost.projectName), ['font-medium', 'text-gray-800', 'dark:text-gray-200'], false, TABLE_HEADERS.projectCosts[0]));
        row.appendChild(createTableCell(formatCurrency(budget), ['text-gray-700', 'dark:text-gray-300'], false, TABLE_HEADERS.projectCosts[1]));
        row.appendChild(createTableCell(formatCurrency(actual), ['text-gray-700', 'dark:text-gray-300'], false, TABLE_HEADERS.projectCosts[2]));
        row.appendChild(createTableCell(formatCurrency(difference), [diffColorClass, 'font-medium'], false, TABLE_HEADERS.projectCosts[3]));
        row.appendChild(
            createTableCell(
                `<button class="text-blue-600 hover:text-blue-800 edit-cost-button dark:text-blue-400 dark:hover:text-blue-300" data-id="${cost.id}" title="Editar Costos" aria-label="Editar costos del proyecto ${sanitizeHTML(cost.projectName)}">
                    <i class="fas fa-edit fa-fw" aria-hidden="true"></i>
                </button>`,
                [], true, TABLE_HEADERS.projectCosts[4]
            )
        );
        fragment.appendChild(row);
    });
    projectCostTableBody.appendChild(fragment);
    if(searchProjectCostsInput) searchProjectCostsInput.value = searchTerm;
};

const renderGenericSetupList = (listEl, dataList, deleteButtonClass, itemNameSingular, inputElToClear = null, isStatusList = false) => {
    if (!listEl) return;
    listEl.innerHTML = ''; // Limpiar antes de renderizar
    const listToRender = Array.isArray(dataList) ? dataList : [];
    const sortedList = [...listToRender].sort((a,b) => a.name.localeCompare(b.name));

    if (sortedList.length === 0) {
        renderEmptyStateMessage(listEl, `No hay ${itemNameSingular}s definidos.`);
        return;
    }
    const fragment = document.createDocumentFragment();
    sortedList.forEach(item => {
        const safeName = sanitizeHTML(item.name);
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center text-sm text-gray-700 dark:text-gray-300 py-1.5 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150';
        
        let colorPickerHtml = '';
        if (isStatusList) {
            const currentColor = item.color || '#CCCCCC'; // Fallback color
            colorPickerHtml = `
                <input type="color" value="${currentColor}" 
                       class="status-color-picker w-6 h-6 p-0 border-none rounded cursor-pointer ml-2 mr-2 flex-shrink-0" 
                       data-id="${item.id}" 
                       aria-label="Seleccionar color para ${safeName}" 
                       title="Cambiar color para ${safeName}">
            `;
        }
        
        li.innerHTML = `
            ${isStatusList ? `<span class="inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0" style="background-color: ${item.color || '#CCCCCC'};"></span>` : ''}
            <span class="flex-grow pr-2 truncate" title="${safeName}">${safeName}</span>
            ${colorPickerHtml}
            <button class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs ${deleteButtonClass} flex-shrink-0" data-id="${item.id}" data-name="${safeName}" title="Eliminar ${itemNameSingular} '${safeName}'" aria-label="Eliminar ${itemNameSingular} ${safeName}">
                <i class="fas fa-times-circle fa-fw" aria-hidden="true"></i>
            </button>`;
        fragment.appendChild(li);
    });
    listEl.appendChild(fragment);
    if (inputElToClear) {
        inputElToClear.value = '';
    }
};

export const renderSetupLists = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    renderGenericSetupList(statusListEl, currentState.statusList, 'delete-status-button', 'estado', newStatusInput, true);
    renderGenericSetupList(projectNameListEl, currentState.projectNameList, 'delete-project-name-button', 'proyecto', newProjectNameInput, false);
};

export const renderProjectSummaries = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectSummaryContainer) return;
    projectSummaryContainer.innerHTML = ''; // Limpiar antes de renderizar

    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    
    if (projectNameList.length === 0) {
        renderEmptyStateMessage(projectSummaryContainer, `No hay proyectos definidos en Configuración.`);
        return;
    }

    const sortedProjectNames = [...projectNameList].sort((a,b) => a.name.localeCompare(b.name));
    const fragment = document.createDocumentFragment();

    sortedProjectNames.forEach(project => {
        const projectName = project.name;
        // Usar calculateProjectSummary
        const summaryData = calculateProjectSummary(projectName);
        const actualCost = summaryData.actualCost;
        const taskCount = summaryData.taskCount;
        const safeProjectName = sanitizeHTML(projectName);

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'project-summary-item bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-150 mb-2 cursor-pointer';
        summaryDiv.dataset.projectName = projectName;

        summaryDiv.innerHTML = `
             <h4 class="font-semibold text-indigo-700 dark:text-indigo-300 truncate text-base mb-1 pointer-events-none" title="${safeProjectName}">${safeProjectName}</h4>
             <p class="text-sm text-gray-600 dark:text-gray-300 pointer-events-none">Costo Actual: <span class="font-medium">${formatCurrency(actualCost)}</span></p>
             <p class="text-sm text-gray-600 dark:text-gray-300 pointer-events-none">Tareas Totales: <span class="font-medium">${taskCount}</span></p>
         `;
        fragment.appendChild(summaryDiv);
    });
    projectSummaryContainer.appendChild(fragment);
};

export const renderFinanceTab = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!monthlyIncomeInput) return;
    
    const monthlyIncome = typeof currentState.monthlyIncome === 'number' ? currentState.monthlyIncome : 0;
    monthlyIncomeInput.value = monthlyIncome >= 0 ? monthlyIncome.toFixed(2) : '';
    
    renderFixedExpensesList(currentState);
    renderFinanceSummary(currentState);
};

export const renderFixedExpensesList = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!fixedExpensesTableBody || !fixedExpensesTable) return;
    fixedExpensesTableBody.innerHTML = ''; // Limpiar antes de renderizar

    const searchTerm = currentState.searchTerms?.fixedExpenses || '';
    const sortConfig = currentState.sortState?.fixedExpenses || SORT_STATE_DEFAULTS.fixedExpenses;

    // Usar getFilteredAndSortedData
    const itemsToRender = getFilteredAndSortedData('fixedExpenses', searchTerm, sortConfig);

    // ¡MODIFICADO! updateSortIcons ahora se llama con el contenedor de los botones
    if (fixedExpensesSortHeaders) { // Asegurarse de que el elemento existe
        updateSortIcons(fixedExpensesSortHeaders, sortConfig.key, sortConfig.direction);
    }

    if (itemsToRender.length === 0) {
        const message = searchTerm ? 'No hay gastos que coincidan.' : 'No hay gastos fijos registrados.';
        renderEmptyStateMessage(fixedExpensesTableBody, message, 3);
        if(searchFixedExpensesInput) searchFixedExpensesInput.value = searchTerm;
        return;
    }
    const fragment = document.createDocumentFragment();
    itemsToRender.forEach(expense => { // Iterar sobre los datos ya filtrados y ordenados
        const safeName = sanitizeHTML(expense.name);
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150';
        row.dataset.expenseId = expense.id;

        // Pasar dataLabel directamente a createTableCell
        row.appendChild(createTableCell(safeName, ['text-gray-800', 'dark:text-gray-200', 'whitespace-nowrap'], false, TABLE_HEADERS.fixedExpenses[0]));
        row.appendChild(createTableCell(formatCurrency(expense.amount), ['text-gray-600', 'dark:text-gray-300', 'text-right'], false, TABLE_HEADERS.fixedExpenses[1]));
        row.appendChild(
            createTableCell(
                `<button class="text-red-500 hover:text-red-700 delete-expense-button transition duration-150 dark:text-red-400 dark:hover:text-red-300" data-id="${expense.id}" data-name="${safeName}" title="Eliminar Gasto '${safeName}'" aria-label="Eliminar gasto ${safeName}">
                    <i class="fas fa-trash-alt fa-fw fa-xs" aria-hidden="true"></i>
                </button>`,
                ['text-right'], true, TABLE_HEADERS.fixedExpenses[2]
            )
        );
        fragment.appendChild(row);
    });
    fixedExpensesTableBody.appendChild(fragment);
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
    netMonthlyAmountEl.classList.remove('net-positive', 'net-negative', 'text-indigo-900', 'dark:text-indigo-100', 'text-gray-700', 'dark:text-gray-300');

    if (netAmount > 0) netMonthlyAmountEl.classList.add('net-positive');
    else if (netAmount < 0) netMonthlyAmountEl.classList.add('net-negative');
    else netMonthlyAmountEl.classList.add('text-gray-700', 'dark:text-gray-300');
};

export const updateFooterYear = () => {
    if (footerYearSpan) {
        footerYearSpan.textContent = new Date().getFullYear().toString();
    }
};