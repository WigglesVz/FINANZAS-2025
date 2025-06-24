// src/js/theme.js

import { THEME_PREFERENCE_KEY } from './config.js';
import { getDomElements } from './domElements.js'; // Importar la función getter

/**
 * Guarda la preferencia de tema actual (claro/oscuro) en localStorage.
 */
const saveThemePreference = () => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("saveThemePreference: htmlElement no encontrado.");
        return;
    }
    const currentTheme = dom.htmlElement.classList.contains('dark') ? 'dark' : 'light';
    try {
        localStorage.setItem(THEME_PREFERENCE_KEY, currentTheme);
    } catch (e) {
        console.error("Error guardando la preferencia de tema en localStorage:", e);
    }
};

/**
 * Actualiza el icono del botón de cambio de tema y su etiqueta aria.
 * @param {boolean} isDark - True si el modo oscuro está activo, false en caso contrario.
 */
const updateThemeButtonIcon = (isDark) => {
    const dom = getDomElements();
    if (dom.themeToggleButton) {
        const icon = dom.themeToggleButton.querySelector('i');
        if (icon) {
            icon.classList.remove(isDark ? 'fa-sun' : 'fa-moon');
            icon.classList.add(isDark ? 'fa-moon' : 'fa-sun');
            dom.themeToggleButton.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
            dom.themeToggleButton.title = isDark ? 'Alternar Modo Día' : 'Alternar Modo Noche'; // Mantenido por si el HTML no se actualiza dinámicamente
        }
    } else {
        console.warn("updateThemeButtonIcon: themeToggleButton no encontrado.");
    }
};

/**
 * Habilita el modo oscuro.
 * @param {boolean} [save=true] - Indica si se debe guardar la preferencia.
 */
export const enableDarkMode = (save = true) => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("enableDarkMode: htmlElement no encontrado.");
        return;
    }
    dom.htmlElement.classList.add('dark');
    updateThemeButtonIcon(true);
    if (save) saveThemePreference();
    // La actualización del gráfico se maneja centralmente después de la carga de datos y tema.
};

/**
 * Deshabilita el modo oscuro (activa el modo claro).
 * @param {boolean} [save=true] - Indica si se debe guardar la preferencia.
 */
export const disableDarkMode = (save = true) => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("disableDarkMode: htmlElement no encontrado.");
        return;
    }
    dom.htmlElement.classList.remove('dark');
    updateThemeButtonIcon(false);
    if (save) saveThemePreference();
};

/**
 * Alterna entre el modo claro y oscuro.
 */
export const toggleDarkMode = () => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("toggleDarkMode: htmlElement no encontrado.");
        return;
    }
    if (dom.htmlElement.classList.contains('dark')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
    // La actualización del gráfico (refreshCurrentChart) se llamará después de que se renderice todo,
    // lo que incluye la actualización del tema, para asegurar que los colores del gráfico sean correctos.
};

/**
 * Carga la preferencia de tema guardada en localStorage y la aplica.
 */
export const loadThemePreference = () => {
    const dom = getDomElements();
    if (!dom.htmlElement) {
        console.warn("loadThemePreference: htmlElement no encontrado. No se puede cargar la preferencia de tema.");
        return;
    }
    let theme;
    try {
        theme = localStorage.getItem(THEME_PREFERENCE_KEY);
    } catch (e) {
        console.error("Error cargando la preferencia de tema desde localStorage:", e);
        // Continuar con el tema por defecto del sistema o el claro si localStorage falla.
    }

    if (theme === 'dark') {
        dom.htmlElement.classList.add('dark');
        updateThemeButtonIcon(true);
    } else {
        // Por defecto, o si el tema es 'light', asegurarse de que no esté el modo oscuro.
        dom.htmlElement.classList.remove('dark');
        updateThemeButtonIcon(false);
    }
    // La actualización del gráfico se gestionará de forma centralizada en main.js
    // después de que todos los datos iniciales y el estado del tema se hayan establecido.
};