// src/js/domElements.js
export let htmlElement;
export let mainTitleEl;
export let changeTitleButton;
export let themeToggleButton;
export let tabButtons; // NodeList
export let tabContents; // NodeList
export let footerYearSpan;
export let toastContainer;
// Overview Elements
export let totalProjectsEl;
export let totalActualCostEl;
export let cumulativeTasksEl;
export let projectSummaryContainer;
export let overviewChartCanvas;
export let chartNoDataEl;
export let chartTitleEl;
export let chartTypeSelect;
// Crypto Dashboard Elements (in Overview)
export let projectsOverviewDashboard;
export let cryptoOverviewDashboard;
export let cryptoTotalPnl;
export let cryptoWinRate;
export let cryptoTotalTrades;
export let cryptoWinLossRatio;
export let cryptoOverviewChartCanvas;
export let cryptoChartNoData;
// Crypto Panel Elements
export let cryptoPanelTab;
export let cryptoPanelContent;
export let cryptoWatchlistContainer;
// Add Coin to Watchlist Modal Elements
export let addCoinModal;
export let closeAddCoinModalButton;
export let cancelAddCoinModalButton;
export let searchCoinInput;
export let coinSearchResultsContainer;
// Project Details Elements
export let projectDetailsTable;
export let projectDetailsTableBody;
export let addTaskButton;
export let searchProjectTasksInput;
export let projectDetailsSortHeaders;
// Project Costs Elements
export let projectCostTable;
export let projectCostTableBody;
export let searchProjectCostsInput;
export let projectCostSortHeaders;
// Finance Elements
export let monthlyIncomeInput;
export let totalFixedExpensesEl;
export let netMonthlyAmountEl;
export let addExpenseForm;
export let addExpenseButton;
export let expenseNameInput;
export let expenseAmountInput;
export let expenseNameError;
export let expenseAmountError;
export let fixedExpensesTable;
export let fixedExpensesTableBody;
export let searchFixedExpensesInput;
export let fixedExpensesSortHeaders;
// Setup Elements
export let statusListEl;
export let newStatusInput;
export let addStatusButton;
export let newStatusError;
export let projectNameListEl;
export let newProjectNameInput;
export let addProjectNameButton;
export let newProjectNameError;
export let resetDataButton;
export let exportDataButton;
export let importDataButton;
export let importFileInput;
// App Mode Selector Elements
export let appModeSelector;
export let modeProjectsRadio;
export let modeCryptoRadio;
export let setupStatusListContainer;
export let setupProjectNameListContainer;
// Task Modal Elements
export let taskModal;
export let taskModalTitle;
export let closeTaskModalButton;
export let cancelTaskModalButton;
export let saveTaskButton;
export let taskForm;
export let taskIdInput;
export let taskProjectNameSelect;
export let taskStatusSelect;
export let taskPrioritySelect;
export let taskPriorityError;
export let taskNameInput;
export let taskDescriptionInput;
export let taskStartDateInput;
export let taskEndDateInput;
export let taskProjectNameError;
export let taskStatusError;
export let taskNameError;
export let taskStartDateError;
export let taskEndDateError;
// Cost Modal Elements
export let costModal;
export let costModalTitle;
export let closeCostModalButton;
export let cancelCostModalButton;
export let saveCostButton;
export let costForm;
export let costIdInput;
export let costProjectNameInput;
export let costBudgetInput;
export let costActualInput;
export let costBudgetError;
export let costActualError;
// Confirmation Modal Elements
export let confirmationModal;
export let confirmationModalTitle;
export let confirmationModalBody;
export let closeConfirmationModalButton;
export let cancelConfirmationModalButton;
export let confirmConfirmationButton;
// Spot Trading Elements
export let spotTradingTab;
export let addSpotTradeButton;
export let spotTradesTableBody;
export let spotTradeModal;
export let spotTradeModalTitle;
export let closeSpotTradeModalButton;
export let cancelSpotTradeModalButton;
export let saveSpotTradeButton;
export let spotTradeForm;
export let spotTradeIdInput;
export let tradeDateInput;
export let tradeTypeSelect;
export let baseAssetInput;
export let quoteAssetInput;
export let priceInput;
export let quantityBaseInput;
export let totalQuoteInput;
export let notesInput;
export let spotTradeFeesInput;
export let filterSpotAssetInput;
export let filterSpotStartDateInput;
export let filterSpotEndDateInput;
export let applySpotFiltersBtn;
export let clearSpotFiltersBtn;
export let spotTargetCalculatorSection;
export let calcBaseQuantity;
export let calcBaseTotalCost;
export let calcTargetProfitUsdInput; // Cambiado de calcTargetProfitUsd a calcTargetProfitUsdInput
export let calcEstimatedSellFeeInput; // Cambiado de calcEstimatedSellFee a calcEstimatedSellFeeInput
export let calcSellPriceNeeded;
export let calcTotalSellValue;
// Futures Trading Elements
export let futuresTradingTab;
export let addFuturesTradeButton;
export let futuresTradesTableBody;
export let futuresTradeModal;
export let futuresTradeModalTitle;
export let closeFuturesTradeModalButton;
export let cancelFuturesTradeModalButton;
export let saveFuturesTradeButton;
export let closeFuturesTradeButton;
export let futuresTradeForm;
export let futuresTradeIdInput;
export let futuresSymbolInput;
export let futuresDirectionSelect;
export let futuresLeverageInput;
export let futuresEntryDateInput;
export let futuresQuantityInput;
export let futuresEntryPriceInput;
export let futuresExitDateContainer; 
export let futuresExitDateInput;
export let futuresExitPriceContainer;
export let futuresExitPriceInput;
export let futuresNotesInput;
export let futuresEntryFeesInput;
export let futuresExitFeesContainer;
export let futuresExitFeesInput;
// NUEVOS ELEMENTOS PARA FUTUROS
export let futuresDurationContainer; 
export let futuresDurationInput;
export let futuresMarginContainer;
export let futuresMarginInput;
export let futuresRoiContainer;
export let futuresRoiInput; 
// --- Elementos de Autenticación ---
export let authScreen;
export let appContent;
export let loginFormContainer;
export let loginForm;
export let loginUsernameInput;
export let loginPasswordInput;
export let loginUsernameError;
export let loginPasswordError;
export let loginButton;
export let showRegisterFormButton;
export let registerFormContainer;
export let registerForm;
export let registerUsernameInput;
export let registerPasswordInput;
export let registerConfirmPasswordInput;
export let registerUsernameError;
export let registerPasswordError;
export let registerConfirmPasswordError;
export let registerButton;
export let showLoginFormButton; // Sera una NodeList
export let logoutButton;

export const initializeDomElements = () => {
    console.log("--- [DOM_INIT] Inicializando elementos DOM ---");
    htmlElement = document.documentElement;
    mainTitleEl = document.getElementById('main-title');
    changeTitleButton = document.getElementById('change-title-button');
    themeToggleButton = document.getElementById('theme-toggle');
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');
    footerYearSpan = document.getElementById('current-year');
    toastContainer = document.getElementById('toast-container');
    projectsOverviewDashboard = document.getElementById('projects-overview-dashboard');
    cryptoOverviewDashboard = document.getElementById('crypto-overview-dashboard');
    totalProjectsEl = document.getElementById('total-projects');
    totalActualCostEl = document.getElementById('total-actual-cost');
    cumulativeTasksEl = document.getElementById('cumulative-tasks');
    projectSummaryContainer = document.getElementById('project-summary-container');
    overviewChartCanvas = document.getElementById('overview-chart');
    chartNoDataEl = document.getElementById('chart-no-data');
    chartTitleEl = document.getElementById('chart-title');
    chartTypeSelect = document.getElementById('chart-type-select');
    cryptoTotalPnl = document.getElementById('crypto-total-pnl');
    cryptoWinRate = document.getElementById('crypto-win-rate');
    cryptoTotalTrades = document.getElementById('crypto-total-trades');
    cryptoWinLossRatio = document.getElementById('crypto-win-loss-ratio');
    cryptoOverviewChartCanvas = document.getElementById('crypto-overview-chart');
    cryptoChartNoData = document.getElementById('crypto-chart-no-data');
    cryptoPanelTab = document.getElementById('tab-crypto-panel');
    cryptoPanelContent = document.getElementById('crypto-panel-content');
    cryptoWatchlistContainer = document.getElementById('crypto-watchlist-container');
    addCoinModal = document.getElementById('add-coin-modal');
    closeAddCoinModalButton = document.getElementById('close-add-coin-modal');
    cancelAddCoinModalButton = document.getElementById('cancel-add-coin-modal');
    searchCoinInput = document.getElementById('search-coin-input');
    coinSearchResultsContainer = document.getElementById('coin-search-results-container');
    projectDetailsTable = document.getElementById('project-details-table');
    projectDetailsTableBody = document.getElementById('project-details-table-body');
    addTaskButton = document.getElementById('add-task-button');
    searchProjectTasksInput = document.getElementById('search-project-tasks');
    projectDetailsSortHeaders = document.getElementById('project-details-sort-headers');
    projectCostTable = document.getElementById('project-cost-table');
    projectCostTableBody = document.getElementById('project-cost-table-body');
    searchProjectCostsInput = document.getElementById('search-project-costs');
    projectCostSortHeaders = document.getElementById('project-cost-sort-headers');
    monthlyIncomeInput = document.getElementById('monthly-income');
    totalFixedExpensesEl = document.getElementById('total-fixed-expenses');
    netMonthlyAmountEl = document.getElementById('net-monthly-amount');
    addExpenseForm = document.getElementById('add-expense-form');
    addExpenseButton = document.getElementById('add-expense-button');
    expenseNameInput = document.getElementById('expense-name');
    expenseAmountInput = document.getElementById('expense-amount');
    expenseNameError = document.getElementById('expense-name-error');
    expenseAmountError = document.getElementById('expense-amount-error');
    fixedExpensesTable = document.getElementById('fixed-expenses-table');
    fixedExpensesTableBody = document.getElementById('fixed-expenses-table-body');
    searchFixedExpensesInput = document.getElementById('search-fixed-expenses');
    fixedExpensesSortHeaders = document.getElementById('fixed-expenses-sort-headers');
    statusListEl = document.getElementById('status-list');
    newStatusInput = document.getElementById('new-status-input');
    addStatusButton = document.getElementById('add-status-button');
    newStatusError = document.getElementById('new-status-error');
    projectNameListEl = document.getElementById('project-name-list');
    newProjectNameInput = document.getElementById('new-project-name-input');
    addProjectNameButton = document.getElementById('add-project-name-button');
    newProjectNameError = document.getElementById('new-project-name-error');
    resetDataButton = document.getElementById('reset-data-button');
    exportDataButton = document.getElementById('export-data-button');
    importDataButton = document.getElementById('import-data-button');
    importFileInput = document.getElementById('import-file-input');
    appModeSelector = document.getElementById('app-mode-selector');
    modeProjectsRadio = document.getElementById('mode-projects');
    modeCryptoRadio = document.getElementById('mode-crypto');
    setupStatusListContainer = document.getElementById('setup-status-list-container');
    setupProjectNameListContainer = document.getElementById('setup-project-name-list-container');
    taskModal = document.getElementById('task-modal');
    taskModalTitle = document.getElementById('task-modal-title');
    closeTaskModalButton = document.getElementById('close-task-modal');
    cancelTaskModalButton = document.getElementById('cancel-task-modal');
    saveTaskButton = document.getElementById('save-task-button');
    taskForm = document.getElementById('task-form');
    taskIdInput = document.getElementById('task-id');
    taskProjectNameSelect = document.getElementById('task-project-name');
    taskStatusSelect = document.getElementById('task-status');
    taskPrioritySelect = document.getElementById('task-priority');
    taskPriorityError = document.getElementById('task-priority-error');
    taskNameInput = document.getElementById('task-name');
    taskDescriptionInput = document.getElementById('task-description');
    taskStartDateInput = document.getElementById('task-start-date');
    taskEndDateInput = document.getElementById('task-end-date');
    taskProjectNameError = document.getElementById('task-project-name-error');
    taskStatusError = document.getElementById('task-status-error');
    taskNameError = document.getElementById('task-name-error');
    taskStartDateError = document.getElementById('task-start-date-error');
    taskEndDateError = document.getElementById('task-end-date-error');
    costModal = document.getElementById('cost-modal');
    costModalTitle = document.getElementById('cost-modal-title');
    closeCostModalButton = document.getElementById('close-cost-modal');
    cancelCostModalButton = document.getElementById('cancel-cost-modal');
    saveCostButton = document.getElementById('save-cost-button');
    costForm = document.getElementById('cost-form');
    costIdInput = document.getElementById('cost-id');
    costProjectNameInput = document.getElementById('cost-project-name');
    costBudgetInput = document.getElementById('cost-budget');
    costActualInput = document.getElementById('cost-actual');
    costBudgetError = document.getElementById('cost-budget-error');
    costActualError = document.getElementById('cost-actual-error');
    confirmationModal = document.getElementById('confirmation-modal');
    confirmationModalTitle = document.getElementById('confirmation-modal-title');
    confirmationModalBody = document.getElementById('confirmation-modal-body');
    closeConfirmationModalButton = document.getElementById('close-confirmation-modal');
    cancelConfirmationModalButton = document.getElementById('cancel-confirmation-modal');
    confirmConfirmationButton = document.getElementById('confirm-confirmation-button');
    spotTradingTab = document.getElementById('tab-spot-trading');
    addSpotTradeButton = document.getElementById('add-spot-trade-button');
    spotTradesTableBody = document.getElementById('spot-trades-table-body');
    spotTradeModal = document.getElementById('spot-trade-modal');
    spotTradeModalTitle = document.getElementById('spot-trade-modal-title');
    closeSpotTradeModalButton = document.getElementById('close-spot-trade-modal');
    cancelSpotTradeModalButton = document.getElementById('cancel-spot-trade-modal');
    saveSpotTradeButton = document.getElementById('save-spot-trade-button');
    spotTradeForm = document.getElementById('spot-trade-form');
    spotTradeIdInput = document.getElementById('spot-trade-id');
    tradeDateInput = document.getElementById('trade-date');
    tradeTypeSelect = document.getElementById('trade-type');
    baseAssetInput = document.getElementById('base-asset');
    quoteAssetInput = document.getElementById('quote-asset');
    priceInput = document.getElementById('price');
    quantityBaseInput = document.getElementById('quantity-base');
    totalQuoteInput = document.getElementById('total-quote');
    notesInput = document.getElementById('notes');
    spotTradeFeesInput = document.getElementById('spot-trade-fees');
    filterSpotAssetInput = document.getElementById('filter-spot-asset');
    filterSpotStartDateInput = document.getElementById('filter-spot-start-date');
    filterSpotEndDateInput = document.getElementById('filter-spot-end-date');
    applySpotFiltersBtn = document.getElementById('apply-spot-filters-btn');
    clearSpotFiltersBtn = document.getElementById('clear-spot-filters-btn');
    spotTargetCalculatorSection = document.getElementById('spot-target-calculator-section');
    calcBaseQuantity = document.getElementById('calc-base-quantity');
    calcBaseTotalCost = document.getElementById('calc-base-total-cost');
    calcTargetProfitUsdInput = document.getElementById('calc-target-profit-usd');
    calcEstimatedSellFeeInput = document.getElementById('calc-estimated-sell-fee');
    calcSellPriceNeeded = document.getElementById('calc-sell-price-needed');
    calcTotalSellValue = document.getElementById('calc-total-sell-value');
    futuresTradingTab = document.getElementById('tab-futures-trading');
    addFuturesTradeButton = document.getElementById('add-futures-trade-button');
    futuresTradesTableBody = document.getElementById('futures-trades-table-body');
    futuresTradeModal = document.getElementById('futures-trade-modal');
    futuresTradeModalTitle = document.getElementById('futures-trade-modal-title');
    closeFuturesTradeModalButton = document.getElementById('close-futures-trade-modal');
    cancelFuturesTradeModalButton = document.getElementById('cancel-futures-trade-modal');
    saveFuturesTradeButton = document.getElementById('save-futures-trade-button');
    closeFuturesTradeButton = document.getElementById('close-futures-trade-button');
    futuresTradeForm = document.getElementById('futures-trade-form');
    futuresTradeIdInput = document.getElementById('futures-trade-id');
    futuresSymbolInput = document.getElementById('futures-symbol');
    futuresDirectionSelect = document.getElementById('futures-direction');
    futuresLeverageInput = document.getElementById('futures-leverage');
    futuresEntryDateInput = document.getElementById('futures-entry-date');
    futuresQuantityInput = document.getElementById('futures-quantity');
    futuresEntryPriceInput = document.getElementById('futures-entry-price');
    futuresExitDateContainer = document.getElementById('futures-exit-date-container'); 
    futuresExitDateInput = document.getElementById('futures-exit-date');       
    futuresExitPriceContainer = document.getElementById('futures-exit-price-container');
    futuresExitPriceInput = document.getElementById('futures-exit-price');
    futuresNotesInput = document.getElementById('futures-notes');
    futuresEntryFeesInput = document.getElementById('futures-entry-fees');
    futuresExitFeesContainer = document.getElementById('futures-exit-fees-container');
    futuresExitFeesInput = document.getElementById('futures-exit-fees');
    futuresDurationContainer = document.getElementById('futures-duration-container'); 
    futuresDurationInput = document.getElementById('futures-duration');    
    futuresMarginContainer = document.getElementById('futures-margin-container');
    futuresMarginInput = document.getElementById('futures-margin');
    futuresRoiContainer = document.getElementById('futures-roi-container');
    futuresRoiInput = document.getElementById('futures-roi');  
    authScreen = document.getElementById('auth-screen');
    appContent = document.getElementById('app-content');
    loginFormContainer = document.getElementById('login-form-container');
    loginForm = document.getElementById('login-form');
    loginUsernameInput = document.getElementById('login-username');
    loginPasswordInput = document.getElementById('login-password');
    loginUsernameError = document.getElementById('login-username-error');
    loginPasswordError = document.getElementById('login-password-error');
    loginButton = document.getElementById('login-button');
    showRegisterFormButton = document.getElementById('show-register-form-button');
    registerFormContainer = document.getElementById('register-form-container');
    registerForm = document.getElementById('register-form');
    registerUsernameInput = document.getElementById('register-username');
    registerPasswordInput = document.getElementById('register-password');
    registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    registerUsernameError = document.getElementById('register-username-error');
    registerPasswordError = document.getElementById('register-password-error');
    registerConfirmPasswordError = document.getElementById('register-confirm-password-error');
    registerButton = document.getElementById('register-button');
    showLoginFormButton = document.querySelectorAll('#show-login-form-button'); // Es una NodeList
    logoutButton = document.getElementById('logout-button');

    console.log("--- [DOM_INIT] Elementos DOM inicializados ---");
};

/**
 * Devuelve un objeto con todas las referencias a los elementos DOM previamente inicializados.
 * DEBE LLAMARSE DESPUÉS de que initializeDomElements() haya sido ejecutada.
 * @returns {object} Un objeto con referencias a los elementos DOM.
 */
export const getDomElements = () => {
    if (!htmlElement) { // Una comprobación básica para ver si la inicialización ha ocurrido
        console.error("--- [DOM_ERROR] getDomElements: Acceso a elementos DOM antes de la inicialización completa! ---");
    }
     return {
        htmlElement, mainTitleEl, changeTitleButton, themeToggleButton, tabButtons, tabContents,
        footerYearSpan, toastContainer, totalProjectsEl, totalActualCostEl, cumulativeTasksEl,
        projectSummaryContainer, overviewChartCanvas, chartNoDataEl, chartTitleEl, chartTypeSelect,
        projectsOverviewDashboard, cryptoOverviewDashboard, cryptoTotalPnl, cryptoWinRate,
        cryptoTotalTrades, cryptoWinLossRatio, cryptoOverviewChartCanvas, cryptoChartNoData,
        cryptoPanelTab, cryptoPanelContent, cryptoWatchlistContainer, addCoinModal,
        closeAddCoinModalButton, cancelAddCoinModalButton, searchCoinInput, coinSearchResultsContainer,
        projectDetailsTable, projectDetailsTableBody, addTaskButton, searchProjectTasksInput,
        projectDetailsSortHeaders, projectCostTable, projectCostTableBody, searchProjectCostsInput,
        projectCostSortHeaders, monthlyIncomeInput, totalFixedExpensesEl, netMonthlyAmountEl,
        addExpenseForm, addExpenseButton, expenseNameInput, expenseAmountInput, expenseNameError,
        expenseAmountError, fixedExpensesTable, fixedExpensesTableBody, searchFixedExpensesInput,
        fixedExpensesSortHeaders, statusListEl, newStatusInput, addStatusButton, newStatusError,
        projectNameListEl, newProjectNameInput, addProjectNameButton, newProjectNameError,
        resetDataButton, exportDataButton, importDataButton, importFileInput, appModeSelector,
        modeProjectsRadio, modeCryptoRadio, setupStatusListContainer, setupProjectNameListContainer,
        taskModal, taskModalTitle, closeTaskModalButton, cancelTaskModalButton, saveTaskButton,
        taskForm, taskIdInput, taskProjectNameSelect, taskStatusSelect, taskPrioritySelect,
        taskPriorityError, taskNameInput, taskDescriptionInput, taskStartDateInput, taskEndDateInput,
        taskProjectNameError, taskStatusError, taskNameError, taskStartDateError, taskEndDateError,
        costModal, costModalTitle, closeCostModalButton, cancelCostModalButton, saveCostButton,
        costForm, costIdInput, costProjectNameInput, costBudgetInput, costActualInput,
        costBudgetError, costActualError, confirmationModal, confirmationModalTitle,
        confirmationModalBody, closeConfirmationModalButton, cancelConfirmationModalButton,
        confirmConfirmationButton, spotTradingTab, addSpotTradeButton, spotTradesTableBody,
        spotTradeModal, spotTradeModalTitle, closeSpotTradeModalButton, cancelSpotTradeModalButton,
        saveSpotTradeButton, spotTradeForm, spotTradeIdInput, tradeDateInput, tradeTypeSelect,
        baseAssetInput, quoteAssetInput, priceInput, quantityBaseInput, totalQuoteInput,
        notesInput, spotTradeFeesInput, filterSpotAssetInput, filterSpotStartDateInput,
        filterSpotEndDateInput, applySpotFiltersBtn, clearSpotFiltersBtn, 
        spotTargetCalculatorSection, calcBaseQuantity, calcBaseTotalCost, 
        calcTargetProfitUsdInput, calcEstimatedSellFeeInput, calcSellPriceNeeded, calcTotalSellValue,
        futuresTradingTab, addFuturesTradeButton, futuresTradesTableBody, futuresTradeModal, 
        futuresTradeModalTitle, closeFuturesTradeModalButton, cancelFuturesTradeModalButton, 
        saveFuturesTradeButton, closeFuturesTradeButton, futuresTradeForm, futuresTradeIdInput, 
        futuresSymbolInput, futuresDirectionSelect, futuresLeverageInput, futuresEntryDateInput, 
        futuresQuantityInput, futuresEntryPriceInput, futuresExitDateContainer, 
        futuresExitDateInput, futuresExitPriceContainer, futuresExitPriceInput, futuresNotesInput,
        futuresEntryFeesInput, futuresExitFeesContainer, futuresExitFeesInput, 
        authScreen, appContent, loginFormContainer, loginForm, loginUsernameInput, 
        loginPasswordInput, loginUsernameError, loginPasswordError, loginButton, 
        showRegisterFormButton, registerFormContainer, registerForm, registerUsernameInput, 
        registerPasswordInput, registerConfirmPasswordInput, registerUsernameError, 
        registerPasswordError, registerConfirmPasswordError, registerButton, 
        showLoginFormButton, logoutButton,

        // === CORRECCIÓN AQUÍ ===
        // Se añaden los nuevos elementos de futuros al objeto de retorno
        futuresDurationContainer, futuresDurationInput,
        futuresMarginContainer, futuresMarginInput,
        futuresRoiContainer, futuresRoiInput
    };
};