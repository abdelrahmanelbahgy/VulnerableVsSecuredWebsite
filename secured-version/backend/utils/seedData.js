const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Appointment.deleteMany({});
        await MedicalRecord.deleteMany({});

        console.log('Cleared existing data');

        // =========================
        // Create Admin
        // =========================
        const admin = await User.create({
            fullName: 'Admin User',
            email: 'admin@clinic.com',
            password: 'TechTrekTeam9',
            phone: '1234567890',
            role: 'admin'
        });

        console.log('Admin created: admin@clinic.com / TechTrekTeam9');

        // =========================
        // Create Doctors
        // =========================
        const doctors = await User.create([
            {
                fullName: 'Dr. Adel Shakal',
                email: 'adel.shakal@clinic.com',
                password: 'doctor123',
                phone: '5551234567',
                role: 'doctor',
                specialization: 'Za3amology',
                licenseNumber: 'MD12345'
            },
            {
                fullName: 'Dr. Tamer Elgayyar',
                email: 'tamer.elgayyar@clinic.com',
                password: 'doctor123',
                phone: '5552345678',
                role: 'doctor',
                specialization: 'Dentistry',
                licenseNumber: 'MD23456'
            },
            {
                fullName: 'Dr. Mahmoud Ghanem',
                email: 'mahmoud.ghanem@clinic.com',
                password: 'doctor123',
                phone: '5553456789',
                role: 'doctor',
                specialization: 'Dermatology',
                licenseNumber: 'MD34567'
            },
            {
                fullName: 'Dr. Mohamed Aboutrika',
                email: 'mohamed.aboutrika@clinic.com',
                password: 'doctor123',
                phone: '5554567890',
                role: 'doctor',
                specialization: 'Orthopedics',
                licenseNumber: 'MD45678'
            }
        ]);

        console.log('Doctors created');

        // =========================
        // Create Patients
        // =========================
        const patients = await User.create([
            {
                fullName: 'Taher Mohamed Taher',
                email: 'taher.mohamed@email.com',
                password: 'patient123',
                phone: '5559876543',
                role: 'patient',
                age: 35,
                gender: 'male'
            },
            {
                fullName: 'Faten Hamama',
                email: 'faten.hamama@email.com',
                password: 'patient123',
                phone: '5558765432',
                role: 'patient',
                age: 28,
                gender: 'female'
            },
            {
                fullName: 'Mohamed Elshennawy',
                email: 'mohamed.elshennawy@email.com',
                password: 'patient123',
                phone: '5557654321',
                role: 'patient',
                age: 42,
                gender: 'male'
            },
            {
                fullName: 'Ziad Zaza',
                email: 'ziadzaza@email.com',
                password: 'patient123',
                phone: '5556543210',
                role: 'patient',
                age: 31,
                gender: 'female'
            },
            {
                fullName: 'AbdelRahman Elbahgy',
                email: 'abdelrahman.elbahgy@email.com',
                password: 'patient123',
                phone: '5555432109',
                role: 'patient',
                age: 55,
                gender: 'male'
            }
        ]);

        console.log('Patients created');

        // =========================
        // Create Dates
        // =========================
        const today = new Date();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        // =========================
        // Create Appointments
        // =========================
        await Appointment.create([
            {
                patient: patients[0]._id,
                doctor: doctors[0]._id,
                date: today,
                time: '10:00',
                reason: 'Regular checkup and blood pressure monitoring',
                status: 'scheduled'
            },
            {
                patient: patients[1]._id,
                doctor: doctors[1]._id,
                date: today,
                time: '14:00',
                reason: 'Child vaccination consultation',
                status: 'scheduled'
            },
            {
                patient: patients[2]._id,
                doctor: doctors[2]._id,
                date: tomorrow,
                time: '09:00',
                reason: 'Skin rash examination',
                status: 'scheduled'
            },
            {
                patient: patients[3]._id,
                doctor: doctors[3]._id,
                date: tomorrow,
                time: '11:00',
                reason: 'Knee pain assessment',
                status: 'scheduled'
            },
            {
                patient: patients[4]._id,
                doctor: doctors[0]._id,
                date: nextWeek,
                time: '15:00',
                reason: 'Follow-up for heart condition',
                status: 'scheduled'
            },
            {
                patient: patients[0]._id,
                doctor: doctors[1]._id,
                date: lastWeek,
                time: '10:00',
                reason: 'Annual physical examination',
                status: 'completed'
            }
        ]);

        console.log('Appointments created');

        // =========================
        // Create Medical Records
        // =========================
        await MedicalRecord.create([
            {
                patient: patients[0]._id,
                doctor: doctors[0]._id,
                diagnosis: 'Hypertension Stage 1',
                prescription: 'Lisinopril 10mg once daily, monitor blood pressure',
                notes: 'Patient advised to reduce sodium intake and increase physical activity',
                date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                patient: patients[1]._id,
                doctor: doctors[1]._id,
                diagnosis: 'Seasonal Allergies',
                prescription: 'Cetirizine 10mg once daily as needed',
                notes: 'Recommend allergy testing if symptoms persist',
                date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
            },
            {
                patient: patients[2]._id,
                doctor: doctors[2]._id,
                diagnosis: 'Eczema',
                prescription: 'Hydrocortisone cream 1% twice daily, moisturize regularly',
                notes: 'Avoid harsh soaps and hot water',
                date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000)
            },
            {
                patient: patients[3]._id,
                doctor: doctors[3]._id,
                diagnosis: 'Osteoarthritis of the knee',
                prescription: 'Ibuprofen 400mg as needed, physical therapy recommended',
                notes: 'Consider weight reduction and low-impact exercises',
                date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)
            }
        ]);

        console.log('Medical records created');

        // =========================
        // Final Output
        // =========================
        console.log('\n========================================');
        console.log('       SEED DATA COMPLETED SUCCESSFULLY');
        console.log('========================================');

        console.log('\nTest Accounts:');

        console.log('\nAdmin:');
        console.log('Email: admin@clinic.com');
        console.log('Password: TechTrekTeam9');

        console.log('\nDoctors (all password: doctor123):');
        console.log('- adel.shakal@clinic.com');
        console.log('- tamer.elgayyar@clinic.com');
        console.log('- mahmoud.ghanem@clinic.com');
        console.log('- mohamed.aboutrika@clinic.com');

        console.log('\nPatients (all password: patient123):');
        console.log('- taher.mohamed@email.com');
        console.log('- faten.hamama@email.com');
        console.log('- mohamed.elshennawy@email.com');
        console.log('- ziadzaza@email.com');
        console.log('- abdelrahman.elbahgy@email.com');

        console.log('\n========================================\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedData();