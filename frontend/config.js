// config.js - API Configuration
(function() {
    // Base URL - Sesuaikan dengan environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    const BASE_URL = isLocalhost 
        ? 'http://localhost:3000' 
        : window.location.origin; // Untuk production
    
    // API Endpoints
    const ENDPOINTS = {
        USERS: '/api/users',
        DIAGNOSES: '/api/diagnoses',
        RECOMMENDATIONS: '/api/recommendations',
        SYMPTOMS: '/api/symptoms',
        STATS: '/api/stats',
        TEST_DB: '/test-db',
        HEALTH: '/health',
        LOGIN: '/admin/login',
        PROCESS_DIAGNOSIS: '/api/diagnosis/process'
    };
    
    // Helper function untuk fetch API
    async function fetchApi(endpoint, options = {}) {
        const url = BASE_URL + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            console.log(`🔗 Fetching: ${url}`);
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error(`❌ Fetch error for ${endpoint}:`, error.message);
            
            // Return empty array/object as fallback for dashboard
            if (endpoint === ENDPOINTS.STATS) {
                return {
                    total_users: 0,
                    total_diagnoses: 0,
                    total_symptoms: 0,
                    total_recommendations: 0
                };
            } else if ([ENDPOINTS.USERS, ENDPOINTS.DIAGNOSES, ENDPOINTS.SYMPTOMS, ENDPOINTS.RECOMMENDATIONS].includes(endpoint)) {
                return [];
            }
            
            throw error;
        }
    }
    
    // Export ke window object
    window.API_CONFIG = {
        BASE_URL,
        ENDPOINTS,
        fetchApi
    };
    
    console.log('✅ API Config loaded:', { BASE_URL, ENDPOINTS });
})();
