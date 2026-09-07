const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSecurityDb } = require('./config/securityDb');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize the small SQLite security-training database (dummy data only)
initSecurityDb();

const app = express();

// ------------------------------------------------------------
// FIX (supports the CSRF fix): the vulnerable version used
// cors({ origin: true, credentials: true }), which reflects ANY
// request origin back as allowed — combined with credentials:true,
// that lets any website read this API's responses (with cookies
// attached) for a logged-in user, which would defeat a header-based
// CSRF token (the attacker page could just read it from the
// response). Locking this down to a specific known frontend origin
// closes that gap. Set FRONTEND_ORIGIN in .env for your setup.
// ------------------------------------------------------------
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

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
// FIX (Information Disclosure): the /api/debug endpoint and the
// /backup static file route have been removed entirely — no
// environment/config details or stray backup files are exposed.
// If a debug view is genuinely needed during development, it should
// require admin auth AND be disabled outside NODE_ENV=development.
// ------------------------------------------------------------

// FIX (Information Disclosure): generic error message to the client;
// full details go to the server log only, via a proper logger in a
// real deployment (console.error is fine for this project's scope).
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5000;

// Bind explicitly to all interfaces (0.0.0.0) so the server is reachable
// from other machines/VMs on the network (e.g. a Kali VM in NAT/bridged
// mode), not just from localhost on this machine.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (all interfaces)`);
});
