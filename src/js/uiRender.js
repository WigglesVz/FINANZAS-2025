// src/js/uiRender.js

import {
    totalProjectsEl, totalActualCostEl, cumulativeTasksEl, projectSummaryContainer,
    chartNoDataEl,
    projectDetailsTable, projectDetailsTableBody, searchProjectTasksInput,
    projectCostTable, projectCostTableBody, searchProjectCostsInput, // AÑADIDO searchProjectCostsInput
    statusListEl, newStatusInput, projectNameListEl, newProjectNameInput,
    monthlyIncomeInput, totalFixedExpensesEl, netMonthlyAmountEl,
    fixedExpensesTable, fixedExpensesTableBody, searchFixedExpensesInput, // AÑADIDO searchFixedExpensesInput
    htmlElement, footerYearSpan
} from './domElements.js';
import { getAppState } from './state.js';
import {
    formatCurrency, getStatusColor, getCurrentDate, sanitizeHTML,
    sortArray, updateSortIcons
} from './utils.js';
import { DEFAULT_STATUS_LIST, SORT_STATE_DEFAULTS } from './config.js';

export const renderAll = () => {
    console.log("Rendering all components...");
    const currentState = getAppState();

    renderSetupLists(currentState);
    renderProjectDetailsTable(currentState);
    renderProjectCostTable(currentState);
    renderFinanceTab(currentState);
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

const createTableCell = (text, classes = [], isHtml = false) => {
    const cell = document.createElement('td');
    cell.className = `px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm ${classes.join(' ')}`;
    if (isHtml) {
        cell.innerHTML = text;
    } else {
        cell.textContent = text;
    }
    return cell;
};

export const renderProjectDetailsTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectDetailsTableBody || !projectDetailsTable) return;
    projectDetailsTableBody.innerHTML = '';

    const searchTerm = (currentState.searchTerms?.projectDetails || '').toLowerCase();
    let itemsToRender = Array.isArray(currentState.projectDetails) ? currentState.projectDetails : [];

    if (searchTerm) {
        itemsToRender = itemsToRender.filter(task => 
            (task.task && task.task.toLowerCase().includes(searchTerm)) || 
            (task.description && task.description.toLowerCase().includes(searchTerm)) ||
            (task.projectName && task.projectName.toLowerCase().includes(searchTerm))
        );
    }

    const sortConfig = currentState.sortState?.projectDetails || SORT_STATE_DEFAULTS.projectDetails;
    const { key, direction } = sortConfig;
    const sortedDetails = sortArray(itemsToRender, key, direction);
    
    updateSortIcons(projectDetailsTable, key, direction);

    if (sortedDetails.length === 0) {
        projectDetailsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500 dark:text-gray-400 italic">${searchTerm ? 'No hay tareas que coincidan con su búsqueda.' : 'No hay tareas registradas.'}</td></tr>`;
        if(searchProjectTasksInput) searchProjectTasksInput.value = currentState.searchTerms?.projectDetails || ''; // Mantener el valor del input
        return;
    }

    const today = getCurrentDate();
    const statusListToUse = Array.isArray(currentState.statusList) && currentState.statusList.length > 0 
                            ? currentState.statusList 
                            : DEFAULT_STATUS_LIST;
    const completedStatusObject = statusListToUse.find(s => s.name.toLowerCase() === 'completado');
    const completedStatusName = completedStatusObject ? completedStatusObject.name : 'Completado';

    const fragment = document.createDocumentFragment();
    sortedDetails.forEach(task => {
        const isOverdue = task.endDate && task.endDate < today && task.status !== completedStatusName;
        const row = document.createElement('tr');
        row.className = `hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isOverdue ? 'overdue-task' : ''}`;
        row.dataset.taskId = task.id;

        row.appendChild(createTableCell(sanitizeHTML(task.projectName)));
        row.appendChild(createTableCell(sanitizeHTML(task.task), ['font-medium']));
        const descriptionCell = createTableCell(sanitizeHTML(task.description) || '-', ['text-gray-600', 'dark:text-gray-400', 'max-w-xs', 'truncate']);
        descriptionCell.title = task.description || '';
        row.appendChild(descriptionCell);
        row.appendChild(createTableCell(task.startDate || '-', ['whitespace-nowrap']));
        row.appendChild(createTableCell(task.endDate || '-', ['whitespace-nowrap']));
        row.appendChild(
            createTableCell(
                `<span class="status-badge ${getStatusColor(task.status)} px-2 py-1 rounded-full text-xs font-medium">${sanitizeHTML(task.status) || '-'}</span>`,
                [], true
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
                ['space-x-2', 'whitespace-nowrap'], true
            )
        );
        fragment.appendChild(row);
    });
    projectDetailsTableBody.appendChild(fragment);
    if(searchProjectTasksInput) searchProjectTasksInput.value = currentState.searchTerms?.projectDetails || '';
};

export const renderProjectCostTable = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectCostTableBody || !projectCostTable) return;
    projectCostTableBody.innerHTML = '';

    const searchTerm = (currentState.searchTerms?.projectCosts || '').toLowerCase();
    let itemsToRender = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];

    if (searchTerm) {
        itemsToRender = itemsToRender.filter(cost =>
            (cost.projectName && cost.projectName.toLowerCase().includes(searchTerm))
        );
    }

    const sortConfig = currentState.sortState?.projectCosts || SORT_STATE_DEFAULTS.projectCosts;
    const { key, direction } = sortConfig;
    const sortedCosts = sortArray(itemsToRender, key, direction);
    updateSortIcons(projectCostTable, key, direction);

    if (sortedCosts.length === 0) {
        projectCostTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 dark:text-gray-400 italic">${searchTerm ? 'No hay costos de proyecto que coincidan.' : 'No hay costos de proyecto definidos.'}</td></tr>`;
        if(searchProjectCostsInput) searchProjectCostsInput.value = currentState.searchTerms?.projectCosts || '';
        return;
    }
    const fragment = document.createDocumentFragment();
    sortedCosts.forEach(cost => {
        const budget = Number(cost.budget) || 0;
        const actual = Number(cost.actualCost) || 0;
        const difference = budget - actual;
        const diffColorClass = difference >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150';
        row.dataset.costId = cost.id;

        row.appendChild(createTableCell(sanitizeHTML(cost.projectName), ['font-medium', 'text-gray-800', 'dark:text-gray-200']));
        row.appendChild(createTableCell(formatCurrency(budget), ['text-gray-700', 'dark:text-gray-300']));
        row.appendChild(createTableCell(formatCurrency(actual), ['text-gray-700', 'dark:text-gray-300']));
        row.appendChild(createTableCell(formatCurrency(difference), [diffColorClass, 'font-medium']));
        row.appendChild(
            createTableCell(
                `<button class="text-blue-600 hover:text-blue-800 edit-cost-button dark:text-blue-400 dark:hover:text-blue-300" data-id="${cost.id}" title="Editar Costos" aria-label="Editar costos del proyecto ${sanitizeHTML(cost.projectName)}">
                    <i class="fas fa-edit fa-fw" aria-hidden="true"></i>
                </button>`,
                [], true
            )
        );
        fragment.appendChild(row);
    });
    projectCostTableBody.appendChild(fragment);
    if(searchProjectCostsInput) searchProjectCostsInput.value = currentState.searchTerms?.projectCosts || '';
};

const renderGenericSetupList = (listEl, dataList, deleteButtonClass, itemNameSingular, inputElToClear = null) => {
    if (!listEl) return;
    listEl.innerHTML = '';
    const listToRender = Array.isArray(dataList) ? dataList : [];
    const sortedList = [...listToRender].sort((a,b) => a.name.localeCompare(b.name));

    if (sortedList.length === 0) {
        listEl.innerHTML = `<li class="text-xs text-gray-500 dark:text-gray-400 italic p-2">No hay ${itemNameSingular}s definidos.</li>`;
        return;
    }
    const fragment = document.createDocumentFragment();
    sortedList.forEach(item => {
        const safeName = sanitizeHTML(item.name);
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center text-sm text-gray-700 dark:text-gray-300 py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150';
        li.innerHTML = `
            <span class="flex-grow pr-2 truncate" title="${safeName}">${safeName}</span>
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
    renderGenericSetupList(statusListEl, currentState.statusList, 'delete-status-button', 'estado', newStatusInput);
    renderGenericSetupList(projectNameListEl, currentState.projectNameList, 'delete-project-name-button', 'proyecto', newProjectNameInput);
};

export const renderProjectSummaries = (currentStatePassed) => {
    const currentState = currentStatePassed || getAppState();
    if (!projectSummaryContainer) return;
    projectSummaryContainer.innerHTML = '';

    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    const projectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
    const projectDetails = Array.isArray(currentState.projectDetails) ? currentState.projectDetails : [];

    if (projectNameList.length === 0) {
        projectSummaryContainer.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-4">No hay proyectos definidos en Configuración.</p>`;
        return;
    }

    const sortedProjectNames = [...projectNameList].sort((a,b) => a.name.localeCompare(b.name));
    const fragment = document.createDocumentFragment();

    sortedProjectNames.forEach(project => {
        const projectName = project.name;
        const costData = projectCosts.find(c => c.projectName === projectName);
        const actualCost = costData ? (Number(costData.actualCost) || 0) : 0;
        const taskCount = projectDetails.filter(t => t.projectName === projectName).length;
        const safeProjectName = sanitizeHTML(projectName);

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-150 mb-2';
        summaryDiv.innerHTML = `
             <h4 class="font-semibold text-indigo-700 dark:text-indigo-300 truncate text-base mb-1" title="${safeProjectName}">${safeProjectName}</h4>
             <p class="text-sm text-gray-600 dark:text-gray-300">Costo Actual: <span class="font-medium">${formatCurrency(actualCost)}</span></p>
             <p class="text-sm text-gray-600 dark:text-gray-300">Tareas Totales: <span class="font-medium">${taskCount}</span></p>
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
    fixedExpensesTableBody.innerHTML = '';

    const searchTerm = (currentState.searchTerms?.fixedExpenses || '').toLowerCase();
    let itemsToRender = Array.isArray(currentState.fixedExpenses) ? currentState.fixedExpenses : [];

    if (searchTerm) {
        itemsToRender = itemsToRender.filter(expense =>
            (expense.name && expense.name.toLowerCase().includes(searchTerm))
        );
    }

    const sortConfig = currentState.sortState?.fixedExpenses || SORT_STATE_DEFAULTS.fixedExpenses;
    const { key, direction } = sortConfig;
    const sortedExpenses = sortArray(itemsToRender, key, direction);
    updateSortIcons(fixedExpensesTable, key, direction);

    if (sortedExpenses.length === 0) {
        fixedExpensesTableBody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-sm text-gray-500 dark:text-gray-400 italic">${searchTerm ? 'No hay gastos que coincidan.' : 'No hay gastos fijos registrados.'}</td></tr>`;
        if(searchFixedExpensesInput) searchFixedExpensesInput.value = currentState.searchTerms?.fixedExpenses || '';
        return;
    }
    const fragment = document.createDocumentFragment();
    sortedExpenses.forEach(expense => {
        const safeName = sanitizeHTML(expense.name);
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150';
        row.dataset.expenseId = expense.id;

        row.appendChild(createTableCell(safeName, ['text-gray-800', 'dark:text-gray-200', 'whitespace-nowrap']));
        row.appendChild(createTableCell(formatCurrency(expense.amount), ['text-gray-600', 'dark:text-gray-300', 'text-right']));
        row.appendChild(
            createTableCell(
                `<button class="text-red-500 hover:text-red-700 delete-expense-button transition duration-150 dark:text-red-400 dark:hover:text-red-300" data-id="${expense.id}" data-name="${safeName}" title="Eliminar Gasto '${safeName}'" aria-label="Eliminar gasto ${safeName}">
                    <i class="fas fa-trash-alt fa-fw fa-xs" aria-hidden="true"></i>
                </button>`,
                ['text-right'], true
            )
        );
        fragment.appendChild(row);
    });
    fixedExpensesTableBody.appendChild(fragment);
    if(searchFixedExpensesInput) searchFixedExpensesInput.value = currentState.searchTerms?.fixedExpenses || '';
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