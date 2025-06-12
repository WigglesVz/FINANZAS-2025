// src/js/utils.js

import { htmlElement, toastContainer } from './domElements.js';

export const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};
// --- INICIO MODIFICACIÓN ---
/**
 * Formatea precios de criptomonedas, mostrando más decimales para valores bajos.
 * @param {number} amount - El precio a formatear.
 * @returns {string} El precio formateado como una cadena de texto.
 */
export const formatCryptoPrice = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';

    // Si el precio es 1 dólar o más, usar 2 decimales.
    if (amount >= 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    // Si el precio es menor a 1 dólar, usar hasta 8 decimales.
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }).format(amount);
};
export const generateId = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Determina un color de texto contrastante (blanco o negro) para un color de fondo dado.
 * @param {string} backgroundColor - El color de fondo en formato hexadecimal (ej. "#RRGGBB").
 * @returns {string} "#FFFFFF" (blanco) o "#000000" (negro).
 */
export const getContrastingTextColor = (backgroundColor) => {
    if (!backgroundColor || typeof backgroundColor !== 'string') return '#000000';

    const hexToRgb = (hex) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return '#000000';

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Devuelve un objeto con backgroundColor y textColor para los badges de estado.
// Usa el color personalizado del estado si está disponible.
export const getStatusStyle = (statusName, statusListFromState = []) => {
    const defaultStyle = { backgroundColor: '#E5E7EB', textColor: getContrastingTextColor('#E5E7EB') }; // Gris claro por defecto
    if (!statusName || !Array.isArray(statusListFromState)) return defaultStyle;

    const statusObj = statusListFromState.find(s => s.name === statusName);

    if (statusObj && statusObj.color) {
        return {
            backgroundColor: statusObj.color,
            textColor: getContrastingTextColor(statusObj.color)
        };
    }
    // Fallbacks si el estado no se encuentra en la lista o no tiene color personalizado
    const lowerStatus = statusName.toLowerCase();
    // Estos colores de fallback deberían ser consistentes con los defaults en config.js si es posible
    if (lowerStatus === 'completado') return { backgroundColor: '#10B981', textColor: getContrastingTextColor('#10B981') };
    if (lowerStatus === 'en progreso') return { backgroundColor: '#F59E0B', textColor: getContrastingTextColor('#F59E0B') };
    if (lowerStatus === 'bloqueado') return { backgroundColor: '#EF4444', textColor: getContrastingTextColor('#EF4444') };
    if (lowerStatus === 'no iniciado') return { backgroundColor: '#D1D5DB', textColor: getContrastingTextColor('#D1D5DB') };

    return defaultStyle;
};


export const getCurrentDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

export const sanitizeHTML = (str) => {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

export const setValidationError = (errorElement, message) => {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        errorElement.setAttribute('aria-live', 'assertive');
    } else {
        // <--- NUEVO LOG ---
        console.warn("setValidationError: Se intentó mostrar un error, pero errorElement es null. Mensaje:", message);
        // --- FIN NUEVO LOG ---
    }
};

 export const clearValidationError = (errorElement) => {
     if (errorElement) {
         errorElement.textContent = '';
         errorElement.classList.add('hidden');
         errorElement.removeAttribute('aria-live');
     }
 };

 export const clearAllValidationErrors = (formElement) => {
     if (formElement && typeof formElement.querySelectorAll === 'function') {
        formElement.querySelectorAll('.error-message').forEach(el => clearValidationError(el));
     }
 };

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
        if (toast.parentNode === toastContainer) {
            toast.remove();
        }
    }, 3000);
};

export const sortArray = (data, key, direction) => {
    if (!Array.isArray(data)) return [];
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
 * Actualiza los iconos de ordenación en un contenedor de botones.
 * @param {HTMLElement} sortButtonsContainer - El div que contiene los botones sortable-header.
 * @param {string} sortedKey - La clave por la que se está ordenando actualmente.
 * @param {string} direction - La dirección de ordenación ('asc' o 'desc').
 */
export const updateSortIcons = (sortButtonsContainer, sortedKey, direction) => {
    if (!sortButtonsContainer || typeof sortButtonsContainer.querySelectorAll !== 'function') {
        console.warn('updateSortIcons: Contenedor de botones de ordenación no válido.', sortButtonsContainer);
        return;
    }

    sortButtonsContainer.querySelectorAll('.sortable-header').forEach(button => {
        const buttonKey = button.dataset.sortKey;
        const icon = button.querySelector('i');

        // Limpiar clases de estado anterior y aria-sort
        button.classList.remove('sorted');
        button.setAttribute('aria-sort', 'none');

        if (icon) {
            icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
            if (buttonKey === sortedKey) {
                // Si este botón es el que se está ordenando
                icon.classList.add(direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                button.classList.add('sorted');
                button.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
            } else {
                // Si este botón no es el que se está ordenando
                icon.classList.add('fa-sort');
            }
        }
    });
};

export const setButtonLoadingState = (button, isLoading, loadingText = 'Procesando...', loadingIconClass = 'fas fa-spinner fa-spin') => {
    if (!button) return;
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

// Modificada para que `status` sea un objeto derivado de statusListFromState
export const getCurrentChartColors = (statusListFromState = []) => {
    if (!htmlElement) {
        console.warn("htmlElement not found, defaulting to light theme colors for charts.");
        return {
            text: '#374151', grid: '#e5e7eb', border: '#ffffff',
            status: { noIniciado: '#9ca3af', enProgreso: '#facc15', completado: '#22c55e', bloqueado: '#ef4444', default: '#60a5fa', sds: '#3b82f6' }, // Añadido sds
            projectTasks: '#6366f1', budget: '#60a5fa', actualCost: '#34d399'
        };
    }
    const isDark = htmlElement.classList.contains('dark');
    const themeColors = isDark ? {
        text: '#d1d5db', grid: '#4b5563', border: '#374151',
        projectTasks: '#818cf8', budget: '#93c5fd', actualCost: '#6ee7b7'
    } : {
        text: '#374151', grid: '#e5e7eb', border: '#ffffff',
        projectTasks: '#6366f1', budget: '#60a5fa', actualCost: '#34d399'
    };

    const dynamicStatusColors = {};
    if(Array.isArray(statusListFromState)) {
        statusListFromState.forEach(status => {
            const key = status.name.toLowerCase().replace(/\s+/g, ''); // Normalizar nombre de estado para la clave
            dynamicStatusColors[key] = status.color || (isDark ? '#818cf8' : '#60a5fa'); // Usar color del estado o un default del tema
        });
    }
    // Asegurar un color 'default' si no se encuentra uno específico.
    dynamicStatusColors.default = dynamicStatusColors.default || (isDark ? '#818cf8' : '#60a5fa');

    return {
        ...themeColors,
        status: dynamicStatusColors // Este objeto 'status' será usado por charts.js
    };
};

/* --- NUEVAS FUNCIONES DE UTILIDAD --- */

/**
 * Retrasa la ejecución de una función hasta que haya pasado un cierto tiempo sin que se vuelva a llamar.
 * Útil para eventos como 'input' o 'resize'.
 * @param {function} func - La función a ejecutar.
 * @param {number} delay - El tiempo de espera en milisegundos.
 * @returns {function} Una función 'debounced'.
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

/**
 * Formatea una cadena de fecha (YYYY-MM-DD) a un formato de fecha relativa o amigable.
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string} La fecha formateada (ej. "hace 3 días", "mañana", "15 de enero de 2024").
 */
export const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Añadir T00:00:00 para evitar problemas de zona horaria

    // Si la fecha no es válida, retorna la cadena original
    if (isNaN(date.getTime())) {
        return dateString;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const targetDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = targetDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Hoy';
    } else if (diffDays === 1) {
        return 'Mañana';
    } else if (diffDays === -1) {
        return 'Ayer';
    } else if (diffDays > 1 && diffDays <= 7) {
        return `En ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    } else if (diffDays < -1 && diffDays >= -7) {
        return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else {
        // Formato de fecha más tradicional para fechas más lejanas
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }
};

/**
 * Valida si una cadena de texto es un código de color hexadecimal válido (ej. #RRGGBB o #RGB).
 * @param {string} colorString - La cadena a validar.
 * @returns {boolean} True si es un color hex válido, false en caso contrario.
 */
export const isHexColor = (colorString) => {
    if (typeof colorString !== 'string') return false;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(colorString);
};

/**
 * Realiza una validación genérica de un formulario basada en reglas definidas.
 * Los mensajes de error se muestran u ocultan automáticamente.
 * @param {HTMLElement} formElement - El elemento contenedor de los campos (puede ser un form o un div).
 * @param {Array<Object>} validationRules - Un array de objetos que definen las reglas para cada campo.
 * @returns {boolean} True si el formulario es válido, false en caso contrario.
 */
export const validateForm = (formElement, validationRules) => {
    if (!formElement || !validationRules || !Array.isArray(validationRules)) {
        console.error("--- [VALIDATION_FORM_ERROR] validateForm: formElement o validationRules no son válidos. ---");
        return false;
    }
    console.log("--- [VALIDATION_FORM] Iniciando validación para formElement:", formElement);

    let formIsValid = true;
    clearAllValidationErrors(formElement);

    validationRules.forEach(rule => {
        console.log(`--- [VALIDATION_FORM] Procesando regla para campo ID: ${rule.field}`);
        const inputElement = formElement.querySelector(`#${rule.field}`);
        const errorElement = formElement.querySelector(`#${rule.errorElementId}`);

        // <--- INICIO LOG DE VERIFICACIÓN DE ELEMENTOS ---
        if (!inputElement) console.warn(`--- [VALIDATION_FORM_WARN] validateForm: NO SE ENCONTRÓ inputElement para rule.field: ${rule.field} (ID esperado: #${rule.field}) dentro de formElement:`, formElement);
        if (!errorElement) console.warn(`--- [VALIDATION_FORM_WARN] validateForm: NO SE ENCONTRÓ errorElement para rule.errorElementId: ${rule.errorElementId} (ID esperado: #${rule.errorElementId}) dentro de formElement:`, formElement);
        // <--- FIN LOG DE VERIFICACIÓN DE ELEMENTOS ---

        if (!inputElement) { // Si el input no se encuentra, la regla no se puede aplicar, considerar inválido.
            console.error(`--- [VALIDATION_FORM_ERROR] validateForm: Input con ID '${rule.field}' NO ENCONTRADO. Se considera el formulario inválido.`);
            formIsValid = false;
            return; // Salir de esta iteración de la regla
        }
        if (!errorElement) { // Si el elemento de error no se encuentra, no se puede mostrar el error, pero la validación del input puede continuar.
            console.warn(`--- [VALIDATION_FORM_WARN] validateForm: Elemento de error con ID '${rule.errorElementId}' NO ENCONTRADO. Los errores para '${rule.field}' no serán visibles.`);
            // No establecemos formIsValid a false aquí, porque el campo en sí podría ser válido.
            // El problema es solo la visualización del error.
        }


        const inputValue = inputElement.value.trim();
        // <--- INICIO LOG DE VALOR DE INPUT ---
        console.log(`--- [VALIDATION_FORM_FIELD] Campo '${rule.field}', valor (trimmed): '${inputValue}'`);
        // <--- FIN LOG DE VALOR DE INPUT ---

        for (const check of rule.checks) {
            let isValidCheck = true;
            console.log(`--- [VALIDATION_FORM_CHECK] Campo '${rule.field}', aplicando check tipo: '${check.type}'`);

            switch (check.type) {
                case 'required':
                    isValidCheck = inputValue !== '';
                    // <--- INICIO LOG DE VALIDACIÓN REQUIRED ---
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'required', valor: '${inputValue}', esValido: ${isValidCheck}`);
                    // <--- FIN LOG DE VALIDACIÓN REQUIRED ---
                    break;
                case 'minlength':
                    isValidCheck = inputValue.length >= check.value;
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'minlength (${check.value})', valor: '${inputValue}', esValido: ${isValidCheck}`);
                    break;
                case 'maxlength':
                    isValidCheck = inputValue.length <= check.value;
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'maxlength (${check.value})', valor: '${inputValue}', esValido: ${isValidCheck}`);
                    break;
                case 'min':
                    const numValueMin = parseFloat(inputValue);
                    isValidCheck = !isNaN(numValueMin) && numValueMin >= check.value;
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'min (${check.value})', valor: '${inputValue}', numParsed: ${numValueMin}, esValido: ${isValidCheck}`);
                    break;
                case 'max':
                    const numValueMax = parseFloat(inputValue);
                    isValidCheck = !isNaN(numValueMax) && numValueMax <= check.value;
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'max (${check.value})', valor: '${inputValue}', numParsed: ${numValueMax}, esValido: ${isValidCheck}`);
                    break;
                case 'pattern':
                    isValidCheck = check.value.test(inputValue);
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'pattern', valor: '${inputValue}', esValido: ${isValidCheck}`);
                    break;
                case 'custom':
                    isValidCheck = check.validate(inputValue, formElement);
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'custom', valor: '${inputValue}', esValido: ${isValidCheck}`);
                    break;
                case 'selectRequired':
                    isValidCheck = inputElement.value !== '';
                    console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'selectRequired', valor: '${inputElement.value}', esValido: ${isValidCheck}`);
                    break;
                case 'dateComparison':
                    const compareToElement = formElement.querySelector(`#${check.compareTo}`);
                    if (compareToElement) {
                        const date1 = new Date(inputValue);
                        const date2 = new Date(compareToElement.value);
                        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
                            isValidCheck = false;
                            console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'dateComparison', una o ambas fechas no válidas.`);
                            break;
                        }
                        switch (check.operator) {
                            case 'lessThan': isValidCheck = date1 < date2; break;
                            case 'greaterThan': isValidCheck = date1 > date2; break;
                            case 'lessThanOrEqualTo': isValidCheck = date1 <= date2; break;
                            case 'greaterThanOrEqualTo': isValidCheck = date1 >= date2; break;
                            default: console.warn(`validateForm: Operador de comparación de fecha desconocido: ${check.operator}`); isValidCheck = true;
                        }
                        console.log(`--- [VALIDATION_FORM_CHECK_RESULT] Campo '${rule.field}', check 'dateComparison (${check.operator} ${check.compareTo})', date1: ${date1}, date2: ${date2}, esValido: ${isValidCheck}`);
                    } else {
                        console.warn(`validateForm: Elemento para comparar fecha (${check.compareTo}) no encontrado.`);
                        isValidCheck = true;
                    }
                    break;
                default:
                    console.warn(`validateForm: Tipo de verificación desconocido: ${check.type}`);
                    isValidCheck = true;
            }

            if (!isValidCheck) {
                console.log(`--- [VALIDATION_FORM_FAILURE] Campo '${rule.field}' falló la validación '${check.type}'. Mostrando error: "${check.message}"`);
                // Solo intentar mostrar el error si errorElement fue encontrado
                if (errorElement) {
                    setValidationError(errorElement, check.message);
                }
                formIsValid = false; // Si CUALQUIER check de CUALQUIER regla falla, el formulario entero es inválido.
                // No necesitamos 'break' aquí el bucle exterior (forEach rule), 
                // porque queremos evaluar todas las reglas para mostrar todos los errores posibles.
                // Pero sí rompemos el bucle interior (for check of rule.checks) para no aplicar más checks a un campo que ya falló.
                break;
            }
        }
    });

    // <--- INICIO LOG DE RESULTADO FINAL DE VALIDACIÓN ---
    console.log(`--- [VALIDATION_FORM_END] Resultado final de validación del formElement: ${formIsValid}`, formElement);
    // <--- FIN LOG DE RESULTADO FINAL DE VALIDACIÓN ---
    return formIsValid;
};
