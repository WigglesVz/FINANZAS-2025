// src/js/modalHandlers.js
import {
    taskModal, taskModalTitle, taskForm, taskIdInput, taskProjectNameSelect, taskStatusSelect,
    taskNameInput, taskDescriptionInput, taskStartDateInput, taskEndDateInput,
    costModal, costModalTitle, costForm, costIdInput, costProjectNameInput, costBudgetInput, costActualInput,
    confirmationModal, confirmationModalTitle, confirmationModalBody, confirmConfirmationButton,
    mainTitleEl
} from './domElements.js';
import { getAppState, updateAppState } from './state.js';
import { sanitizeHTML, clearAllValidationErrors, showToast } from './utils.js';
import db from './db.js';

/** Opens a modal. @param {HTMLElement} modalElement */
export const openModal = (modalElement) => {
    if (!modalElement) return;
    modalElement.classList.remove('hidden');
    document.body.classList.add('modal-active');
    modalElement.offsetHeight; // Trigger reflow
    modalElement.classList.add('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }
    // Enfocar el primer elemento interactivo para accesibilidad
    const firstFocusable = modalElement.querySelector('input, select, textarea, button:not([aria-label="Cerrar modal de tarea"]):not([aria-label="Cerrar modal de costos"]):not([aria-label="Cerrar modal de confirmación"])');
    if (firstFocusable) firstFocusable.focus();
};

/** Closes a modal. @param {HTMLElement} modalElement */
export const closeModal = (modalElement) => {
    if (!modalElement) return;

    if (modalElement.id === 'task-modal' && taskForm) clearAllValidationErrors(taskForm);
    if (modalElement.id === 'cost-modal' && costForm) clearAllValidationErrors(costForm);
    if (modalElement.id === 'confirmation-modal') updateAppState({ currentConfirmationAction: null }); // Limpiar acción de confirmación

    document.body.classList.remove('modal-active');
    modalElement.classList.remove('opacity-100');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }
    setTimeout(() => modalElement.classList.add('hidden'), 250);
};

/** Populates dropdowns in the Task Modal. */
export const updateTaskModalDropdowns = () => {
    const currentState = getAppState();
    if (!taskProjectNameSelect || !taskStatusSelect) return;

    const projectNameList = Array.isArray(currentState.projectNameList) ? currentState.projectNameList : [];
    taskProjectNameSelect.innerHTML = '<option value="">Seleccione Proyecto</option>';
    [...projectNameList]
        .sort((a,b) => a.name.localeCompare(b.name))
        .forEach(project => {
            const safeName = sanitizeHTML(project.name);
            taskProjectNameSelect.add(new Option(safeName, project.name));
    });

    const statusList = Array.isArray(currentState.statusList) ? currentState.statusList : [];
    taskStatusSelect.innerHTML = '<option value="">Seleccione Estado</option>';
    [...statusList]
        .sort((a,b) => a.name.localeCompare(b.name))
        .forEach(status => {
             const safeStatus = sanitizeHTML(status.name);
             taskStatusSelect.add(new Option(safeStatus, status.name));
    });
};

/**
 * Función genérica para mostrar diferentes tipos de modales.
 * @param {object} options - Objeto de configuración del modal.
 * @param {string} options.type - Tipo de modal ('task', 'cost', 'confirmation').
 * @param {string} options.title - Título del modal.
 * @param {object} [options.data] - Objeto de datos para modales de edición (ej. taskToEdit, costToEdit).
 * @param {string} [options.message] - Mensaje para el modal de confirmación.
 * @param {string} [options.confirmButtonText] - Texto del botón de confirmación.
 * @param {string} [options.confirmButtonClass] - Clase de color del botón de confirmación (ej. 'red', 'teal').
 * @param {function} [options.actionCallback] - Callback a ejecutar al confirmar el modal.
 * @param {any} [options.actionData] - Datos a pasar al actionCallback.
 */
export const showDynamicModal = (options) => {
    const { type, title, data, message, confirmButtonText, confirmButtonClass, actionCallback, actionData } = options;

    let modalElement;
    let modalTitleEl;
    let formElement;

    // Determinar qué modal mostrar y qué elementos usar
    switch (type) {
        case 'task':
            modalElement = taskModal;
            modalTitleEl = taskModalTitle;
            formElement = taskForm;
            break;
        case 'cost':
            modalElement = costModal;
            modalTitleEl = costModalTitle;
            formElement = costForm;
            break;
        case 'confirmation':
            modalElement = confirmationModal;
            modalTitleEl = confirmationModalTitle;
            formElement = null; // No hay formulario para el modal de confirmación
            break;
        default:
            console.error(`showDynamicModal: Tipo de modal desconocido: ${type}`);
            return;
    }

    if (!modalElement || !modalTitleEl) {
        console.error(`showDynamicModal: Elementos DOM no encontrados para el tipo ${type}.`);
        return;
    }

    // Configurar el título del modal
    modalTitleEl.textContent = sanitizeHTML(title);

    // Limpiar y resetear el formulario si existe
    if (formElement) {
        formElement.reset();
        clearAllValidationErrors(formElement);
    }

    // Lógica específica para cada tipo de modal
    switch (type) {
        case 'task':
            updateTaskModalDropdowns(); // Llenar dropdowns de proyectos y estados
            if (data) { // Modo edición de tarea
                if (!taskIdInput || !taskProjectNameSelect || !taskStatusSelect ||
                    !taskNameInput || !taskDescriptionInput || !taskStartDateInput || !taskEndDateInput) return;
                taskIdInput.value = data.id || '';
                taskProjectNameSelect.value = data.projectName || '';
                taskStatusSelect.value = data.status || '';
                taskNameInput.value = data.task || '';
                taskDescriptionInput.value = data.description || '';
                taskStartDateInput.value = data.startDate || '';
                taskEndDateInput.value = data.endDate || '';
            } else { // Modo añadir tarea
                if (taskIdInput) taskIdInput.value = '';
            }
            break;
        case 'cost':
            if (data) { // Modo edición de costo
                if (!costIdInput || !costProjectNameInput || !costBudgetInput || !costActualInput) return;
                costIdInput.value = data.id || '';
                costProjectNameInput.value = data.projectName || '';
                costBudgetInput.value = (data.budget >= 0) ? data.budget.toFixed(2) : '';
                costActualInput.value = (data.actualCost >= 0) ? data.actualCost.toFixed(2) : '';
            } else {
                // No debería haber un modo "añadir costo" sin un proyecto asociado
                // Los costos se asocian a proyectos existentes al editar un proyecto.
            }
            break;
        case 'confirmation':
            if (!confirmationModalBody || !confirmConfirmationButton) return;
            confirmationModalBody.innerHTML = message;
            confirmConfirmationButton.textContent = confirmButtonText;
            confirmConfirmationButton.className = `font-medium py-2 px-4 rounded-lg shadow transition duration-300 text-sm text-white`;
            confirmConfirmationButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'bg-teal-600', 'hover:bg-teal-700', 'bg-blue-600', 'hover:bg-blue-700');
            confirmConfirmationButton.classList.add(`bg-${confirmButtonClass}-600`, `hover:bg-${confirmButtonClass}-700`);
            updateAppState({ currentConfirmationAction: { callback: actionCallback, data: actionData } });
            break;
    }

    // Abrir el modal genérico
    openModal(modalElement);
};

// Refactorizar las funciones existentes para usar showDynamicModal
export const openAddTaskModal = () => {
    showDynamicModal({
        type: 'task',
        title: 'Agregar Nueva Tarea'
    });
};

export const openEditTaskModal = (taskIdToEdit) => {
    const currentState = getAppState();
    const taskToEdit = currentState.projectDetails.find(task => task.id === taskIdToEdit);
    if (!taskToEdit) return showToast("Error: Tarea no encontrada.", "error");

    showDynamicModal({
        type: 'task',
        title: 'Editar Tarea',
        data: taskToEdit
    });
};

export const openEditCostModal = (costIdToEdit) => {
    const currentState = getAppState();
    const costToEdit = currentState.projectCosts.find(cost => cost.id === costIdToEdit);
    if (!costToEdit) return showToast("Error: Costo no encontrado.", "error");

    showDynamicModal({
        type: 'cost',
        title: `Editar Costos: ${sanitizeHTML(costToEdit.projectName)}`,
        data: costToEdit
    });
};

export const openConfirmationModal = (title, message, confirmButtonText, confirmButtonClass, actionCallback, actionData = null) => {
    showDynamicModal({
        type: 'confirmation',
        title,
        message,
        confirmButtonText,
        confirmButtonClass,
        actionCallback,
        actionData
    });
};

/** Closes the confirmation modal. (Esta función se mantiene igual ya que se llama desde eventHandlers para manejar el confirm) */
export const closeConfirmationModal = () => {
    closeModal(confirmationModal);
};

/** Handles changing the main application title. */
export const handleChangeAppTitle = async () => {
    if (!mainTitleEl) {
         console.error("Elemento H1 del título principal no encontrado.");
         showToast("Error interno: No se pudo encontrar el título.", "error");
         return;
    }
    const currentState = getAppState();
    const currentTitle = currentState.mainTitle || mainTitleEl.textContent.trim();
    const newTitlePrompt = prompt(`Cambiar el título actual:\n"${currentTitle}"\n\nIngrese el nuevo título (máx 100 caracteres):`, currentTitle);

    if (newTitlePrompt !== null) {
        const trimmedTitle = newTitlePrompt.trim();
        if (trimmedTitle === '') {
            showToast("El título no puede estar vacío.", "error");
            return;
        }
        if (trimmedTitle.length > 100) {
             showToast("El título no puede exceder 100 caracteres.", "error");
             return;
        }
        const sanitizedNewTitle = sanitizeHTML(trimmedTitle);
        
        try {
            await db.appConfig.put({ key: 'mainTitle', value: sanitizedNewTitle });
            mainTitleEl.textContent = sanitizedNewTitle;
            updateAppState({ mainTitle: sanitizedNewTitle });
            showToast("Título actualizado.", 'success');
        } catch (error) {
            console.error("Error saving title to DB:", error);
            showToast("Error al guardar el título en la base de datos.", "error");
        }
    }
};