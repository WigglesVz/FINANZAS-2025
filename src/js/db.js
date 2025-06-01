// src/js/db.js
import Dexie from 'dexie';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES
} from './config.js';
import { generateId } from './utils.js';

const db = new Dexie('ProjectFinanceDB');

db.version(1).stores({
    appConfig: 'key', // keyPath es 'key'
    statusList: '&id, name', // clave primaria 'id', índice en 'name'
    projectNameList: '&id, name', // clave primaria 'id', índice en 'name'
    projectDetails: '&id, projectName, task, status, endDate, startDate', // clave primaria 'id', múltiples índices
    projectCosts: '&id, projectName', // clave primaria 'id', índice en 'projectName'
    fixedExpenses: '&id, name' // clave primaria 'id', índice en 'name'
});

// Función reutilizable para poblar la base de datos.
// Se puede llamar desde 'on.populate' o desde resetData.
export const populateDefaultData = async () => {
    console.log("Populating database with default data...");
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: DEFAULT_MONTHLY_INCOME }
            ]);

            const ensureId = (item) => ({ ...item, id: item.id || generateId() });

            await db.statusList.bulkPut(DEFAULT_STATUS_LIST.map(ensureId));
            await db.projectNameList.bulkPut(DEFAULT_PROJECT_NAME_LIST.map(ensureId));
            await db.projectDetails.bulkPut(DEFAULT_PROJECT_DETAILS.map(ensureId));
            
            const formattedProjectCosts = DEFAULT_PROJECT_COSTS.map(cost => ({
                ...ensureId(cost),
                budget: Number(cost.budget) || 0,
                actualCost: Number(cost.actualCost) || 0
            }));
            await db.projectCosts.bulkPut(formattedProjectCosts);

            const formattedFixedExpenses = DEFAULT_FIXED_EXPENSES.map(exp => ({
                ...ensureId(exp),
                amount: Number(exp.amount) || 0
            }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);
        });
        console.log("Default data populated successfully.");
    } catch (error) {
        console.error("Failed to populate database:", error);
        // Podrías querer propagar el error para que loadData lo maneje o muestre un toast.
        throw error; 
    }
};

db.on('populate', populateDefaultData);

// No es estrictamente necesario exportar db.open() ya que Dexie lo maneja al acceder a las tablas.
// La simple importación de 'db' en otros módulos y su uso (ej. db.table.toArray()) iniciará la apertura si es necesario.
// Mantenerlo explícito puede ser bueno para la claridad o si necesitas manejar el éxito/error de apertura inicial.
// db.open().catch(err => {
//     console.error(`Failed to open db: ${err.stack || err}`);
// });

export default db;