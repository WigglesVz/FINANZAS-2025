// src/js/auth.js

// Asegurarse de que todas las utilidades necesarias de utils.js estén importadas
import { showToast, sanitizeHTML, setValidationError, clearValidationError, clearAllValidationErrors } from './utils.js';
import { getAppState, updateAppState } from './state.js';
import { loadData } from './storage.js';
import { renderAll } from './uiRender.js';
import { refreshCurrentChart, renderSelectedChart } from './charts.js';
import {
    authScreen, appContent, loginForm, registerForm,
    loginFormContainer, registerFormContainer, logoutButton,
    loginUsernameInput, loginPasswordInput,
    registerUsernameInput, registerPasswordInput, registerConfirmPasswordInput,
    loginUsernameError, loginPasswordError,
    registerUsernameError, registerPasswordError, registerConfirmPasswordError,
    chartTypeSelect // Necesario si hideAuthScreenAndShowApp lo usa
} from './domElements.js';
import { USER_CREDENTIALS_PREFIX_KEY, AUTH_STATUS_KEY as AUTH_KEY_FROM_CONFIG } from './config.js'; // Importar claves de config

// Usar las claves de config.js para consistencia
const USER_STORAGE_KEY_PREFIX = USER_CREDENTIALS_PREFIX_KEY || 'projectTrackerAppUser_';
const AUTH_STATUS_KEY = AUTH_KEY_FROM_CONFIG || 'projectTrackerAuthStatus';


const simpleHash = (str) => {
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
};

export const showAuthScreen = () => {
    if (authScreen) {
        authScreen.classList.remove('hidden');
        // Forzar reflow para asegurar que la transición de opacidad funcione
        void authScreen.offsetWidth; 
        authScreen.classList.add('opacity-100');
    }
    if (appContent) appContent.classList.add('hidden');
    if (logoutButton) logoutButton.classList.add('hidden'); // Ocultar botón de logout
};

export const hideAuthScreenAndShowApp = async () => {
    if (authScreen) {
        authScreen.classList.remove('opacity-100');
        // Esperar que la transición de opacidad termine antes de ocultar con display:none
        setTimeout(() => {
            authScreen.classList.add('hidden');
        }, 300); // Coincidir con la duración de la transición de opacidad
    }
    if (appContent) appContent.classList.remove('hidden');
    if (logoutButton) logoutButton.classList.remove('hidden'); // Mostrar botón de logout

    try {
        await loadData();
        renderAll();
        // Asegurarse que chartTypeSelect existe antes de acceder a su valor
        const initialChartType = chartTypeSelect ? chartTypeSelect.value : 'statusDistribution';
        renderSelectedChart(initialChartType);
        showToast('Aplicación cargada y lista.', 'info'); // Mover el toast aquí
        console.log("Rastreador de proyectos y finanzas inicializado y listo.");
    } catch (error) {
        console.error("Error al cargar datos después del login:", error);
        showToast("Error al cargar los datos de la aplicación.", "error");
    }
};

export const showLoginForm = () => {
    if (loginFormContainer) loginFormContainer.classList.remove('hidden');
    if (registerFormContainer) registerFormContainer.classList.add('hidden');
    if (loginForm) {
        loginForm.reset();
        clearAllValidationErrors(loginForm);
    }
    if (loginUsernameInput) loginUsernameInput.focus();
};

export const showRegisterForm = () => {
    if (registerFormContainer) registerFormContainer.classList.remove('hidden');
    if (loginFormContainer) loginFormContainer.classList.add('hidden');
    if (registerForm) {
        registerForm.reset();
        clearAllValidationErrors(registerForm);
    }
    if (registerUsernameInput) registerUsernameInput.focus();
};

export const handleRegister = async (event) => {
    event.preventDefault();
    if (!registerForm || !registerUsernameInput || !registerPasswordInput || !registerConfirmPasswordInput ||
        !registerUsernameError || !registerPasswordError || !registerConfirmPasswordError) {
        console.error("Elementos del formulario de registro faltantes.");
        return;
    }

    clearAllValidationErrors(registerForm);
    let isValid = true;

    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value;
    const confirmPassword = registerConfirmPasswordInput.value;

    if (!username) {
        setValidationError(registerUsernameError, "Nombre de usuario es requerido.");
        isValid = false;
    } else if (username.length < 3) {
        setValidationError(registerUsernameError, "Mínimo 3 caracteres.");
        isValid = false;
    } else if (localStorage.getItem(USER_STORAGE_KEY_PREFIX + username)) {
        setValidationError(registerUsernameError, "Este nombre de usuario ya existe.");
        isValid = false;
    }

    if (!password) {
        setValidationError(registerPasswordError, "Contraseña es requerida.");
        isValid = false;
    } else if (password.length < 6) {
        setValidationError(registerPasswordError, "Mínimo 6 caracteres.");
        isValid = false;
    }

    if (!confirmPassword) {
        setValidationError(registerConfirmPasswordError, "Confirme la contraseña.");
        isValid = false;
    } else if (password !== confirmPassword) {
        setValidationError(registerConfirmPasswordError, "Las contraseñas no coinciden.");
        isValid = false;
    }

    if (!isValid) return;

    const hashedPassword = simpleHash(password);
    const userData = { username, hashedPassword };

    try {
        localStorage.setItem(USER_STORAGE_KEY_PREFIX + username, JSON.stringify(userData));
        localStorage.setItem(AUTH_STATUS_KEY, JSON.stringify({ isLoggedIn: true, username: username }));
        updateAppState({ isAuthenticated: true, currentUser: username });
        showToast(`¡Bienvenido, ${sanitizeHTML(username)}! Cuenta creada.`, 'success');
        await hideAuthScreenAndShowApp();
    } catch (e) {
        showToast("Error al guardar datos de usuario. Intente de nuevo.", "error");
        console.error("Error saving user data:", e);
    }
};

export const handleLogin = async (event) => {
    event.preventDefault();
    if (!loginForm || !loginUsernameInput || !loginPasswordInput || !loginUsernameError || !loginPasswordError) {
        console.error("Elementos del formulario de login faltantes.");
        return;
    }

    clearAllValidationErrors(loginForm);
    let isValid = true;

    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username) {
        setValidationError(loginUsernameError, "Nombre de usuario es requerido.");
        isValid = false;
    }
    if (!password) {
        setValidationError(loginPasswordError, "Contraseña es requerida.");
        isValid = false;
    }

    if (!isValid) return;

    const storedUserDataString = localStorage.getItem(USER_STORAGE_KEY_PREFIX + username);
    if (!storedUserDataString) {
        setValidationError(loginUsernameError, "Usuario no encontrado.");
        loginPasswordInput.value = ""; // Limpiar campo de contraseña
        return;
    }

    try {
        const storedUserData = JSON.parse(storedUserDataString);
        const hashedPasswordAttempt = simpleHash(password);

        if (storedUserData.hashedPassword === hashedPasswordAttempt) {
            localStorage.setItem(AUTH_STATUS_KEY, JSON.stringify({ isLoggedIn: true, username: username }));
            updateAppState({ isAuthenticated: true, currentUser: username });
            // El toast y el resto se manejan en hideAuthScreenAndShowApp
            await hideAuthScreenAndShowApp();
        } else {
            setValidationError(loginPasswordError, "Contraseña incorrecta.");
            loginPasswordInput.value = ""; // Limpiar campo de contraseña
        }
    } catch (e) {
        showToast("Error al procesar inicio de sesión.", "error");
        console.error("Error processing login:", e);
    }
};

export const handleLogout = () => {
    localStorage.removeItem(AUTH_STATUS_KEY);
    updateAppState({ isAuthenticated: false, currentUser: null });
    showToast("Has cerrado sesión.", "info");
    showAuthScreen();
    showLoginForm();
};

export const checkAuthStatus = async () => {
    const authStatusString = localStorage.getItem(AUTH_STATUS_KEY);
    if (authStatusString) {
        try {
            const authStatus = JSON.parse(authStatusString);
            if (authStatus.isLoggedIn && authStatus.username) {
                if (localStorage.getItem(USER_STORAGE_KEY_PREFIX + authStatus.username)) {
                    updateAppState({ isAuthenticated: true, currentUser: authStatus.username });
                    await hideAuthScreenAndShowApp();
                    return true;
                } else {
                    localStorage.removeItem(AUTH_STATUS_KEY);
                }
            }
        } catch (e) {
            console.error("Error parsing auth status:", e);
            localStorage.removeItem(AUTH_STATUS_KEY);
        }
    }
    updateAppState({ isAuthenticated: false, currentUser: null });
    showAuthScreen(); // Mostrar pantalla de autenticación si no está autenticado
    return false;
};

export const checkForRegisteredUser = () => {
    let userExists = false;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(USER_STORAGE_KEY_PREFIX)) {
                userExists = true;
                break;
            }
        }
    } catch (e) {
        console.error("Error accessing localStorage in checkForRegisteredUser:", e);
        // Asumir que no hay usuarios si localStorage no es accesible
    }

    if (!userExists) {
        showRegisterForm();
    } else {
        showLoginForm();
    }
    return userExists;
};