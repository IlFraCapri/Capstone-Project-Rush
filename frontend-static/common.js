document.addEventListener('DOMContentLoaded', () => {
    // Menu Toggle
    const menuIcon = document.getElementById('menu-icon');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const closeMenuBtn = document.getElementById('close-menu');

    if (menuIcon && fullscreenMenu) {
        menuIcon.addEventListener('click', () => {
            menuIcon.classList.toggle('open');
            fullscreenMenu.classList.toggle('active');
        });

        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', () => {
                menuIcon.classList.remove('open');
                fullscreenMenu.classList.remove('active');
            });
        }
    }

    // Scroll to Top
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Audio Toggle
    const audioBtn = document.getElementById('audio-toggle');
    const audioText = audioBtn ? audioBtn.querySelector('.audio-text') : null;
    const video = document.getElementById('bg-video');
    const body = document.body;
    let isMuted = true;

    if (audioBtn) {
        // Init volume if video exists
        if (video) {
            video.volume = 0.15;
        }

        audioBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (video) {
                video.muted = isMuted;
            }
            if (audioText) {
                audioText.textContent = isMuted ? 'AUDIO OFF' : 'AUDIO ON';
            }
            audioBtn.classList.toggle('on', !isMuted);

            // Effetto "Red Light" per index
            if (video) {
                if (!isMuted) {
                    video.volume = 0.15; // Forza il volume al 15%
                    body.classList.add('audio-active');
                    video.play().catch(e => console.log("Autoplay blocked:", e));
                } else {
                    body.classList.remove('audio-active');
                }
            } else {
                // Sulle altre pagine
                if (!isMuted) {
                    body.classList.add('audio-active');
                } else {
                    body.classList.remove('audio-active');
                }
            }
        });
    }
});
