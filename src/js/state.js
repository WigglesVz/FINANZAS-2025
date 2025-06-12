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

// Estado inicial en memoria.
let currentState = {
    activeUserMode: 'projects',
    mainTitle: 'Rastreador de Proyectos y Finanzas',
    statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId(), color: item.color || '#CCCCCC' })),
    projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
    projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
    projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
    monthlyIncome: DEFAULT_MONTHLY_INCOME,
    fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: parseFloat(item.amount) || 0 })),
    spotTrades: [],
    futuresTrades: [],
    watchlist: [],

    sortState: {
        ...JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
        spotTrades: { key: 'tradeDate', direction: 'desc' },
        futuresTrades: { key: 'entryDate', direction: 'desc' }
    },
    
    searchTerms: {
        projectDetails: '',
        projectCosts: '',
        fixedExpenses: '',
        spotTrades: { 
            asset: '',
            startDate: '',
            endDate: ''
        }
    },
    
    currentConfirmationAction: null,
    isAuthenticated: false,
    currentUser: null
};

export const getAppState = () => {
    // Devuelve una copia profunda para evitar mutaciones no deseadas del estado.
    return JSON.parse(JSON.stringify(currentState));
};

export const setAppState = (newState) => {
    const defaultSearchTerms = {
        projectDetails: '', 
        projectCosts: '', 
        fixedExpenses: '',
        spotTrades: { asset: '', startDate: '', endDate: '' }
    };

    // Fusión más segura que preserva la estructura interna de los objetos anidados
    currentState = {
        ...currentState,
        ...newState,
        searchTerms: {
            ...defaultSearchTerms,
            ...(newState.searchTerms || {})
        },
        sortState: {
            ...currentState.sortState,
            ...(newState.sortState || {})
        }
    };
};

export const updateAppState = (updates) => {
    // Fusión profunda para searchTerms y sortState para evitar sobrescribir el objeto completo
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
    
    currentState = { ...currentState, ...updates };
};

export const getFilteredAndSortedData = (dataTypeKey, filters, sortConfig) => {
    const data = currentState[dataTypeKey] ? [...currentState[dataTypeKey]] : [];
    
    if (!filters) {
        return sortArray(data, sortConfig.key, sortConfig.direction);
    }

    let filteredData = data;

    // Lógica de filtrado avanzado para Spot Trades
    if (dataTypeKey === 'spotTrades') {
        if (filters.asset) {
            const assetUpper = filters.asset.toUpperCase();
            filteredData = filteredData.filter(trade => 
                trade.baseAsset.toUpperCase().includes(assetUpper) || 
                trade.quoteAsset.toUpperCase().includes(assetUpper)
            );
        }
        if (filters.startDate) {
            filteredData = filteredData.filter(trade => {
                const tradeDate = new Date(trade.tradeDate);
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0); // Asegurar que comparamos desde el inicio del día
                return tradeDate >= startDate;
            });
        }
        if (filters.endDate) {
            filteredData = filteredData.filter(trade => {
                const tradeDate = new Date(trade.tradeDate);
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999); // Asegurar que comparamos hasta el final del día
                return tradeDate <= endDate;
            });
        }
    } 
    // Lógica de búsqueda simple para otras tablas
    else if (typeof filters === 'string' && filters) {
        const lowerCaseSearchTerm = filters.toLowerCase();
        filteredData = data.filter(item => {
            if (dataTypeKey === 'projectDetails') {
                return (item.task?.toLowerCase().includes(lowerCaseSearchTerm)) || 
                       (item.description?.toLowerCase().includes(lowerCaseSearchTerm)) ||
                       (item.projectName?.toLowerCase().includes(lowerCaseSearchTerm));
            } else if (dataTypeKey === 'projectCosts') {
                return item.projectName?.toLowerCase().includes(lowerCaseSearchTerm);
            } else if (dataTypeKey === 'fixedExpenses') {
                return item.name?.toLowerCase().includes(lowerCaseSearchTerm);
            }
            return true;
        });
    }

    return sortArray(filteredData, sortConfig.key, sortConfig.direction);
};

export const calculateProjectSummary = (projectName) => {
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

export const getFuturesTradesStats = () => {
    const trades = currentState.futuresTrades || [];
    
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    const totalTrades = closedTrades.length;
    
    if (totalTrades === 0) {
        return {
            totalPnl: 0,
            winRate: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            pnlHistory: []
        };
    }
    
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = (winningTrades / totalTrades) * 100;
    
    const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
    let cumulativePnl = 0;
    const pnlHistory = sortedTrades.map(trade => {
        cumulativePnl += trade.pnl || 0;
        return {
            date: trade.exitDate,
            pnl: cumulativePnl
        };
    });

    return {
        totalPnl: totalPnl,
        winRate: winRate,
        totalTrades: totalTrades,
        winningTrades: winningTrades,
        losingTrades: losingTrades,
        pnlHistory: pnlHistory
    };
};
