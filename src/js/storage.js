// src/js/storage.js

import db, { populateDefaultData } from './db.js'; // Importar db y populateDefaultData
import { getAppState, setAppState } from './state.js'; // Solo necesitamos get y set aquí
import { generateId, showToast, sanitizeHTML } from './utils.js';
import { mainTitleEl } from './domElements.js';
import { renderAll } from './uiRender.js';
import { refreshCurrentChart } from './charts.js';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES,
    SORT_STATE_DEFAULTS
} from './config.js';


export const loadData = async () => {
    try {
        // Abrir la base de datos explícitamente para asegurar que 'populate' se dispare si es la primera vez.
        // Dexie maneja esto internamente también, pero ser explícito puede ayudar en algunos casos.
        await db.open();

        const [
            statusList, projectNameList, projectDetails, projectCosts,
            fixedExpenses, mainTitleConfig, monthlyIncomeConfig
        ] = await db.transaction('r', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            return await Promise.all([
                db.statusList.toArray(),
                db.projectNameList.toArray(),
                db.projectDetails.toArray(),
                db.projectCosts.toArray(),
                db.fixedExpenses.toArray(),
                db.appConfig.get('mainTitle'),
                db.appConfig.get('monthlyIncome')
            ]);
        });

        // Si alguna tabla esencial está vacía después de la carga inicial y populate,
        // podría indicar un problema, o que realmente no hay datos.
        // Por ahora, si está vacío, tomamos los defaults para el estado en memoria.
        // La lógica de db.on('populate') debería haber llenado la DB si era su primera creación.

        const loadedState = {
            statusList: statusList.length ? statusList : DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectNameList: projectNameList.length ? projectNameList : DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectDetails: projectDetails.length ? projectDetails : DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
            projectCosts: projectCosts.length ? projectCosts.map(cost => ({...cost, budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 }))
                            : DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
            monthlyIncome: (monthlyIncomeConfig && typeof monthlyIncomeConfig.value === 'number') ? Number(monthlyIncomeConfig.value) : DEFAULT_MONTHLY_INCOME,
            fixedExpenses: fixedExpenses.length ? fixedExpenses.map(exp => ({...exp, amount: Number(exp.amount) || 0}))
                            : DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: Number(item.amount) || 0 })),
            mainTitle: mainTitleConfig ? sanitizeHTML(mainTitleConfig.value) : 'Rastreador de Proyectos y Finanzas',
            sortState: getAppState().sortState || JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            currentConfirmationAction: null
        };
        
        if (isNaN(loadedState.monthlyIncome)) loadedState.monthlyIncome = DEFAULT_MONTHLY_INCOME;

        // Data Integrity Checks
        const currentProjectNames = loadedState.projectNameList.map(p => p.name);
        loadedState.projectCosts = loadedState.projectCosts.filter(cost => currentProjectNames.includes(cost.projectName));
        // No añadir automáticamente costos si no existen para un proyecto cargado,
        // esto debería manejarse al crear el proyecto.

        const currentStatuses = loadedState.statusList.map(s => s.name);
        loadedState.projectDetails = loadedState.projectDetails.filter(task =>
            currentProjectNames.includes(task.projectName) && currentStatuses.includes(task.status)
        );

        if (mainTitleEl) {
            mainTitleEl.textContent = loadedState.mainTitle;
        }

        setAppState(loadedState);
        console.log("Data loaded from IndexedDB into app state:", getAppState());

    } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        const defaultState = {
            statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
            projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
            monthlyIncome: DEFAULT_MONTHLY_INCOME,
            fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: Number(item.amount) || 0 })),
            mainTitle: 'Rastreador de Proyectos y Finanzas',
            sortState: JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            currentConfirmationAction: null
        };
        setAppState(defaultState);
        if (mainTitleEl) mainTitleEl.textContent = defaultState.mainTitle;
        showToast("Error al cargar datos de la DB. Usando valores por defecto.", "error");
    }
};

// Esta función ya no persiste datos, solo muestra un toast.
// La persistencia se hace en los eventHandlers usando los métodos de 'db'.
export const saveData = (successMessage) => {
    if (successMessage) {
        showToast(successMessage, 'success');
    }
};

export const resetToDefaultData = async () => {
    try {
        // Limpiar todas las tablas en Dexie usando una transacción
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            await Promise.all([
                db.appConfig.clear(),
                db.statusList.clear(),
                db.projectNameList.clear(),
                db.projectDetails.clear(),
                db.projectCosts.clear(),
                db.fixedExpenses.clear()
            ]);
        });
        console.log("All Dexie tables cleared for reset.");

        // Volver a poblar la base de datos usando la función exportada de db.js
        await populateDefaultData();
        
        await loadData(); // Recargar datos desde Dexie al estado en memoria
        renderAll();
        refreshCurrentChart();
        showToast('Datos restablecidos a los valores de ejemplo.', 'info');
    } catch (error) {
        console.error("Error resetting data:", error);
        showToast("Error al restablecer los datos.", "error");
    }
};


export const importData = async (importedData, fileName) => {
    if (typeof importedData !== 'object' || importedData === null ||
        !Array.isArray(importedData.statusList) ||
        !Array.isArray(importedData.projectNameList) ||
        !Array.isArray(importedData.projectDetails) ||
        !Array.isArray(importedData.projectCosts) ||
        typeof importedData.monthlyIncome === 'undefined' || // monthlyIncome puede ser 0
        !Array.isArray(importedData.fixedExpenses)) {
        showToast('Estructura del archivo JSON no válida.', 'error');
        return false;
    }

    try {
        // Limpiar tablas antes de importar y luego insertar en una transacción
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            await Promise.all([
                db.appConfig.clear(), db.statusList.clear(), db.projectNameList.clear(),
                db.projectDetails.clear(), db.projectCosts.clear(), db.fixedExpenses.clear()
            ]);

            console.log("Dexie tables cleared for import. Importing new data...");

            const ensureId = (item) => ({ ...item, id: item.id || generateId() });
            
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: sanitizeHTML(importedData.mainTitle) || 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: Number(importedData.monthlyIncome) || 0 }
            ]);
            await db.statusList.bulkPut(importedData.statusList.map(item => typeof item === 'string' ? { id: generateId(), name: item } : ensureId(item)));
            await db.projectNameList.bulkPut(importedData.projectNameList.map(item => typeof item === 'string' ? { id: generateId(), name: item } : ensureId(item)));
            await db.projectDetails.bulkPut(importedData.projectDetails.map(ensureId));
            const formattedProjectCosts = importedData.projectCosts.map(cost => ({ ...ensureId(cost), budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 }));
            await db.projectCosts.bulkPut(formattedProjectCosts);
            const formattedFixedExpenses = importedData.fixedExpenses.map(exp => ({ ...ensureId(exp), amount: Number(exp.amount) || 0 }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);
        });
        console.log("Data imported to Dexie successfully.");
        
        await loadData(); 
        renderAll();
        refreshCurrentChart();
        showToast(`Datos importados correctamente desde ${sanitizeHTML(fileName)}.`, 'success');
        return true;
    } catch (error) {
        console.error("Error importing data to Dexie:", error);
        showToast("Error al importar los datos a la base de datos.", "error");
        // Considerar volver a cargar los datos por defecto o el estado anterior si la importación falla a mitad
        await loadData(); // Intenta recargar lo que haya (podría ser una DB vacía o parcialmente llena)
        renderAll();
        refreshCurrentChart();
        return false;
    }
};