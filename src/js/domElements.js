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

// Crypto Dashboard Elements (in Overview)
export const projectsOverviewDashboard = document.getElementById('projects-overview-dashboard');
export const cryptoOverviewDashboard = document.getElementById('crypto-overview-dashboard');
export const cryptoTotalPnl = document.getElementById('crypto-total-pnl');
export const cryptoWinRate = document.getElementById('crypto-win-rate');
export const cryptoTotalTrades = document.getElementById('crypto-total-trades');
export const cryptoWinLossRatio = document.getElementById('crypto-win-loss-ratio');
export const cryptoOverviewChartCanvas = document.getElementById('crypto-overview-chart');
export const cryptoChartNoData = document.getElementById('crypto-chart-no-data');

// Crypto Panel Elements
export const cryptoPanelTab = document.getElementById('tab-crypto-panel');
export const cryptoPanelContent = document.getElementById('crypto-panel-content');
export const cryptoWatchlistContainer = document.getElementById('crypto-watchlist-container');

// Add Coin to Watchlist Modal Elements
export const addCoinModal = document.getElementById('add-coin-modal');
export const closeAddCoinModalButton = document.getElementById('close-add-coin-modal');
export const cancelAddCoinModalButton = document.getElementById('cancel-add-coin-modal');
export const searchCoinInput = document.getElementById('search-coin-input');
export const coinSearchResultsContainer = document.getElementById('coin-search-results-container');

// Project Details Elements
export const projectDetailsTable = document.getElementById('project-details-table');
export const projectDetailsTableBody = document.getElementById('project-details-table-body');
export const addTaskButton = document.getElementById('add-task-button');
export const searchProjectTasksInput = document.getElementById('search-project-tasks');
export const projectDetailsSortHeaders = document.getElementById('project-details-sort-headers');


// Project Costs Elements
export const projectCostTable = document.getElementById('project-cost-table');
export const projectCostTableBody = document.getElementById('project-cost-table-body');
export const searchProjectCostsInput = document.getElementById('search-project-costs');
export const projectCostSortHeaders = document.getElementById('project-cost-sort-headers');


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
export const searchFixedExpensesInput = document.getElementById('search-fixed-expenses');
export const fixedExpensesSortHeaders = document.getElementById('fixed-expenses-sort-headers');


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

// App Mode Selector Elements
export const appModeSelector = document.getElementById('app-mode-selector');
export const modeProjectsRadio = document.getElementById('mode-projects');
export const modeCryptoRadio = document.getElementById('mode-crypto');
export const setupStatusListContainer = document.getElementById('setup-status-list-container');
export const setupProjectNameListContainer = document.getElementById('setup-project-name-list-container');

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

// Spot Trading Elements
export const spotTradingTab = document.getElementById('tab-spot-trading');
export const addSpotTradeButton = document.getElementById('add-spot-trade-button');
export const spotTradesTableBody = document.getElementById('spot-trades-table-body');
// Modal de Spot Trade
export const spotTradeModal = document.getElementById('spot-trade-modal');
export const spotTradeModalTitle = document.getElementById('spot-trade-modal-title');
export const closeSpotTradeModalButton = document.getElementById('close-spot-trade-modal');
export const cancelSpotTradeModalButton = document.getElementById('cancel-spot-trade-modal');
export const saveSpotTradeButton = document.getElementById('save-spot-trade-button');
export const spotTradeForm = document.getElementById('spot-trade-form');
// Campos del Formulario de Spot Trade
export const spotTradeIdInput = document.getElementById('spot-trade-id');
export const tradeDateInput = document.getElementById('trade-date');
export const tradeTypeSelect = document.getElementById('trade-type');
export const baseAssetInput = document.getElementById('base-asset');
export const quoteAssetInput = document.getElementById('quote-asset');
export const priceInput = document.getElementById('price');
export const quantityBaseInput = document.getElementById('quantity-base');
export const totalQuoteInput = document.getElementById('total-quote');
export const notesInput = document.getElementById('notes');
export const spotTradeFeesInput = document.getElementById('spot-trade-fees'); // Nuevo
export const filterSpotAssetInput = document.getElementById('filter-spot-asset');
export const filterSpotStartDateInput = document.getElementById('filter-spot-start-date');
export const filterSpotEndDateInput = document.getElementById('filter-spot-end-date');
export const applySpotFiltersBtn = document.getElementById('apply-spot-filters-btn');
export const clearSpotFiltersBtn = document.getElementById('clear-spot-filters-btn');
// Futures Trading Elements
export const futuresTradingTab = document.getElementById('tab-futures-trading');
export const addFuturesTradeButton = document.getElementById('add-futures-trade-button');
export const futuresTradesTableBody = document.getElementById('futures-trades-table-body');
// Modal de Futures Trade
export const futuresTradeModal = document.getElementById('futures-trade-modal');
export const futuresTradeModalTitle = document.getElementById('futures-trade-modal-title');
export const closeFuturesTradeModalButton = document.getElementById('close-futures-trade-modal');
export const cancelFuturesTradeModalButton = document.getElementById('cancel-futures-trade-modal');
export const saveFuturesTradeButton = document.getElementById('save-futures-trade-button');
export const closeFuturesTradeButton = document.getElementById('close-futures-trade-button');
export const futuresTradeForm = document.getElementById('futures-trade-form');
// Campos del Formulario de Futures Trade
export const futuresTradeIdInput = document.getElementById('futures-trade-id');
export const futuresSymbolInput = document.getElementById('futures-symbol');
export const futuresDirectionSelect = document.getElementById('futures-direction');
export const futuresLeverageInput = document.getElementById('futures-leverage');
export const futuresEntryDateInput = document.getElementById('futures-entry-date');
export const futuresQuantityInput = document.getElementById('futures-quantity');
export const futuresEntryPriceInput = document.getElementById('futures-entry-price');
export const futuresExitPriceContainer = document.getElementById('futures-exit-price-container');
export const futuresExitPriceInput = document.getElementById('futures-exit-price');
export const futuresNotesInput = document.getElementById('futures-notes');
export const futuresEntryFeesInput = document.getElementById('futures-entry-fees'); // Nuevo
export const futuresExitFeesContainer = document.getElementById('futures-exit-fees-container'); // Nuevo
export const futuresExitFeesInput = document.getElementById('futures-exit-fees'); // Nuevo


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
