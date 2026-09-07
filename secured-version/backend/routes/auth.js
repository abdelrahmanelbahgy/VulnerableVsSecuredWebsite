const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// ------------------------------------------------------------
// FIX (Privilege Escalation / mass assignment): the registration form
// only ever offers "Patient" or "Doctor" (see frontend/register.html) —
// "admin" was never a legitimate client-selectable option, it was
// purely a backend trust bug. The server now allowlists the role
// value instead of trusting whatever the client sends, so no request
// — however it's crafted — can create an admin account this way.
// Admin accounts must be provisioned through a separate, trusted
// process (e.g. directly in the database or a dedicated admin-only
// endpoint), never through public self-registration.
// ------------------------------------------------------------
const ALLOWED_SELF_REGISTER_ROLES = ['patient', 'doctor'];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, phone, role, specialization, licenseNumber } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // --- FIX: validate the requested role against an allowlist ---
        const safeRole = ALLOWED_SELF_REGISTER_ROLES.includes(role) ? role : 'patient';

        // Create user object
        const userData = {
            fullName,
            email,
            password,
            phone,
            role: safeRole
        };

        // Add doctor-specific fields if role is doctor
        if (safeRole === 'doctor') {
            userData.specialization = specialization;
            userData.licenseNumber = licenseNumber;
        }

        // Create user
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // FIX (Information Disclosure): log details server-side only;
        // the client gets a generic message.
        console.error('[auth] register failed:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check for user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check role
        if (user.role !== role) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            specialization: user.specialization,
            token: generateToken(user._id),
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                specialization: user.specialization,
                licenseNumber: user.licenseNumber,
                age: user.age,
                gender: user.gender
            }
        });
    } catch (error) {
        console.error('[auth] login failed:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

module.exports = router;
