const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const totalAppointments = await Appointment.countDocuments();

        // Get recent activity (last 10 appointments)
        const recentActivity = await Appointment.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('patient', 'fullName')
            .populate('doctor', 'fullName');

        const formattedActivity = recentActivity.map(apt => ({
            type: 'Appointment',
            description: `${apt.patient.fullName} scheduled with Dr. ${apt.doctor.fullName}`,
            date: apt.createdAt
        }));

        res.json({
            totalUsers,
            totalDoctors,
            totalPatients,
            totalAppointments,
            recentActivity: formattedActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow deleting self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', protect, authorize('admin'), async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('patient', 'fullName email phone')
            .populate('doctor', 'fullName specialization')
            .sort({ date: -1 });

        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/reports
// @desc    Generate reports
// @access  Private (Admin)
router.get('/reports', protect, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('doctor', 'fullName');

        // Calculate statistics
        const totalAppointments = appointments.length;
        const completed = appointments.filter(apt => apt.status === 'completed').length;
        const scheduled = appointments.filter(apt => apt.status === 'scheduled').length;
        const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;

        // Top doctors by appointment count
        const doctorCounts = {};
        appointments.forEach(apt => {
            const doctorId = apt.doctor._id.toString();
            if (!doctorCounts[doctorId]) {
                doctorCounts[doctorId] = {
                    name: apt.doctor.fullName,
                    count: 0
                };
            }
            doctorCounts[doctorId].count++;
        });

        const topDoctors = Object.values(doctorCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            totalAppointments,
            completed,
            scheduled,
            cancelled,
            topDoctors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;