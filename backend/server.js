// server.js - SIMPLIFIED VERSION FOR RAILWAY
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ==================== BASIC MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILES ====================
const staticPath = path.join(__dirname, '../frontend');
console.log('📁 Looking for frontend at:', staticPath);

if (fs.existsSync(staticPath)) {
    console.log('✅ Frontend folder found');
    app.use(express.static(staticPath));
} else {
    console.log('⚠️  Frontend folder not found, serving API only');
    // Fallback for missing frontend
    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Diabetes Diagnosis System</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .endpoint { background: #f5f5f5; padding: 10px; margin: 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Diabetes Diagnosis API</h1>
                    <p>Backend API is running successfully!</p>
                    <p>If you see this page, frontend files are not deployed yet.</p>
                    
                    <h3>📡 Available Endpoints:</h3>
                    <div class="endpoint"><strong>GET /health</strong> - Health check</div>
                    <div class="endpoint"><strong>GET /api/info</strong> - API information</div>
                    <div class="endpoint"><strong>GET /test-db</strong> - Test database</div>
                    <div class="endpoint"><strong>POST /admin/login</strong> - Admin login</div>
                    
                    <h3>🔧 Environment:</h3>
                    <p>Port: ${PORT}</p>
                    <p>NODE_ENV: ${process.env.NODE_ENV || 'development'}</p>
                </div>
            </body>
            </html>
        `);
    });
}

// ==================== SIMPLE DATABASE MOCK ====================
console.log('💡 Using in-memory database (mock mode)');

const mockDB = {
    query: (sql, params, callback) => {
        console.log(`📝 Mock query: ${sql.substring(0, 50)}...`);
        
        setTimeout(() => {
            // Handle different queries
            if (sql.includes('SELECT 1 + 1')) {
                callback(null, [{ result: 2 }]);
            } 
            else if (sql.includes('admin')) {
                callback(null, [
                    { name: 'admin', sandi: 111111 },
                    { name: 'inay', sandi: 111111 }
                ]);
            }
            else if (sql.includes('users')) {
                callback(null, [
                    { id: 1, nama_lengkap: 'John Doe', usia: 30, jenis_kelamin: 'L' },
                    { id: 2, nama_lengkap: 'Jane Smith', usia: 25, jenis_kelamin: 'P' }
                ]);
            }
            else if (sql.includes('symptoms')) {
                callback(null = [
                    { id: 1, kode_gejala: 'G01', nama_gejala: 'Sering Haus', bobot: 2 },
                    { id: 2, kode_gejala: 'G02', nama_gejala: 'Sering Buang Air', bobot: 3 },
                    { id: 3, kode_gejala: 'G03', nama_gejala: 'Lelah Berlebihan', bobot: 2 }
                ]);
            }
            else if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
                callback(null, { insertId: 1, affectedRows: 1 });
            }
            else {
                callback(null, []);
            }
        }, 50);
    }
};

// Database helper
const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        mockDB.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// ==================== API ENDPOINTS ====================

// 1. HEALTH CHECK (Railway requires this!)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'diabetes-diagnosis-api',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        database: 'mock'
    });
});

// 2. TEST ENDPOINT
app.get('/test-db', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 + 1 AS result');
        res.json({
            success: true,
            message: 'Database test successful',
            data: result[0],
            mode: 'mock-database'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Database test failed',
            error: error.message
        });
    }
});

// 3. ADMIN LOGIN
app.get('/admin/login', (req, res) => {
    res.json({
        message: 'Admin login endpoint',
        method: 'POST with {name, sandi}',
        test_accounts: [
            { name: 'admin', sandi: 111111 },
            { name: 'inay', sandi: 111111 }
        ]
    });
});

app.post('/admin/login', async (req, res) => {
    try {
        const { name, sandi } = req.body;
        
        if (!name || !sandi) {
            return res.status(400).json({
                success: false,
                error: 'Name and password required'
            });
        }
        
        const results = await executeQuery('SELECT * FROM admin WHERE name = ?', [name]);
        
        if (results.length === 0 || results[0].sandi != sandi) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            admin: results[0]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});

// 4. USERS
app.get('/api/users', async (req, res) => {
    try {
        const users = await executeQuery('SELECT * FROM users ORDER BY id DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { nama_lengkap, usia, jenis_kelamin } = req.body;
        
        if (!nama_lengkap || !usia || !jenis_kelamin) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        
        const result = await executeQuery(
            'INSERT INTO users (nama_lengkap, usia, jenis_kelamin) VALUES (?, ?, ?)',
            [nama_lengkap, usia, jenis_kelamin]
        );
        
        res.json({
            success: true,
            message: 'User created',
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. SYMPTOMS
app.get('/api/symptoms', async (req, res) => {
    try {
        const symptoms = await executeQuery('SELECT * FROM symptoms ORDER BY id');
        res.json(symptoms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. DIAGNOSIS PROCESSING
app.post('/api/diagnosis/process', async (req, res) => {
    try {
        const { user_id, symptoms } = req.body;
        
        // Simple diagnosis logic
        const score = (symptoms || []).length * 20;
        let risk = 'Rendah';
        
        if (score > 70) risk = 'Tinggi';
        else if (score > 40) risk = 'Sedang';
        
        // Save to database
        await executeQuery(
            'INSERT INTO diagnoses (user_id, tingkat_risiko, skor_akhir) VALUES (?, ?, ?)',
            [user_id || 1, risk, score]
        );
        
        res.json({
            success: true,
            message: 'Diagnosis complete',
            tingkat_risiko: risk,
            skor_akhir: score,
            gejala: symptoms || [],
            rekomendasi: 'Konsultasi dengan dokter untuk pemeriksaan lebih lanjut'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. DIAGNOSES HISTORY
app.get('/api/diagnoses', async (req, res) => {
    try {
        const diagnoses = await executeQuery(`
            SELECT d.*, u.nama_lengkap 
            FROM diagnoses d 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY d.id DESC
        `);
        res.json(diagnoses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. RECOMMENDATIONS
app.get('/api/recommendations', async (req, res) => {
    try {
        const recommendations = await executeQuery('SELECT * FROM recommendations');
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 9. API INFO
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Diabetes Diagnosis Expert System',
        version: '2.0.0',
        status: 'online',
        environment: process.env.NODE_ENV || 'development',
        deployment: 'Railway',
        endpoints: [
            'GET    /health',
            'GET    /test-db',
            'GET    /admin/login',
            'POST   /admin/login',
            'GET    /api/users',
            'POST   /api/users',
            'GET    /api/symptoms',
            'POST   /api/diagnosis/process',
            'GET    /api/diagnoses',
            'GET    /api/recommendations',
            'GET    /api/info'
        ],
        timestamp: new Date().toISOString()
    });
});

// 10. STATISTICS
app.get('/api/stats', (req, res) => {
    res.json({
        total_users: 15,
        total_diagnoses: 42,
        total_symptoms: 8,
        risk_distribution: {
            tinggi: 10,
            sedang: 20,
            rendah: 12
        }
    });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        available: '/api/info'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Contact administrator' : err.message
    });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 DIABETES DIAGNOSIS SYSTEM');
    console.log('='.repeat(60));
    console.log(`✅ Server started successfully!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Database: Mock database`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`📊 API Info: http://localhost:${PORT}/api/info`);
    console.log('='.repeat(60) + '\n');
});

// Handle shutdown
process.on('SIGTERM', () => {
    console.log('👋 Shutting down gracefully...');
    process.exit(0);
});
