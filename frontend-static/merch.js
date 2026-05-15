document.addEventListener('DOMContentLoaded', () => {
    // Load Merch
    async function loadMerch() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            const grid = document.getElementById('merch-grid');
            if (!grid) return;
            grid.innerHTML = '';

            const merchData = data.merch || [];

            if (merchData.length === 0) {
                grid.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center;">COMING SOON</p>';
                return;
            }

            merchData.forEach(item => {
                const card = document.createElement('div');
                card.className = 'merch-card';
                card.innerHTML = `
                    <div class="merch-image-wrapper">
                        <img src="${item.image || '/items/foto3.jpg'}" alt="${item.name}">
                        <div class="merch-overlay">
                            <span>DETTAGLI</span>
                        </div>
                    </div>
                    <div class="merch-info">
                        <h3>${item.name}</h3>
                        <p class="merch-price">${item.price || ''}</p>
                        ${item.link ? `<a href="${item.link}" target="_blank" class="buy-now-btn">COMPRA ORA</a>` : ''}
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (e) {
            console.error(e);
        }
    }

    loadMerch();
});
