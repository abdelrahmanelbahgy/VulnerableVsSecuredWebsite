const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const { initSecurityDb } = require('./config/securityDb');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize the small SQLite security-training database (dummy data only)
initSecurityDb();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/security', require('./routes/security'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/diagnostics', require('./routes/diagnostics'));
app.use('/api/session', require('./routes/session'));

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Medical Clinic API is running' });
});

// ------------------------------------------------------------
// VULNERABLE (Information Disclosure): a debug endpoint left
// exposed, revealing internal configuration/environment details
// that should never be shown to a client.
// ------------------------------------------------------------
app.get('/api/debug', (req, res) => {
    res.json({
        env: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI,
        jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
        cwd: process.cwd(),
        node: process.version,
        clue: 'Next: check /backup/ for stray files.'
    });
});

// ------------------------------------------------------------
// VULNERABLE (Information Disclosure): a stray backup file left
// accessible under the public static path, containing a dummy
// leaked credential.
// ------------------------------------------------------------
const backupDir = path.join(__dirname, 'backup');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
const backupFilePath = path.join(backupDir, 'config.backup');
if (!fs.existsSync(backupFilePath)) {
    fs.writeFileSync(
        backupFilePath,
        'DB_USER=clinic_admin\nDB_PASS=DummyBackupPass#2026\nFLAG=flag_7_Seventh_Part_Of_the_hash{ffcf}\n'
    );
}
app.use('/backup', express.static(backupDir));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Bind explicitly to all interfaces (0.0.0.0) so the server is reachable
// from other machines/VMs on the network (e.g. a Kali VM in NAT/bridged
// mode), not just from localhost on this machine.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (all interfaces)`);
});