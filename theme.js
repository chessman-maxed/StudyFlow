// Theme Toggle Functionality
const THEME_KEY = 'studyflow_theme';

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || getSystemTheme();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle buttons icon
    const toggleButtons = document.querySelectorAll('.theme-toggle, #themeToggle');
    toggleButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                btn.title = 'Switch to Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                btn.title = 'Switch to Dark Mode';
            }
        }
    });

    // Update Vanta background for theme
    if (typeof VANTA !== 'undefined') {
        updateVantaTheme(theme);
    }
}

function updateVantaTheme(theme) {
    const bgColor = theme === 'dark' ? 0x0B1220 : 0xF8FAFC;
    const accentColor = theme === 'dark' ? 0x0F766E : 0x10B981;

    // Check if this is the landing page (uses WAVES instead of NET)
    const isLandingPage = document.querySelector('.hero-section') !== null;
    
    // Destroy existing Vanta instance
    if (window.vantaNet) {
        window.vantaNet.destroy();
        window.vantaNet = null;
    }
    if (window.vantaWaves) {
        window.vantaWaves.destroy();
        window.vantaWaves = null;
    }

    if (typeof VANTA !== 'undefined') {
        if (isLandingPage) {
            // Landing page uses WAVES effect
            window.vantaWaves = VANTA.WAVES({
                el: "body",
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: theme === 'dark' ? 0x0a1628 : 0xf8fafc,
                color2: theme === 'dark' ? 0x112240 : 0xe2e8f0,
                shininess: 50.00,
                waveHeight: 20.00,
                waveSpeed: 0.5,
                zoom: 0.65
            });
        } else {
            // Other pages use NET effect
            const vantaBg = document.getElementById('vanta-bg');
            if (vantaBg) {
                window.vantaNet = VANTA.NET({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: accentColor,
                    backgroundColor: bgColor
                });
            }
        }
    }

    // Also update fallback background
    const vantaBg = document.getElementById('vanta-bg');
    if (vantaBg) {
        vantaBg.style.backgroundColor = theme === 'dark' ? '#0a1628' : '#f8fafc';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = getStoredTheme();
    applyTheme(savedTheme);

    // Add click handler to all toggle buttons
    const toggleButtons = document.querySelectorAll('.theme-toggle, #themeToggle');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
    }
});
