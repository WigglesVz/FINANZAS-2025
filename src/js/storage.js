// src/js/storage.js

import db, { populateDefaultData as populateDbWithDefaults } from './db.js'; // Renombrar para claridad
import { getAppState, setAppState, updateAppState } from './state.js';
import { generateId, showToast, sanitizeHTML, isHexColor } from './utils.js';
import { getDomElements } from './domElements.js'; // Para acceder a mainTitleEl
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES,
    SORT_STATE_DEFAULTS, DEFAULT_PRIORITY_VALUE // Importar DEFAULT_PRIORITY_VALUE desde config
} from './config.js';

// ===================================================================
// === FUNCIONES CRUD PARA OPERACIONES SPOT ===
// ===================================================================

export const addSpotTrade = async (tradeData) => {
    try {
        const id = await db.spotTrades.add(tradeData);
        console.log(`Operación Spot añadida con ID: ${id}`);
        showToast("Operación Spot agregada.", "success");
        return { ...tradeData, id }; // Devolver el objeto con el ID asignado por Dexie
    } catch (error) {
        console.error("Error al añadir operación spot a la DB:", error);
        showToast("Error al guardar la operación Spot.", "error");
        throw error; // Re-lanzar para que el llamador pueda manejarlo
    }
};

export const getSpotTrades = async () => {
    try {
        return await db.spotTrades.orderBy('tradeDate').reverse().toArray();
    } catch (error) {
        console.error("Error al obtener las operaciones spot de la DB:", error);
        showToast("Error al cargar las operaciones Spot.", "error");
        return [];
    }
};

export const getSpotTradeById = async (id) => {
    try {
        if (!id && id !== 0) return null; // Dexie usa números para IDs autoincrementados
        return await db.spotTrades.get(id);
    } catch (error) {
        console.error(`Error al obtener la operación spot con ID ${id}:`, error);
        showToast("Error al buscar la operación Spot.", "error");
        return null;
    }
};

export const updateSpotTrade = async (id, updates) => {
    try {
        await db.spotTrades.update(id, updates);
        console.log(`Operación spot con ID ${id} actualizada.`);
        showToast("Operación Spot actualizada.", "success");
    } catch (error) {
        console.error(`Error al actualizar la operación spot con ID ${id}:`, error);
        showToast("Error al actualizar la operación Spot.", "error");
        throw error;
    }
};

export const deleteSpotTrade = async (id) => {
    try {
        await db.spotTrades.delete(id);
        console.log(`Operación spot con ID ${id} eliminada.`);
        showToast("Operación Spot eliminada.", "success");
    } catch (error) {
        console.error(`Error al eliminar la operación spot con ID ${id}:`, error);
        showToast("Error al eliminar la operación Spot.", "error");
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
        showToast("Posición de Futuros abierta.", "success");
        return { ...tradeData, id };
    } catch (error) {
        console.error("Error al añadir posición de futuros a la DB:", error);
        showToast("Error al abrir la posición de Futuros.", "error");
        throw error;
    }
};

export const getFuturesTrades = async () => {
    try {
        return await db.futuresTrades.orderBy('entryDate').reverse().toArray();
    } catch (error) {
        console.error("Error al obtener las operaciones de futuros de la DB:", error);
        showToast("Error al cargar las posiciones de Futuros.", "error");
        return [];
    }
};

export const getFuturesTradeById = async (id) => {
    try {
        if (!id && id !== 0) return null;
        return await db.futuresTrades.get(id);
    } catch (error) {
        console.error(`Error al obtener la operación de futuros con ID ${id}:`, error);
        showToast("Error al buscar la posición de Futuros.", "error");
        return null;
    }
};

export const updateFuturesTrade = async (id, updates) => {
    try {
        await db.futuresTrades.update(id, updates);
        console.log(`Posición de futuros con ID ${id} actualizada.`);
        // El toast se maneja en eventHandlers para ser más específico (actualizada vs. cerrada)
    } catch (error) {
        console.error(`Error al actualizar la posición de futuros con ID ${id}:`, error);
        showToast("Error al actualizar la posición de Futuros.", "error");
        throw error;
    }
};

export const deleteFuturesTrade = async (id) => {
    try {
        await db.futuresTrades.delete(id);
        console.log(`Posición de futuros con ID ${id} eliminada.`);
        showToast("Posición de Futuros eliminada.", "success");
    } catch (error) {
        console.error(`Error al eliminar la posición de futuros con ID ${id}:`, error);
        showToast("Error al eliminar la posición de Futuros.", "error");
        throw error;
    }
};

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
            showToast(`${sanitizeHTML(coinId)} ya está en tu lista.`, "info");
            return null; // Indicar que no se añadió nada nuevo
        }
        const newItem = { coinId, id: generateId() }; // Dexie puede auto-incrementar 'id' si es '++id', pero aquí lo generamos
        const dbId = await db.watchlist.add({ coinId }); // Dexie usa 'id' como clave primaria
        console.log(`Moneda añadida a la watchlist con ID de DB: ${dbId}`);
        showToast(`${sanitizeHTML(coinId)} añadida a la lista.`, "success");
        return { id: dbId, coinId }; // Devolver el item con el ID de la DB
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
        showToast(`${sanitizeHTML(coinId)} eliminada de la lista.`, "success");
    } catch (error) {
        console.error(`Error al eliminar ${coinId} de la watchlist en la DB:`, error);
        showToast("Error al eliminar de la lista de seguimiento.", "error");
        throw error;
    }
};

// ===================================================================
// === FUNCIONES DE MANEJO DE DATOS GENERALES ===
// ===================================================================

export const loadData = async () => {
    console.log("--- [LOAD_DATA] INICIO: Cargando datos desde IndexedDB ---");
    const dom = getDomElements();
    try {
        await db.open(); // Asegura que la base de datos esté abierta y las migraciones ejecutadas
        console.log("--- [LOAD_DATA] DB_OPEN: Base de datos abierta/verificada ---");

        const [
            statusListDb, projectNameListDb, projectDetailsDb, projectCostsDb,
            fixedExpensesDb, mainTitleConfig, monthlyIncomeConfig, spotTradesDb,
            activeUserModeConfig, futuresTradesDb, watchlistDb
        ] = await db.transaction('r',
            db.appConfig, db.statusList, db.projectNameList, db.projectDetails,
            db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist,
            async () => {
                console.log("--- [LOAD_DATA] DB_READ: Iniciando transacción de lectura ---");
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
                    db.watchlist.toArray()
                ]);
            });

        const currentAppState = getAppState(); // Para obtener sortState y searchTerms actuales

        const loadedState = {
            statusList: statusListDb || [],
            projectNameList: projectNameListDb || [],
            projectDetails: projectDetailsDb || [],
            projectCosts: projectCostsDb ? projectCostsDb.map(cost => ({ ...cost, budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 })) : [],
            monthlyIncome: (monthlyIncomeConfig && typeof monthlyIncomeConfig.value === 'number') ? Number(monthlyIncomeConfig.value) : DEFAULT_MONTHLY_INCOME,
            fixedExpenses: fixedExpensesDb ? fixedExpensesDb.map(exp => ({ ...exp, amount: Number(exp.amount) || 0 })) : [],
            mainTitle: mainTitleConfig ? sanitizeHTML(mainTitleConfig.value) : 'Rastreador de Proyectos y Finanzas',
            spotTrades: spotTradesDb || [],
            futuresTrades: futuresTradesDb || [],
            watchlist: watchlistDb || [],
            activeUserMode: activeUserModeConfig ? activeUserModeConfig.value : 'projects',
            // Mantener el estado de ordenación y búsqueda si ya existen en el estado actual
            sortState: currentAppState.sortState || JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            searchTerms: currentAppState.searchTerms || { projectDetails: '', projectCosts: '', fixedExpenses: '', spotTrades: { asset: '', startDate: '', endDate: '' } },
            currentConfirmationAction: null // Siempre resetear la acción de confirmación al cargar
        };
        
        // Asegurar la consistencia de los datos después de cargar
        const currentProjectNames = loadedState.projectNameList.map(p => p.name);
        loadedState.projectCosts = loadedState.projectCosts.filter(cost => currentProjectNames.includes(cost.projectName));
        
        const currentStatuses = loadedState.statusList.map(s => s.name);
        loadedState.projectDetails = loadedState.projectDetails.map(task => ({
            ...task,
            priority: task.priority || DEFAULT_PRIORITY_VALUE // Asegurar que las tareas tengan prioridad
        })).filter(task =>
            currentProjectNames.includes(task.projectName) && currentStatuses.includes(task.status)
        );

        if (dom.mainTitleEl) {
            dom.mainTitleEl.textContent = loadedState.mainTitle;
        }

        setAppState(loadedState);
        console.log("--- [LOAD_DATA] ÉXITO: Datos cargados de IndexedDB al estado de la aplicación.");

    } catch (error) {
        console.error("--- [LOAD_DATA] ERROR: Error cargando datos de IndexedDB ---", error);
        // En caso de error crítico, cargar un estado por defecto para permitir que la app funcione
        const defaultStateForError = {
            statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId(), color: item.color || '#CCCCCC' })),
            projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId(), priority: item.priority || DEFAULT_PRIORITY_VALUE })),
            projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
            monthlyIncome: DEFAULT_MONTHLY_INCOME,
            fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: Number(item.amount) || 0 })),
            spotTrades: [], futuresTrades: [], watchlist: [],
            activeUserMode: 'projects', mainTitle: 'Rastreador de Proyectos y Finanzas',
            sortState: JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            searchTerms: { projectDetails: '', projectCosts: '', fixedExpenses: '', spotTrades: { asset: '', startDate: '', endDate: '' } },
            currentConfirmationAction: null
        };
        setAppState(defaultStateForError);
        if (dom.mainTitleEl) dom.mainTitleEl.textContent = defaultStateForError.mainTitle;
        showToast("Error crítico al cargar datos. Usando valores por defecto.", "error");
    }
    console.log("--- [LOAD_DATA] FIN: Proceso de carga de datos finalizado. ---");
};

export const resetToDefaultData = async () => {
    console.log("--- [RESET_DATA] INICIO: Restableciendo datos a valores de ejemplo ---");
    try {
        // populateDbWithDefaults se encarga de limpiar y llenar la DB con datos por defecto
        await populateDbWithDefaults();
        // Después de repoblar la DB, cargar esos datos al estado en memoria
        await loadData();
        showToast('Datos restablecidos a los valores de ejemplo.', 'info');
        console.log("--- [RESET_DATA] ÉXITO: Datos restablecidos y estado de la aplicación actualizado. ---");
    } catch (error) {
        console.error("--- [RESET_DATA] ERROR: Error restableciendo datos ---", error);
        showToast("Error al restablecer los datos.", "error");
        // Podrías intentar cargar datos de nuevo aquí como fallback, o dejar que el usuario reintente.
    }
    console.log("--- [RESET_DATA] FIN: Proceso de restablecimiento finalizado. ---");
};

export const importData = async (importedData, fileName) => {
    // La validación inicial de la estructura de importedJson ya se hace en eventHandlers.js
    console.log("[STORAGE importData] Iniciando importación. Datos recibidos:", importedData);

    try {
        await db.transaction('rw', 
            [db.appConfig, db.statusList, db.projectNameList, db.projectDetails, 
             db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist], // Listar todas las tablas explícitamente
            async () => {
                console.log("[STORAGE importData TX] Iniciando transacción de escritura...");

                console.log("[STORAGE importData TX] Limpiando tablas...");
                await Promise.all([
                    db.appConfig.clear(), db.statusList.clear(), db.projectNameList.clear(),
                    db.projectDetails.clear(), db.projectCosts.clear(), db.fixedExpenses.clear(),
                    db.spotTrades.clear(), db.futuresTrades.clear(), db.watchlist.clear()
                ]);
                console.log("[STORAGE importData TX] Tablas limpiadas.");

                const ensureId = (item) => ({ ...item, id: item.id || generateId() });
                
                console.log("[STORAGE importData TX] Importando appConfig...");
                await db.appConfig.bulkPut([
                    { key: 'mainTitle', value: sanitizeHTML(importedData.appConfig.mainTitle) || 'Rastreador de Proyectos y Finanzas' },
                    { key: 'monthlyIncome', value: Number(importedData.appConfig.monthlyIncome) || 0 },
                    { key: 'activeUserMode', value: importedData.appConfig.activeUserMode || 'projects' }
                ]);

                console.log("[STORAGE importData TX] Importando statusList...");
                await db.statusList.bulkPut(importedData.statusList.map(item => {
                    const baseItem = typeof item === 'string' ? { name: item } : { ...item };
                    return { id: baseItem.id || generateId(), name: baseItem.name, color: (baseItem.color && isHexColor(baseItem.color)) ? baseItem.color : '#CCCCCC' };
                }));

                console.log("[STORAGE importData TX] Importando projectNameList...");
                await db.projectNameList.bulkPut(importedData.projectNameList.map(item => typeof item === 'string' ? { id: generateId(), name: item } : ensureId(item)));
                
                console.log("[STORAGE importData TX] Importando projectDetails...");
                await db.projectDetails.bulkPut(importedData.projectDetails.map(item => ({
                    ...ensureId(item),
                    priority: item.priority || DEFAULT_PRIORITY_VALUE 
                })));

                console.log("[STORAGE importData TX] Importando projectCosts...");
                const formattedProjectCosts = importedData.projectCosts.map(cost => ({ ...ensureId(cost), budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 }));
                await db.projectCosts.bulkPut(formattedProjectCosts);

                console.log("[STORAGE importData TX] Importando fixedExpenses...");
                const formattedFixedExpenses = importedData.fixedExpenses.map(exp => ({ ...ensureId(exp), amount: Number(exp.amount) || 0 }));
                await db.fixedExpenses.bulkPut(formattedFixedExpenses);

                console.log("[STORAGE importData TX] Importando spotTrades...");
                const formattedSpotTrades = importedData.spotTrades.map(trade => ({
                    ...ensureId(trade),
                    price: Number(trade.price) || 0,
                    quantityBase: Number(trade.quantityBase) || 0,
                    totalQuote: Number(trade.totalQuote) || 0,
                    fees: Number(trade.fees) || 0,
                }));
                await db.spotTrades.bulkPut(formattedSpotTrades);

                console.log("[STORAGE importData TX] Importando futuresTrades...");
                const formattedFuturesTrades = importedData.futuresTrades.map(trade => ({
                    ...ensureId(trade),
                    pnl: Number(trade.pnl) || 0,
                    leverage: Number(trade.leverage) || 1,
                    quantity: Number(trade.quantity) || 0,
                    entryPrice: Number(trade.entryPrice) || 0,
                    exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
                    entryFees: Number(trade.entryFees) || 0,
                    exitFees: Number(trade.exitFees) || 0,
                }));
                await db.futuresTrades.bulkPut(formattedFuturesTrades);

                console.log("[STORAGE importData TX] Importando watchlist...");
                if (Array.isArray(importedData.watchlist)) {
                    await db.watchlist.bulkPut(importedData.watchlist.map(item => ({...ensureId(item), coinId: item.coinId })));
                }
                console.log("[STORAGE importData TX] DB bulkPut completado. Finalizando transacción...");
            }
        ); // Fin de la transacción de Dexie
        
        console.log("[STORAGE importData] Transacción de importación completada exitosamente. Llamando a loadData().");
        await loadData(); // Recargar el estado con los nuevos datos
        // El toast de éxito se maneja en eventHandlers.js
        return true; // Retornar true si la transacción y loadData tuvieron éxito
    } catch (error) {
        // Este catch captura errores tanto de la transacción de Dexie como de loadData si fallara.
        console.error("--- [STORAGE importData] ERROR DURANTE LA IMPORTACIÓN O CARGA POSTERIOR ---", error);
        // Intentar recargar el estado anterior o por defecto es importante si la importación falla a medias.
        // loadData() ya tiene un fallback a datos por defecto si hay un error crítico al leer.
        await loadData(); 
        return false; // Indicar que la importación general falló
    }
};

/**
 * Función genérica para guardar datos (actualmente solo muestra un toast).
 * Podría expandirse si hay una necesidad de una operación de guardado genérica.
 * @param {string} [successMessage] - Mensaje opcional a mostrar en caso de éxito.
 */
export const saveData = (successMessage) => {
    // Esta función es actualmente un placeholder. Las operaciones de guardado
    // se manejan individualmente (addSpotTrade, updateProjectDetails, etc.)
    // que interactúan directamente con db.js.
    if (successMessage) {
        showToast(successMessage, 'success');
    }
    // console.log("saveData llamada (actualmente solo muestra toast).");
};