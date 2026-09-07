// API Base URL
const API_URL = `http://${window.location.hostname}:5000/api`;

// Show doctor fields when role is doctor
if (document.getElementById('role')) {
    document.getElementById('role').addEventListener('change', function() {
        const doctorFields = document.getElementById('doctorFields');
        if (doctorFields) {
            doctorFields.style.display = this.value === 'doctor' ? 'block' : 'none';
        }
    });
}

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success message
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'patient') {
                        window.location.href = 'patient-dashboard.html';
                    } else if (data.user.role === 'doctor') {
                        window.location.href = 'doctor-dashboard.html';
                    } else if (data.user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    }
                }, 1000);
            } else {
                showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        }
    });
}

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showMessage('Passwords do not match!', 'error');
            return;
        }
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: password,
            role: document.getElementById('role').value
        };
        
        // Add doctor-specific fields
        if (formData.role === 'doctor') {
            formData.specialization = document.getElementById('specialization').value;
            formData.licenseNumber = document.getElementById('licenseNumber').value;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        }
    });
}

// Show Message Function
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}