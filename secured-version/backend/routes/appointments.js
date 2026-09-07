const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/appointments/patient
// @desc    Get patient's appointments
// @access  Private (Patient)
router.get('/patient', protect, authorize('patient'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate('doctor', 'fullName specialization phone')
            .sort({ date: -1 });

        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/appointments/doctor
// @desc    Get doctor's appointments
// @access  Private (Doctor)
router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.user._id })
            .populate('patient', 'fullName phone email age gender')
            .sort({ date: 1, time: 1 });

        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/appointments
// @desc    Book a new appointment
// @access  Private (Patient)
router.post('/', protect, authorize('patient'), async (req, res) => {
    try {
        const { doctor, date, time, reason } = req.body;

        // Check if appointment slot is available
        const existingAppointment = await Appointment.findOne({
            doctor,
            date,
            time,
            status: 'scheduled'
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked' });
        }

        // Create appointment
        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor,
            date,
            time,
            reason
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('doctor', 'fullName specialization')
            .populate('patient', 'fullName');

        res.status(201).json({ 
            message: 'Appointment booked successfully',
            appointment: populatedAppointment 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/appointments/:id
// @desc    Update appointment status
// @access  Private (Patient, Doctor)
router.patch('/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check authorization
        if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();

        res.json({ 
            message: 'Appointment updated successfully',
            appointment 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Patient, Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check authorization
        if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await appointment.deleteOne();

        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;