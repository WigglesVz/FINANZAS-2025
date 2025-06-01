// src/js/utils.js

import { htmlElement, toastContainer } from './domElements.js';
// import { appState } from './state.js'; // ELIMINADO: appState ya no se importa directamente

/**
 * Formats a number as currency (USD).
 * @param {number} amount - The number to format.
 * @returns {string} Formatted currency string (e.g., $1,234.56).
 */
export const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Generates a simple unique ID.
 * @returns {string} A unique ID string.
 */
export const generateId = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Gets Tailwind CSS classes for a given task status.
 * @param {string} status - The task status string.
 * @returns {string} Tailwind classes for background and text color.
 */
export const getStatusColor = (status) => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus === 'completado') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (lowerStatus === 'en progreso') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (lowerStatus === 'bloqueado') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (lowerStatus === 'no iniciado') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; // Default
};

/**
 * Gets the current date in YYYY-MM-DD format.
 * @returns {string} The current date string.
 */
export const getCurrentDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

/**
* Sanitizes HTML string to prevent XSS.
* @param {string} str - The string to sanitize.
* @returns {string} The sanitized string.
*/
export const sanitizeHTML = (str) => {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

/**
 * Sets a validation error message for a given input.
 * @param {HTMLElement} errorElement - The span element to display the error.
 * @param {string} message - The error message.
 */
export const setValidationError = (errorElement, message) => {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        errorElement.setAttribute('aria-live', 'assertive');
    }
};

/**
 * Clears a validation error message.
 * @param {HTMLElement} errorElement - The span element displaying the error.
 */
 export const clearValidationError = (errorElement) => {
     if (errorElement) {
         errorElement.textContent = '';
         errorElement.classList.add('hidden');
         errorElement.removeAttribute('aria-live');
     }
 };

 /**
 * Clears all validation error messages in a form.
 * @param {HTMLElement} formElement - The form element.
 */
 export const clearAllValidationErrors = (formElement) => {
     if (formElement && typeof formElement.querySelectorAll === 'function') {
        formElement.querySelectorAll('.error-message').forEach(el => clearValidationError(el));
     }
 };

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} type - The type of toast (controls color). Defaults to 'success'.
 */
export const showToast = (message, type = 'success') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    let bgColorClass = 'bg-green-600';
    let iconClass = 'fas fa-check-circle';
    if (type === 'error') {
        bgColorClass = 'bg-red-600';
        iconClass = 'fas fa-exclamation-circle';
    } else if (type === 'info') {
        bgColorClass = 'bg-blue-600';
        iconClass = 'fas fa-info-circle';
    }
    toast.className = `${bgColorClass} text-white px-4 py-3 rounded-lg shadow-md text-sm animate-fade flex items-center justify-between`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
        <span><i class="${iconClass} mr-2" aria-hidden="true"></i>${sanitizeHTML(message)}</span>
        <button class="ml-4 text-white hover:text-gray-200 text-lg leading-none" aria-label="Cerrar notificación">×</button>
    `;

    const closeButton = toast.querySelector('button');
    if (closeButton) {
         closeButton.addEventListener('click', () => toast.remove(), { once: true });
    }
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode === toastContainer) { // Verificar si el toast sigue siendo hijo
            toast.remove();
        }
    }, 3000);
};

/**
 * Sorts an array of objects by a key and direction.
 * @param {Array<Object>} data - The array to sort.
 * @param {string} key - The key to sort by.
 * @param {'asc' | 'desc'} direction - The sort direction.
 * @returns {Array<Object>} The sorted array.
 */
export const sortArray = (data, key, direction) => {
    if (!Array.isArray(data)) return []; // Devolver array vacío si data no es un array
    return [...data].sort((a, b) => {
        const valueA = a[key];
        const valueB = b[key];
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

 /**
 * Updates the sort icons and aria-sort attribute in a table header.
 * @param {HTMLElement} tableElement - The table element.
 * @param {string} sortedKey - The key that is currently sorted.
 * @param {'asc' | 'desc'} direction - The sort direction.
 */
 export const updateSortIcons = (tableElement, sortedKey, direction) => {
    if (!tableElement || typeof tableElement.querySelectorAll !== 'function') return;
     tableElement.querySelectorAll('.sortable-header').forEach(header => {
         const headerKey = header.dataset.sortKey;
         const icon = header.querySelector('i');
         header.classList.remove('sorted');
         header.setAttribute('aria-sort', 'none');
         if (icon) {
             icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
             if (headerKey === sortedKey) {
                 icon.classList.add(direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                 header.classList.add('sorted');
                 header.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
             } else {
                 icon.classList.add('fa-sort');
             }
         }
     });
 };

/**
 * Handles button loading state. Saves and restores original HTML.
 * @param {HTMLElement} button - The button element.
 * @param {boolean} isLoading - True to set loading state, false to restore.
 * @param {string} [loadingText='Procesando...'] - Text to display when loading.
 * @param {string} [loadingIconClass='fas fa-spinner fa-spin'] - Icon class for loading.
 */
export const setButtonLoadingState = (button, isLoading, loadingText = 'Procesando...', loadingIconClass = 'fas fa-spinner fa-spin') => {
    if (!button) return; // Protección
    if (isLoading) {
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        button.innerHTML = `<i class="${loadingIconClass}" aria-hidden="true"></i> ${sanitizeHTML(loadingText)}`;
        button.disabled = true;
    } else {
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
            delete button.dataset.originalHtml;
        }
        button.disabled = false;
    }
};

// Colores para gráficos
export const chartColors = {
    light: {
        text: '#374151', 
        grid: '#e5e7eb', 
        border: '#ffffff', 
        status: {
            noIniciado: '#9ca3af',
            enProgreso: '#facc15',
            completado: '#22c55e',
            bloqueado: '#ef4444',
            sds: '#3b82f6', // Añadido para el estado 'sds' si es un estado válido
            default: '#60a5fa', 
        },
        projectTasks: '#6366f1', 
        budget: '#60a5fa',       
        actualCost: '#34d399'    
    },
    dark: {
        text: '#d1d5db', 
        grid: '#4b5563', 
        border: '#374151', 
        status: {
            noIniciado: '#6b7280',
            enProgreso: '#f59e0b',
            completado: '#10b981',
            bloqueado: '#f87171',
            sds: '#818cf8', // Añadido para el estado 'sds'
            default: '#818cf8', 
        },
        projectTasks: '#818cf8', 
        budget: '#93c5fd',       
        actualCost: '#6ee7b7'    
    }
};

// Función para obtener los colores del gráfico según el tema actual
export const getCurrentChartColors = () => {
    if (!htmlElement) { 
        console.warn("htmlElement not found, defaulting to light theme colors for charts.");
        return chartColors.light;
    }
    return htmlElement.classList.contains('dark') ? chartColors.dark : chartColors.light;
};