// src/js/utils.js
import { getDomElements } from './domElements.js'; 
import { DEFAULT_TASK_PRIORITIES } from './config.js';

export const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const formatCryptoPrice = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    if (amount >= 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }).format(amount);
};

export const generateId = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

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
    const sRGBtoLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const luminance = (0.2126 * sRGBtoLinear(rgb.r / 255) + 0.7152 * sRGBtoLinear(rgb.g / 255) + 0.0722 * sRGBtoLinear(rgb.b / 255));
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const getStatusStyle = (statusName, statusListFromState = []) => {
    const dom = getDomElements();
    const isDark = dom.htmlElement ? dom.htmlElement.classList.contains('dark') : false;
    const defaultBgColor = isDark ? '#374151' : '#E5E7EB';
    const defaultTextColor = getContrastingTextColor(defaultBgColor);
    const defaultStyle = { backgroundColor: defaultBgColor, textColor: defaultTextColor };

    if (!statusName || !Array.isArray(statusListFromState)) return defaultStyle;
    const statusObj = statusListFromState.find(s => s.name === statusName);

    if (statusObj && statusObj.color && isHexColor(statusObj.color)) {
        return {
            backgroundColor: statusObj.color,
            textColor: getContrastingTextColor(statusObj.color)
        };
    }
    const lowerStatus = statusName.toLowerCase();
    if (lowerStatus === 'completado') return { backgroundColor: isDark ? '#047857' : '#10B981', textColor: getContrastingTextColor(isDark ? '#047857' : '#10B981') };
    if (lowerStatus === 'en progreso') return { backgroundColor: isDark ? '#b45309' : '#F59E0B', textColor: getContrastingTextColor(isDark ? '#b45309' : '#F59E0B') };
    if (lowerStatus === 'bloqueado') return { backgroundColor: isDark ? '#991b1b' : '#EF4444', textColor: getContrastingTextColor(isDark ? '#991b1b' : '#EF4444') };
    if (lowerStatus === 'no iniciado') return { backgroundColor: isDark ? '#4b5563' : '#D1D5DB', textColor: getContrastingTextColor(isDark ? '#4b5563' : '#D1D5DB') };

    return defaultStyle;
};

export const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const sanitizeHTML = (str) => {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const temp = document.createElement('div');
    temp.textContent = s;
    return temp.innerHTML;
};

export const setValidationError = (errorElement, message) => {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        errorElement.setAttribute('aria-live', 'assertive');
    } else {
        console.warn("setValidationError: errorElement no encontrado. Mensaje:", message);
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

export const showToast = (message, type = 'success', duration = 3000) => {
    const dom = getDomElements();
    if (!dom.toastContainer) {
        console.warn("Toast container not found. Message:", message);
        return;
    }
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
    const textColorClass = 'text-white';

    toast.className = `${bgColorClass} ${textColorClass} px-4 py-3 rounded-lg shadow-md text-sm animate-fade flex items-center justify-between`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span><i class="${iconClass} mr-2" aria-hidden="true"></i>${sanitizeHTML(message)}</span>
        <button class="ml-4 text-current hover:text-gray-200 dark:hover:text-gray-400 text-lg leading-none" aria-label="Cerrar notificación">×</button>
    `;
    const closeButton = toast.querySelector('button');
    if (closeButton) {
        closeButton.addEventListener('click', () => toast.remove(), { once: true });
    }
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode === dom.toastContainer) {
            toast.remove();
        }
    }, duration);
};

export const sortArray = (data, key, direction) => {
    if (!Array.isArray(data) || !key) return data;
    return [...data].sort((a, b) => {
        const valueA = a[key];
        const valueB = b[key];
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return direction === 'asc' ? 1 : -1;
        if (valueB == null) return direction === 'asc' ? -1 : 1;
        if (key.toLowerCase().includes('date')) {
            const dateA = new Date(valueA);
            const dateB = new Date(valueB);
            const timeA = isNaN(dateA.getTime()) ? null : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? null : dateB.getTime();
            if (timeA === null && timeB === null) return 0;
            if (timeA === null) return direction === 'asc' ? 1 : -1;
            if (timeB === null) return direction === 'asc' ? -1 : 1;
            return direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const updateSortIcons = (sortButtonsContainer, sortedKey, direction) => {
    if (!sortButtonsContainer || typeof sortButtonsContainer.querySelectorAll !== 'function') {
        console.warn('updateSortIcons: Contenedor de botones de ordenación no válido.', sortButtonsContainer);
        return;
    }
    sortButtonsContainer.querySelectorAll('.sortable-header').forEach(button => {
        const buttonKey = button.dataset.sortKey;
        const icon = button.querySelector('i');
        button.classList.remove('sorted');
        button.setAttribute('aria-sort', 'none');
        if (icon) {
            icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
            if (buttonKey === sortedKey) {
                icon.classList.add(direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                button.classList.add('sorted');
                button.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
            } else {
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

export const getCurrentChartColors = (statusListFromState = []) => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("htmlElement not found, defaulting to light theme colors for charts.");
        return {
            text: '#374151', grid: '#e5e7eb', border: '#ffffff',
            status: { noiniciado: '#D1D5DB', enprogreso: '#F59E0B', completado: '#10B981', bloqueado: '#EF4444', default: '#60a5fa' },
            projectTasks: '#6366f1', budget: '#60a5fa', actualCost: '#34d399',
            profit: '#22c55e', loss: '#ef4444'
        };
    }
    const isDark = dom.htmlElement.classList.contains('dark');
    const themeColors = isDark ? {
        text: '#d1d5db', grid: '#4b5563', border: '#1f2937',
        projectTasks: '#818cf8', budget: '#93c5fd', actualCost: '#6ee7b7',
        profit: '#34d399', loss: '#f87171'
    } : {
        text: '#374151', grid: '#e5e7eb', border: '#ffffff',
        projectTasks: '#6366f1', budget: '#60a5fa', actualCost: '#34d399',
        profit: '#22c55e', loss: '#ef4444'
    };
    const dynamicStatusColors = {};
    if (Array.isArray(statusListFromState)) {
        statusListFromState.forEach(status => {
            const key = status.name.toLowerCase().replace(/\s+/g, '');
            dynamicStatusColors[key] = (status.color && isHexColor(status.color)) ? status.color : (isDark ? '#818cf8' : '#60a5fa');
        });
    }
    dynamicStatusColors.default = dynamicStatusColors.default || (isDark ? '#818cf8' : '#60a5fa');
    return { ...themeColors, status: dynamicStatusColors };
};

export const getPriorityStyle = (priorityName) => {
    const dom = getDomElements();
    if (!priorityName || typeof priorityName !== 'string') {
        return 'text-gray-500 dark:text-gray-400 italic';
    }
    const lowerPriority = priorityName.toLowerCase();
    const isDark = dom.htmlElement ? dom.htmlElement.classList.contains('dark') : false;

    switch (lowerPriority) {
        case DEFAULT_TASK_PRIORITIES[2].toLowerCase(): 
            return isDark ? 'text-red-400 font-semibold' : 'text-red-700 font-semibold';
        case DEFAULT_TASK_PRIORITIES[1].toLowerCase(): 
            return isDark ? 'text-blue-400 font-semibold' : 'text-blue-700 font-semibold';
        case DEFAULT_TASK_PRIORITIES[0].toLowerCase(): 
            return isDark ? 'text-green-400' : 'text-green-700';
        default:
            return 'text-gray-500 dark:text-gray-400 italic';
    }
};

export const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

export const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays < -1 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

export const isHexColor = (colorString) => {
    if (typeof colorString !== 'string') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorString);
};

export const validateForm = (formElement, validationRules) => {
    if (!formElement || !validationRules || !Array.isArray(validationRules)) {
        console.error("validateForm: formElement o validationRules no son válidos.");
        return false;
    }
    let formIsValid = true;
    clearAllValidationErrors(formElement);

    validationRules.forEach(rule => {
        const inputElement = formElement.querySelector(`#${rule.field}`);
        const errorElement = rule.errorElementId ? formElement.querySelector(`#${rule.errorElementId}`) : null;

        if (!inputElement) {
            console.error(`validateForm: Input con ID '${rule.field}' NO ENCONTRADO.`);
            formIsValid = false; 
            return; 
        }
        
        const inputValue = (inputElement.type === 'checkbox' || inputElement.type === 'radio') ? inputElement.checked : inputElement.value;
        const trimmedValue = typeof inputValue === 'string' ? inputValue.trim() : inputValue;

        for (const check of rule.checks) {
            let isValidCheck = true;
            switch (check.type) {
                case 'required':
                    isValidCheck = trimmedValue !== '' && trimmedValue !== null && typeof trimmedValue !== 'undefined';
                    break;
                case 'minlength':
                    isValidCheck = typeof trimmedValue === 'string' && trimmedValue.length >= check.value;
                    break;
                case 'maxlength':
                    isValidCheck = typeof trimmedValue === 'string' && trimmedValue.length <= check.value;
                    break;
                case 'min':
                    const numValueMin = parseFloat(trimmedValue);
                    isValidCheck = !isNaN(numValueMin) && numValueMin >= check.value;
                    break;
                case 'max':
                    const numValueMax = parseFloat(trimmedValue);
                    isValidCheck = !isNaN(numValueMax) && numValueMax <= check.value;
                    break;
                case 'pattern':
                    isValidCheck = typeof trimmedValue === 'string' && check.value.test(trimmedValue);
                    break;
                case 'custom':
                    isValidCheck = check.validate(trimmedValue, formElement);
                    break;
                case 'selectRequired':
                    isValidCheck = trimmedValue !== '' && trimmedValue !== null && typeof trimmedValue !== 'undefined';
                    break;
                case 'dateComparison':
                    const compareToElement = formElement.querySelector(`#${check.compareTo}`);
                    if (compareToElement) {
                        const date1 = new Date(trimmedValue + 'T00:00:00'); 
                        const date2 = new Date(compareToElement.value + 'T00:00:00');
                        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
                            isValidCheck = false; 
                        } else {
                            switch (check.operator) {
                                case 'lessThan': isValidCheck = date1 < date2; break;
                                case 'greaterThan': isValidCheck = date1 > date2; break;
                                case 'lessThanOrEqualTo': isValidCheck = date1 <= date2; break;
                                case 'greaterThanOrEqualTo': isValidCheck = date1 >= date2; break;
                                default: console.warn(`validateForm: Operador de comparación de fecha desconocido: ${check.operator}`); isValidCheck = true;
                            }
                        }
                    } else {
                        console.warn(`validateForm: Elemento para comparar fecha (${check.compareTo}) no encontrado.`);
                    }
                    break;
                default:
                    console.warn(`validateForm: Tipo de verificación desconocido: ${check.type}`);
            }

            if (!isValidCheck) {
                if (errorElement) {
                    setValidationError(errorElement, check.message);
                } else if (check.message) {
                    console.warn(`Error de validación para el campo '${rule.field}' (sin elemento de error visual): ${check.message}`);
                }
                formIsValid = false;
                break; 
            }
        }
    });
    return formIsValid;
};

export const calculateSpotTargetMetrics = (options) => {
    const {
        buyQuantity,
        buyPricePerToken,
        buyFeesUSD,
        targetProfitUSD,
        estimatedSellFeeUSD
    } = options;

    if (isNaN(buyQuantity) || buyQuantity <= 0 || isNaN(buyPricePerToken) || buyPricePerToken < 0) {
        return { sellPricePerTokenNeeded: null, totalSellValue: null, error: "Datos de compra inválidos." };
    }

    const numTargetProfitUSD = parseFloat(targetProfitUSD) || 0;
    const numEstimatedSellFeeUSD = parseFloat(estimatedSellFeeUSD) || 0;
    const numBuyFeesUSD = parseFloat(buyFeesUSD) || 0; // Asegurar que buyFeesUSD sea número

    // Costo total de la inversión inicial
    const totalInvestmentUSD = (buyQuantity * buyPricePerToken) + numBuyFeesUSD;
    
    // Ingreso total necesario por la venta para alcanzar el profit deseado
    const totalRevenueNeededUSD = totalInvestmentUSD + numTargetProfitUSD + numEstimatedSellFeeUSD;
    
    let sellPricePerTokenNeeded = null;
    if (buyQuantity > 0) {
        sellPricePerTokenNeeded = totalRevenueNeededUSD / buyQuantity;
    }

    return {
        sellPricePerTokenNeeded: sellPricePerTokenNeeded,
        totalSellValue: totalRevenueNeededUSD,
        error: null
    };
};

/**
 * --- NUEVA FUNCIÓN MEJORADA ---
 * Formatea la duración entre dos fechas en un formato legible.
 * @param {string} startDateString - La fecha de inicio en formato ISO (ej. "2023-10-27T10:00:00").
 * @param {string} endDateString - La fecha de fin en formato ISO.
 * @returns {string} La duración formateada (ej. "3d 5h", "12h 30m", "< 1m") o '-'.
 */
export const formatDuration = (startDateString, endDateString) => {
    if (!startDateString || !endDateString) return '-';

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
        return '-';
    }

    let diffMs = endDate - startDate;

    if (diffMs < 60000) { // Menos de 1 minuto
        return '< 1m';
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diffMs / (1000 * 60));

    const parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0 && days === 0) { // Solo mostrar minutos si no hay días
        parts.push(`${minutes}m`);
    }

    return parts.length > 0 ? parts.join(' ') : '< 1m';
};


/**
 * --- NUEVA FUNCIÓN MEJORADA ---
 * Calcula las métricas de una operación de futuros (margen, PnL, ROI).
 * @param {object} trade - El objeto de la operación.
 * @returns {{margin: number, roi: number, pnl: number}} Un objeto con las métricas calculadas.
 */
export const calculateFuturesMetrics = (trade) => {
    // Valores por defecto si la operación no se puede calcular
    const defaults = { margin: 0, roi: 0, pnl: trade?.pnl || 0 };

    if (!trade || !trade.entryPrice || !trade.quantity || !trade.leverage) {
        return defaults;
    }

    const entryPrice = parseFloat(trade.entryPrice);
    const quantity = parseFloat(trade.quantity);
    const leverage = parseFloat(trade.leverage);

    if (isNaN(entryPrice) || isNaN(quantity) || isNaN(leverage) || leverage === 0) {
        return defaults;
    }

    // Calcular el margen inicial
    const positionValue = entryPrice * quantity;
    const margin = positionValue / leverage;

    // Si la operación no está cerrada, devolvemos solo el margen.
    if (trade.status !== 'closed' || !trade.exitPrice) {
        return { margin, roi: 0, pnl: 0 };
    }

    const exitPrice = parseFloat(trade.exitPrice);
    const entryFees = parseFloat(trade.entryFees) || 0;
    const exitFees = parseFloat(trade.exitFees) || 0;

    if (isNaN(exitPrice)) {
        return { margin, roi: 0, pnl: 0 };
    }
    
    // Calcular el PnL bruto
    let grossPnl = 0;
    if (trade.direction === 'long') {
        grossPnl = (exitPrice - entryPrice) * quantity;
    } else if (trade.direction === 'short') {
        grossPnl = (entryPrice - exitPrice) * quantity;
    }
    
    // Calcular el PnL neto (restando comisiones)
    const netPnl = grossPnl - entryFees - exitFees;

    // Calcular el ROI sobre el margen
    const roi = margin > 0 ? (netPnl / margin) * 100 : 0;

    return {
        margin: margin,
        roi: roi,
        pnl: netPnl
    };
};