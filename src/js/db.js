// src/js/db.js
import Dexie from 'dexie';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES
} from './config.js';
import { generateId } from './utils.js';

const db = new Dexie('ProjectFinanceDB');

// IMPORTANTE: Incrementar la versión de la base de datos porque estamos cambiando el esquema de statusList
db.version(2).stores({ // <---- VERSIÓN INCREMENTADA A 2
    appConfig: 'key',
    statusList: '&id, name, color', // AÑADIDO 'color' al esquema
    projectNameList: '&id, name',
    projectDetails: '&id, projectName, task, status, endDate, startDate',
    projectCosts: '&id, projectName',
    fixedExpenses: '&id, name'
}).upgrade(async (tx) => {
    // Código de migración para la versión 2
    // Si la tabla statusList ya existe de la v1, necesitamos añadirle la propiedad 'color'
    // a los registros existentes.
    console.log("Upgrading database to version 2...");
    const defaultStatusColors = DEFAULT_STATUS_LIST.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {});

    await tx.table('statusList').toCollection().modify(status => {
        if (status.color === undefined) {
            status.color = defaultStatusColors[status.name] || '#CCCCCC'; // Asignar color por defecto de config o un gris
        }
    });
    console.log("Database upgrade to version 2 complete. Added 'color' to statusList.");
});


// Función reutilizable para poblar la base de datos.
export const populateDefaultData = async () => {
    console.log("Populating database with default data (v2 schema)...");
    try {
        // Usar una transacción para todas las operaciones de populate
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: DEFAULT_MONTHLY_INCOME }
            ]);

            const ensureIdAndColor = (item, defaultColor = '#CCCCCC') => ({
                ...item,
                id: item.id || generateId(),
                // Asegurarse de que el color esté presente, especialmente para DEFAULT_STATUS_LIST
                ...(item.name && DEFAULT_STATUS_LIST.find(s => s.name === item.name) && { color: DEFAULT_STATUS_LIST.find(s => s.name === item.name).color || defaultColor })
            });
            
            // DEFAULT_STATUS_LIST ya tiene 'color' desde config.js
            await db.statusList.bulkPut(DEFAULT_STATUS_LIST.map(status => ({
                id: status.id || generateId(),
                name: status.name,
                color: status.color // Tomar el color de la configuración
            })));

            await db.projectNameList.bulkPut(DEFAULT_PROJECT_NAME_LIST.map(item => ensureIdAndColor(item))); // ensureIdAndColor no es necesario si ya tienen id
            await db.projectDetails.bulkPut(DEFAULT_PROJECT_DETAILS.map(item => ensureIdAndColor(item)));
            
            const formattedProjectCosts = DEFAULT_PROJECT_COSTS.map(cost => ({
                ...ensureIdAndColor(cost),
                budget: Number(cost.budget) || 0,
                actualCost: Number(cost.actualCost) || 0
            }));
            await db.projectCosts.bulkPut(formattedProjectCosts);

            const formattedFixedExpenses = DEFAULT_FIXED_EXPENSES.map(exp => ({
                ...ensureIdAndColor(exp),
                amount: Number(exp.amount) || 0
            }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);
        });
        console.log("Default data populated successfully (v2 schema).");
    } catch (error) {
        console.error("Failed to populate database (v2 schema):", error);
        throw error; 
    }
};

// El evento 'populate' solo se dispara si la base de datos se crea desde cero.
// Si la base de datos ya existe y solo se actualiza la versión, 'populate' no se ejecuta.
// La lógica de migración en .upgrade() se encarga de actualizar los datos existentes.
db.on('populate', populateDefaultData);


// Abrir la base de datos. Esto aplicará la versión y las migraciones si es necesario.
db.open().catch(err => {
    console.error(`Failed to open db: ${err.stack || err}`);
    // Considerar mostrar un error al usuario si la DB no se puede abrir.
});

export default db;