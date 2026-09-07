const API_URL = `http://${window.location.hostname}:5000/api`;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

// Check authentication
if (!token || !user || user.role !== 'doctor') {
    window.location.href = 'login.html';
}

// Set user name
document.getElementById('userName').textContent = `Welcome, ${user.fullName}`;

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

// Tab navigation
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = link.getAttribute('data-tab');
        
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'schedule') loadSchedule();
        if (tabName === 'patients') loadPatients();
        if (tabName === 'records') loadPatientsForRecords();
        if (tabName === 'profile') loadProfile();
    });
});

// Load schedule and stats
async function loadSchedule() {
    try {
        const response = await fetch(`${API_URL}/appointments/doctor`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displaySchedule(data.appointments);
            updateStats(data.appointments);
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// Update statistics
function updateStats(appointments) {
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today && apt.status === 'scheduled'
    );
    
    const thisWeek = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return aptDate >= weekStart && apt.status === 'scheduled';
    });
    
    const uniquePatients = [...new Set(appointments.map(apt => apt.patient._id))];
    
    document.getElementById('todayCount').textContent = todayAppointments.length;
    document.getElementById('weekCount').textContent = thisWeek.length;
    document.getElementById('totalPatients').textContent = uniquePatients.length;
}

// Display schedule
function displaySchedule(appointments) {
    const container = document.getElementById('scheduleList');
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p>No appointments scheduled.</p>';
        return;
    }
    
    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <h3>${apt.patient.fullName}</h3>
            <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${apt.time}</p>
            <p><strong>Reason:</strong> ${apt.reason}</p>
            <p><span class="status-badge status-${apt.status}">${apt.status.toUpperCase()}</span></p>
            <div class="appointment-actions">
                ${apt.status === 'scheduled' ? `
                    <button class="btn btn-success" onclick="updateAppointmentStatus('${apt._id}', 'completed')">Complete</button>
                    <button class="btn btn-danger" onclick="updateAppointmentStatus('${apt._id}', 'cancelled')">Cancel</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Update appointment status
async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            alert(`Appointment ${status} successfully`);
            loadSchedule();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load patients
async function loadPatients() {
    try {
        const response = await fetch(`${API_URL}/doctors/patients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayPatients(data.patients);
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Display patients
function displayPatients(patients) {
    const container = document.getElementById('patientsList');
    
    if (!patients || patients.length === 0) {
        container.innerHTML = '<p>No patients found.</p>';
        return;
    }
    
    container.innerHTML = patients.map(patient => `
        <div class="patient-card">
            <h3>${patient.fullName}</h3>
            <p><strong>Email:</strong> ${patient.email}</p>
            <p><strong>Phone:</strong> ${patient.phone || 'N/A'}</p>
            <p><strong>Age:</strong> ${patient.age || 'N/A'}</p>
            <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
        </div>
    `).join('');
}

// Load patients for records dropdown
async function loadPatientsForRecords() {
    try {
        const response = await fetch(`${API_URL}/doctors/patients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('patientSelect');
            select.innerHTML = '<option value="">Choose a patient...</option>' +
                data.patients.map(patient => `
                    <option value="${patient._id}">${patient.fullName}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Add medical record
document.getElementById('addRecordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        patient: document.getElementById('patientSelect').value,
        diagnosis: document.getElementById('diagnosis').value,
        prescription: document.getElementById('prescription').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        const response = await fetch(`${API_URL}/doctors/records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showRecordMessage('Medical record added successfully!', 'success');
            document.getElementById('addRecordForm').reset();
        } else {
            showRecordMessage(data.message || 'Failed to add record', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showRecordMessage('An error occurred', 'error');
    }
});

// Load profile
async function loadProfile() {
    document.getElementById('profileName').value = user.fullName;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('specialization').value = user.specialization || '';
    document.getElementById('licenseNumber').value = user.licenseNumber || '';
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value,
        specialization: document.getElementById('specialization').value,
        licenseNumber: document.getElementById('licenseNumber').value
    };
    
    try {
        const response = await fetch(`${API_URL}/doctors/profile`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            user = data.user;
            localStorage.setItem('user', JSON.stringify(user));
            showProfileMessage('Profile updated successfully!', 'success');
        } else {
            showProfileMessage(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showProfileMessage('An error occurred', 'error');
    }
});

// Message functions
function showRecordMessage(message, type) {
    const messageDiv = document.getElementById('recordMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

function showProfileMessage(message, type) {
    const messageDiv = document.getElementById('profileMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Filter functionality
document.getElementById('filterDate')?.addEventListener('change', loadSchedule);
document.getElementById('filterStatus')?.addEventListener('change', loadSchedule);
document.getElementById('searchPatients')?.addEventListener('input', loadPatients);

// ------------------------------------------------------------
// VULNERABLE (SSTI): sends the raw template text to the server, which
// compiles it with Handlebars.compile() — attacker-controlled template
// syntax (e.g. {{internalFlag}}) is evaluated server-side.
// ------------------------------------------------------------
document.getElementById('letterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        patientName: document.getElementById('letterPatientName').value,
        doctorName: user.fullName,
        date: document.getElementById('letterDate').value
    };
    const customTemplate = document.getElementById('letterTemplate').value;
    if (customTemplate) body.template = customTemplate;

    try {
        const response = await fetch(`${API_URL}/reports/appointment-letter`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        document.getElementById('letterResult').textContent = data.letter || JSON.stringify(data);
    } catch (error) {
        console.error('Error generating letter:', error);
    }
});

// ------------------------------------------------------------
// VULNERABLE (SSRF): sends a fully user-controlled URL to the server,
// which fetches it with no host/IP validation.
// ------------------------------------------------------------
document.getElementById('labPreviewBtn')?.addEventListener('click', async () => {
    const url = document.getElementById('labUrlInput').value;

    try {
        const response = await fetch(`${API_URL}/lab/preview`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        const data = await response.json();
        document.getElementById('labPreviewResult').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error previewing lab resource:', error);
    }
});

// Initial load
loadSchedule();