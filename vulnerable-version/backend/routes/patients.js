const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/patients/records
// @desc    Get patient's medical records
// @access  Private (Patient)
router.get('/records', protect, authorize('patient'), async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.user._id })
            .populate('doctor', 'fullName specialization')
            .sort({ date: -1 });

        res.json({ records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PATCH /api/patients/profile
// @desc    Update patient profile
// @access  Private (Patient)
router.patch('/profile', protect, authorize('patient'), async (req, res) => {
    try {
        const { fullName, phone, age, gender } = req.body;

        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        user.fullName = fullName || user.fullName;
        user.phone = phone || user.phone;
        user.age = age || user.age;
        user.gender = gender || user.gender;

        await user.save();

        res.json({ 
            message: 'Profile updated successfully',
            user 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;