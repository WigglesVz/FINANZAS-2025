// src/js/theme.js

import { THEME_PREFERENCE_KEY } from './config.js';
import { htmlElement, themeToggleButton } from './domElements.js';
// import { renderTaskStatusChart } from './uiRender.js'; // Ya no se importa desde aquí
import { refreshCurrentChart } from './charts.js'; // Importar la función correcta para refrescar el gráfico

const saveThemePreference = () => {
    if (!htmlElement) return; // Protección
    const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem(THEME_PREFERENCE_KEY, currentTheme);
};

const updateThemeButtonIcon = (isDark) => {
    if (themeToggleButton) {
        const icon = themeToggleButton.querySelector('i');
        if (icon) {
            icon.classList.remove(isDark ? 'fa-sun' : 'fa-moon');
            icon.classList.add(isDark ? 'fa-moon' : 'fa-sun');
            themeToggleButton.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
            // El title ya se actualiza en el HTML directamente, pero podemos mantenerlo aquí por si acaso
            themeToggleButton.title = isDark ? 'Alternar Modo Día' : 'Alternar Modo Noche';
        }
    }
};

export const enableDarkMode = (save = true) => {
    if (!htmlElement) return;
    htmlElement.classList.add('dark');
    updateThemeButtonIcon(true);
    if (save) saveThemePreference();
    refreshCurrentChart(); // Actualizar el gráfico actual
};

export const disableDarkMode = (save = true) => {
    if (!htmlElement) return;
    htmlElement.classList.remove('dark');
    updateThemeButtonIcon(false);
    if (save) saveThemePreference();
    refreshCurrentChart(); // Actualizar el gráfico actual
};

export const toggleDarkMode = () => {
    if (!htmlElement) return;
    if (htmlElement.classList.contains('dark')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
};

export const loadThemePreference = () => {
    if (!htmlElement) { // Protección por si htmlElement no está listo
        console.warn("htmlElement not available during loadThemePreference");
        return;
    }
    const theme = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (theme === 'dark') {
        // Llamar a enableDarkMode sin guardar, pero también sin refrescar el gráfico aquí,
        // ya que el gráfico se renderizará después en main.js
        htmlElement.classList.add('dark');
        updateThemeButtonIcon(true);
    } else {
        htmlElement.classList.remove('dark');
        updateThemeButtonIcon(false);
    }
    // El refreshCurrentChart se hará en main.js después de que todo esté cargado y renderizado.
};