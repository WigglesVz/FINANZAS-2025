// src/js/config.js
export const APP_PREFIX = 'projectTracker_vFin_Optimized_';
export const THEME_PREFERENCE_KEY = `${APP_PREFIX}themePreference`;
export const MAIN_TITLE_KEY = `${APP_PREFIX}mainTitle`; // Clave para appConfig en Dexie

// Claves de localStorage (histórico/referencia, no para lógica principal con Dexie)
// export const STATUS_LIST_KEY = `${APP_PREFIX}statusList`;
// export const PROJECT_NAME_LIST_KEY = `${APP_PREFIX}projectNameList`;
// export const PROJECT_DETAILS_KEY = `${APP_PREFIX}projectDetails`;
// export const PROJECT_COSTS_KEY = `${APP_PREFIX}projectCosts`;
// export const MONTHLY_INCOME_KEY = `${APP_PREFIX}monthlyIncome`;
// export const FIXED_EXPENSES_KEY = `${APP_PREFIX}fixedExpenses`;

// Default Project Data
export const DEFAULT_STATUS_LIST = [
    { id: 'status-ni', name: 'No Iniciado', color: '#D1D5DB' }, // Gris claro (Tailwind gray-300)
    { id: 'status-ep', name: 'En Progreso', color: '#F59E0B' }, // Ámbar (Tailwind amber-500)
    { id: 'status-c', name: 'Completado', color: '#10B981' },  // Esmeralda (Tailwind emerald-500)
    { id: 'status-b', name: 'Bloqueado', color: '#EF4444' }   // Rojo (Tailwind red-500)
];

export const DEFAULT_PROJECT_NAME_LIST = [
     { id: 'proj-wr', name: 'Website Redesign' },
     { id: 'proj-mad', name: 'Mobile App Dev' },
     { id: 'proj-mc', name: 'Marketing Campaign' }
 ];

// Default Priority List for Tasks
export const DEFAULT_TASK_PRIORITIES = [
    'Baja',
    'Media',
    'Alta'
];

// Valor de prioridad por defecto, derivado de la lista anterior
export const DEFAULT_PRIORITY_VALUE = DEFAULT_TASK_PRIORITIES.length > 0 ? DEFAULT_TASK_PRIORITIES[0] : 'Baja';

// Datos de ejemplo para projectDetails, asegurando que incluyan la prioridad
export const DEFAULT_PROJECT_DETAILS = [
    { id: 't1', projectName: 'Website Redesign', task: 'Wireframing Homepage', description: 'Create low-fidelity wireframes.', startDate: '2024-01-10', endDate: '2024-01-15', status: 'Completado', priority: 'Alta' },
    { id: 't2', projectName: 'Website Redesign', task: 'Develop Frontend', description: 'Implement using Tailwind & JS.', startDate: '2024-01-16', endDate: '2024-02-10', status: 'En Progreso', priority: 'Media' },
    { id: 't3', projectName: 'Mobile App Dev', task: 'Market Research', description: 'Analyze competitor apps.', startDate: '2024-01-05', endDate: '2024-01-20', status: 'Completado', priority: 'Alta' },
    { id: 't4', projectName: 'Marketing Campaign', task: 'Setup Database', description: 'Configure PostgreSQL database.', startDate: '2024-01-02', endDate: '2024-01-08', status: 'Completado', priority: 'Media' },
    { id: 't5', projectName: 'Mobile App Dev', task: 'Define API Specs', description: 'Document required API endpoints.', startDate: '2024-01-21', endDate: '2024-01-30', status: 'En Progreso', priority: 'Baja' },
    { id: 't6', projectName: 'Website Redesign', task: 'User Testing', description: 'Conduct usability tests.', startDate: '2024-02-11', endDate: '2024-02-18', status: 'No Iniciado', priority: 'Media' },
    { id: 't7', projectName: 'Website Redesign', task: 'Past Due Task Example', description: 'This task should be overdue.', startDate: '2023-12-01', endDate: '2023-12-10', status: 'En Progreso', priority: 'Alta' },
];

export const DEFAULT_PROJECT_COSTS = [
    { id: 'pc1', projectName: 'Website Redesign', budget: 25000, actualCost: 18500 },
    { id: 'pc2', projectName: 'Mobile App Dev', budget: 40000, actualCost: 42000 },
    { id: 'pc3', projectName: 'Marketing Campaign', budget: 15000, actualCost: 14000 },
];

// Default Finance Data
export const DEFAULT_MONTHLY_INCOME = 3500;

export const DEFAULT_FIXED_EXPENSES = [
    { id: 'fe1', name: 'Alquiler/Hipoteca', amount: 1250.50 },
    { id: 'fe2', name: 'Internet y Cable', amount: 85.00 },
    { id: 'fe3', name: 'Teléfono Móvil', amount: 55.20 },
    { id: 'fe4', name: 'Suscripción Gimnasio', amount: 40.00 },
];

export const SORT_STATE_DEFAULTS = {
    projectDetails: { key: 'projectName', direction: 'asc' }, // El orden por defecto real se maneja en state.js
    projectCosts: { key: 'projectName', direction: 'asc' },
    fixedExpenses: { key: 'name', direction: 'asc' }
};

// Claves para localStorage (solo para tema y estado de autenticación)
export const USER_CREDENTIALS_PREFIX_KEY = `${APP_PREFIX}user_`;
export const AUTH_STATUS_KEY = `${APP_PREFIX}authStatus`;