// frontend/js/config.js
// Konfigurasi API untuk semua halaman

const API_CONFIG = {
    // Base URL otomatis berdasarkan environment
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : 'https://your-backend-api.com', // Ganti dengan URL backend production Anda
    
    // Semua endpoint API (SESUAI DENGAN BACKEND KITA)
    ENDPOINTS: {
        // Authentication
        ADMIN_LOGIN: '/admin/login',
        
        // Data endpoints (SESUAI server.js kita)
        USERS: '/users',
        USER_DETAIL: (id) => `/users/${id}`,
        
        SYMPTOMS: '/symptoms',
        SYMPTOM_DETAIL: (id) => `/symptoms/${id}`,
        
        DIAGNOSES: '/diagnoses',
        DIAGNOSIS_DETAIL: (id) => `/diagnoses/${id}`,
        
        DISEASES: '/diseases',
        DISEASE_DETAIL: (id) => `/disease/${id}`,
        
        RECOMMENDATIONS: '/recommendations',
        RECOMMENDATION_DETAIL: (id) => `/recommendations/${id}`,
        
        USER_SYMPTOMS: '/user_symptoms',
        USER_SYMPTOMS_BY_USER: (userId) => `/user/${userId}/symptoms`,
        
        // Test & Stats
        TEST_DB: '/test-db',
        STATS: '/stats'
    },
    
    // Helper functions
    getUrl(endpoint) {
        return this.BASE_URL + endpoint;
    },
    
    async fetchApi(endpoint, options = {}) {
        const url = this.getUrl(endpoint);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // Untuk session cookies jika digunakan
        };
        
        try {
            console.log(`📡 API Request: ${url}`, options);
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error:`, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Success:`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    // Helper untuk method khusus
    async get(endpoint) {
        return this.fetchApi(endpoint, { method: 'GET' });
    },
    
    async post(endpoint, data) {
        return this.fetchApi(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.fetchApi(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.fetchApi(endpoint, { method: 'DELETE' });
    }
};

// Buat global untuk mudah diakses
window.API_CONFIG = API_CONFIG;

// Juga export untuk ES6 modules jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}

// Debug info
console.log('🔧 API Config loaded:', {
    BASE_URL: API_CONFIG.BASE_URL,
    currentHostname: window.location.hostname,
    currentOrigin: window.location.origin
});
