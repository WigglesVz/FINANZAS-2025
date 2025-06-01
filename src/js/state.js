// src/js/state.js

import {
    SORT_STATE_DEFAULTS,
    DEFAULT_STATUS_LIST,
    DEFAULT_PROJECT_NAME_LIST,
    DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS,
    DEFAULT_MONTHLY_INCOME,
    DEFAULT_FIXED_EXPENSES
} from './config.js';
import { generateId, sortArray } from './utils.js'; 

// Estado inicial en memoria. Se llenará desde IndexedDB por loadData.
// Los valores aquí son más bien placeholders o fallbacks si la carga inicial falla.
// Asegurarse que DEFAULT_STATUS_LIST incluya la propiedad 'color'.
let currentState = {
    mainTitle: 'Rastreador de Proyectos y Finanzas',
    statusList: DEFAULT_STATUS_LIST.map(item => ({ 
        id: item.id || generateId(), 
        name: item.name, 
        color: item.color || '#CCCCCC' // Fallback color si no está definido
    })),
    projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
    projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
    projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({
        ...item,
        id: item.id || generateId(),
        budget: Number(item.budget) || 0,
        actualCost: Number(item.actualCost) || 0
    })),
    monthlyIncome: DEFAULT_MONTHLY_INCOME,
    fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({
        ...item,
        id: item.id || generateId(),
        amount: parseFloat(item.amount) || 0
    })),
    sortState: JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
    currentConfirmationAction: null,
    isAuthenticated: false,
    currentUser: null,
    searchTerms: {
        projectDetails: '',
        projectCosts: '',
        fixedExpenses: ''
    }
};

export const getAppState = () => {
    return { 
        ...currentState,
        statusList: currentState.statusList.map(item => ({...item})),
        projectNameList: currentState.projectNameList.map(item => ({...item})),
        projectDetails: currentState.projectDetails.map(item => ({...item})),
        projectCosts: currentState.projectCosts.map(item => ({...item})),
        fixedExpenses: currentState.fixedExpenses.map(item => ({...item})),
        sortState: JSON.parse(JSON.stringify(currentState.sortState)),
        searchTerms: { ...currentState.searchTerms }
    };
};

export const setAppState = (newState) => {
    const defaultSortState = JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS));
    const defaultSearchTerms = {
        projectDetails: '',
        projectCosts: '',
        fixedExpenses: ''
    };
    const defaultStatusColor = '#CCCCCC';

    currentState = {
        mainTitle: typeof newState.mainTitle === 'string' ? newState.mainTitle : 'Rastreador de Proyectos y Finanzas',
        statusList: Array.isArray(newState.statusList) ? newState.statusList.map(s => ({...s, color: s.color || defaultStatusColor })) : [],
        projectNameList: Array.isArray(newState.projectNameList) ? newState.projectNameList : [],
        projectDetails: Array.isArray(newState.projectDetails) ? newState.projectDetails : [],
        projectCosts: Array.isArray(newState.projectCosts) ? newState.projectCosts : [],
        monthlyIncome: typeof newState.monthlyIncome === 'number' ? newState.monthlyIncome : 0,
        fixedExpenses: Array.isArray(newState.fixedExpenses) ? newState.fixedExpenses : [],
        sortState: newState.sortState ? JSON.parse(JSON.stringify(newState.sortState)) : defaultSortState,
        currentConfirmationAction: newState.currentConfirmationAction || null,
        isAuthenticated: typeof newState.isAuthenticated === 'boolean' ? newState.isAuthenticated : false,
        currentUser: newState.currentUser || null,
        searchTerms: newState.searchTerms ? { ...defaultSearchTerms, ...newState.searchTerms } : defaultSearchTerms
    };
};

export const updateAppState = (updates) => {
    if (updates.searchTerms) {
        currentState.searchTerms = {
            ...currentState.searchTerms,
            ...updates.searchTerms
        };
        delete updates.searchTerms; 
    }
    if (updates.sortState) {
        currentState.sortState = {
            ...currentState.sortState,
            ...updates.sortState
        };
        delete updates.sortState;
    }
    // Si se actualiza statusList, asegurarse de que cada estado tenga una propiedad color
    if (Array.isArray(updates.statusList)) {
        updates.statusList = updates.statusList.map(s => ({...s, color: s.color || '#CCCCCC'}));
    }
    
    currentState = { ...currentState, ...updates };
};

export const getStatePart = (key) => {
    const part = currentState[key];
    if (Array.isArray(part)) {
        return [...part.map(item => typeof item === 'object' && item !== null ? {...item} : item)];
    }
    if (typeof part === 'object' && part !== null) {
        return {...part};
    }
    return part;
};

export const setStatePart = (key, value) => {
    currentState[key] = value;
};

/**
 * Obtiene datos filtrados y ordenados de una sección específica del estado.
 * @param {string} dataTypeKey - La clave del array de datos en el estado (ej. 'projectDetails', 'projectCosts', 'fixedExpenses').
 * @param {string} searchTerm - El término de búsqueda actual.
 * @param {object} sortConfig - El objeto de configuración de ordenación { key, direction }.
 * @returns {Array} Los datos filtrados y ordenados.
 */
export const getFilteredAndSortedData = (dataTypeKey, searchTerm, sortConfig) => {
    const data = Array.isArray(currentState[dataTypeKey]) ? currentState[dataTypeKey] : [];
    
    let filteredData = [...data];

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    if (lowerCaseSearchTerm) {
        filteredData = filteredData.filter(item => {
            // Lógica de filtrado específica para cada tipo de dato
            if (dataTypeKey === 'projectDetails') {
                return (item.task && item.task.toLowerCase().includes(lowerCaseSearchTerm)) || 
                       (item.description && item.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.projectName && item.projectName.toLowerCase().includes(lowerCaseSearchTerm));
            } else if (dataTypeKey === 'projectCosts') {
                return (item.projectName && item.projectName.toLowerCase().includes(lowerCaseSearchTerm));
            } else if (dataTypeKey === 'fixedExpenses') {
                return (item.name && item.name.toLowerCase().includes(lowerCaseSearchTerm));
            }
            // Fallback: si no hay un filtro específico, no lo filtra por término de búsqueda
            return true;
        });
    }

    const { key, direction } = sortConfig;
    const sortedData = sortArray(filteredData, key, direction);

    return sortedData;
};

/**
 * Calcula un resumen detallado para un proyecto específico.
 * @param {string} projectName - El nombre del proyecto.
 * @returns {object} Un objeto con el costo actual y el número total de tareas del proyecto.
 */
export const calculateProjectSummary = (projectName) => { // ¡'export' añadido aquí!
    const projectCosts = Array.isArray(currentState.projectCosts) ? currentState.projectCosts : [];
    const projectDetails = Array.isArray(currentState.projectDetails) ? currentState.projectDetails : [];

    const costData = projectCosts.find(c => c.projectName === projectName);
    const actualCost = costData ? (Number(costData.actualCost) || 0) : 0;
    const taskCount = projectDetails.filter(t => t.projectName === projectName).length;

    return {
        actualCost: actualCost,
        taskCount: taskCount
    };
};