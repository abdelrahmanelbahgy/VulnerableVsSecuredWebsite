const API_URL = `http://${window.location.hostname}:5000/api`;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

// Check authentication
if (!token || !user || user.role !== 'patient') {
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
        
        // Update active states
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        // Load data for specific tabs
        if (tabName === 'appointments') loadAppointments();
        if (tabName === 'book') loadDoctors();
        if (tabName === 'records') loadMedicalRecords();
        if (tabName === 'profile') loadProfile();
        if (tabName === 'find-doctor') { /* nothing to preload */ }
    });
});

// Load appointments
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments/patient`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayAppointments(data.appointments);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Display appointments
function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p>No appointments found.</p>';
        return;
    }
    
    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <h3>${escapeHtml(apt.doctor.fullName)}</h3>
            <p><strong>Specialization:</strong> ${escapeHtml(apt.doctor.specialization)}</p>
            <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${apt.time}</p>
            <p><strong>Reason:</strong> ${escapeHtml(apt.reason)}</p>
            <p><span class="status-badge status-${apt.status}">${apt.status.toUpperCase()}</span></p>
            <div class="appointment-actions">
                ${apt.status === 'scheduled' ? `<button class="btn btn-danger" onclick="cancelAppointment('${apt._id}')">Cancel</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (response.ok) {
            alert('Appointment cancelled successfully');
            loadAppointments();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load doctors
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/doctors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('doctorSelect');
            select.innerHTML = '<option value="">Choose a doctor...</option>' +
                data.doctors.map(doc => `
                    <option value="${doc._id}">${doc.fullName} - ${doc.specialization}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

// Set minimum date to today
if (document.getElementById('appointmentDate')) {
    document.getElementById('appointmentDate').min = new Date().toISOString().split('T')[0];
}

// Book appointment form
document.getElementById('bookAppointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        doctor: document.getElementById('doctorSelect').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        reason: document.getElementById('reason').value
    };
    
    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showBookMessage('Appointment booked successfully!', 'success');
            document.getElementById('bookAppointmentForm').reset();
        } else {
            showBookMessage(data.message || 'Failed to book appointment', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showBookMessage('An error occurred', 'error');
    }
});

// Load medical records
async function loadMedicalRecords() {
    try {
        const response = await fetch(`${API_URL}/patients/records`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayRecords(data.records);
        }
    } catch (error) {
        console.error('Error loading records:', error);
    }
}

// Display medical records
function displayRecords(records) {
    const container = document.getElementById('recordsList');
    
    if (!records || records.length === 0) {
        container.innerHTML = '<p>No medical records found.</p>';
        return;
    }
    
    container.innerHTML = records.map(record => `
        <div class="record-card">
            <h3>${escapeHtml(record.doctor.fullName)}</h3>
            <p><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
            <p><strong>Diagnosis:</strong> ${escapeHtml(record.diagnosis)}</p>
            <p><strong>Prescription:</strong> ${escapeHtml(record.prescription)}</p>
            ${record.notes ? `<p><strong>Notes:</strong> ${escapeHtml(record.notes)}</p>` : ''}
        </div>
    `).join('');
}

// Load profile
async function loadProfile() {
    document.getElementById('profileName').value = user.fullName;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileAge').value = user.age || '';
    document.getElementById('profileGender').value = user.gender || '';
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value,
        age: document.getElementById('profileAge').value,
        gender: document.getElementById('profileGender').value
    };
    
    try {
        const response = await fetch(`${API_URL}/patients/profile`, {
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
function showBookMessage(message, type) {
    const messageDiv = document.getElementById('bookMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

function showProfileMessage(message, type) {
    const messageDiv = document.getElementById('profileMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Search and filter
document.getElementById('searchAppointments')?.addEventListener('input', filterAppointments);
document.getElementById('filterStatus')?.addEventListener('change', filterAppointments);

function filterAppointments() {
    // Implement filter logic here
    loadAppointments();
}

// ------------------------------------------------------------
// VULNERABLE (DOM XSS): the "shared appointment note" banner reads a
// value straight from the URL hash (e.g. patient-dashboard.html#note=...)
// and writes it into innerHTML with no sanitization. Source: location.hash.
// Sink: element.innerHTML.
// ------------------------------------------------------------
function renderSharedNoteFromHash() {
    const banner = document.getElementById('sharedNoteBanner');
    if (!banner) return;

    const hash = window.location.hash; // e.g. "#note=Welcome back!"
    const match = hash.match(/note=([^&]*)/);

    if (match) {
        const note = decodeURIComponent(match[1]);

        // --- FIX (DOM XSS): build the banner with safe DOM APIs instead
        // of innerHTML. textContent/appendChild never parse their input
        // as HTML — a string containing "<img onerror=...>" is inserted
        // as the literal text of that string, not as markup, no matter
        // what it contains. ---
        banner.textContent = '';
        const label = document.createElement('strong');
        label.textContent = 'Shared note: ';
        banner.appendChild(label);
        banner.appendChild(document.createTextNode(note));
    }
}
window.addEventListener('hashchange', renderSharedNoteFromHash);
renderSharedNoteFromHash();

// ------------------------------------------------------------
// VULNERABLE (Reflected XSS): the doctor search box calls the
// server-rendered /api/doctors/search-html endpoint and injects the
// raw HTML response (which reflects the query unescaped) directly
// into the page.
// ------------------------------------------------------------
document.getElementById('doctorSearchBtn')?.addEventListener('click', async () => {
    const q = document.getElementById('doctorSearchInput').value;

    try {
        const response = await fetch(`${API_URL}/doctors/search-html?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const html = await response.text();

        // --- VULNERABLE: raw server HTML (with reflected `q`) injected as-is ---
        document.getElementById('doctorSearchResults').innerHTML = html;
    } catch (error) {
        console.error('Error searching doctors:', error);
    }
});

// ------------------------------------------------------------
// VULNERABLE (Path Traversal): passes the filename field straight
// through to /api/reports/download?file=, which the server resolves
// with no base-directory restriction.
// ------------------------------------------------------------
document.getElementById('reportDownloadBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('reportFileInput').value;

    try {
        const response = await fetch(`${API_URL}/reports/download?file=${encodeURIComponent(file)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await response.text();
        document.getElementById('reportDownloadResult').textContent = text;
    } catch (error) {
        console.error('Error downloading report:', error);
    }
});

// Initial load
loadAppointments();