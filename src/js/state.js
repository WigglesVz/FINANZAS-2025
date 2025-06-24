// src/js/state.js

// Asumo que estas importaciones son de tu config.js actual
import {
    SORT_STATE_DEFAULTS,
    DEFAULT_STATUS_LIST,
    DEFAULT_PROJECT_NAME_LIST,
    DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS,
    DEFAULT_MONTHLY_INCOME,
    DEFAULT_FIXED_EXPENSES,
    DEFAULT_TASK_PRIORITIES, // Importar la lista de prioridades por defecto
    DEFAULT_PRIORITY_VALUE   // Importar el valor de prioridad por defecto
} from './config.js';
import { generateId, sortArray } from './utils.js';

export const PRIORITY_ORDER = [...DEFAULT_TASK_PRIORITIES].reverse();

let currentState = {
    activeUserMode: 'projects',
    mainTitle: 'Rastreador de Proyectos y Finanzas',
    statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId(), color: item.color || '#CCCCCC' })),
    projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
    projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({
        ...item,
        id: item.id || generateId(),
        priority: item.priority || DEFAULT_PRIORITY_VALUE
    })),
    projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
    monthlyIncome: DEFAULT_MONTHLY_INCOME,
    fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: parseFloat(item.amount) || 0 })),
    spotTrades: [],
    futuresTrades: [],
    watchlist: [],
    sortState: {
        ...JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
        projectDetails: { key: 'priority', direction: 'asc' },
        spotTrades: { key: 'tradeDate', direction: 'desc' },
        futuresTrades: { key: 'entryDate', direction: 'desc' }
    },
    searchTerms: {
        projectDetails: '',
        projectCosts: '',
        fixedExpenses: '',
        spotTrades: { asset: '', startDate: '', endDate: '' }
    },
    currentConfirmationAction: null, // Contendrá { callback: function, data: any }
    isAuthenticated: false,
    currentUser: null
};

/**
 * Devuelve una copia profunda de las propiedades del estado que son seguras para JSON.stringify.
 * La propiedad 'currentConfirmationAction' se maneja por separado con getConfirmationAction().
 */
export const getAppState = () => {
    const { currentConfirmationAction, ... बाकीराज्य } = currentState; // Destructurar para excluir currentConfirmationAction
    return JSON.parse(JSON.stringify( बाकीराज्य )); // Clonar profundamente el resto
};

/**
 * Devuelve la referencia directa al objeto currentConfirmationAction.
 */
export const getConfirmationAction = () => {
    return currentState.currentConfirmationAction;
};

/**
 * Establece el estado completo de la aplicación.
 * Se usa principalmente al cargar datos de la DB o al restablecer.
 */
export const setAppState = (newState) => {
    const defaultSearchTerms = {
        projectDetails: '', projectCosts: '', fixedExpenses: '',
        spotTrades: { asset: '', startDate: '', endDate: '' }
    };
    
    // Mantener el currentConfirmationAction si newState no lo define explícitamente
    const confirmationActionToKeep = newState.hasOwnProperty('currentConfirmationAction')
        ? newState.currentConfirmationAction
        : currentState.currentConfirmationAction;

    currentState = {
        ...currentState, // Mantener propiedades que no estén en newState (aunque newState suele ser completo)
        ...newState,     // Sobrescribir con newState
        searchTerms: {
            ...defaultSearchTerms,
            ...(newState.searchTerms || currentState.searchTerms || {}) // Priorizar newState, luego currentState, luego default
        },
        sortState: {
            ...(currentState.sortState || SORT_STATE_DEFAULTS), // Empezar con el actual o default
            ...(newState.sortState || {}) // Aplicar el del nuevo estado
        },
        currentConfirmationAction: confirmationActionToKeep // Restaurar/mantener
    };
};

/**
 * Actualiza partes específicas del estado de la aplicación.
 */
export const updateAppState = (updates) => {
    // Manejo especial para currentConfirmationAction para preservar la función callback
    if (updates.hasOwnProperty('currentConfirmationAction')) {
        currentState.currentConfirmationAction = updates.currentConfirmationAction;
        // Si solo se está actualizando currentConfirmationAction, no es necesario el spread del resto
        if (Object.keys(updates).length === 1) {
            return;
        }
        // Si hay más actualizaciones, eliminamos currentConfirmationAction de 'updates'
        // para que no se procese con el spread operator general más abajo.
        const { currentConfirmationAction, ...otherUpdates } = updates;
        currentState = { ...currentState, ...otherUpdates }; // Aplicar el resto de las actualizaciones
        return; // Salir temprano
    }

    // Fusión profunda para searchTerms y sortState si están presentes en updates
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

    // Fusión superficial para el resto de propiedades
    currentState = { ...currentState, ...updates };
};


export const getFilteredAndSortedData = (dataTypeKey, filters, sortConfig) => {
    const appData = getAppState(); // Usa la copia segura para datos (sin el callback)
    const data = appData[dataTypeKey] ? [...appData[dataTypeKey]] : [];
    let filteredData = data;

    if (dataTypeKey === 'spotTrades') {
        if (filters && typeof filters === 'object') {
            if (filters.asset) {
                const assetUpper = filters.asset.toUpperCase();
                filteredData = filteredData.filter(trade =>
                    trade.baseAsset?.toUpperCase().includes(assetUpper) ||
                    trade.quoteAsset?.toUpperCase().includes(assetUpper)
                );
            }
            if (filters.startDate) {
                filteredData = filteredData.filter(trade => {
                    if (!trade.tradeDate) return false;
                    const tradeDate = new Date(trade.tradeDate);
                    const startDate = new Date(filters.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    return !isNaN(tradeDate.getTime()) && tradeDate >= startDate;
                });
            }
            if (filters.endDate) {
                filteredData = filteredData.filter(trade => {
                    if (!trade.tradeDate) return false;
                    const tradeDate = new Date(trade.tradeDate);
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    return !isNaN(tradeDate.getTime()) && tradeDate <= endDate;
                });
            }
        }
    } else if (typeof filters === 'string' && filters) {
        const lowerCaseSearchTerm = filters.toLowerCase();
        filteredData = data.filter(item => {
            if (dataTypeKey === 'projectDetails') {
                return (item.task?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.description?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.projectName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.status?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.priority?.toLowerCase().includes(lowerCaseSearchTerm));
            } else if (dataTypeKey === 'projectCosts') {
                return item.projectName?.toLowerCase().includes(lowerCaseSearchTerm);
            } else if (dataTypeKey === 'fixedExpenses') {
                return item.name?.toLowerCase().includes(lowerCaseSearchTerm);
            }
            return true;
        });
    }

    if (dataTypeKey === 'projectDetails' && sortConfig && sortConfig.key === 'priority') {
        return filteredData.sort((a, b) => {
            const priorityA = a.priority || DEFAULT_PRIORITY_VALUE;
            const priorityB = b.priority || DEFAULT_PRIORITY_VALUE;
            const indexA = PRIORITY_ORDER.indexOf(priorityA);
            const indexB = PRIORITY_ORDER.indexOf(priorityB);
            const safeIndexA = indexA === -1 ? PRIORITY_ORDER.length : indexA;
            const safeIndexB = indexB === -1 ? PRIORITY_ORDER.length : indexB;
            if (safeIndexA < safeIndexB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (safeIndexA > safeIndexB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    if (sortConfig && sortConfig.key) {
        return sortArray(filteredData, sortConfig.key, sortConfig.direction);
    }
    return filteredData;
};

export const calculateProjectSummary = (projectName) => {
    const appState = getAppState();
    const projectCosts = Array.isArray(appState.projectCosts) ? appState.projectCosts : [];
    const projectDetails = Array.isArray(appState.projectDetails) ? appState.projectDetails : [];
    const costData = projectCosts.find(c => c.projectName === projectName);
    const actualCost = costData ? (Number(costData.actualCost) || 0) : 0;
    const taskCount = projectDetails.filter(t => t.projectName === projectName).length;
    return { actualCost, taskCount };
};

export const getFuturesTradesStats = () => {
    const appState = getAppState();
    const trades = appState.futuresTrades || [];
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    const totalTrades = closedTrades.length;
    if (totalTrades === 0) {
        return { totalPnl: 0, winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, pnlHistory: [] };
    }
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = (totalTrades > 0) ? (winningTrades / totalTrades) * 100 : 0;
    const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
    let cumulativePnl = 0;
    const pnlHistory = sortedTrades.map(trade => {
        cumulativePnl += trade.pnl || 0;
        return { date: trade.exitDate, pnl: cumulativePnl };
    });
    return { totalPnl, winRate, totalTrades, winningTrades, losingTrades, pnlHistory };
};