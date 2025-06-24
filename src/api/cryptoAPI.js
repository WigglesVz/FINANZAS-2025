// src/api/cryptoAPI.js

import { showToast } from '../js/utils.js'; // Ruta correcta desde src/api/ a src/js/

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Caché en memoria simple con tiempo de expiración para evitar llamadas excesivas
const apiCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos (ajustado desde 1 minuto para ser un poco más generoso)

/**
 * Realiza una petición fetch a la API con manejo de caché.
 * @param {string} endpoint - El endpoint de la API a consultar.
 * @returns {Promise<any>} Los datos de la respuesta en formato JSON.
 * @throws {Error} Si la respuesta de la red no es ok y no hay caché válido.
 */
const fetchWithCache = async (endpoint) => {
    const cacheKey = endpoint;
    const cachedItem = apiCache.get(cacheKey);

    if (cachedItem && Date.now() < cachedItem.expiry) {
        console.log(`[CryptoAPI] Sirviendo desde caché para: ${endpoint}`);
        return cachedItem.data;
    }

    console.log(`[CryptoAPI] Realizando petición de red para: ${API_BASE_URL}/${endpoint}`);
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            // Intentar obtener más detalles del error si la API los proporciona en JSON
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (e) {
                // Si el cuerpo del error no es JSON, usar el statusText
            }
            const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText || 'Error desconocido de red'}`;
            console.error(`[CryptoAPI] Error en la respuesta de la API para '${endpoint}': ${errorMessage}`, errorData);
            throw new Error(errorMessage); // Lanzar el error para que sea capturado por el bloque catch principal
        }
        const data = await response.json();

        // Almacenar en caché con una marca de tiempo de expiración
        apiCache.set(cacheKey, {
            data: data,
            expiry: Date.now() + CACHE_DURATION_MS
        });

        return data;
    } catch (error) {
        // El error ya debería haber sido logueado por el if (!response.ok)
        // o por el fetch mismo si fue un error de red.
        // Solo mostramos el toast y consideramos si devolvemos caché expirado.
        console.error(`[CryptoAPI] Error final en fetchWithCache para '${endpoint}':`, error.message);
        showToast(`Error de API: ${error.message}`, 'error');

        // Si hay un error, devolvemos el dato cacheado si existe, aunque esté expirado,
        // para no romper la UI si la API está temporalmente caída.
        if (cachedItem) {
            console.warn(`[CryptoAPI] Sirviendo dato expirado de caché para ${endpoint} debido a un error de red.`);
            return cachedItem.data;
        }
        // Si no hay caché y la petición falló, re-lanzamos el error para que el llamador lo maneje.
        throw error;
    }
};

/**
 * Obtiene la lista de las 100 criptomonedas principales por capitalización de mercado.
 * @returns {Promise<Array<object>>} Una lista de objetos de monedas.
 */
export const getTop100Coins = async () => {
    // Incluir sparkline=false ya que no se usa directamente aquí, y puede ahorrar datos.
    const endpoint = 'coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';
    try {
        const data = await fetchWithCache(endpoint);
        // Mapeamos a un formato más simple y útil para nuestra aplicación
        return data.map(coin => ({
            id: coin.id,        // ej: "bitcoin"
            symbol: coin.symbol.toUpperCase(), // ej: "BTC"
            name: coin.name     // ej: "Bitcoin"
        }));
    } catch (error) {
        console.error("[CryptoAPI] Fallo al obtener top 100 monedas:", error.message);
        return []; // Devolver array vacío en caso de error para no romper la UI
    }
};

/**
 * Obtiene los datos de mercado completos para una lista de IDs de monedas.
 * @param {Array<string>} coinIds - Un array de IDs de CoinGecko (ej. ['bitcoin', 'ethereum']).
 * @returns {Promise<Array<object>>} Una lista con los datos de mercado de cada moneda.
 */
export const getMarketDataForCoins = async (coinIds) => {
    if (!coinIds || coinIds.length === 0) {
        return [];
    }
    const idsString = coinIds.join(',');
    // Incluir price_change_percentage=24h si se va a usar, y sparkline=true para los gráficos.
    const endpoint = `coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    try {
        const data = await fetchWithCache(endpoint);
        return data; // Devolvemos el array completo de datos
    } catch (error) {
        console.error(`[CryptoAPI] Fallo al obtener datos de mercado para IDs [${idsString}]:`, error.message);
        return []; // Devolver array vacío en caso de error
    }
};