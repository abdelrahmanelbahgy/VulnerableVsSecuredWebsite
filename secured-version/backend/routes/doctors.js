const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { protect, authorize } = require('../middleware/auth');
const { escapeHtml } = require('../utils/escapeHtml');

// ------------------------------------------------------------
// @route   GET /api/doctors/search-html?q=
// @desc    Server-rendered "quick search" results snippet, used by the
//          patient dashboard's doctor search box (print/share view).
// @access  Private
//
// FIX (Reflected XSS): the search term, and every field pulled from
// the database, is now passed through escapeHtml() before being
// concatenated into the HTML response — so any HTML/JS characters in
// it render as literal text instead of being parsed as markup.
// ------------------------------------------------------------
router.get('/search-html', protect, async (req, res) => {
    const q = req.query.q || '';

    try {
        const doctors = await User.find({
            role: 'doctor',
            fullName: { $regex: q, $options: 'i' }
        }).select('fullName specialization');

        // --- FIX: escape every field before it reaches the HTML string ---
        const rows = doctors
            .map(d => `<li>${escapeHtml(d.fullName)} — ${escapeHtml(d.specialization || '')}</li>`)
            .join('');

        const html = `
            <div class="search-results">
                <p>Search results for: ${escapeHtml(q)}</p>
                <ul>${rows || '<li>No doctors found.</li>'}</ul>
            </div>
        `;

        res.type('html').send(html);
    } catch (error) {
        console.error('[doctors] search-html failed:', error);
        res.status(500).send('<p>Search failed. Please try again.</p>');
    }
});

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' })
            .select('-password')
            .sort({ fullName: 1 });

        res.json({ doctors });
    } catch (error) {
        console.error('[doctors] list failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/doctors/patients
// @desc    Get doctor's patients
// @access  Private (Doctor)
router.get('/patients', protect, authorize('doctor'), async (req, res) => {
    try {
        // Get unique patient IDs from appointments
        const appointments = await Appointment.find({
            doctor: req.user._id
        }).distinct('patient');

        // Get patient details
        const patients = await User.find({
            _id: { $in: appointments },
            role: 'patient'
        }).select('-password');

        res.json({ patients });
    } catch (error) {
        console.error('[doctors] patients list failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/doctors/records
// @desc    Add medical record
// @access  Private (Doctor)
router.post('/records', protect, authorize('doctor'), async (req, res) => {
    try {
        const { patient, diagnosis, prescription, notes } = req.body;

        const record = await MedicalRecord.create({
            patient,
            doctor: req.user._id,
            diagnosis,
            prescription,
            notes
        });

        const populatedRecord = await MedicalRecord.findById(record._id)
            .populate('patient', 'fullName')
            .populate('doctor', 'fullName specialization');

        res.status(201).json({
            message: 'Medical record added successfully',
            record: populatedRecord
        });
    } catch (error) {
        console.error('[doctors] add record failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor)
router.patch('/profile', protect, authorize('doctor'), async (req, res) => {
    try {
        const { fullName, phone, specialization, licenseNumber } = req.body;

        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        user.fullName = fullName || user.fullName;
        user.phone = phone || user.phone;
        user.specialization = specialization || user.specialization;
        user.licenseNumber = licenseNumber || user.licenseNumber;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('[doctors] profile update failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
