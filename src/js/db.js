// src/js/db.js
import Dexie from 'dexie';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES
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
    console.log("Upgrading database to version 2...");
    const defaultStatusColors = DEFAULT_STATUS_LIST.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {});

    await tx.table('statusList').toCollection().modify(status => {
        if (status.color === undefined) {
            status.color = defaultStatusColors[status.name] || '#CCCCCC';
        }
    });
    console.log("Database upgrade to version 2 complete. Added 'color' to statusList.");
});


// VERSIÓN 3: Añadida la tabla para Spot Trading
db.version(3).stores({
    // Tablas existentes
    appConfig: 'key',
    statusList: '&id, name, color',
    projectNameList: '&id, name',
    projectDetails: '&id, projectName, task, status, endDate, startDate',
    projectCosts: '&id, projectName',
    fixedExpenses: '&id, name',
    
    // Nueva tabla
    spotTrades: '++id, tradeDate, &[baseAsset+quoteAsset], type'
});

// VERSIÓN 4: Añadida la tabla para Futures Trading
db.version(4).stores({
    // Tablas existentes de la v3
    appConfig: 'key',
    statusList: '&id, name, color',
    projectNameList: '&id, name',
    projectDetails: '&id, projectName, task, status, endDate, startDate',
    projectCosts: '&id, projectName',
    fixedExpenses: '&id, name',
    spotTrades: '++id, tradeDate, &[baseAsset+quoteAsset], type',

    // Nueva tabla para futuros
    futuresTrades: '++id, entryDate, symbol, direction, status'
});

// --- INICIO MODIFICACIÓN ---

// VERSIÓN 5: Añadida la tabla para la Watchlist
db.version(5).stores({
    // Tablas existentes de la v4
    appConfig: 'key',
    statusList: '&id, name, color',
    projectNameList: '&id, name',
    projectDetails: '&id, projectName, task, status, endDate, startDate',
    projectCosts: '&id, projectName',
    fixedExpenses: '&id, name',
    spotTrades: '++id, tradeDate, &[baseAsset+quoteAsset], type',
    futuresTrades: '++id, entryDate, symbol, direction, status',

    // Nueva tabla para la watchlist
    watchlist: '++id, &coinId' // coinId será el id de coingecko, ej: "bitcoin"
});

// --- FIN MODIFICACIÓN ---


export const populateDefaultData = async () => {
    console.log("Populating database with default data...");
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, db.spotTrades, db.futuresTrades, db.watchlist, async () => {
            // Limpiar tablas de cripto
            await db.spotTrades.clear();
            await db.futuresTrades.clear();
            await db.watchlist.clear(); // Limpiar también la watchlist

            // Asegurarse de que las configuraciones por defecto se establezcan
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: DEFAULT_MONTHLY_INCOME },
                { key: 'activeUserMode', value: 'projects' } // Default mode
            ]);
            
            await db.statusList.bulkPut(DEFAULT_STATUS_LIST.map(status => ({
                id: status.id || generateId(),
                name: status.name,
                color: status.color
            })));

            await db.projectNameList.bulkPut(DEFAULT_PROJECT_NAME_LIST.map(item => ({...item, id: item.id || generateId()})));
            await db.projectDetails.bulkPut(DEFAULT_PROJECT_DETAILS.map(item => ({...item, id: item.id || generateId()})));
            
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
        });
        console.log("Default data populated successfully.");
    } catch (error) {
        console.error("Failed to populate database:", error);
        throw error; 
    }
};

db.on('populate', populateDefaultData);

db.open().catch(err => {
    console.error(`Failed to open db: ${err.stack || err}`);
});

export default db;