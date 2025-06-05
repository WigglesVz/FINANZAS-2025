// src/js/storage.js

import db, { populateDefaultData } from './db.js';
import { getAppState, setAppState } from './state.js';
import { generateId, showToast, sanitizeHTML, isHexColor } from './utils.js';
import { mainTitleEl } from './domElements.js';
import { renderAll } from './uiRender.js';
import { refreshCurrentChart } from './charts.js';
import {
    DEFAULT_STATUS_LIST, DEFAULT_PROJECT_NAME_LIST, DEFAULT_PROJECT_DETAILS,
    DEFAULT_PROJECT_COSTS, DEFAULT_MONTHLY_INCOME, DEFAULT_FIXED_EXPENSES,
    SORT_STATE_DEFAULTS
} from './config.js';


export const loadData = async () => {
    console.log("--- [LOAD_DATA] INICIO: Cargando datos desde IndexedDB ---");
    try {
        // Asegurarse de que la DB esté abierta y poblada si es la primera vez.
        // db.on('populate') se encarga de esto si es la primera creación.
        // db.open() asegura que las migraciones se ejecuten si es necesario.
        await db.open();
        console.log("--- [LOAD_DATA] DB_OPEN: Base de datos abierta/verificada ---");

        const [
            statusListDb, projectNameListDb, projectDetailsDb, projectCostsDb,
            fixedExpensesDb, mainTitleConfig, monthlyIncomeConfig
        ] = await db.transaction('r', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            console.log("--- [LOAD_DATA] DB_READ: Dentro de la transacción de lectura de Dexie ---");
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
        console.log("--- [LOAD_DATA] POST_DB_READ: Datos crudos recuperados de Dexie ---");
        console.log("--- [LOAD_DATA] Raw statusListDb:", statusListDb ? `Array[${statusListDb.length}]` : statusListDb);
        console.log("--- [LOAD_DATA] Raw projectNameListDb:", projectNameListDb ? `Array[${projectNameListDb.length}]` : projectNameListDb);
        console.log("--- [LOAD_DATA] Raw fixedExpensesDb:", fixedExpensesDb ? `Array[${fixedExpensesDb.length}]` : fixedExpensesDb);
        console.log("--- [LOAD_DATA] Raw mainTitleConfig:", mainTitleConfig);
        console.log("--- [LOAD_DATA] Raw monthlyIncomeConfig:", monthlyIncomeConfig);


        // Cargar directamente lo que hay en la DB.
        // Si una tabla devuelve null o undefined (lo que no debería pasar con toArray()), se usa un array vacío.
        // Los valores por defecto para mainTitle e monthlyIncome se usan solo si no existen en appConfig.
        const loadedState = {
            statusList: statusListDb || [],
            projectNameList: projectNameListDb || [],
            projectDetails: projectDetailsDb || [],
            projectCosts: projectCostsDb ? projectCostsDb.map(cost => ({...cost, budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 })) : [],
            monthlyIncome: (monthlyIncomeConfig && typeof monthlyIncomeConfig.value === 'number') ? Number(monthlyIncomeConfig.value) : DEFAULT_MONTHLY_INCOME,
            fixedExpenses: fixedExpensesDb ? fixedExpensesDb.map(exp => ({...exp, amount: Number(exp.amount) || 0})) : [],
            mainTitle: mainTitleConfig ? sanitizeHTML(mainTitleConfig.value) : 'Rastreador de Proyectos y Finanzas',
            // Mantener la lógica para sortState y currentConfirmationAction como estaba (del estado actual o defaults al inicializar app)
            // No se sobreescriben aquí a menos que la exportación/importación los maneje explícitamente
            sortState: getAppState().sortState || JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            currentConfirmationAction: getAppState().currentConfirmationAction || null,
            // El estado de autenticación (isAuthenticated, currentUser) se maneja en auth.js y no se sobreescribe aquí.
            searchTerms: getAppState().searchTerms || { projectDetails: '', projectCosts: '', fixedExpenses: '' }
        };

        // Asegurar que monthlyIncome sea un número válido
        if (isNaN(loadedState.monthlyIncome)) {
            console.warn("--- [LOAD_DATA] WARN: monthlyIncome era NaN, usando DEFAULT_MONTHLY_INCOME ---");
            loadedState.monthlyIncome = DEFAULT_MONTHLY_INCOME;
        }
        
        console.log("--- [LOAD_DATA] PRE_INTEGRITY_CHECK: Estado construido antes de chequeos de integridad:", loadedState);

        // Comprobaciones de integridad de datos (opcional, pero útil para consistencia)
        // Esta lógica no debería añadir datos por defecto, solo filtrar datos huérfanos.
        const currentProjectNames = loadedState.projectNameList.map(p => p.name);
        loadedState.projectCosts = loadedState.projectCosts.filter(cost => currentProjectNames.includes(cost.projectName));

        const currentStatuses = loadedState.statusList.map(s => s.name);
        loadedState.projectDetails = loadedState.projectDetails.filter(task =>
            currentProjectNames.includes(task.projectName) && currentStatuses.includes(task.status)
        );
        console.log("--- [LOAD_DATA] POST_INTEGRITY_CHECK: Estado después de chequeos de integridad ---");


        if (mainTitleEl) {
            mainTitleEl.textContent = loadedState.mainTitle;
        }

        setAppState(loadedState); // Establecer el estado cargado
        console.log("--- [LOAD_DATA] ÉXITO: Datos cargados de IndexedDB al estado de la aplicación. Estado actual:", getAppState());

    } catch (error) {
        console.error("--- [LOAD_DATA] ERROR: Error cargando datos de IndexedDB ---", error);
        // Lógica de fallback si la carga de la DB falla catastróficamente
        const defaultStateForError = {
            statusList: DEFAULT_STATUS_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectNameList: DEFAULT_PROJECT_NAME_LIST.map(item => ({ ...item, id: item.id || generateId() })),
            projectDetails: DEFAULT_PROJECT_DETAILS.map(item => ({ ...item, id: item.id || generateId() })),
            projectCosts: DEFAULT_PROJECT_COSTS.map(item => ({ ...item, id: item.id || generateId(), budget: Number(item.budget) || 0, actualCost: Number(item.actualCost) || 0 })),
            monthlyIncome: DEFAULT_MONTHLY_INCOME,
            fixedExpenses: DEFAULT_FIXED_EXPENSES.map(item => ({ ...item, id: item.id || generateId(), amount: Number(item.amount) || 0 })),
            mainTitle: 'Rastreador de Proyectos y Finanzas',
            sortState: JSON.parse(JSON.stringify(SORT_STATE_DEFAULTS)),
            searchTerms: { projectDetails: '', projectCosts: '', fixedExpenses: '' },
            currentConfirmationAction: null
        };
        setAppState(defaultStateForError);
        if (mainTitleEl) mainTitleEl.textContent = defaultStateForError.mainTitle;
        showToast("Error crítico al cargar datos. Usando valores por defecto de config.", "error");
        console.log("--- [LOAD_DATA] FALLBACK: Usando estado por defecto debido a error. Estado actual:", getAppState());
    }
    console.log("--- [LOAD_DATA] FIN: Proceso de carga de datos finalizado. ---");
};

export const saveData = (successMessage) => {
    // Esta función ya no persiste datos directamente a localStorage o IndexedDB aquí.
    // La persistencia se maneja en los eventHandlers usando los métodos de 'db'.
    // Su propósito ahora es solo mostrar un toast si se provee un mensaje.
    if (successMessage) {
        showToast(successMessage, 'success');
    }
    // Podría añadirse un log si se desea: console.log("saveData (deprecated for direct persistence) called.");
};

export const resetToDefaultData = async () => {
    console.log("--- [RESET_DATA] INICIO: Restableciendo datos a valores de ejemplo ---");
    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            console.log("--- [RESET_DATA] DB_CLEAR: Limpiando todas las tablas de Dexie ---");
            await Promise.all([
                db.appConfig.clear(),
                db.statusList.clear(),
                db.projectNameList.clear(),
                db.projectDetails.clear(),
                db.projectCosts.clear(),
                db.fixedExpenses.clear()
            ]);
        });
        console.log("--- [RESET_DATA] DB_CLEARED: Todas las tablas de Dexie limpiadas. ---");

        await populateDefaultData(); // Esta función ya tiene sus propios logs
        console.log("--- [RESET_DATA] DB_POPULATED: Base de datos repoblada con datos por defecto. ---");
        
        await loadData(); // Recargar datos desde Dexie al estado en memoria
        renderAll();
        refreshCurrentChart();
        showToast('Datos restablecidos a los valores de ejemplo.', 'info');
        console.log("--- [RESET_DATA] ÉXITO: Datos restablecidos y UI actualizada. ---");
    } catch (error) {
        console.error("--- [RESET_DATA] ERROR: Error restableciendo datos ---", error);
        showToast("Error al restablecer los datos.", "error");
    }
    console.log("--- [RESET_DATA] FIN: Proceso de restablecimiento finalizado. ---");
};


export const importData = async (importedData, fileName) => {
    console.log(`--- [IMPORT_DATA] INICIO: Importando datos desde archivo: ${sanitizeHTML(fileName)} ---`);
    if (typeof importedData !== 'object' || importedData === null ||
        !Array.isArray(importedData.statusList) ||
        !Array.isArray(importedData.projectNameList) ||
        !Array.isArray(importedData.projectDetails) ||
        !Array.isArray(importedData.projectCosts) ||
        typeof importedData.monthlyIncome === 'undefined' || // puede ser 0
        !Array.isArray(importedData.fixedExpenses)) {
        showToast('Estructura del archivo JSON no válida.', 'error');
        console.error("--- [IMPORT_DATA] ERROR: Estructura JSON no válida. ---", importedData);
        return false;
    }
    console.log("--- [IMPORT_DATA] JSON_VALIDATED: Estructura JSON parece válida. ---");
    console.log("--- [IMPORT_DATA] Contenido a importar (resumen):");
    console.log(`  mainTitle: ${importedData.mainTitle}`);
    console.log(`  statusList: Array[${importedData.statusList.length}]`);
    console.log(`  projectNameList: Array[${importedData.projectNameList.length}]`);
    console.log(`  projectDetails: Array[${importedData.projectDetails.length}]`);
    console.log(`  projectCosts: Array[${importedData.projectCosts.length}]`);
    console.log(`  monthlyIncome: ${importedData.monthlyIncome}`);
    console.log(`  fixedExpenses: Array[${importedData.fixedExpenses.length}]`);


    try {
        await db.transaction('rw', db.appConfig, db.statusList, db.projectNameList, db.projectDetails, db.projectCosts, db.fixedExpenses, async () => {
            console.log("--- [IMPORT_DATA] DB_CLEAR: Limpiando tablas de Dexie antes de importar... ---");
            await Promise.all([
                db.appConfig.clear(), db.statusList.clear(), db.projectNameList.clear(),
                db.projectDetails.clear(), db.projectCosts.clear(), db.fixedExpenses.clear()
            ]);
            console.log("--- [IMPORT_DATA] DB_CLEARED: Tablas limpiadas. Insertando nuevos datos... ---");

            const ensureId = (item) => ({ ...item, id: item.id || generateId() });
            
            await db.appConfig.bulkPut([
                { key: 'mainTitle', value: sanitizeHTML(importedData.mainTitle) || 'Rastreador de Proyectos y Finanzas' },
                { key: 'monthlyIncome', value: Number(importedData.monthlyIncome) || 0 }
            ]);
            await db.statusList.bulkPut(importedData.statusList.map(item => {
                const baseItem = typeof item === 'string' ? { name: item } : { ...item }; // Manejar si el item es solo un string (legado)
                const importedColor = baseItem.color;
                return {
                    id: baseItem.id || generateId(),
                    name: baseItem.name,
                    color: (importedColor && isHexColor(importedColor)) ? importedColor : '#CCCCCC'
                };
            }));
            await db.projectNameList.bulkPut(importedData.projectNameList.map(item => typeof item === 'string' ? { id: generateId(), name: item } : ensureId(item)));
            await db.projectDetails.bulkPut(importedData.projectDetails.map(ensureId));
            const formattedProjectCosts = importedData.projectCosts.map(cost => ({ ...ensureId(cost), budget: Number(cost.budget) || 0, actualCost: Number(cost.actualCost) || 0 }));
            await db.projectCosts.bulkPut(formattedProjectCosts);
            const formattedFixedExpenses = importedData.fixedExpenses.map(exp => ({ ...ensureId(exp), amount: Number(exp.amount) || 0 }));
            await db.fixedExpenses.bulkPut(formattedFixedExpenses);
            console.log("--- [IMPORT_DATA] DB_BULKPUT_COMPLETE: Datos importados a tablas de Dexie. ---");
        });
        
        console.log("--- [IMPORT_DATA] RELOADING_DATA: Datos importados a Dexie. Recargando datos al estado de la aplicación... ---");
        await loadData(); // Cargar los datos recién importados al estado en memoria
        renderAll();
        refreshCurrentChart();
        showToast(`Datos importados correctamente desde ${sanitizeHTML(fileName)}.`, 'success');
        console.log("--- [IMPORT_DATA] ÉXITO: Importación completada y UI actualizada. ---");
        return true;
    } catch (error) {
        console.error("--- [IMPORT_DATA] ERROR: Error importando datos a Dexie ---", error);
        showToast("Error al importar los datos a la base de datos.", "error");
        console.log("--- [IMPORT_DATA] ATTEMPT_RELOAD_AFTER_ERROR: Intentando recargar estado actual de la DB después del error de importación... ---");
        await loadData(); // Intenta recargar lo que haya (podría ser una DB vacía o parcialmente llena)
        renderAll();
        refreshCurrentChart();
        return false;
    } finally {
        console.log("--- [IMPORT_DATA] FIN: Proceso de importación finalizado. ---");
    }
};