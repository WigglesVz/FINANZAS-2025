// src/js/db.js
import Dexie from 'dexie';
import {
    DEFAULT_STATUS_LIST,
    DEFAULT_PROJECT_NAME_LIST,
    DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS,
    DEFAULT_MONTHLY_INCOME,
    DEFAULT_FIXED_EXPENSES,
    DEFAULT_PRIORITY_VALUE,
} from './config.js';
import { generateId } from './utils.js';

const db = new Dexie('ProjectFinanceDB');

// VERSIÓN 2: Añadido color a statusList
db.version(2).stores({
    appConfig: 'key',
    statusList: '&id, name, color',
    projectNameList: '&id, name',
    projectDetails: '&id, projectName, task, status, endDate, startDate',
    projectCosts: '&id, projectName',
    fixedExpenses: '&id, name'
}).upgrade(async (tx) => {
    console.log("DB: Upgrading to version 2 (statusList color).");
    const defaultStatusColors = DEFAULT_STATUS_LIST.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {});
    await tx.table('statusList').toCollection().modify(status => {
        if (status.color === undefined) {
            status.color = defaultStatusColors[status.name] || '#CCCCCC';
        }
    });
});

// VERSIÓN 3: Añadida la tabla para Spot Trading
db.version(3).stores({
    // appConfig: 'key', // No es necesario redefinir si no cambia
    // statusList: '&id, name, color',
    // projectNameList: '&id, name',
    // projectDetails: '&id, projectName, task, status, endDate, startDate',
    // projectCosts: '&id, projectName',
    // fixedExpenses: '&id, name',
    spotTrades: '++id, tradeDate, &[baseAsset+quoteAsset], type'
}).upgrade(async (tx) => {
    console.log("DB: Upgrading to version 3 (adding spotTrades table).");
    // No se necesita código de migración de datos si solo se añade una tabla nueva.
});

// VERSIÓN 4: Añadida la tabla para Futures Trading
db.version(4).stores({
    futuresTrades: '++id, entryDate, symbol, direction, status'
}).upgrade(async (tx) => {
    console.log("DB: Upgrading to version 4 (adding futuresTrades table).");
});

// VERSIÓN 5: Añadida la tabla para la Watchlist
db.version(5).stores({
    watchlist: '++id, &coinId'
}).upgrade(async (tx) => {
    console.log("DB: Upgrading to version 5 (adding watchlist table).");
});

// VERSIÓN 6: Añadida la propiedad 'priority' a projectDetails
db.version(6).stores({
    projectDetails: '&id, projectName, task, status, endDate, startDate, priority', // Actualizar projectDetails
}).upgrade(async (trans) => {
    console.log(`DB: Upgrading to version 6 (adding priority to projectDetails with default '${DEFAULT_PRIORITY_VALUE}').`);
    await trans.table('projectDetails').toCollection().modify(task => {
        if (task.priority === undefined) {
            task.priority = DEFAULT_PRIORITY_VALUE;
        }
    });
});

// VERSIÓN 7: Eliminar restricción de unicidad de [baseAsset+quoteAsset] en spotTrades
db.version(7).stores({
    // Redefinir solo la tabla que cambia. Dexie mantiene las demás de versiones anteriores.
    spotTrades: '++id, tradeDate, [baseAsset+quoteAsset], type' // quitamos el '&'
}).upgrade(async (tx) => {
    console.log("DB: Upgrading to version 7 (removing uniqueness constraint from spotTrades index [baseAsset+quoteAsset]).");
    // No se necesita una operación de modificación de datos explícita aquí.
    // Dexie maneja la recreación del índice según la nueva definición.
    // Si se quisiera forzar una "actualización" de los registros (aunque no cambien):
    // await tx.table("spotTrades").toCollection().modify(trade => {});
    // Pero usualmente no es necesario para este tipo de cambio de índice.
});


export const populateDefaultData = async () => {
    console.log("DB: Populating database with default data...");
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => {
            await db.statusList.clear();
            await db.projectNameList.clear();
            await db.projectDetails.clear();
            await db.projectCosts.clear();
            await db.fixedExpenses.clear();
            await db.spotTrades.clear(); // Limpiar también para datos de ejemplo
            await db.futuresTrades.clear(); // Limpiar también
            await db.watchlist.clear(); // Limpiar también

            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: DEFAULT_MONTHLY_INCOME },
                { key: 'activeUserMode', value: 'projects' }
            ]);

            await db.statusList.bulkPut(DEFAULT_STATUS_LIST.map(status => ({
                id: status.id || generateId(),
                name: status.name,
                color: status.color
            })));

            await db.projectNameList.bulkPut(DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })));

            await db.projectDetails.bulkPut(DEFAULT_PROJECT_DETAILS.map(item => ({
                ...item,
                id: item.id || generateId(),
                priority: item.priority || DEFAULT_PRIORITY_VALUE
            })));

            const formattedProjectCosts = DEFAULT_PROJECT_COSTS.map(cost => ({
                ...cost,
                id: cost.id || generateId(),
                budget: Number(cost.budget) || 0,
                actualCost: Number(cost.actualCost) || 0
            }));
            await db.projectCosts.bulkPut(formattedProjectCosts);

            const formattedFixedExpenses = DEFAULT_FIXED_EXPENSES.map(exp => ({
                ...exp,
                id: exp.id || generateId(),
                amount: Number(exp.amount) || 0
            }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);
            // No se añaden spotTrades, futuresTrades, ni watchlist por defecto en populateDefaultData
            // ya que estos suelen ser datos específicos del usuario.
        });
        console.log("DB: Default data populated successfully.");
    } catch (error) {
        console.error("DB: Failed to populate database with default data:", error);
        throw error; // Re-lanzar para que el llamador sepa del error.
    }
};

db.on('populate', async () => {
    // Este evento 'populate' se llama SOLO cuando la base de datos se crea por primera vez.
    // Si la BD ya existe, se ejecutan las migraciones de 'version().upgrade()'.
    // Aquí llamamos a populateDefaultData para asegurar que los datos iniciales se carguen.
    console.log("DB: 'populate' event triggered. Calling populateDefaultData.");
    await populateDefaultData();
});

db.open().catch(err => {
    console.error(`DB: Failed to open db: ${err.stack || err}`);
});

export default db;