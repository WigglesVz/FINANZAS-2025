// src/api/cryptoAPI.js

import { showToast } from '../js/utils.js';

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Caché en memoria simple con tiempo de expiración para evitar llamadas excesivas
const apiCache = new Map();
const CACHE_DURATION_MS = 1 * 60 * 1000; // 5 minutos

/**
 * Realiza una petición fetch a la API con manejo de caché.
 * @param {string} endpoint - El endpoint de la API a consultar.
 * @returns {Promise<any>} Los datos de la respuesta en formato JSON.
 */
const fetchWithCache = async (endpoint) => {
    const cacheKey = endpoint;
    const cachedItem = apiCache.get(cacheKey);

    if (cachedItem && Date.now() < cachedItem.expiry) {
        console.log(`[CryptoAPI] Sirviendo desde caché para: ${endpoint}`);
        return cachedItem.data;
    }

    console.log(`[CryptoAPI] Realizando petición de red para: ${endpoint}`);
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        const data = await response.json();
        
        // Almacenar en caché con una marca de tiempo de expiración
        apiCache.set(cacheKey, {
            data: data,
            expiry: Date.now() + CACHE_DURATION_MS
        });
        
        return data;
    } catch (error) {
        console.error(`[CryptoAPI] Error al hacer fetch a '${endpoint}':`, error);
        showToast(`Error de API: ${error.message}`, 'error');
        // Si hay un error, devolvemos el dato cacheado si existe, aunque esté expirado,
        // para no romper la UI si la API está temporalmente caída.
        if (cachedItem) {
            console.warn(`[CryptoAPI] Sirviendo dato expirado de caché debido a un error de red.`);
            return cachedItem.data;
        }
        throw error;
    }
};

/**
 * Obtiene la lista de las 100 criptomonedas principales por capitalización de mercado.
 * @returns {Promise<Array<object>>} Una lista de objetos de monedas.
 */
export const getTop100Coins = async () => {
    const endpoint = 'coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';
    const data = await fetchWithCache(endpoint);
    // Mapeamos a un formato más simple y útil para nuestra aplicación
    return data.map(coin => ({
        id: coin.id,        // ej: "bitcoin"
        symbol: coin.symbol.toUpperCase(), // ej: "BTC"
        name: coin.name     // ej: "Bitcoin"
    }));
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
    const endpoint = `coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;
    const data = await fetchWithCache(endpoint);
    // Devolvemos el array completo de datos
    return data;
};