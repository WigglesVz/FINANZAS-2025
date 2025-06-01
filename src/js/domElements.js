// src/js/domElements.js

// Main Structure
export const htmlElement = document.documentElement;
export const mainTitleEl = document.getElementById('main-title');
export const changeTitleButton = document.getElementById('change-title-button');
export const themeToggleButton = document.getElementById('theme-toggle');
export const tabButtons = document.querySelectorAll('.tab-button');
export const tabContents = document.querySelectorAll('.tab-content');
export const footerYearSpan = document.getElementById('current-year');
export const toastContainer = document.getElementById('toast-container');

// Overview Elements
export const totalProjectsEl = document.getElementById('total-projects');
export const totalActualCostEl = document.getElementById('total-actual-cost');
export const cumulativeTasksEl = document.getElementById('cumulative-tasks');
export const projectSummaryContainer = document.getElementById('project-summary-container');
export const overviewChartCanvas = document.getElementById('overview-chart');
export const chartNoDataEl = document.getElementById('chart-no-data');
export const chartTitleEl = document.getElementById('chart-title');
export const chartTypeSelect = document.getElementById('chart-type-select');

// Project Details Elements
export const projectDetailsTable = document.getElementById('project-details-table');
export const projectDetailsTableBody = document.getElementById('project-details-table-body');
export const addTaskButton = document.getElementById('add-task-button');
export const searchProjectTasksInput = document.getElementById('search-project-tasks');

// Project Costs Elements
export const projectCostTable = document.getElementById('project-cost-table');
export const projectCostTableBody = document.getElementById('project-cost-table-body');
export const searchProjectCostsInput = document.getElementById('search-project-costs'); // DESCOMENTADO Y AÑADIDO

// Finance Elements
export const monthlyIncomeInput = document.getElementById('monthly-income');
export const totalFixedExpensesEl = document.getElementById('total-fixed-expenses');
export const netMonthlyAmountEl = document.getElementById('net-monthly-amount');
export const addExpenseForm = document.getElementById('add-expense-form');
export const addExpenseButton = document.getElementById('add-expense-button');
export const expenseNameInput = document.getElementById('expense-name');
export const expenseAmountInput = document.getElementById('expense-amount');
export const expenseNameError = document.getElementById('expense-name-error');
export const expenseAmountError = document.getElementById('expense-amount-error');
export const fixedExpensesTable = document.getElementById('fixed-expenses-table');
export const fixedExpensesTableBody = document.getElementById('fixed-expenses-table-body');
export const searchFixedExpensesInput = document.getElementById('search-fixed-expenses'); // DESCOMENTADO Y AÑADIDO

// Setup Elements
export const statusListEl = document.getElementById('status-list');
export const newStatusInput = document.getElementById('new-status-input');
export const addStatusButton = document.getElementById('add-status-button');
export const newStatusError = document.getElementById('new-status-error');
export const projectNameListEl = document.getElementById('project-name-list');
export const newProjectNameInput = document.getElementById('new-project-name-input');
export const addProjectNameButton = document.getElementById('add-project-name-button');
export const newProjectNameError = document.getElementById('new-project-name-error');
export const resetDataButton = document.getElementById('reset-data-button');
export const exportDataButton = document.getElementById('export-data-button');
export const importDataButton = document.getElementById('import-data-button');
export const importFileInput = document.getElementById('import-file-input');

// Task Modal Elements
export const taskModal = document.getElementById('task-modal');
export const taskModalTitle = document.getElementById('task-modal-title');
export const closeTaskModalButton = document.getElementById('close-task-modal');
export const cancelTaskModalButton = document.getElementById('cancel-task-modal');
export const saveTaskButton = document.getElementById('save-task-button');
export const taskForm = document.getElementById('task-form');
export const taskIdInput = document.getElementById('task-id');
export const taskProjectNameSelect = document.getElementById('task-project-name');
export const taskStatusSelect = document.getElementById('task-status');
export const taskNameInput = document.getElementById('task-name');
export const taskDescriptionInput = document.getElementById('task-description');
export const taskStartDateInput = document.getElementById('task-start-date');
export const taskEndDateInput = document.getElementById('task-end-date');
export const taskProjectNameError = document.getElementById('task-project-name-error');
export const taskStatusError = document.getElementById('task-status-error');
export const taskNameError = document.getElementById('task-name-error');
export const taskStartDateError = document.getElementById('task-start-date-error');
export const taskEndDateError = document.getElementById('task-end-date-error');

// Cost Modal Elements
export const costModal = document.getElementById('cost-modal');
export const costModalTitle = document.getElementById('cost-modal-title');
export const closeCostModalButton = document.getElementById('close-cost-modal');
export const cancelCostModalButton = document.getElementById('cancel-cost-modal');
export const saveCostButton = document.getElementById('save-cost-button');
export const costForm = document.getElementById('cost-form');
export const costIdInput = document.getElementById('cost-id');
export const costProjectNameInput = document.getElementById('cost-project-name');
export const costBudgetInput = document.getElementById('cost-budget');
export const costActualInput = document.getElementById('cost-actual');
export const costBudgetError = document.getElementById('cost-budget-error');
export const costActualError = document.getElementById('cost-actual-error');

// Confirmation Modal Elements
export const confirmationModal = document.getElementById('confirmation-modal');
export const confirmationModalTitle = document.getElementById('confirmation-modal-title');
export const confirmationModalBody = document.getElementById('confirmation-modal-body');
export const closeConfirmationModalButton = document.getElementById('close-confirmation-modal');
export const cancelConfirmationModalButton = document.getElementById('cancel-confirmation-modal');
export const confirmConfirmationButton = document.getElementById('confirm-confirmation-button');

// --- Elementos de Autenticación ---
export const authScreen = document.getElementById('auth-screen');
export const appContent = document.getElementById('app-content');
export const loginFormContainer = document.getElementById('login-form-container');
export const loginForm = document.getElementById('login-form');
export const loginUsernameInput = document.getElementById('login-username');
export const loginPasswordInput = document.getElementById('login-password');
export const loginUsernameError = document.getElementById('login-username-error');
export const loginPasswordError = document.getElementById('login-password-error');
export const loginButton = document.getElementById('login-button');
export const showRegisterFormButton = document.getElementById('show-register-form-button');
export const registerFormContainer = document.getElementById('register-form-container');
export const registerForm = document.getElementById('register-form');
export const registerUsernameInput = document.getElementById('register-username');
export const registerPasswordInput = document.getElementById('register-password');
export const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
export const registerUsernameError = document.getElementById('register-username-error');
export const registerPasswordError = document.getElementById('register-password-error');
export const registerConfirmPasswordError = document.getElementById('register-confirm-password-error');
export const registerButton = document.getElementById('register-button');
export const showLoginFormButton = document.getElementById('show-login-form-button');
export const logoutButton = document.getElementById('logout-button');