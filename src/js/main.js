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
    // Elementos de Costos (Cost)
    costForm, costModal, 
    closeCostModalButton, cancelCostModalButton,
    projectCostTableBody, projectCostTable, searchProjectCostsInput, // AÑADIDO searchProjectCostsInput
    // Elementos de Finanzas (Finance)
    monthlyIncomeInput, addExpenseForm, fixedExpensesTableBody, fixedExpensesTable, searchFixedExpensesInput, // AÑADIDO searchFixedExpensesInput
    // Elementos de Modales
    confirmationModal, closeConfirmationModalButton, cancelConfirmationModalButton, confirmConfirmationButton,
    // Elementos de Gráficos (Overview)
    chartTypeSelect,
    // Elementos de Autenticación
    loginForm, registerForm,
    showRegisterFormButton, logoutButton
} from './domElements.js';

import { loadData } from './storage.js';
import { getAppState } from './state.js';

import { loadThemePreference, toggleDarkMode } from './theme.js';
// renderAll no se llama directamente desde aquí si la autenticación lo maneja
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
    handleSearchProjectCosts,   // AÑADIDO handler
    handleSearchFixedExpenses // AÑADIDO handler
} from './eventHandlers.js';
import {
    handleLogin, handleRegister, handleLogout,
    showLoginForm, showRegisterForm,
    checkAuthStatus, checkForRegisteredUser
} from './auth.js';
import { showToast } from './utils.js';
// renderSelectedChart no se llama directamente desde aquí, se maneja en auth.js o eventHandlers.js

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

    [projectDetailsTable, projectCostTable, fixedExpensesTable].forEach(table => {
        if (table) {
            const sortableHeaders = table.querySelectorAll('thead th.sortable-header');
            sortableHeaders.forEach(header => header.addEventListener('click', handleTableSort));
        }
    });

    if(chartTypeSelect) chartTypeSelect.addEventListener('change', handleChartTypeChange);
    
    // Listeners para búsqueda
    if(searchProjectTasksInput) searchProjectTasksInput.addEventListener('input', handleSearchProjectTasks);
    if(searchProjectCostsInput) searchProjectCostsInput.addEventListener('input', handleSearchProjectCosts); // AÑADIDO
    if(searchFixedExpensesInput) searchFixedExpensesInput.addEventListener('input', handleSearchFixedExpenses); // AÑADIDO

    // Auth Listeners
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(registerForm) registerForm.addEventListener('submit', handleRegister);
    if(showRegisterFormButton) showRegisterFormButton.addEventListener('click', showRegisterForm);
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
                if (targetButton && targetButton.hasAttribute(idAttribute)) {
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
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando Rastreador...");

    try {
        loadThemePreference();
        const isAuthenticated = await checkAuthStatus(); 
        
        if (isAuthenticated) {
            // No es necesario llamar a loadData() o renderAll() aquí,
            // ya que hideAuthScreenAndShowApp (llamado desde checkAuthStatus) lo hace.
        } else {
            checkForRegisteredUser();
        }

        attachStaticListeners();
        attachDelegatedListeners();

        // El toast y el log de "Aplicación cargada" se manejan dentro de hideAuthScreenAndShowApp
        // o podrían mostrarse aquí si ya estaba autenticado, pero es mejor centralizarlo.

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