const API_URL = `http://${window.location.hostname}:5000/api`;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

// Check authentication
if (!token || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// Set user name
document.getElementById('userName').textContent = `Admin: ${user.fullName}`;

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
        
        if (tabName === 'overview') loadOverview();
        if (tabName === 'users') loadUsers();
        if (tabName === 'appointments') loadAllAppointments();
    });
});

// Load overview
async function loadOverview() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('totalDoctors').textContent = data.totalDoctors;
            document.getElementById('totalPatients').textContent = data.totalPatients;
            document.getElementById('totalAppointments').textContent = data.totalAppointments;
            displayRecentActivity(data.recentActivity);
        }
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Display recent activity
function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p>No recent activity.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <p><strong>${activity.type}:</strong> ${activity.description}</p>
            <p><small>${new Date(activity.date).toLocaleString()}</small></p>
        </div>
    `).join('');
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Display users
function displayUsers(users) {
    const container = document.getElementById('usersList');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    container.innerHTML = users.map(usr => `
        <div class="user-card">
            <h3>${usr.fullName}</h3>
            <p><strong>Email:</strong> ${usr.email}</p>
            <p><strong>Phone:</strong> ${usr.phone || 'N/A'}</p>
            <p><strong>Role:</strong> ${usr.role.toUpperCase()}</p>
            ${usr.role === 'doctor' ? `<p><strong>Specialization:</strong> ${usr.specialization}</p>` : ''}
            <p><strong>Joined:</strong> ${new Date(usr.createdAt).toLocaleDateString()}</p>
            <div class="user-actions">
                <button class="btn btn-danger" onclick="deleteUser('${usr._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('User deleted successfully');
            loadUsers();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load all appointments
async function loadAllAppointments() {
    try {
        const response = await fetch(`${API_URL}/admin/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayAllAppointments(data.appointments);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Display all appointments
function displayAllAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p>No appointments found.</p>';
        return;
    }
    
    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <h3>Patient: ${apt.patient.fullName}</h3>
            <p><strong>Doctor:</strong> ${apt.doctor.fullName} (${apt.doctor.specialization})</p>
            <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${apt.time}</p>
            <p><strong>Reason:</strong> ${apt.reason}</p>
            <p><span class="status-badge status-${apt.status}">${apt.status.toUpperCase()}</span></p>
        </div>
    `).join('');
}

// Generate report
document.getElementById('generateReportBtn')?.addEventListener('click', async () => {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/reports?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayReport(data);
        }
    } catch (error) {
        console.error('Error generating report:', error);
    }
});

// Display report
function displayReport(data) {
    const container = document.getElementById('reportResults');
    
    container.innerHTML = `
        <div class="report-summary">
            <h3>Report Summary</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${data.totalAppointments}</h3>
                    <p>Total Appointments</p>
                </div>
                <div class="stat-card">
                    <h3>${data.completed}</h3>
                    <p>Completed</p>
                </div>
                <div class="stat-card">
                    <h3>${data.scheduled}</h3>
                    <p>Scheduled</p>
                </div>
                <div class="stat-card">
                    <h3>${data.cancelled}</h3>
                    <p>Cancelled</p>
                </div>
            </div>
            <h4>Most Active Doctors</h4>
            ${data.topDoctors.map(doc => `
                <p>${doc.name}: ${doc.count} appointments</p>
            `).join('')}
        </div>
    `;
}

// Filter functionality
document.getElementById('searchUsers')?.addEventListener('input', loadUsers);
document.getElementById('filterRole')?.addEventListener('change', loadUsers);

// ------------------------------------------------------------
// VULNERABLE (SQL Injection): passes the raw search term to the
// SQL-backed patient search endpoint, which concatenates it directly
// into a query with no parameterization.
// ------------------------------------------------------------
document.getElementById('sqlSearchBtn')?.addEventListener('click', async () => {
    const q = document.getElementById('sqlSearchInput').value;

    try {
        const response = await fetch(`${API_URL}/security/patient-search?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        document.getElementById('sqlSearchResult').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error searching:', error);
    }
});

// ------------------------------------------------------------
// VULNERABLE (OS Command Injection): passes the raw host field to the
// server, which concatenates it into a shell `ping` command.
// ------------------------------------------------------------
document.getElementById('pingBtn')?.addEventListener('click', async () => {
    const host = document.getElementById('pingHostInput').value;

    try {
        const response = await fetch(`${API_URL}/diagnostics/ping`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host })
        });
        const data = await response.json();
        document.getElementById('pingResult').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error pinging host:', error);
    }
});

// Initial load
loadOverview();