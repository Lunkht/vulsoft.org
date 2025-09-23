document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication ---
    const auth = new VulsoftAuth({
        apiUrl: 'http://localhost:8001/api',
        onAuthStateChanged: (user) => {
            if (!user) {
                window.location.href = 'login.html';
            }
        }
    });

    // Check authentication on page load
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Make auth instance globally available for inline onclick events
    window.vulsoftAuth = auth;

    // --- UI Elements ---
    const verify2FAForm = document.getElementById('verify-2fa-form');
    const disable2FAForm = document.getElementById('disable-2fa-form');

    // --- Functions ---
    async function loadDashboardData() {
        try {
            const api = new VulsoftAPI();
            const stats = await api.getProjectStats();
            
            document.getElementById('total-projects').textContent = stats.total || 0;
            document.getElementById('active-projects').textContent = stats.active || 0;
            document.getElementById('completed-projects').textContent = stats.completed || 0;
            document.getElementById('completion-rate').textContent = (stats.completion_rate || 0).toFixed(1) + '%';
                
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            window.notifications?.error('Impossible de charger les statistiques.');
        }
    }

    window.viewProjects = function() {
        window.notifications?.info('Fonctionnalité en développement', 'info');
    }

    window.viewMessages = function() {
        window.notifications?.info('Fonctionnalité en développement', 'info');
    }

    window.viewCourses = function() {
        window.location.href = '../academie.html';
    }

    window.viewSettings = function() {
        open2FAModal();
    }

    window.open2FAModal = function() {
        const modal = document.getElementById('2fa-modal');
        modal.style.display = 'block';
        const user = auth.getCurrentUser();

        if (user && user.is_two_factor_enabled) {
            document.getElementById('2fa-setup-step').style.display = 'none';
            document.getElementById('2fa-manage-step').style.display = 'block';
        } else {
            document.getElementById('2fa-setup-step').style.display = 'block';
            document.getElementById('2fa-manage-step').style.display = 'none';
            setup2FA();
        }
    }

    window.close2FAModal = function() {
        document.getElementById('2fa-modal').style.display = 'none';
    }

    async function setup2FA() {
        const qrContainer = document.getElementById('qr-code-container');
        const secretKeyEl = document.getElementById('secret-key-display');
        qrContainer.innerHTML = 'Génération du QR code...';
        secretKeyEl.textContent = '...';
        try {
            const result = await auth.generate2FASecret();
            if (result.provisioning_uri) {
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: result.provisioning_uri,
                    width: 200,
                    height: 200,
                });
                secretKeyEl.textContent = result.secret;
            }
        } catch (error) {
            qrContainer.innerHTML = `<p style="color:red;">Erreur: ${error.message}</p>`;
        }
    }

    window.logout = function() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            auth.logout();
        }
    }

    window.goToAdmin = function() {
        const user = auth.getCurrentUser();
        if (user && user.is_admin) {
            window.location.href = 'admin.html';
        } else {
            window.notifications?.error("Vous n'avez pas les droits d'administrateur.");
        }
    }

    // --- Event Listeners ---
    if (verify2FAForm) {
        verify2FAForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpCode = document.getElementById('otp-code').value;
            try {
                const result = await auth.enable2FA(otpCode);
                window.notifications?.success(result.message);
                await auth.getProfile();
                close2FAModal();
            } catch (error) {
                window.notifications?.error(error.message || "Code OTP invalide.");
            }
        });
    }

    if (disable2FAForm) {
        disable2FAForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('current-password').value;
            if (!password || !confirm("Êtes-vous sûr de vouloir désactiver la 2FA ?")) return;
            try {
                const result = await auth.disable2FA(password);
                window.notifications?.success(result.message);
                await auth.getProfile();
                close2FAModal();
            } catch (error) {
                window.notifications?.error(error.message || "Erreur lors de la désactivation.");
            }
        });
    }

    // --- Initial Load ---
    loadDashboardData();
    
    document.querySelectorAll('.dashboard-card, .stat-card').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
});