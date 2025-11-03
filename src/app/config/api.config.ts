export const API_CONFIG = {
  // URL base del backend
  BASE_URL: 'http://127.0.0.1:8000/api',

  // Endpoints específicos
  ENDPOINTS: {
    CATEGORIES: '/categories',
    CATEGORIES_INIT: '/categories/init',
    CATEGORIES_SYNC: '/categories/sync',
    CATEGORIES_STATUS: '/categories/status/check',
    TEST: '/test'
  },

  // Configuración de timeouts
  TIMEOUT: 5000, // 5 segundos

  // Configuración de reintentos
  MAX_RETRIES: 3,

  // Configuración de fallback
  USE_FALLBACK: true, // Usar categorías del frontend si el backend falla

  // Controlar qué endpoint usar para crear categorías y evitar doble POST
  // true => usar solo CATEGORIES_SYNC; false => usar solo CATEGORIES
  USE_SYNC_CREATE: true
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
