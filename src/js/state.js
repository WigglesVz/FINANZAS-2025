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
import { generateId } from './utils.js';

// Estado inicial. searchTerms ya está incluido.
let currentState = {
    mainTitle: 'Rastreador de Proyectos y Finanzas',
    statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId() })),
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
        projectCosts: '',   // Ya estaba
        fixedExpenses: ''   // Ya estaba
    }
};

export const getAppState = () => {
    // Devolver una copia para proteger el estado original de mutaciones directas accidentales.
    // Un spread superficial es suficiente para el primer nivel.
    // Si las propiedades del estado son objetos y se modifican profundamente,
    // se necesitaría una clonación profunda para esas propiedades específicas o para todo el estado.
    return { 
        ...currentState,
        // Clonar explícitamente objetos anidados que podrían ser modificados
        statusList: currentState.statusList.map(item => ({...item})),
        projectNameList: currentState.projectNameList.map(item => ({...item})),
        projectDetails: currentState.projectDetails.map(item => ({...item})),
        projectCosts: currentState.projectCosts.map(item => ({...item})),
        fixedExpenses: currentState.fixedExpenses.map(item => ({...item})),
        sortState: JSON.parse(JSON.stringify(currentState.sortState)), // Clonación profunda para sortState
        searchTerms: { ...currentState.searchTerms } // Clonación superficial para searchTerms
    };
};

export const setAppState = (newState) => {
    const defaultSortState = JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS));
    const defaultSearchTerms = {
        projectDetails: '',
        projectCosts: '',
        fixedExpenses: ''
    };

    // Al establecer un nuevo estado, asegurarse de que todas las claves esperadas estén presentes
    // y con tipos de datos válidos, usando valores por defecto si es necesario.
    currentState = {
        mainTitle: typeof newState.mainTitle === 'string' ? newState.mainTitle : 'Rastreador de Proyectos y Finanzas',
        statusList: Array.isArray(newState.statusList) ? newState.statusList : [],
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
    // console.log("App state set/replaced:", getAppState());
};

export const updateAppState = (updates) => {
    // Si se actualiza searchTerms, asegurarse de fusionar con los searchTerms existentes
    if (updates.searchTerms) {
        currentState.searchTerms = {
            ...currentState.searchTerms,
            ...updates.searchTerms
        };
        // Eliminar searchTerms de 'updates' para que no sobreescriba el merge anterior
        // al hacer el spread de ...updates
        delete updates.searchTerms; 
    }

    // Si se actualiza sortState, asegurarse de fusionar correctamente
    if (updates.sortState) {
        currentState.sortState = {
            ...currentState.sortState,
            ...updates.sortState
        };
        delete updates.sortState;
    }
    
    currentState = { ...currentState, ...updates };
    // console.log("App state updated with:", updates, "New state:", getAppState());
};


// Las funciones getStatePart y setStatePart pueden ser útiles para granularidad,
// pero updateAppState es a menudo preferible para claridad y para asegurar
// que el estado se trata de forma inmutable (creando nuevos objetos/arrays).
export const getStatePart = (key) => {
    const part = currentState[key];
    // Si la parte es un array u objeto, considera devolver una copia para evitar mutaciones.
    if (Array.isArray(part)) {
        return [...part.map(item => typeof item === 'object' && item !== null ? {...item} : item)];
    }
    if (typeof part === 'object' && part !== null) {
        return {...part};
    }
    return part;
};

export const setStatePart = (key, value) => {
    // Esta función muta directamente una parte del estado. Usar con precaución.
    // Es mejor usar updateAppState({ [key]: value }) para mantener la inmutabilidad a nivel superior.
    currentState[key] = value;
};