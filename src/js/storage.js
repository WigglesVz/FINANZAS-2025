// src/js/storage.js

import db, { populateDefaultData } from './db.js';
import { getAppState, setAppState, updateAppState } from './state.js';
import { generateId, showToast, sanitizeHTML, isHexColor } from './utils.js';
import { mainTitleEl } from './domElements.js';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES,
    SORT_STATE_DEFAULTS
} from './config.js';


// ===================================================================
// === FUNCIONES CRUD PARA OPERACIONES SPOT ===
// ===================================================================

export const addSpotTrade = async (tradeData) => {
    try {
        const id = await db.spotTrades.add(tradeData);
        console.log(`Operación Spot añadida con ID: ${id}`);
        showToast("Operación agregada exitosamente.", "success");
        return { ...tradeData, id };
    } catch (error) {
        console.error("Error al añadir operación spot a la DB:", error);
        showToast("Error al guardar la operación.", "error");
        throw error;
    }
};

export const getSpotTrades = async () => {
    try {
        return await db.spotTrades.orderBy('tradeDate').reverse().toArray();
    } catch (error) {
        console.error("Error al obtener las operaciones spot de la DB:", error);
        showToast("Error al cargar las operaciones.", "error");
        return [];
    }
};

export const getSpotTradeById = async (id) => {
    try {
        if (!id) return null;
        return await db.spotTrades.get(id);
    } catch (error) {
        console.error(`Error al obtener la operación spot con ID ${id}:`, error);
        showToast("Error al buscar la operación.", "error");
        return null;
    }
};

export const updateSpotTrade = async (id, updates) => {
    try {
        await db.spotTrades.update(id, updates);
        console.log(`Operación spot con ID ${id} actualizada.`);
        showToast("Operación actualizada exitosamente.", "success");
    } catch (error) {
        console.error(`Error al actualizar la operación spot con ID ${id}:`, error);
        showToast("Error al actualizar la operación.", "error");
        throw error;
    }
};

export const deleteSpotTrade = async (id) => {
    try {
        await db.spotTrades.delete(id);
        console.log(`Operación spot con ID ${id} eliminada.`);
        showToast("Operación eliminada exitosamente.", "success");
    } catch (error) {
        console.error(`Error al eliminar la operación spot con ID ${id}:`, error);
        showToast("Error al eliminar la operación.", "error");
        throw error;
    }
};

// ===================================================================
// === FUNCIONES CRUD PARA OPERACIONES DE FUTUROS ===
// ===================================================================

export const addFuturesTrade = async (tradeData) => {
    try {
        const id = await db.futuresTrades.add(tradeData);
        console.log(`Posición de Futuros añadida con ID: ${id}`);
        showToast("Posición abierta exitosamente.", "success");
        return { ...tradeData, id };
    } catch (error) {
        console.error("Error al añadir posición de futuros a la DB:", error);
        showToast("Error al abrir la posición.", "error");
        throw error;
    }
};

export const getFuturesTrades = async () => {
    try {
        return await db.futuresTrades.orderBy('entryDate').reverse().toArray();
    } catch (error) {
        console.error("Error al obtener las operaciones de futuros de la DB:", error);
        showToast("Error al cargar las posiciones de futuros.", "error");
        return [];
    }
};

export const getFuturesTradeById = async (id) => {
    try {
        if (!id) return null;
        return await db.futuresTrades.get(id);
    } catch (error) {
        console.error(`Error al obtener la operación de futuros con ID ${id}:`, error);
        showToast("Error al buscar la posición.", "error");
        return null;
    }
};

export const updateFuturesTrade = async (id, updates) => {
    try {
        await db.futuresTrades.update(id, updates);
        console.log(`Posición de futuros con ID ${id} actualizada.`);
        showToast("Posición actualizada exitosamente.", "success");
    } catch (error) {
        console.error(`Error al actualizar la posición de futuros con ID ${id}:`, error);
        showToast("Error al actualizar la posición.", "error");
        throw error;
    }
};

export const deleteFuturesTrade = async (id) => {
    try {
        await db.futuresTrades.delete(id);
        console.log(`Posición de futuros con ID ${id} eliminada.`);
        showToast("Posición eliminada exitosamente.", "success");
    } catch (error) {
        console.error(`Error al eliminar la posición de futuros con ID ${id}:`, error);
        showToast("Error al eliminar la posición.", "error");
        throw error;
    }
};


// --- INICIO MODIFICACIÓN ---
// ===================================================================
// === FUNCIONES CRUD PARA LA WATCHLIST ===
// ===================================================================

export const getWatchlist = async () => {
    try {
        return await db.watchlist.toArray();
    } catch (error) {
        console.error("Error al obtener la watchlist de la DB:", error);
        showToast("Error al cargar la lista de seguimiento.", "error");
        return [];
    }
};

export const addToWatchlist = async (coinId) => {
    try {
        const existing = await db.watchlist.get({ coinId });
        if (existing) {
            showToast("Esta moneda ya está en tu lista de seguimiento.", "info");
            return;
        }
        const id = await db.watchlist.add({ coinId });
        console.log(`Moneda añadida a la watchlist con ID de DB: ${id}`);
        showToast(`${sanitizeHTML(coinId)} añadida a la lista de seguimiento.`, "success");
        return { id, coinId };
    } catch (error) {
        console.error("Error al añadir a la watchlist en la DB:", error);
        showToast("Error al añadir a la lista de seguimiento.", "error");
        throw error;
    }
};

export const removeFromWatchlist = async (coinId) => {
    try {
        await db.watchlist.where('coinId').equals(coinId).delete();
        console.log(`Moneda con coinId ${coinId} eliminada de la watchlist.`);
        showToast(`${sanitizeHTML(coinId)} eliminada de la lista de seguimiento.`, "success");
    } catch (error) {
        console.error(`Error al eliminar ${coinId} de la watchlist en la DB:`, error);
        showToast("Error al eliminar de la lista de seguimiento.", "error");
        throw error;
    }
};

// --- FIN MODIFICACIÓN ---


// ===================================================================
// === FUNCIONES DE MANEJO DE DATOS GENERALES ===
// ===================================================================

export const loadData = async () => {
    console.log("--- [LOAD_DATA] INICIO: Cargando datos desde IndexedDB ---");
    try {
        await db.open();
        console.log("--- [LOAD_DATA] DB_OPEN: Base de datos abierta/verificada ---");

        const [
            statusListDb, projectNameListDb, projectDetailsDb, projectCostsDb,
            fixedExpensesDb, mainTitleConfig, monthlyIncomeConfig, spotTradesDb,
            activeUserModeConfig, futuresTradesDb, watchlistDb // --- INICIO MODIFICACIÓN ---
        ] = await db.transaction('r', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => { // --- FIN MODIFICACIÓN ---
            console.log("--- [LOAD_DATA] DB_READ: Dentro de la transacción de lectura de Dexie ---");
            return await Promise.all([
                db.statusList.toArray(),
                db.projectNameList.toArray(),
                db.projectDetails.toArray(),
                db.projectCosts.toArray(),
                db.fixedExpenses.toArray(),
                db.appConfig.get('mainTitle'),
                db.appConfig.get('monthlyIncome'),
                db.spotTrades.toArray(),
                db.appConfig.get('activeUserMode'),
                db.futuresTrades.toArray(),
                db.watchlist.toArray() // --- INICIO MODIFICACIÓN ---
            ]);
        });
        
        const currentAppState = getAppState();

        const loadedState = {
            statusList: statusListDb || [],
            projectNameList: projectNameListDb || [],
            projectDetails: projectDetailsDb || [],
            projectCosts: projectCostsDb ? projectCostsDb.map(cost => ({...cost, budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 })) : [],
            monthlyIncome: (monthlyIncomeConfig && typeof monthlyIncomeConfig.value === 'number') ? Number(monthlyIncomeConfig.value) : DEFAULT_MONTHLY_INCOME,
            fixedExpenses: fixedExpensesDb ? fixedExpensesDb.map(exp => ({...exp, amount: Number(exp.amount) || 0})) : [],
            mainTitle: mainTitleConfig ? sanitizeHTML(mainTitleConfig.value) : 'Rastreador de Proyectos y Finanzas',
            spotTrades: spotTradesDb || [],
            futuresTrades: futuresTradesDb || [],
            watchlist: watchlistDb || [], // --- INICIO MODIFICACIÓN ---
            activeUserMode: activeUserModeConfig ? activeUserModeConfig.value : 'projects', 
            sortState: currentAppState.sortState || JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            currentConfirmationAction: currentAppState.currentConfirmationAction || null,
            searchTerms: currentAppState.searchTerms || { projectDetails: '', projectCosts: '', fixedExpenses: '' },
        };

        if (isNaN(loadedState.monthlyIncome)) {
            loadedState.monthlyIncome = DEFAULT_MONTHLY_INCOME;
        }
        
        const currentProjectNames = loadedState.projectNameList.map(p => p.name);
        loadedState.projectCosts = loadedState.projectCosts.filter(cost => currentProjectNames.includes(cost.projectName));
        const currentStatuses = loadedState.statusList.map(s => s.name);
        loadedState.projectDetails = loadedState.projectDetails.filter(task =>
            currentProjectNames.includes(task.projectName) && currentStatuses.includes(task.status)
        );

        if (mainTitleEl) {
            mainTitleEl.textContent = loadedState.mainTitle;
        }

        setAppState(loadedState);
        console.log("--- [LOAD_DATA] ÉXITO: Datos cargados de IndexedDB al estado de la aplicación. Estado actual:", getAppState());

    } catch (error) {
        console.error("--- [LOAD_DATA] ERROR: Error cargando datos de IndexedDB ---", error);
        const defaultStateForError = {
            statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
            projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
            monthlyIncome: DEFAULT_MONTHLY_INCOME,
            fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: Number(item.amount) || 0 })),
            spotTrades: [],
            futuresTrades: [],
            watchlist: [], // --- INICIO MODIFICACIÓN ---
            activeUserMode: 'projects',
            mainTitle: 'Rastreador de Proyectos y Finanzas',
            sortState: JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            searchTerms: { projectDetails: '', projectCosts: '', fixedExpenses: '' },
            currentConfirmationAction: null
        };
        setAppState(defaultStateForError);
        if (mainTitleEl) mainTitleEl.textContent = defaultStateForError.mainTitle;
        showToast("Error crítico al cargar datos. Usando valores por defecto.", "error");
    }
    console.log("--- [LOAD_DATA] FIN: Proceso de carga de datos finalizado. ---");
};

export const resetToDefaultData = async () => {
    console.log("--- [RESET_DATA] INICIO: Restableciendo datos a valores de ejemplo ---");
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => { // --- FIN MODIFICACIÓN ---
            console.log("--- [RESET_DATA] DB_CLEAR: Limpiando todas las tablas de Dexie ---");
            await db.appConfig.clear();
            await Promise.all([
                db.statusList.clear(),
                db.projectNameList.clear(),
                db.projectDetails.clear(),
                db.projectCosts.clear(),
                db.fixedExpenses.clear(),
                db.spotTrades.clear(),
                db.futuresTrades.clear(),
                db.watchlist.clear() // --- INICIO MODIFICACIÓN ---
            ]);
        });
        
        await populateDefaultData();
        await loadData();
        showToast('Datos restablecidos a los valores de ejemplo.', 'info');
        console.log("--- [RESET_DATA] ÉXITO: Datos restablecidos y UI actualizada. ---");
    } catch (error) {
        console.error("--- [RESET_DATA] ERROR: Error restableciendo datos ---", error);
        showToast("Error al restablecer los datos.", "error");
    }
    console.log("--- [RESET_DATA] FIN: Proceso de restablecimiento finalizado. ---");
};


export const importData = async (importedData, fileName) => {
    if (typeof importedData !== 'object' || importedData === null ||
        !Array.isArray(importedData.statusList) ||
        !Array.isArray(importedData.projectNameList) ||
        !Array.isArray(importedData.projectDetails) ||
        !Array.isArray(importedData.projectCosts) ||
        typeof importedData.monthlyIncome === 'undefined' ||
        !Array.isArray(importedData.fixedExpenses) ||
        !Array.isArray(importedData.spotTrades) ||
        !Array.isArray(importedData.futuresTrades)) {
        showToast('Estructura del archivo JSON no válida o incompleta.', 'error');
        return false;
    }
    
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => { // --- FIN MODIFICACIÓN ---
            console.log("--- [IMPORT_DATA] DB_CLEAR: Limpiando tablas de Dexie antes de importar... ---");
            await Promise.all([
                db.appConfig.clear(), db.statusList.clear(), db.projectNameList.clear(),
                db.projectDetails.clear(), db.projectCosts.clear(), db.fixedExpenses.clear(),
                db.spotTrades.clear(), db.futuresTrades.clear(),
                db.watchlist.clear() // --- INICIO MODIFICACIÓN ---
            ]);

            const ensureId = (item) => ({ ...item, id: item.id || generateId() });
            
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: sanitizeHTML(importedData.mainTitle) || 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: Number(importedData.monthlyIncome) || 0 },
                { key: 'activeUserMode', value: importedData.activeUserMode || 'projects' }
            ]);

            await db.statusList.bulkPut(importedData.statusList.map(item => {
                const baseItem = typeof item === 'string' ? { name: item } : { ...item };
                const importedColor = baseItem.color;
                return { id: baseItem.id || generateId(), name: baseItem.name, color: (importedColor && isHexColor(importedColor)) ? importedColor : '#CCCCCC' };
            }));
            await db.projectNameList.bulkPut(importedData.projectNameList.map(item => typeof item === 'string' ? { id: generateId(), name: item } : ensureId(item)));
            await db.projectDetails.bulkPut(importedData.projectDetails.map(ensureId));
            const formattedProjectCosts = importedData.projectCosts.map(cost => ({ ...ensureId(cost), budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 }));
            await db.projectCosts.bulkPut(formattedProjectCosts);
            const formattedFixedExpenses = importedData.fixedExpenses.map(exp => ({ ...ensureId(exp), amount: Number(exp.amount) || 0 }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);

            const formattedSpotTrades = importedData.spotTrades.map(trade => ({
                ...trade,
                price: Number(trade.price) || 0,
                quantityBase: Number(trade.quantityBase) || 0,
                totalQuote: Number(trade.totalQuote) || 0,
                feeAmount: Number(trade.feeAmount) || 0,
            }));
            await db.spotTrades.bulkPut(formattedSpotTrades);

            const formattedFuturesTrades = importedData.futuresTrades.map(trade => ({
                ...trade,
                pnl: Number(trade.pnl) || 0,
            }));
            await db.futuresTrades.bulkPut(formattedFuturesTrades);

            // --- INICIO MODIFICACIÓN ---
            if (Array.isArray(importedData.watchlist)) {
                await db.watchlist.bulkPut(importedData.watchlist.map(item => ({...item, id: item.id || generateId()})));
            }
            // --- FIN MODIFICACIÓN ---
            
            console.log("--- [IMPORT_DATA] DB_BULKPUT_COMPLETE: Datos importados a tablas de Dexie. ---");
        });
        
        await loadData();
        showToast(`Datos importados correctamente desde ${sanitizeHTML(fileName)}.`, 'success');
        return true;
    } catch (error) {
        console.error("--- [IMPORT_DATA] ERROR: Error importando datos a Dexie ---", error);
        showToast("Error al importar los datos a la base de datos.", "error");
        await loadData();
        return false;
    }
};

export const saveData = (successMessage) => {
    if (successMessage) {
        showToast(successMessage, 'success');
    }
};