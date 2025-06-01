// src/js/modalHandlers.js
import {
    taskModal, taskModalTitle, taskForm, taskIdInput, taskProjectNameSelect, taskStatusSelect,
    taskNameInput, taskDescriptionInput, taskStartDateInput, taskEndDateInput,
    costModal, costModalTitle, costForm, costIdInput, costProjectNameInput, costBudgetInput, costActualInput,
    confirmationModal, confirmationModalTitle, confirmationModalBody, confirmConfirmationButton,
    mainTitleEl
} from './domElements.js';
// MODIFICADO: Importar getAppState y updateAppState
import { getAppState, updateAppState } from './state.js';
import { sanitizeHTML, clearAllValidationErrors, showToast } from './utils.js';
import db from './db.js'; // Importar db para persistir mainTitle
// saveData de storage.js ya no es necesaria aquí para guardar el título, se hará directo con Dexie

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
    const firstFocusable = modalElement.querySelector('input, select, textarea, button');
    if (firstFocusable) firstFocusable.focus();
};

/** Closes a modal. @param {HTMLElement} modalElement */
export const closeModal = (modalElement) => {
    if (!modalElement) return;

    if (modalElement.id === 'task-modal' && taskForm) clearAllValidationErrors(taskForm);
    if (modalElement.id === 'cost-modal' && costForm) clearAllValidationErrors(costForm);

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

/** Opens the Task Modal for adding. */
export const openAddTaskModal = () => {
    if (!taskModalTitle || !taskForm || !taskIdInput) return;
    taskModalTitle.textContent = 'Agregar Nueva Tarea';
    taskForm.reset();
    taskIdInput.value = ''; // Asegurarse que el ID esté vacío para nueva tarea
    clearAllValidationErrors(taskForm);
    updateTaskModalDropdowns();
    openModal(taskModal);
    if(taskProjectNameSelect) taskProjectNameSelect.focus();
};

/** Opens Task Modal for editing. @param {string} taskIdToEdit */
export const openEditTaskModal = (taskIdToEdit) => {
    const currentState = getAppState();
    const taskToEdit = currentState.projectDetails.find(task => task.id === taskIdToEdit);
    if (!taskToEdit) return showToast("Error: Tarea no encontrada.", "error");

    if (!taskModalTitle || !taskForm || !taskIdInput || !taskProjectNameSelect || !taskStatusSelect ||
        !taskNameInput || !taskDescriptionInput || !taskStartDateInput || !taskEndDateInput) return;

    taskModalTitle.textContent = 'Editar Tarea';
    taskForm.reset();
    clearAllValidationErrors(taskForm);
    updateTaskModalDropdowns();

    taskIdInput.value = taskToEdit.id;
    taskProjectNameSelect.value = taskToEdit.projectName;
    taskStatusSelect.value = taskToEdit.status;
    taskNameInput.value = taskToEdit.task;
    taskDescriptionInput.value = taskToEdit.description;
    taskStartDateInput.value = taskToEdit.startDate;
    taskEndDateInput.value = taskToEdit.endDate;

    openModal(taskModal);
    if(taskNameInput) taskNameInput.focus();
};

/** Opens Cost Modal for editing. @param {string} costIdToEdit */
export const openEditCostModal = (costIdToEdit) => {
    const currentState = getAppState();
    const costToEdit = currentState.projectCosts.find(cost => cost.id === costIdToEdit);
    if (!costToEdit) return showToast("Error: Costo no encontrado.", "error");

    if (!costModalTitle || !costForm || !costIdInput || !costProjectNameInput ||
        !costBudgetInput || !costActualInput) return;

    costModalTitle.textContent = `Editar Costos: ${sanitizeHTML(costToEdit.projectName)}`;
    costForm.reset();
    clearAllValidationErrors(costForm);

    costIdInput.value = costToEdit.id;
    costProjectNameInput.value = costToEdit.projectName;
    costBudgetInput.value = costToEdit.budget >= 0 ? costToEdit.budget.toFixed(2) : '';
    costActualInput.value = costToEdit.actualCost >= 0 ? costToEdit.actualCost.toFixed(2) : '';

    openModal(costModal);
    if(costBudgetInput) costBudgetInput.focus();
};


/** Opens the confirmation modal. */
 export const openConfirmationModal = (title, message, confirmButtonText, confirmButtonClass, actionCallback, actionData = null) => {
    if (!confirmationModal || !confirmationModalTitle || !confirmationModalBody || !confirmConfirmationButton) return;
    confirmationModalTitle.textContent = sanitizeHTML(title);
    confirmationModalBody.innerHTML = message;
    confirmConfirmationButton.textContent = confirmButtonText;

    confirmConfirmationButton.className = `font-medium py-2 px-4 rounded-lg shadow transition duration-300 text-sm text-white`;
    confirmConfirmationButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'bg-teal-600', 'hover:bg-teal-700', 'bg-blue-600', 'hover:bg-blue-700'); // Remover clases antiguas
    confirmConfirmationButton.classList.add(`bg-${confirmButtonClass}-600`, `hover:bg-${confirmButtonClass}-700`);

    updateAppState({ currentConfirmationAction: { callback: actionCallback, data: actionData } });
    openModal(confirmationModal);
};

/** Closes the confirmation modal. */
export const closeConfirmationModal = () => {
    updateAppState({ currentConfirmationAction: null });
    closeModal(confirmationModal);
};

/** Handles changing the main application title. */
export const handleChangeAppTitle = async () => { // Hacerla async
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
            showToast("Título actualizado.", 'success'); // Usar showToast de utils
        } catch (error) {
            console.error("Error saving title to DB:", error);
            showToast("Error al guardar el título en la base de datos.", "error");
        }
    }
};