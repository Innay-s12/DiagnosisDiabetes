const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Koneksi ke database
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'diabetes'
});

// Coba koneksi ke database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.log('Pastikan:');
        console.log('1. MySQL/MariaDB sedang berjalan');
        console.log('2. Database "diabetes" sudah dibuat');
        console.log('3. Username dan password sesuai');
        return;
    }
    console.log('✅ Connected to MySQL database successfully');
});

// ==================== ENDPOINT SEDERHANA UNTUK TESTING ====================

// Test endpoint untuk cek koneksi
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS result', (err, results) => {
        if (err) {
            console.error('Database test failed:', err);
            res.status(500).json({ 
                error: 'Database connection failed',
                details: err.message 
            });
            return;
        }
        res.json({ 
            message: 'Database connection successful',
            result: results[0].result 
        });
    });
});

// ==================== USERS CRUD ====================

// Get semua users
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    
    console.log('Executing query:', query);
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ 
                error: 'Failed to fetch users',
                details: err.message,
                sqlMessage: err.sqlMessage 
            });
            return;
        }
        
        console.log('Found', results.length, 'users');
        res.json(results);
    });
});

// Get user by ID
app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT * FROM users WHERE id = ?';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Failed to fetch user' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        res.json(results[0]);
    });
});

// Create new user
app.post('/users', (req, res) => {
    const { nama_lengkap, usia, jenis_kelamin } = req.body;
    
    console.log('Creating user:', req.body);
    
    if (!nama_lengkap || !usia || !jenis_kelamin) {
        res.status(400).json({ 
            error: 'Missing required fields',
            required: ['nama_lengkap', 'usia', 'jenis_kelamin'],
            received: req.body
        });
        return;
    }
    
    const query = 'INSERT INTO users (nama_lengkap, usia, jenis_kelamin) VALUES (?, ?, ?)';
    
    db.query(query, [nama_lengkap, usia, jenis_kelamin], (err, result) => {
        if (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ 
                error: 'Failed to create user',
                details: err.message 
            });
            return;
        }
        
        console.log('User created with ID:', result.insertId);
        
        // Get the created user
        db.query('SELECT * FROM users WHERE id = ?', [result.insertId], (err, userResult) => {
            if (err) {
                res.json({
                    success: true,
                    message: 'User created successfully',
                    id: result.insertId
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'User created successfully',
                id: result.insertId,
                user: userResult[0]
            });
        });
    });
});

// Update user
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { nama_lengkap, usia, jenis_kelamin } = req.body;
    
    console.log('Updating user ID:', userId, 'Data:', req.body);
    
    // Check if user exists
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            res.status(500).json({ error: 'Failed to check user' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (nama_lengkap !== undefined) {
            updates.push('nama_lengkap = ?');
            values.push(nama_lengkap);
        }
        if (usia !== undefined) {
            updates.push('usia = ?');
            values.push(usia);
        }
        if (jenis_kelamin !== undefined) {
            updates.push('jenis_kelamin = ?');
            values.push(jenis_kelamin);
        }
        
        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        
        values.push(userId);
        
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating user:', err);
                res.status(500).json({ 
                    error: 'Failed to update user',
                    details: err.message 
                });
                return;
            }
            
            console.log('User updated, affected rows:', result.affectedRows);
            
            // Get updated user
            db.query('SELECT * FROM users WHERE id = ?', [userId], (err, userResult) => {
                if (err) {
                    res.json({
                        success: true,
                        message: 'User updated successfully',
                        affectedRows: result.affectedRows
                    });
                    return;
                }
                
                res.json({
                    success: true,
                    message: 'User updated successfully',
                    affectedRows: result.affectedRows,
                    user: userResult[0]
                });
            });
        });
    });
});

// Delete user
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    
    console.log('Deleting user ID:', userId);
    
    // Check if user exists
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            res.status(500).json({ error: 'Failed to check user' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Delete user symptoms first (foreign key constraint)
        db.query('DELETE FROM user_symptoms WHERE user_id = ?', [userId], (err) => {
            if (err) {
                console.error('Error deleting user symptoms:', err);
                // Continue anyway
            }
            
            // Delete user diagnoses
            db.query('DELETE FROM diagnoses WHERE user_id = ?', [userId], (err) => {
                if (err) {
                    console.error('Error deleting user diagnoses:', err);
                    // Continue anyway
                }
                
                // Delete user
                const query = 'DELETE FROM users WHERE id = ?';
                
                db.query(query, [userId], (err, result) => {
                    if (err) {
                        console.error('Error deleting user:', err);
                        res.status(500).json({ 
                            error: 'Failed to delete user',
                            details: err.message 
                        });
                        return;
                    }
                    
                    console.log('User deleted, affected rows:', result.affectedRows);
                    res.json({
                        success: true,
                        message: 'User deleted successfully',
                        affectedRows: result.affectedRows,
                        deletedUserId: userId
                    });
                });
            });
        });
    });
});

// ==================== SYMPTOMS CRUD ====================

// Get semua gejala (symptoms)
app.get('/symptoms', (req, res) => {
    const query = 'SELECT * FROM symptoms ORDER BY id';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching symptoms:', err);
            res.status(500).json({ 
                error: 'Failed to fetch symptoms',
                details: err.message 
            });
            return;
        }
        
        console.log('Found', results.length, 'symptoms');
        res.json(results);
    });
});

// Get symptom by ID
app.get('/symptoms/:id', (req, res) => {
    const symptomId = req.params.id;
    const query = 'SELECT * FROM symptoms WHERE id = ?';
    
    db.query(query, [symptomId], (err, results) => {
        if (err) {
            console.error('Error fetching symptom:', err);
            res.status(500).json({ error: 'Failed to fetch symptom' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Symptom not found' });
            return;
        }
        
        res.json(results[0]);
    });
});

// Create new symptom
app.post('/symptoms', (req, res) => {
    const { kode_gejala, nama_gejala, deskripsi, tingkat_keparahan, bobot } = req.body;
    
    console.log('Creating symptom:', req.body);
    
    if (!kode_gejala || !nama_gejala || !tingkat_keparahan || bobot === undefined) {
        res.status(400).json({ 
            error: 'Missing required fields',
            required: ['kode_gejala', 'nama_gejala', 'tingkat_keparahan', 'bobot'],
            received: req.body
        });
        return;
    }
    
    const query = 'INSERT INTO symptoms (kode_gejala, nama_gejala, deskripsi, tingkat_keparahan, bobot) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [kode_gejala, nama_gejala, deskripsi || null, tingkat_keparahan, bobot], (err, result) => {
        if (err) {
            console.error('Error creating symptom:', err);
            res.status(500).json({ 
                error: 'Failed to create symptom',
                details: err.message 
            });
            return;
        }
        
        console.log('Symptom created with ID:', result.insertId);
        
        // Get the created symptom
        db.query('SELECT * FROM symptoms WHERE id = ?', [result.insertId], (err, symptomResult) => {
            if (err) {
                res.json({
                    success: true,
                    message: 'Symptom created successfully',
                    id: result.insertId
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Symptom created successfully',
                id: result.insertId,
                symptom: symptomResult[0]
            });
        });
    });
});

// Update symptom
app.put('/symptoms/:id', (req, res) => {
    const symptomId = req.params.id;
    const { kode_gejala, nama_gejala, deskripsi, tingkat_keparahan, bobot } = req.body;
    
    console.log('Updating symptom ID:', symptomId, 'Data:', req.body);
    
    // Check if symptom exists
    db.query('SELECT * FROM symptoms WHERE id = ?', [symptomId], (err, results) => {
        if (err) {
            console.error('Error checking symptom:', err);
            res.status(500).json({ error: 'Failed to check symptom' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Symptom not found' });
            return;
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (kode_gejala !== undefined) {
            updates.push('kode_gejala = ?');
            values.push(kode_gejala);
        }
        if (nama_gejala !== undefined) {
            updates.push('nama_gejala = ?');
            values.push(nama_gejala);
        }
        if (deskripsi !== undefined) {
            updates.push('deskripsi = ?');
            values.push(deskripsi);
        }
        if (tingkat_keparahan !== undefined) {
            updates.push('tingkat_keparahan = ?');
            values.push(tingkat_keparahan);
        }
        if (bobot !== undefined) {
            updates.push('bobot = ?');
            values.push(bobot);
        }
        
        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        
        values.push(symptomId);
        
        const query = `UPDATE symptoms SET ${updates.join(', ')} WHERE id = ?`;
        
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating symptom:', err);
                res.status(500).json({ 
                    error: 'Failed to update symptom',
                    details: err.message 
                });
                return;
            }
            
            console.log('Symptom updated, affected rows:', result.affectedRows);
            
            // Get updated symptom
            db.query('SELECT * FROM symptoms WHERE id = ?', [symptomId], (err, symptomResult) => {
                if (err) {
                    res.json({
                        success: true,
                        message: 'Symptom updated successfully',
                        affectedRows: result.affectedRows
                    });
                    return;
                }
                
                res.json({
                    success: true,
                    message: 'Symptom updated successfully',
                    affectedRows: result.affectedRows,
                    symptom: symptomResult[0]
                });
            });
        });
    });
});

// Delete symptom
app.delete('/symptoms/:id', (req, res) => {
    const symptomId = req.params.id;
    
    console.log('Deleting symptom ID:', symptomId);
    
    // Check if symptom exists
    db.query('SELECT * FROM symptoms WHERE id = ?', [symptomId], (err, results) => {
        if (err) {
            console.error('Error checking symptom:', err);
            res.status(500).json({ error: 'Failed to check symptom' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Symptom not found' });
            return;
        }
        
        // Check if symptom is used in user_symptoms
        db.query('SELECT COUNT(*) as count FROM user_symptoms WHERE symptom_id = ?', [symptomId], (err, usageResult) => {
            if (err) {
                console.error('Error checking symptom usage:', err);
                // Continue anyway
            }
            
            if (usageResult && usageResult[0].count > 0) {
                // Option 1: Delete related user_symptoms first
                db.query('DELETE FROM user_symptoms WHERE symptom_id = ?', [symptomId], (err) => {
                    if (err) {
                        console.error('Error deleting related user symptoms:', err);
                        res.status(400).json({ 
                            error: 'Cannot delete symptom. It is being used by users.',
                            usageCount: usageResult[0].count
                        });
                        return;
                    }
                    
                    // Now delete the symptom
                    deleteSymptom();
                });
            } else {
                // Delete symptom directly
                deleteSymptom();
            }
        });
        
        function deleteSymptom() {
            const query = 'DELETE FROM symptoms WHERE id = ?';
            
            db.query(query, [symptomId], (err, result) => {
                if (err) {
                    console.error('Error deleting symptom:', err);
                    res.status(500).json({ 
                        error: 'Failed to delete symptom',
                        details: err.message 
                    });
                    return;
                }
                
                console.log('Symptom deleted, affected rows:', result.affectedRows);
                res.json({
                    success: true,
                    message: 'Symptom deleted successfully',
                    affectedRows: result.affectedRows,
                    deletedSymptomId: symptomId
                });
            });
        }
    });
});

// ==================== RECOMMENDATIONS CRUD ====================

// Get all recommendations
app.get('/recommendations', (req, res) => {
    const query = 'SELECT * FROM recommendations ORDER BY id';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching recommendations:', err);
            res.status(500).json({ error: 'Failed to fetch recommendations' });
            return;
        }
        
        console.log('Found', results.length, 'recommendations');
        res.json(results);
    });
});

// Get recommendation by ID
app.get('/recommendations/:id', (req, res) => {
    const recommendationId = req.params.id;
    const query = 'SELECT * FROM recommendations WHERE id = ?';
    
    db.query(query, [recommendationId], (err, results) => {
        if (err) {
            console.error('Error fetching recommendation:', err);
            res.status(500).json({ error: 'Failed to fetch recommendation' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Recommendation not found' });
            return;
        }
        
        res.json(results[0]);
    });
});

// Create new recommendation (SESUAI DENGAN DATABASE ANDA)
app.post('/recommendations', (req, res) => {
    const { kategori, judul, deskripsi, untuk_tingkat_risiko } = req.body;
    
    console.log('Creating recommendation:', req.body);
    
    if (!kategori || !judul || !deskripsi || !untuk_tingkat_risiko) {
        res.status(400).json({ 
            error: 'Missing required fields',
            required: ['kategori', 'judul', 'deskripsi', 'untuk_tingkat_risiko'],
            received: req.body
        });
        return;
    }
    
    const query = 'INSERT INTO recommendations (kategori, judul, deskripsi, untuk_tingkat_risiko) VALUES (?, ?, ?, ?)';
    
    db.query(query, [kategori, judul, deskripsi, untuk_tingkat_risiko], (err, result) => {
        if (err) {
            console.error('Error creating recommendation:', err);
            res.status(500).json({ 
                error: 'Failed to create recommendation',
                details: err.message 
            });
            return;
        }
        
        console.log('Recommendation created with ID:', result.insertId);
        
        // Get the created recommendation
        db.query('SELECT * FROM recommendations WHERE id = ?', [result.insertId], (err, recResult) => {
            if (err) {
                res.json({
                    success: true,
                    message: 'Recommendation created successfully',
                    id: result.insertId
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Recommendation created successfully',
                id: result.insertId,
                recommendation: recResult[0]
            });
        });
    });
});

// Update recommendation (SESUAI DENGAN DATABASE ANDA)
app.put('/recommendations/:id', (req, res) => {
    const recommendationId = req.params.id;
    const { kategori, judul, deskripsi, untuk_tingkat_risiko } = req.body;
    
    console.log('Updating recommendation ID:', recommendationId, 'Data:', req.body);
    
    // Check if recommendation exists
    db.query('SELECT * FROM recommendations WHERE id = ?', [recommendationId], (err, results) => {
        if (err) {
            console.error('Error checking recommendation:', err);
            res.status(500).json({ error: 'Failed to check recommendation' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Recommendation not found' });
            return;
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (kategori !== undefined) {
            updates.push('kategori = ?');
            values.push(kategori);
        }
        if (judul !== undefined) {
            updates.push('judul = ?');
            values.push(judul);
        }
        if (deskripsi !== undefined) {
            updates.push('deskripsi = ?');
            values.push(deskripsi);
        }
        if (untuk_tingkat_risiko !== undefined) {
            updates.push('untuk_tingkat_risiko = ?');
            values.push(untuk_tingkat_risiko);
        }
        
        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        
        values.push(recommendationId);
        
        const query = `UPDATE recommendations SET ${updates.join(', ')} WHERE id = ?`;
        
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating recommendation:', err);
                res.status(500).json({ 
                    error: 'Failed to update recommendation',
                    details: err.message 
                });
                return;
            }
            
            console.log('Recommendation updated, affected rows:', result.affectedRows);
            
            // Get updated recommendation
            db.query('SELECT * FROM recommendations WHERE id = ?', [recommendationId], (err, recResult) => {
                if (err) {
                    res.json({
                        success: true,
                        message: 'Recommendation updated successfully',
                        affectedRows: result.affectedRows
                    });
                    return;
                }
                
                res.json({
                    success: true,
                    message: 'Recommendation updated successfully',
                    affectedRows: result.affectedRows,
                    recommendation: recResult[0]
                });
            });
        });
    });
});

// Delete recommendation
app.delete('/recommendations/:id', (req, res) => {
    const recommendationId = req.params.id;
    
    console.log('Deleting recommendation ID:', recommendationId);
    
    // Check if recommendation exists
    db.query('SELECT * FROM recommendations WHERE id = ?', [recommendationId], (err, results) => {
        if (err) {
            console.error('Error checking recommendation:', err);
            res.status(500).json({ error: 'Failed to check recommendation' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Recommendation not found' });
            return;
        }
        
        const query = 'DELETE FROM recommendations WHERE id = ?';
        
        db.query(query, [recommendationId], (err, result) => {
            if (err) {
                console.error('Error deleting recommendation:', err);
                res.status(500).json({ 
                    error: 'Failed to delete recommendation',
                    details: err.message 
                });
                return;
            }
            
            console.log('Recommendation deleted, affected rows:', result.affectedRows);
            res.json({
                success: true,
                message: 'Recommendation deleted successfully',
                affectedRows: result.affectedRows,
                deletedRecommendationId: recommendationId
            });
        });
    });
});

// ==================== EXISTING ENDPOINTS ====================

// Get symptoms by user ID
app.get('/user/:id/symptoms', (req, res) => {
    const userId = req.params.id;
    const query = `
        SELECT us.*, s.kode_gejala, s.nama_gejala, s.bobot, s.tingkat_keparahan
        FROM user_symptoms us
        JOIN symptoms s ON us.symptom_id = s.id
        WHERE us.user_id = ?
        ORDER BY us.created_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user symptoms:', err);
            res.status(500).json({ error: 'Failed to fetch user symptoms' });
            return;
        }
        
        console.log('Found', results.length, 'symptoms for user', userId);
        res.json(results);
    });
});

// Add symptom to user
app.post('/user-symptoms', (req, res) => {
    const { user_id, symptom_id } = req.body;
    
    console.log('Adding symptom to user:', { user_id, symptom_id });
    
    if (!user_id || !symptom_id) {
        res.status(400).json({ error: 'Missing user_id or symptom_id' });
        return;
    }
    
    const query = 'INSERT INTO user_symptoms (user_id, symptom_id) VALUES (?, ?)';
    
    db.query(query, [user_id, symptom_id], (err, result) => {
        if (err) {
            console.error('Error adding user symptom:', err);
            res.status(500).json({ 
                error: 'Failed to add symptom to user',
                details: err.message 
            });
            return;
        }
        
        console.log('Symptom added with ID:', result.insertId);
        res.json({
            success: true,
            message: 'Symptom added to user successfully',
            id: result.insertId
        });
    });
});

// Get semua diagnosis
app.get('/diagnoses', (req, res) => {
    const query = `
        SELECT d.*, u.nama_lengkap 
        FROM diagnoses d 
        LEFT JOIN users u ON d.user_id = u.id 
        ORDER BY d.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching diagnoses:', err);
            res.status(500).json({ 
                error: 'Failed to fetch diagnoses',
                details: err.message 
            });
            return;
        }
        
        console.log('Found', results.length, 'diagnoses');
        res.json(results);
    });
});

// Create diagnosis
app.post('/diagnoses', (req, res) => {
    const { user_id, disease_id, tingkat_risiko, skor_akhir, rekomendasi_khusus } = req.body;
    
    console.log('Creating diagnosis:', req.body);
    
    if (!user_id || !tingkat_risiko || skor_akhir === undefined) {
        res.status(400).json({ 
            error: 'Missing required fields',
            required: ['user_id', 'tingkat_risiko', 'skor_akhir']
        });
        return;
    }
    
    const query = `
        INSERT INTO diagnoses 
        (user_id, disease_id, tingkat_risiko, skor_akhir, rekomendasi_khusus) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, [user_id, disease_id, tingkat_risiko, skor_akhir, rekomendasi_khusus || null], (err, result) => {
        if (err) {
            console.error('Error creating diagnosis:', err);
            res.status(500).json({ 
                error: 'Failed to create diagnosis',
                details: err.message 
            });
            return;
        }
        
        console.log('Diagnosis created with ID:', result.insertId);
        res.json({
            success: true,
            message: 'Diagnosis created successfully',
            id: result.insertId
        });
    });
});

// ==================== FORWARD CHAINING DIAGNOSIS ====================
app.post('/diagnosis/process', (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id wajib diisi' });
    }

    // 1️⃣ Ambil gejala user (FAKTA)
    const faktaQuery = `
        SELECT s.kode_gejala, s.bobot
        FROM user_symptoms us
        JOIN symptoms s ON us.symptom_id = s.id
        WHERE us.user_id = ?
    `;

    db.query(faktaQuery, [user_id], (err, fakta) => {
        if (err || fakta.length === 0) {
            return res.status(500).json({ error: 'Gagal mengambil fakta gejala' });
        }

        const faktaKode = fakta.map(f => f.kode_gejala);

        // 2️⃣ FORWARD CHAINING (RULE IF–THEN)
        let tingkat_risiko = 'Rendah';

        if (faktaKode.includes('G01') && faktaKode.includes('G02') && faktaKode.includes('G06')) {
            tingkat_risiko = 'Tinggi';
        }
        else if (faktaKode.includes('G01') && faktaKode.includes('G06')) {
            tingkat_risiko = 'Tinggi';
        }
        else if (faktaKode.includes('G02') && faktaKode.includes('G03')) {
            tingkat_risiko = 'Sedang';
        }
        else if (faktaKode.includes('G02') && faktaKode.includes('G06')) {
            tingkat_risiko = 'Sedang';
        }

        // 3️⃣ Hitung skor bobot
        let skor_akhir = 0;
        fakta.forEach(f => skor_akhir += Number(f.bobot));

        // 4️⃣ Simpan hasil diagnosis
        const insertDiagnosis = `
            INSERT INTO diagnoses (user_id, tingkat_risiko, skor_akhir)
            VALUES (?, ?, ?)
        `;

        db.query(insertDiagnosis, [user_id, tingkat_risiko, skor_akhir], (err2) => {
            if (err2) {
                return res.status(500).json({ error: 'Gagal menyimpan diagnosis' });
            }

            res.json({
                success: true,
                metode: 'Forward Chaining',
                fakta: faktaKode,
                tingkat_risiko,
                skor_akhir
            });
        });
    });
});


// Admin login - DIPERBAIKI SESUAI DATABASE
app.get('/admin/login', (req, res) => {
    res.json({
        message: 'Admin login endpoint',
        method: 'Use POST with {name, sandi}',
        note: 'Password adalah 6 digit angka',
        test_credentials: {
            name: 'inay',
            sandi: 111111
        }
    });
});

app.post('/admin/login', (req, res) => {
    const { name, sandi } = req.body;
    
    console.log('Admin login attempt:', { name, sandi });
    
    if (!name || sandi === undefined) {
        res.status(400).json({ error: 'Missing username or password' });
        return;
    }
    
    // Konversi sandi ke number karena di database bertipe INT
    const sandiNumber = parseInt(sandi);
    
    const query = 'SELECT * FROM admin WHERE name = ? AND sandi = ?';
    
    db.query(query, [name, sandiNumber], (err, results) => {
        if (err) {
            console.error('Error during admin login:', err);
            res.status(500).json({ error: 'Login failed' });
            return;
        }
        
        if (results.length === 0) {
            console.log('Login failed: Invalid credentials');
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        
        console.log('Login successful for admin:', name);
        res.json({
            success: true,
            message: 'Login successful',
            admin: results[0]
        });
    });
});

// Get dashboard stats
app.get('/stats', (req, res) => {
    const stats = {};
    
    // Get total users
    db.query('SELECT COUNT(*) as total_users FROM users', (err1, result1) => {
        if (!err1) stats.total_users = result1[0].total_users;
        
        // Get total diagnoses
        db.query('SELECT COUNT(*) as total_diagnoses FROM diagnoses', (err2, result2) => {
            if (!err2) stats.total_diagnoses = result2[0].total_diagnoses;
            
            // Get total symptoms
            db.query('SELECT COUNT(*) as total_symptoms FROM symptoms', (err3, result3) => {
                if (!err3) stats.total_symptoms = result3[0].total_symptoms;
                
                // Get total recommendations
                db.query('SELECT COUNT(*) as total_recommendations FROM recommendations', (err4, result4) => {
                    if (!err4) stats.total_recommendations = result4[0].total_recommendations;
                    
                    // Get risk distribution
                    db.query('SELECT tingkat_risiko, COUNT(*) as count FROM diagnoses GROUP BY tingkat_risiko', (err5, result5) => {
                        if (!err5) stats.risk_distribution = result5;
                        
                        // Get latest users
                        db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5', (err6, result6) => {
                            if (!err6) stats.latest_users = result6;
                            
                            // Get latest diagnoses
                            db.query(`
                                SELECT d.*, u.nama_lengkap 
                                FROM diagnoses d 
                                LEFT JOIN users u ON d.user_id = u.id 
                                ORDER BY d.created_at DESC LIMIT 5
                            `, (err7, result7) => {
                                if (!err7) stats.latest_diagnoses = result7;
                                
                                // Get latest symptoms
                                db.query('SELECT * FROM symptoms ORDER BY id DESC LIMIT 5', (err8, result8) => {
                                    if (!err8) stats.latest_symptoms = result8;
                                    
                                    // Get latest recommendations
                                    db.query('SELECT * FROM recommendations ORDER BY id DESC LIMIT 5', (err9, result9) => {
                                        if (!err9) stats.latest_recommendations = result9;
                                        
                                        res.json(stats);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Root endpoint with all available endpoints
app.get('/', (req, res) => {
    res.json({
        message: 'Diabetes Diagnosis API',
        status: 'running',
        version: '2.0.0',
        database: 'diabetes',
        endpoints: [
            '=== AUTH ===',
            'GET  /admin/login',
            'POST /admin/login',
            
            '=== USERS ===',
            'GET    /users',
            'GET    /users/:id',
            'POST   /users',
            'PUT    /users/:id',
            'DELETE /users/:id',
            
            '=== SYMPTOMS ===',
            'GET    /symptoms',
            'GET    /symptoms/:id',
            'POST   /symptoms',
            'PUT    /symptoms/:id',
            'DELETE /symptoms/:id',
            
            '=== RECOMMENDATIONS ===',
            'GET    /recommendations',
            'GET    /recommendations/:id',
            'POST   /recommendations',
            'PUT    /recommendations/:id',
            'DELETE /recommendations/:id',
            
            '=== DIAGNOSES ===',
            'GET    /diagnoses',
            'POST   /diagnoses',
            
            '=== USER SYMPTOMS ===',
            'GET    /user/:id/symptoms',
            'POST   /user-symptoms',
            
            '=== UTILITY ===',
            'GET    /test-db',
            'GET    /stats'
        ],
        note: 'Cek console/log untuk informasi debugging'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📊 Please check http://localhost:${port}/test-db to test database connection`);
    console.log(`📋 All endpoints: http://localhost:${port}/`);
});