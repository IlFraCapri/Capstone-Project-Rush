document.addEventListener('DOMContentLoaded', () => {
    // Load DJs
    let djData = [];
    let currentModalIndex = 0;
    let currentDjMedia = [];

    async function loadDJs() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            const grid = document.getElementById('dj-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            djData = data.djs || [];

            djData.forEach(dj => {
                const card = document.createElement('div');
                card.className = 'dj-card';
                card.innerHTML = `
                    <div class="dj-image-wrapper">
                        <img src="${dj.image || '/items/foto2.jpg'}" alt="${dj.name}">
                        <div class="dj-overlay">
                            <span>VIEW GALLERY</span>
                        </div>
                    </div>
                    <div class="dj-info">
                        <h3>${dj.name}</h3>
                        ${dj.pressKit ? `<a href="${dj.pressKit}" target="_blank" class="press-kit-btn" onclick="event.stopPropagation()">PRESS KIT</a>` : ''}
                    </div>
                `;
                grid.appendChild(card);

                card.onclick = () => openModal(dj);
            });
        } catch (e) {
            console.error(e);
        }
    }

    // Modal Logic
    const modal = document.getElementById('media-modal');
    const closeBtn = document.getElementsByClassName('close-modal')[0];
    const prevBtn = document.querySelector('.modal-nav.prev');
    const nextBtn = document.querySelector('.modal-nav.next');
    const mediaContainer = document.getElementById('modal-media-container');

    function openModal(dj) {
        if (!modal) return;
        if (!dj.media || dj.media.length === 0) {
            currentDjMedia = [dj.image]; // Fallback if no media
        } else {
            currentDjMedia = dj.media;
        }
        currentModalIndex = 0;
        updateModalContent();
        modal.classList.add('active');
    }

    function updateModalContent() {
        if (!mediaContainer) return;
        if (currentDjMedia.length === 0) return;
        const src = currentDjMedia[currentModalIndex];
        mediaContainer.innerHTML = '';

        // check if video (very basic check)
        if (src && (src.endsWith('.mp4') || src.includes('video'))) {
            const video = document.createElement('video');
            video.src = src;
            video.autoplay = true;
            video.controls = true;
            video.loop = true;
            mediaContainer.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = src || '/items/foto2.jpg';
            mediaContainer.appendChild(img);
        }

        if (prevBtn) prevBtn.style.display = currentDjMedia.length > 1 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = currentDjMedia.length > 1 ? 'block' : 'none';
    }

    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            currentModalIndex = (currentModalIndex - 1 + currentDjMedia.length) % currentDjMedia.length;
            updateModalContent();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            currentModalIndex = (currentModalIndex + 1) % currentDjMedia.length;
            updateModalContent();
        };
    }

    function closeModal() {
        if (modal) modal.classList.remove('active');
        if (mediaContainer) mediaContainer.innerHTML = ''; // Svuota il contenitore per fermare la musica/video
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    if (modal) {
        modal.onclick = (event) => {
            if (event.target === modal || event.target.classList.contains('modal-container')) {
                closeModal();
            }
        };
    }

    loadDJs();
});
