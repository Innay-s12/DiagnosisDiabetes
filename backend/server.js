// ==================== IMPORT ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== LOG ====================
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ ==================== ROOT ROUTE (WAJIB UNTUK RAILWAY) ====================
app.get('/', (req, res) => {
    res.status(200).send('🚀 Diabetes Diagnosis API is running');
});

// ==================== STATIC FRONTEND ====================
const staticPath = path.join(__dirname, '../frontend');
if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
}

// ==================== MOCK DATABASE ====================
const mockDB = {
    query: (sql, params, callback) => {
        setTimeout(() => {
            if (sql.includes('SELECT 1 + 1')) {
                callback(null, [{ result: 2 }]);
            } else if (sql.includes('admin')) {
                callback(null, [
                    { name: 'admin', sandi: 111111 },
                    { name: 'inay', sandi: 111111 }
                ]);
            } else if (sql.includes('users')) {
                callback(null, [
                    { id: 1, nama_lengkap: 'John Doe', usia: 30, jenis_kelamin: 'L' },
                    { id: 2, nama_lengkap: 'Jane Smith', usia: 25, jenis_kelamin: 'P' }
                ]);
            } else if (sql.includes('symptoms')) {
                callback(null, [
                    { id: 1, kode_gejala: 'G01', nama_gejala: 'Sering Haus', bobot: 2 },
                    { id: 2, kode_gejala: 'G02', nama_gejala: 'Sering Buang Air', bobot: 3 },
                    { id: 3, kode_gejala: 'G03', nama_gejala: 'Lelah Berlebihan', bobot: 2 }
                ]);
            } else if (
                sql.includes('INSERT') ||
                sql.includes('UPDATE') ||
                sql.includes('DELETE')
            ) {
                callback(null, { insertId: 1, affectedRows: 1 });
            } else {
                callback(null, []);
            }
        }, 50);
    }
};

const executeQuery = (sql, params = []) =>
    new Promise((resolve, reject) => {
        mockDB.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// ==================== API ENDPOINTS ====================

// TEST DB
app.get('/test-db', async (req, res) => {
    const result = await executeQuery('SELECT 1 + 1 AS result');
    res.json(result[0]);
});

// ADMIN LOGIN
app.get('/admin/login', (req, res) => {
    res.json({ message: 'Gunakan POST' });
});

app.post('/admin/login', async (req, res) => {
    const { name, sandi } = req.body;
    const admins = await executeQuery('SELECT * FROM admin');
    const admin = admins.find(a => a.name === name && a.sandi == sandi);

    if (!admin) {
        return res.status(401).json({ error: 'Login gagal' });
    }

    res.json({ success: true, admin });
});

// USERS
app.get('/api/users', async (req, res) => {
    const users = await executeQuery('SELECT * FROM users');
    res.json(users);
});

// SYMPTOMS
app.get('/api/symptoms', async (req, res) => {
    const symptoms = await executeQuery('SELECT * FROM symptoms');
    res.json(symptoms);
});

// DIAGNOSIS
app.post('/api/diagnosis/process', async (req, res) => {
    const { symptoms = [] } = req.body;
    const score = symptoms.length * 20;

    let risk = 'Rendah';
    if (score > 70) risk = 'Tinggi';
    else if (score > 40) risk = 'Sedang';

    res.json({
        skor: score,
        risiko: risk,
        rekomendasi: 'Periksa ke dokter'
    });
});

// HISTORY
app.get('/api/diagnoses', async (req, res) => {
    res.json([]);
});

// RECOMMENDATIONS
app.get('/api/recommendations', async (req, res) => {
    res.json([]);
});

// INFO
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Diabetes Diagnosis System',
        status: 'online'
    });
});

// STATS
app.get('/api/stats', (req, res) => {
    res.json({
        total_users: 15,
        total_diagnoses: 42
    });
});

// ==================== 404 ====================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ==================== START ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Server running on port', PORT);
});
