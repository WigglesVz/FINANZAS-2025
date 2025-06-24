// src/js/auth.js

import { showToast, sanitizeHTML, setValidationError, clearAllValidationErrors, validateForm } from './utils.js';
import { getAppState, updateAppState } from './state.js';
import { loadData } from './storage.js';
import { renderAll } from './uiRender.js';
import { renderSelectedChart } from './charts.js';
import { getDomElements } from './domElements.js';
import { USER_CREDENTIALS_PREFIX_KEY, AUTH_STATUS_KEY } from './config.js'; // Importar claves desde config.js

/**
 * Genera un hash simple de una cadena.
 * @param {string} str - La cadena a hashear.
 * @returns {string} El hash resultante como cadena hexadecimal.
 */
const simpleHash = (str) => {
    let hash = 0;
    if (!str || str.length === 0) return hash.toString(16);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
};

/**
 * Muestra la pantalla de autenticación y oculta el contenido principal de la aplicación.
 */
export const showAuthScreen = () => {
    const dom = getDomElements();
    if (dom.authScreen) {
        dom.authScreen.classList.remove('hidden');
        void dom.authScreen.offsetWidth; // Forzar reflow para la transición de opacidad
        dom.authScreen.classList.add('opacity-100');
    }
    if (dom.appContent) dom.appContent.classList.add('hidden');
    if (dom.logoutButton) dom.logoutButton.classList.add('hidden');
};

/**
 * Oculta la pantalla de autenticación y muestra el contenido principal de la aplicación.
 * Carga los datos y renderiza la UI.
 */
export const hideAuthScreenAndShowApp = async () => {
    const dom = getDomElements();
    if (dom.authScreen) {
        dom.authScreen.classList.remove('opacity-100');
        setTimeout(() => {
            if (dom.authScreen) dom.authScreen.classList.add('hidden');
        }, 300); // Duración de la transición
    }
    if (dom.appContent) dom.appContent.classList.remove('hidden');
    if (dom.logoutButton) dom.logoutButton.classList.remove('hidden');

    try {
        await loadData();
        renderAll();
        const currentMode = getAppState().activeUserMode;
        let initialChartType = 'statusDistribution';
        if (currentMode === 'crypto') {
            initialChartType = 'cryptoPerformance';
        } else if (dom.chartTypeSelect) {
            initialChartType = dom.chartTypeSelect.value || 'statusDistribution';
        }
        renderSelectedChart(initialChartType);
        showToast('Aplicación cargada y lista.', 'info');
        console.log("ZenithTrack inicializado y listo (desde hideAuthScreenAndShowApp).");
    } catch (error) {
        console.error("Error al cargar datos y renderizar después de la autenticación:", error);
        showToast("Error al cargar los datos de la aplicación.", "error");
    }
};

/**
 * Muestra el formulario de inicio de sesión y oculta el de registro.
 */
export const showLoginForm = () => {
    const dom = getDomElements();
    if (dom.loginFormContainer) dom.loginFormContainer.classList.remove('hidden');
    if (dom.registerFormContainer) dom.registerFormContainer.classList.add('hidden');
    if (dom.loginForm) {
        dom.loginForm.reset();
        clearAllValidationErrors(dom.loginForm);
    }
    if (dom.loginUsernameInput) dom.loginUsernameInput.focus();
};

/**
 * Muestra el formulario de registro y oculta el de inicio de sesión.
 */
export const showRegisterForm = () => {
    const dom = getDomElements();
    if (dom.registerFormContainer) dom.registerFormContainer.classList.remove('hidden');
    if (dom.loginFormContainer) dom.loginFormContainer.classList.add('hidden');
    if (dom.registerForm) {
        dom.registerForm.reset();
        clearAllValidationErrors(dom.registerForm);
    }
    if (dom.registerUsernameInput) dom.registerUsernameInput.focus();
};

/**
 * Maneja el envío del formulario de registro.
 * @param {Event} event - El evento de envío del formulario.
 */
export const handleRegister = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.registerForm || !dom.registerUsernameInput || !dom.registerPasswordInput || !dom.registerConfirmPasswordInput ||
        !dom.registerUsernameError || !dom.registerPasswordError || !dom.registerConfirmPasswordError) {
        console.error("Elementos del formulario de registro faltantes en handleRegister.");
        showToast("Error interno del formulario. Intente de nuevo.", "error");
        return;
    }

    const validationRules = [
        { field: 'register-username', errorElementId: 'register-username-error', checks: [
            { type: 'required', message: "Nombre de usuario es requerido." },
            { type: 'minlength', value: 3, message: "Mínimo 3 caracteres." },
            {
                type: 'custom',
                message: "Este nombre de usuario ya existe.",
                validate: (value) => {
                    try {
                        return !localStorage.getItem(USER_CREDENTIALS_PREFIX_KEY + value.trim());
                    } catch (e) {
                        console.warn("localStorage no accesible en validación de nombre de usuario:", e);
                        return true; // No bloquear si no se puede verificar
                    }
                }
            }
        ]},
        { field: 'register-password', errorElementId: 'register-password-error', checks: [
            { type: 'required', message: "Contraseña es requerida." },
            { type: 'minlength', value: 6, message: "Mínimo 6 caracteres." }
        ]},
        { field: 'register-confirm-password', errorElementId: 'register-confirm-password-error', checks: [
            { type: 'required', message: "Confirme la contraseña." },
            {
                type: 'custom',
                message: "Las contraseñas no coinciden.",
                validate: (value) => value === dom.registerPasswordInput.value
            }
        ]}
    ];

    if (!validateForm(dom.registerForm, validationRules)) {
        return;
    }

    const username = dom.registerUsernameInput.value.trim();
    const password = dom.registerPasswordInput.value;
    const hashedPassword = simpleHash(password);
    const userData = { username, hashedPassword };

    try {
        localStorage.setItem(USER_CREDENTIALS_PREFIX_KEY + username, JSON.stringify(userData));
        localStorage.setItem(AUTH_STATUS_KEY, JSON.stringify({ isLoggedIn: true, username: username }));
        updateAppState({ isAuthenticated: true, currentUser: username });
        showToast(`¡Bienvenido, ${sanitizeHTML(username)}! Cuenta creada.`, 'success');
        await hideAuthScreenAndShowApp();
    } catch (e) {
        showToast("Error al guardar datos de usuario. Intente de nuevo.", "error");
        console.error("Error saving user data during registration:", e);
    }
};

/**
 * Maneja el envío del formulario de inicio de sesión.
 * @param {Event} event - El evento de envío del formulario.
 */
export const handleLogin = async (event) => {
    event.preventDefault();
    const dom = getDomElements();
    if (!dom.loginForm || !dom.loginUsernameInput || !dom.loginPasswordInput || !dom.loginUsernameError || !dom.loginPasswordError) {
        console.error("Elementos del formulario de login faltantes en handleLogin.");
        showToast("Error interno del formulario. Intente de nuevo.", "error");
        return;
    }

    const validationRules = [
        { field: 'login-username', errorElementId: 'login-username-error', checks: [{ type: 'required', message: "Nombre de usuario es requerido." }]},
        { field: 'login-password', errorElementId: 'login-password-error', checks: [{ type: 'required', message: "Contraseña es requerida." }]}
    ];

    if (!validateForm(dom.loginForm, validationRules)) {
        return;
    }

    const username = dom.loginUsernameInput.value.trim();
    const password = dom.loginPasswordInput.value;
    let storedUserDataString;
    try {
        storedUserDataString = localStorage.getItem(USER_CREDENTIALS_PREFIX_KEY + username);
    } catch (e) {
        showToast("Error al acceder a los datos de usuario.", "error");
        console.error("Error accessing localStorage for login:", e);
        return;
    }

    if (!storedUserDataString) {
        setValidationError(dom.loginUsernameError, "Usuario no encontrado.");
        if (dom.loginPasswordInput) dom.loginPasswordInput.value = "";
        return;
    }

    try {
        const storedUserData = JSON.parse(storedUserDataString);
        const hashedPasswordAttempt = simpleHash(password);

        if (storedUserData.hashedPassword === hashedPasswordAttempt) {
            localStorage.setItem(AUTH_STATUS_KEY, JSON.stringify({ isLoggedIn: true, username: username }));
            updateAppState({ isAuthenticated: true, currentUser: username });
            await hideAuthScreenAndShowApp();
        } else {
            setValidationError(dom.loginPasswordError, "Contraseña incorrecta.");
            if (dom.loginPasswordInput) dom.loginPasswordInput.value = "";
        }
    } catch (e) {
        showToast("Error al procesar inicio de sesión.", "error");
        console.error("Error processing login:", e);
    }
};

/**
 * Maneja el cierre de sesión del usuario.
 */
export const handleLogout = () => {
    try {
        localStorage.removeItem(AUTH_STATUS_KEY);
    } catch (e) {
        console.error("Error removing auth status from localStorage:", e);
    }
    updateAppState({ isAuthenticated: false, currentUser: null });
    showToast("Has cerrado sesión.", "info");
    showAuthScreen();
    showLoginForm();
};

/**
 * Verifica el estado de autenticación al cargar la aplicación.
 * @returns {Promise<boolean>} True si el usuario está autenticado, false en caso contrario.
 */
export const checkAuthStatus = async () => {
    let authStatusString;
    try {
        authStatusString = localStorage.getItem(AUTH_STATUS_KEY);
    } catch (e) {
        console.error("Error accessing localStorage for auth status:", e);
        updateAppState({ isAuthenticated: false, currentUser: null });
        showAuthScreen();
        return false;
    }

    if (authStatusString) {
        try {
            const authStatus = JSON.parse(authStatusString);
            if (authStatus.isLoggedIn && authStatus.username) {
                if (localStorage.getItem(USER_CREDENTIALS_PREFIX_KEY + authStatus.username)) {
                    updateAppState({ isAuthenticated: true, currentUser: authStatus.username });
                    await hideAuthScreenAndShowApp();
                    return true;
                } else {
                    localStorage.removeItem(AUTH_STATUS_KEY);
                }
            }
        } catch (e) {
            console.error("Error parsing auth status from localStorage:", e);
            localStorage.removeItem(AUTH_STATUS_KEY);
        }
    }
    updateAppState({ isAuthenticated: false, currentUser: null });
    showAuthScreen();
    return false;
};

/**
 * Verifica si existen usuarios registrados y muestra el formulario apropiado (login o registro).
 * @returns {boolean} True si existe al menos un usuario registrado, false en caso contrario.
 */
export const checkForRegisteredUser = () => {
    let userExists = false;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(USER_CREDENTIALS_PREFIX_KEY)) {
                userExists = true;
                break;
            }
        }
    } catch (e) {
        console.error("Error accessing localStorage in checkForRegisteredUser:", e);
    }

    if (!userExists) {
        showRegisterForm();
    } else {
        showLoginForm();
    }
    return userExists;
};