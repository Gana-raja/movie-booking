// DOM Elements
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const checkEmailBtn = document.getElementById('checkEmailBtn');
const passwordFields = document.getElementById('passwordFields');
const resetSuccess = document.getElementById('resetSuccess');
const backToLogin = document.getElementById('backToLogin');

// ===== LOADER CONTROL =====
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
}


// Tab Switching
loginTab.addEventListener('click', () => {
    // Hide register form and show login form
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    
    // Update active tab styling
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    // Hide reset form if visible
    resetForm.style.display = 'none';
    document.querySelector('.form-tabs').style.display = 'flex';
});

registerTab.addEventListener('click', () => {
    // Hide login form and show register form
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    
    // Update active tab styling
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    // Hide reset form if visible
    resetForm.style.display = 'none';
    document.querySelector('.form-tabs').style.display = 'flex';
});

// Forgot Password Flow
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetUI();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    resetForm.style.display = 'flex';
    document.querySelector('.form-tabs').style.display = 'none';
});

// Email Verification
checkEmailBtn.addEventListener('click', async () => {
    showLoader();
    const username = document.getElementById('resetUsername').value;
    const email = document.getElementById('resetEmail').value;
    
    try {
        const response = await fetch('https://cinetix-backend.onrender.com/verify-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email }),
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.valid) {
            passwordFields.style.display = 'flex';
            passwordFields.classList.add('fade-in');
        } else {
            alert('Username and email do not match our records');
        }
    } catch (err) {
        alert('Error verifying user');
    } finally{
        hideLoader();
    }
});

// Password Reset
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('resetUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        hideLoader();
        return alert('Passwords do not match!');
    }
    
    try {
        const response = await fetch('https://cinetix-backend.onrender.com/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword }),
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            resetSuccess.style.display = 'block';
            passwordFields.style.display = 'none';
            resetForm.reset();
        }
    } catch (err) {
        alert('Error updating password');
    }
});

// Login Form Submission
 loginForm.addEventListener('submit', async (e) => {
     e.preventDefault();
     showLoader();
    
     const formData = new FormData(loginForm);
     const data = Object.fromEntries(formData);
    
     try {
         const response = await fetch('https://cinetix-backend.onrender.com/login', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(data),
             credentials:'include'
         });
        
         const result = await response.json();
         if (result.success) {
             // Handle successful login (e.g., redirect or store token)
             window.location.href = result.redirectUrl; // Example redirect
         } else {
             alert(result.message || 'Login failed');
         }
     } catch (err) {
         alert('Error during login');
     } finally {
         hideLoader();
     }
 });

// // Register Form Submission
// registerForm.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     showLoader();
    
//     const formData = new FormData(registerForm);
//     const data = Object.fromEntries(formData);
    
//     // Check if passwords match
//     if (data.password !== data.confirm_password) {
//         hideLoader();
//         return alert('Passwords do not match!');
//     }
    
//     try {
//         const response = await fetch('https://cinetix-backend.onrender.com/register', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 username: data.username,
//                 email: data.email,
//                 password: data.password
//             }),
              credentials: 'include'
//         });
        
//         const result = await response.json();
//         if (response.ok) {
//             alert('Registration successful! Please login.');
//             loginTab.click(); // Switch to login tab
//             registerForm.reset();
//         } else {
//             alert(result.message || 'Registration failed');
//         }
//     } catch (err) {
//         alert('Error during registration');
//     } finally {
//         hideLoader();
//     }
// });

// Back to Login
backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    resetUI();
    loginForm.style.display = 'flex';
});

// Helper Function
function resetUI() {
    resetForm.style.display = 'none';
    registerForm.style.display = 'none';
    document.querySelector('.form-tabs').style.display = 'flex';
    resetSuccess.style.display = 'none';
    passwordFields.style.display = 'none';
    resetForm.reset();
}
