// ==================== IMPORT ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2'); // Wajib pakai mysql2

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATABASE CONNECTION (REAL) ====================
// Mengambil variabel dari Railway Environment
const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper untuk menjalankan query dengan Promise
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

// Log setiap request yang masuk
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
    res.status(200).send('🚀 Diabetes Diagnosis API is running on Railway');
});

// ==================== STATIC FRONTEND ====================
const staticPath = path.join(__dirname, '../frontend');
if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
}

// ==================== API ENDPOINTS ====================

// 1. TEST KONEKSI DB
app.get('/test-db', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 + 1 AS result');
        res.json({ status: 'Connected', data: result[0] });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
});

// 2. ADMIN LOGIN (Real Check to DB)
app.post('/admin/login', async (req, res) => {
    const { name, sandi } = req.body;
    try {
        const sql = 'SELECT * FROM admin WHERE name = ? AND sandi = ?';
        const results = await executeQuery(sql, [name, sandi]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'Username atau Password salah' });
        }

        res.json({ success: true, admin: results[0] });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// 3. GET ALL USERS
app.get('/api/users', async (req, res) => {
    try {
        const users = await executeQuery('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. GET ALL SYMPTOMS
app.get('/api/symptoms', async (req, res) => {
    try {
        const symptoms = await executeQuery('SELECT * FROM symptoms');
        res.json(symptoms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. DIAGNOSIS PROCESS (Bisa dikembangkan sesuai logika pakar kamu)
app.post('/api/diagnosis/process', async (req, res) => {
    const { symptoms = [] } = req.body;
    // Contoh logika sederhana (Skor berdasarkan jumlah gejala)
    const score = symptoms.length * 20;

    let risk = 'Rendah';
    if (score > 70) risk = 'Tinggi';
    else if (score > 40) risk = 'Sedang';

    res.json({
        skor: score,
        risiko: risk,
        rekomendasi: 'Segera konsultasikan dengan dokter spesialis dalam.'
    });
});

// 6. HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is live on port ${PORT}`);
});
