// src/js/main.js

import {
    // Elementos generales y de pestañas
    tabButtons, changeTitleButton, themeToggleButton,
    // Elementos de Configuración (Setup)
    addStatusButton, newStatusInput, statusListEl,
    addProjectNameButton, newProjectNameInput, projectNameListEl,
    resetDataButton, exportDataButton, importDataButton, importFileInput,
    // Elementos de Tareas (Details)
    addTaskButton, taskForm, taskModal, 
    closeTaskModalButton, cancelTaskModalButton,
    projectDetailsTableBody, projectDetailsTable, searchProjectTasksInput,
    // ¡NUEVO! Importar los nuevos contenedores de títulos/ordenación
    projectDetailsSortHeaders, 
    // Elementos de Costos (Cost)
    costForm, costModal, 
    closeCostModalButton, cancelCostModalButton,
    projectCostTableBody, projectCostTable, searchProjectCostsInput,
    // ¡NUEVO! Importar los nuevos contenedores de títulos/ordenación
    projectCostSortHeaders,
    // Elementos de Finanzas (Finance)
    monthlyIncomeInput, addExpenseForm, fixedExpensesTableBody, fixedExpensesTable, searchFixedExpensesInput,
    // ¡NUEVO! Importar los nuevos contenedores de títulos/ordenación
    fixedExpensesSortHeaders,
    // Elementos de Modales
    confirmationModal, closeConfirmationModalButton, cancelConfirmationModalButton, confirmConfirmationButton,
    // Elementos de Gráficos (Overview)
    chartTypeSelect,
    // Elementos de Autenticación
    loginForm, registerForm,
    showRegisterFormButton, logoutButton,
    // Añadir el segundo botón de showLoginFormButton si existe y es diferente
    // Si ambos botones #show-login-form-button son idénticos en funcionalidad, querySelectorAll está bien.
} from './domElements.js';

import { loadData } from './storage.js';
import { getAppState } from './state.js'; // Solo se necesita getAppState si no modificamos estado directamente aquí.

import { loadThemePreference, toggleDarkMode } from './theme.js';
// renderAll es llamado desde auth.js después de un login/registro exitoso o en checkAuthStatus.
// import { renderAll } from './uiRender.js'; 
import {
    openAddTaskModal, closeModal,
    handleChangeAppTitle, closeConfirmationModal,
    openEditTaskModal, openEditCostModal
} from './modalHandlers.js';
import {
    handleTabClick, handleAddStatus, handleAddProjectName,
    handleDeleteStatus, handleDeleteProjectName, handleResetData,
    handleTaskFormSubmit, handleDeleteTask, handleCostFormSubmit,
    handleIncomeChange, handleAddFixedExpense, handleDeleteFixedExpense,
    handleExportData, triggerImportFile, handleImportFile,
    handleTableSort, handleConfirmAction,
    handleChartTypeChange,
    handleSearchProjectTasks, 
    handleSearchProjectCosts,
    handleSearchFixedExpenses,
    handleStatusColorChange // Importar el handler para el cambio de color
} from './eventHandlers.js';
import {
    handleLogin, handleRegister, handleLogout,
    showLoginForm, showRegisterForm,
    checkAuthStatus, checkForRegisteredUser
} from './auth.js';
import { showToast } from './utils.js';
// renderSelectedChart se llama desde auth.js (en hideAuthScreenAndShowApp) y eventHandlers.js (handleTabClick)

const attachStaticListeners = () => {
    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
    }

    if(changeTitleButton) changeTitleButton.addEventListener('click', handleChangeAppTitle);
    if(themeToggleButton) themeToggleButton.addEventListener('click', toggleDarkMode);

    if(addStatusButton) addStatusButton.addEventListener('click', handleAddStatus);
    if(newStatusInput) newStatusInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStatus(); }});
    
    if(addProjectNameButton) addProjectNameButton.addEventListener('click', handleAddProjectName);
    if(newProjectNameInput) newProjectNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProjectName(); }});
    
    if(resetDataButton) resetDataButton.addEventListener('click', handleResetData);
    if(exportDataButton) exportDataButton.addEventListener('click', handleExportData);
    if(importDataButton) importDataButton.addEventListener('click', triggerImportFile);
    if(importFileInput) importFileInput.addEventListener('change', handleImportFile);

    if(addTaskButton) addTaskButton.addEventListener('click', openAddTaskModal);
    if(taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
    if(closeTaskModalButton) closeTaskModalButton.addEventListener('click', () => closeModal(taskModal));
    if(cancelTaskModalButton) cancelTaskModalButton.addEventListener('click', () => closeModal(taskModal));
    if(taskModal) taskModal.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(taskModal); });

    if(costForm) costForm.addEventListener('submit', handleCostFormSubmit);
    if(closeCostModalButton) closeCostModalButton.addEventListener('click', () => closeModal(costModal));
    if(cancelCostModalButton) cancelCostModalButton.addEventListener('click', () => closeModal(costModal));
    if(costModal) costModal.addEventListener('click', (e) => { if (e.target === costModal) closeModal(costModal); });

    if(closeConfirmationModalButton) closeConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if(cancelConfirmationModalButton) cancelConfirmationModalButton.addEventListener('click', closeConfirmationModal);
    if(confirmConfirmationButton) confirmConfirmationButton.addEventListener('click', handleConfirmAction);
    if(confirmationModal) confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); });

    if(monthlyIncomeInput) {
        monthlyIncomeInput.addEventListener('blur', handleIncomeChange);
        monthlyIncomeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleIncomeChange(e); e.target.blur(); }});
    }
    if(addExpenseForm) addExpenseForm.addEventListener('submit', handleAddFixedExpense);

    // ¡ELIMINADO! Listener en thead para ordenar, ya no existe.
    // [projectDetailsTable, projectCostTable, fixedExpensesTable].forEach(table => {
    //     if (table) {
    //         const sortableHeaders = table.querySelectorAll('thead th.sortable-header');
    //         sortableHeaders.forEach(header => header.addEventListener('click', handleTableSort));
    //     }
    // });

    if(chartTypeSelect) chartTypeSelect.addEventListener('change', handleChartTypeChange);
    
    if(searchProjectTasksInput) searchProjectTasksInput.addEventListener('input', handleSearchProjectTasks);
    if(searchProjectCostsInput) searchProjectCostsInput.addEventListener('input', handleSearchProjectCosts);
    if(searchFixedExpensesInput) searchFixedExpensesInput.addEventListener('input', handleSearchFixedExpenses);

    // Auth Listeners
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(registerForm) registerForm.addEventListener('submit', handleRegister);
    if(showRegisterFormButton) showRegisterFormButton.addEventListener('click', showRegisterForm);
    // Si tienes múltiples botones con el mismo ID (lo cual no es ideal, pero si es el caso)
    document.querySelectorAll('#show-login-form-button').forEach(btn => {
        if (btn) btn.addEventListener('click', showLoginForm);
    });
    if(logoutButton) logoutButton.addEventListener('click', handleLogout);
};

const attachDelegatedListeners = () => {
    const setupDelegatedListener = (parentElement, selector, handlerFn, idAttribute = 'data-id') => {
        if(parentElement) {
            parentElement.addEventListener('click', (event) => {
                const targetButton = event.target.closest(selector);
                // Para los nuevos botones de ordenación, el ID lo sacamos del data-table-id
                // y la clave de ordenación del data-sort-key.
                // Asegurarse de que el elemento sea un botón y tenga los atributos correctos.
                if (targetButton && targetButton.matches('button.sortable-header') && targetButton.dataset.sortKey && targetButton.dataset.tableId) {
                    handlerFn(event); // Pasamos el evento completo para que handleTableSort pueda leer el target
                } else if (targetButton && targetButton.hasAttribute(idAttribute)) { // Para botones con data-id tradicional
                    handlerFn(targetButton.getAttribute(idAttribute));
                }
            });
        }
    };

    setupDelegatedListener(statusListEl, '.delete-status-button', handleDeleteStatus);
    setupDelegatedListener(projectNameListEl, '.delete-project-name-button', handleDeleteProjectName);
    setupDelegatedListener(fixedExpensesTableBody, '.delete-expense-button', handleDeleteFixedExpense);

    if(projectDetailsTableBody) {
        projectDetailsTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-task-button');
            const deleteBtn = event.target.closest('.delete-task-button');
            if (editBtn && editBtn.dataset.id) openEditTaskModal(editBtn.dataset.id);
            else if (deleteBtn && deleteBtn.dataset.id) handleDeleteTask(deleteBtn.dataset.id);
        });
    }

    if(projectCostTableBody) {
        projectCostTableBody.addEventListener('click', (event) => {
            const editBtn = event.target.closest('.edit-cost-button');
            if (editBtn && editBtn.dataset.id) openEditCostModal(editBtn.dataset.id);
        });
    }

    // Listener delegado para los inputs de color de estado en la lista de configuración
    if(statusListEl) {
        statusListEl.addEventListener('input', (event) => {
            const colorInput = event.target.closest('.status-color-picker');
            if (colorInput) {
                handleStatusColorChange(event); 
            }
        });
    }
    
    // ¡NUEVO! Listeners delegados para los nuevos contenedores de ordenación
    if(projectDetailsSortHeaders) {
        projectDetailsSortHeaders.addEventListener('click', (event) => {
            const sortButton = event.target.closest('.sortable-header');
            if (sortButton && sortButton.matches('button')) { // Asegurar que es un botón
                handleTableSort(event); // Pasar el evento completo a handleTableSort
            }
        });
    }
    if(projectCostSortHeaders) {
        projectCostSortHeaders.addEventListener('click', (event) => {
            const sortButton = event.target.closest('.sortable-header');
            if (sortButton && sortButton.matches('button')) {
                handleTableSort(event);
            }
        });
    }
    if(fixedExpensesSortHeaders) {
        fixedExpensesSortHeaders.addEventListener('click', (event) => {
            const sortButton = event.target.closest('.sortable-header');
            if (sortButton && sortButton.matches('button')) {
                handleTableSort(event);
            }
        });
    }

};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando Rastreador...");

    try {
        loadThemePreference();
        const isAuthenticated = await checkAuthStatus(); 
        
        if (isAuthenticated) {
            // La función hideAuthScreenAndShowApp (llamada desde checkAuthStatus)
            // ya se encarga de loadData, renderAll y renderizar el gráfico inicial.
            // El toast y el log también se manejan allí.
        } else {
            checkForRegisteredUser(); // Muestra el formulario de login o registro.
        }

        attachStaticListeners();
        attachDelegatedListeners();

        // No es necesario un toast/log adicional aquí si ya se maneja en el flujo de autenticación.

    } catch (error) {
        console.error("Error durante la inicialización de la aplicación:", error);
        showToast("Error crítico al inicializar la aplicación. Revise la consola.", "error");
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;">
                                <h1>Error al cargar la aplicación</h1>
                                <p>Ha ocurrido un error inesperado. Por favor, intente recargar la página o contacte al soporte si el problema persiste.</p>
                                <p><em>Detalles del error (para desarrolladores): ${error.message}</em></p>
                              </div>`;
        }
    }
});