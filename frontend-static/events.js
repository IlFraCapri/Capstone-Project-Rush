document.addEventListener('DOMContentLoaded', () => {
    // Event Modal
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const span = document.getElementsByClassName('close-modal')[0];

    if (modal && span) {
        span.onclick = () => modal.classList.remove('active');
        window.onclick = (event) => { if (event.target == modal) modal.classList.remove('active'); }
    }

    // Fetch Events
    let allEvents = [];
    async function loadEvents() {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            const grid = document.getElementById('events-grid');
            if (!grid) return;
            grid.innerHTML = '';

            if (!data.events || data.events.length === 0) {
                grid.innerHTML = '<p class="no-results">NO EVENTS FOUND</p>';
                return;
            }

            allEvents = data.events;
            renderEvents(allEvents);
        } catch (e) {
            console.error(e);
            const grid = document.getElementById('events-grid');
            if (grid) grid.innerHTML = '<p class="no-results">ERROR LOADING EVENTS</p>';
        }
    }

    function renderEvents(eventsToRender) {
        const grid = document.getElementById('events-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        if (eventsToRender.length === 0) {
            grid.innerHTML = '<p class="no-results">NO RESULTS</p>';
            return;
        }

        eventsToRender.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-date">${event.dateDisplay || ''}</div>
                <div class="event-details">
                    <h3>${event.name}</h3>
                    <p>LINEUP: ${event.lineup || ''}</p>
                </div>
            `;
            grid.appendChild(card);
            
            card.onclick = () => {
                if (modal && modalImg) {
                    modal.classList.add('active');
                    modalImg.src = event.poster || '/items/foto2.jpg';
                }
            };
        });
    }

    // Search functionality
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allEvents.filter(ev => 
                (ev.name && ev.name.toLowerCase().includes(term)) || 
                (ev.lineup && ev.lineup.toLowerCase().includes(term)) ||
                (ev.dateDisplay && ev.dateDisplay.toLowerCase().includes(term))
            );
            renderEvents(filtered);
        });
    }

    loadEvents();
});
