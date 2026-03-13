// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mock Database using localStorage
const MockDatabase = {
    key: 'studyflow_users',
    
    getUsers() {
        const users = localStorage.getItem(this.key);
        return users ? JSON.parse(users) : [];
    },
    
    saveUser(user) {
        const users = this.getUsers();
        const existingIndex = users.findIndex(u => u.email === user.email);
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem(this.key, JSON.stringify(users));
    },
    
    findUser(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    },
    
    validateCredentials(email, password) {
        const user = this.findUser(email);
        if (!user) return { valid: false, message: 'User not found. Please sign up first.' };
        if (user.password !== password) return { valid: false, message: 'Incorrect password. Please try again.' };
        return { valid: true, user: user };
    },
    
    // Initialize with demo users if empty
    initDemoData() {
        if (this.getUsers().length === 0) {
            const demoUsers = [
                { email: 'demo@studyflow.com', password: 'demo123', name: 'Demo User', createdAt: new Date().toISOString() },
                { email: 'john@example.com', password: 'john123', name: 'John Smith', createdAt: new Date().toISOString() },
                { email: 'jane@example.com', password: 'jane123', name: 'Jane Doe', createdAt: new Date().toISOString() }
            ];
            demoUsers.forEach(user => this.saveUser(user));
        }
    }
};

// Initialize demo data
MockDatabase.initDemoData();

// Modal Elements
const modal = document.getElementById('signup-modal');
const signupContent = document.getElementById('signup-content');
const successContent = document.getElementById('success-content');
const loginSuccessContent = document.getElementById('login-success-content');
const signupForm = document.querySelector('#signup-modal form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.querySelector('.login-btn');
const errorMsg = document.getElementById('login-error');

// --- Modal Functions ---

function handleSignupClick() {
    if (!modal || !signupContent || !successContent) return;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset to signup view
    signupContent.classList.remove('hidden');
    successContent.classList.add('hidden');
    loginSuccessContent.classList.add('hidden');
    
    // Clear inputs
    if(emailInput) emailInput.value = '';
    if(passwordInput) passwordInput.value = '';
    if(errorMsg) errorMsg.classList.add('hidden');
}

function closeSignupModal() {
    if (!modal) return;
    
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showSuccessAnimation() {
    // Validate inputs first
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        if(errorMsg) {
            errorMsg.textContent = 'Please fill in all fields';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    if (password.length < 6) {
        if(errorMsg) {
            errorMsg.textContent = 'Password must be at least 6 characters';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    // Check if user already exists
    if (MockDatabase.findUser(email)) {
        if(errorMsg) {
            errorMsg.textContent = 'An account with this email already exists. Please log in instead.';
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    // Create new user
    const newUser = {
        email: email,
        password: password,
        name: email.split('@')[0],
        createdAt: new Date().toISOString()
    };
    
    MockDatabase.saveUser(newUser);

    // Switch to success view
    signupContent.classList.add('hidden');
    successContent.classList.remove('hidden');
}

function handleSuccessOk() {
    // Close success view and show signup view again (which acts as login view)
    successContent.classList.add('hidden');
    signupContent.classList.remove('hidden');
    
    // Clear password field for login
    if(passwordInput) passwordInput.value = '';
    if(errorMsg) errorMsg.classList.add('hidden');
}

function showLoginSuccessAnimation() {
    // Hide signup content and show login success
    signupContent.classList.add('hidden');
    loginSuccessContent.classList.remove('hidden');
}

function handleLoginSuccessOk() {
    // Redirect to planner page
    window.location.href = 'planner.html';
}

// --- Event Listeners ---

// Log In button validation in modal
if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            if(errorMsg) {
                errorMsg.textContent = 'Please enter email and password';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Checking...';
        if(errorMsg) errorMsg.classList.add('hidden');
        
        // Simulate network delay
        setTimeout(() => {
            const result = MockDatabase.validateCredentials(email, password);
            
            if (result.valid) {
                // Store current user session
                localStorage.setItem('studyflow_current_user', JSON.stringify(result.user));
                if(errorMsg) errorMsg.classList.add('hidden');
                
                // Show login success animation instead of alert
                showLoginSuccessAnimation();
            } else {
                if(errorMsg) {
                    errorMsg.textContent = result.message;
                    errorMsg.classList.remove('hidden');
                }
            }
            
            // Reset button
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log In';
        }, 800);
    });
}

// Sign Up / Create Account functionality
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showSuccessAnimation();
    });
}

// Close modal when clicking outside
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSignupModal();
        }
    });
}

// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeSignupModal();
    }
});

// Make functions available globally for onclick handlers
window.handleSignupClick = handleSignupClick;
window.closeSignupModal = closeSignupModal;
window.showSuccessAnimation = showSuccessAnimation;
window.handleSuccessOk = handleSuccessOk;
window.showLoginSuccessAnimation = showLoginSuccessAnimation;
window.handleLoginSuccessOk = handleLoginSuccessOk;
