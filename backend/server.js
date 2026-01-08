// ==================== IMPORT ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATABASE CONNECTION ====================
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'diabetes_db',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) {
                console.error("❌ Database Error:", err.message);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// ==================== STATIC FRONTEND ====================
const staticPath = path.join(__dirname, '../frontend');
if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
} else {
    app.use(express.static(path.join(__dirname)));
}

// ==================== API ENDPOINTS ====================

// 1. TEST KONEKSI DB
app.get('/test-db', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 + 1 AS result');
        res.json({ success: true, status: 'Connected', data: result[0] });
    } catch (error) {
        res.status(500).json({ success: false, status: 'Error', message: error.message });
    }
});

// 2. HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), message: 'API is healthy' });
});

// 3. ADMIN LOGIN
app.post('/admin/login', async (req, res) => {
    const { name, sandi } = req.body;
    try {
        const sql = 'SELECT * FROM admin WHERE name = ? AND sandi = ?';
        const results = await executeQuery(sql, [name, sandi]);

        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Username atau Password salah' 
            });
        }

        const admin = results[0];
        res.json({ 
            success: true, 
            admin: {
                id: admin.id,
                name: admin.name,
                nama_lengkap: admin.nama_lengkap || admin.name,
                email: admin.email || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed' 
        });
    }
});

// 4. GET ALL USERS
app.get('/api/users', async (req, res) => {
    try {
        const users = await executeQuery('SELECT * FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. GET ALL SYMPTOMS
app.get('/api/symptoms', async (req, res) => {
    try {
        const symptoms = await executeQuery('SELECT * FROM symptoms ORDER BY id DESC');
        res.json(symptoms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. GET ALL DIAGNOSES
app.get('/api/diagnoses', async (req, res) => {
    try {
        const diagnoses = await executeQuery(`
            SELECT d.*, u.nama_lengkap 
            FROM diagnoses d 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC
        `);
        res.json(diagnoses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. GET ALL RECOMMENDATIONS
app.get('/api/recommendations', async (req, res) => {
    try {
        const recommendations = await executeQuery('SELECT * FROM recommendations ORDER BY id DESC');
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. GET DASHBOARD STATS
app.get('/api/stats', async (req, res) => {
    try {
        const [
            usersCount,
            diagnosesCount,
            symptomsCount,
            recommendationsCount
        ] = await Promise.all([
            executeQuery('SELECT COUNT(*) as count FROM users'),
            executeQuery('SELECT COUNT(*) as count FROM diagnoses'),
            executeQuery('SELECT COUNT(*) as count FROM symptoms'),
            executeQuery('SELECT COUNT(*) as count FROM recommendations')
        ]);

        res.json({
            total_users: usersCount[0].count,
            total_diagnoses: diagnosesCount[0].count,
            total_symptoms: symptomsCount[0].count,
            total_recommendations: recommendationsCount[0].count,
            last_updated: new Date()
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            error: error.message,
            total_users: 0,
            total_diagnoses: 0,
            total_symptoms: 0,
            total_recommendations: 0
        });
    }
});

// 9. DIAGNOSIS PROCESS
app.post('/api/diagnosis/process', async (req, res) => {
    const { symptoms = [], user_id } = req.body;
    
    try {
        // Contoh logika sederhana
        const score = symptoms.length * 20;
        let tingkat_risiko = 'Rendah';
        
        if (score > 70) tingkat_risiko = 'Tinggi';
        else if (score > 40) tingkat_risiko = 'Sedang';

        // Simpan ke database jika ada user_id
        if (user_id) {
            await executeQuery(
                'INSERT INTO diagnoses (user_id, skor_akhir, tingkat_risiko, gejala_terpilih) VALUES (?, ?, ?, ?)',
                [user_id, score, tingkat_risiko, JSON.stringify(symptoms)]
            );
        }

        res.json({
            success: true,
            skor_akhir: score,
            tingkat_risiko: tingkat_risiko,
            rekomendasi: 'Segera konsultasikan dengan dokter spesialis dalam.'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 10. SERVE ADMIN.HTML
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 11. SERVE LOGIN.HTML
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is live on port ${PORT}`);
    console.log(`📁 Static files from: ${staticPath}`);
});
