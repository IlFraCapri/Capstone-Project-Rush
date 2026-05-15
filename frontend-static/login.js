document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('adminToken', data.token);
                    // Promemoria: se il login è ok salviamo il token nel browser e ti mandiamo alla Dashboard
                    window.location.href = 'admin.html';
                } else {
                    const errorMsg = document.getElementById('error-msg');
                    if (errorMsg) errorMsg.style.display = 'block';
                }
            } catch (err) {
                const errorMsg = document.getElementById('error-msg');
                if (errorMsg) errorMsg.style.display = 'block';
            }
        });
    }
    // Toggle Password Visibility
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const eyeOpen = togglePassword.querySelector('.eye-open');
            const eyeClosed = togglePassword.querySelector('.eye-closed');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    }
});
