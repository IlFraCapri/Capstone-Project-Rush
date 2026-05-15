let state = {
    events: [],
    djs: [],
    merch: [],
    auth: { email: '', password: '' }
};

let currentEditingType = null;
let currentEditingIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
    // Promemoria: qui controllo se sei loggato. Se non hai il "token", ti rimando al login!
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Promemoria: questo serve a gestire lo scambio tra le tab (Events, DJs, Merch)
    const tabs = document.querySelectorAll('.tab-btn');
    const menuToggle = document.getElementById('admin-menu-toggle');
    const tabsContainer = document.getElementById('admin-tabs');
    const currentTabName = document.getElementById('current-tab-name');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            
            // Mobile: Update name and close menu
            if (currentTabName) currentTabName.innerText = tab.innerText;
            if (tabsContainer) tabsContainer.classList.remove('open');
        });
    });

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            tabsContainer.classList.toggle('open');
        });
        
        window.addEventListener('click', () => {
            if (tabsContainer) tabsContainer.classList.remove('open');
        });
    }

    // Promemoria: il tasto Logout cancella i tuoi dati di accesso dal browser
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
    });

    // Initial Load
    await fetchData();

    // Promemoria: questo è il form dei SETTINGS per cambiare la tua Email o Password admin
    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-password').value;
        
        state.auth.email = email;
        if (pass) state.auth.password = pass;

        await saveData();
        showToast('Credenziali aggiornate!');
    });

    // Promemoria: qui gestisco l'occhietto per vedere la password mentre la scrivi
    const toggleAdminPass = document.getElementById('toggle-admin-password');
    if (toggleAdminPass) {
        toggleAdminPass.addEventListener('click', () => {
            const passInput = document.getElementById('admin-password');
            const eyeOpen = toggleAdminPass.querySelector('.eye-open');
            const eyeClosed = toggleAdminPass.querySelector('.eye-closed');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                eyeOpen.style.display = 'none'; eyeClosed.style.display = 'block';
            } else {
                passInput.type = 'password';
                eyeOpen.style.display = 'block'; eyeClosed.style.display = 'none';
            }
        });
    }

    // Modal Form Submit
    document.getElementById('modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleModalSubmit();
    });
});

async function fetchData() {
    showLoader(true);
    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        state.events = data.events || [];
        state.djs = data.djs || [];
        state.merch = data.merch || [];
        
        // We don't get auth via /api/data for security, but server.js says it's ok for this simple version?
        // Actually server.js doesn't return auth in GET /api/data.
        // Let's assume we don't edit auth unless specified.
        
        renderLists();
    } catch (e) {
        console.error(e);
    }
    showLoader(false);
}

async function saveData() {
    showLoader(true);
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        await fetchData();
    } catch (e) {
        console.error(e);
        alert('Errore durante il salvataggio');
    }
    showLoader(false);
}

function renderLists() {
    // Events
    const eventsList = document.getElementById('admin-events-list');
    eventsList.innerHTML = state.events.map((ev, i) => `
        <div class="admin-item-card">
            <img src="${ev.poster || '/items/About us.jpg'}">
            <div class="admin-item-info">
                <h3>${ev.name}</h3>
                <p>${ev.dateDisplay || ev.date}</p>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn edit" onclick="openModal('event', ${i})">✎</button>
                <button class="action-btn delete" onclick="deleteItem('event', ${i})">✕</button>
            </div>
        </div>
    `).join('');

    // DJs
    const djsList = document.getElementById('admin-djs-list');
    djsList.innerHTML = state.djs.map((dj, i) => `
        <div class="admin-item-card">
            <img src="${dj.image || '/items/About us.jpg'}">
            <div class="admin-item-info">
                <h3>${dj.name}</h3>
                <p>${dj.media ? dj.media.length : 0} media</p>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn edit" onclick="openModal('dj', ${i})">✎</button>
                <button class="action-btn delete" onclick="deleteItem('dj', ${i})">✕</button>
            </div>
        </div>
    `).join('');

    // Merch
    const merchList = document.getElementById('admin-merch-list');
    merchList.innerHTML = state.merch.map((m, i) => `
        <div class="admin-item-card">
            <img src="${m.image || '/items/About us.jpg'}">
            <div class="admin-item-info">
                <h3>${m.name}</h3>
                <p>${m.price}</p>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn edit" onclick="openModal('merch', ${i})">✎</button>
                <button class="action-btn delete" onclick="deleteItem('merch', ${i})">✕</button>
            </div>
        </div>
    `).join('');
}

function openModal(type, index = -1) {
    currentEditingType = type;
    currentEditingIndex = index;
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('modal-fields');
    
    modal.classList.add('active');
    title.innerText = index === -1 ? `ADD ${type.toUpperCase()}` : `EDIT ${type.toUpperCase()}`;
    
    let item = index === -1 ? {} : (type === 'event' ? state.events[index] : (type === 'dj' ? state.djs[index] : state.merch[index]));

    if (type === 'event') {
        fields.innerHTML = `
            <div class="admin-form-group"><label>Event Name</label><input type="text" id="m-name" value="${item.name || ''}" required></div>
            <div class="admin-form-group"><label>Date (es: 2024-12-31)</label><input type="text" id="m-date" value="${item.date || ''}" required></div>
            <div class="admin-form-group"><label>Date Display (es: 31 DEC)</label><input type="text" id="m-dateDisplay" value="${item.dateDisplay || ''}" required></div>
            <div class="admin-form-group"><label>Lineup</label><input type="text" id="m-lineup" value="${item.lineup || ''}"></div>
            <div class="admin-form-group">
                <label>Poster Image (Upload from PC or enter Link)</label>
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                    <img id="m-preview" src="${item.poster || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; background:#222; ${item.poster ? '' : 'display:none'}">
                    <input type="file" id="m-file" accept="image/*" style="flex-grow:1">
                </div>
                <input type="text" id="m-image-url" value="${item.poster || ''}" placeholder="Oppure incolla link immagine qui">
            </div>
        `;
    } else if (type === 'dj') {
        fields.innerHTML = `
            <div class="admin-form-group"><label>DJ Name</label><input type="text" id="m-name" value="${item.name || ''}" required></div>
            <div class="admin-form-group">
                <label>Main Image</label>
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                    <img id="m-preview" src="${item.image || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; background:#222; ${item.image ? '' : 'display:none'}">
                    <input type="file" id="m-file" accept="image/*" style="flex-grow:1">
                </div>
                <input type="text" id="m-image-url" value="${item.image || ''}" placeholder="Oppure incolla link immagine qui">
            </div>
            <div class="admin-form-group"><label>Press Kit Link</label><input type="text" id="m-pressKit" value="${item.pressKit || ''}"></div>
            <div class="admin-form-group">
                <label>Gallery Media (Multiple Upload from PC)</label>
                <input type="file" id="m-media-files" accept="image/*,video/*" multiple>
                <p style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">${item.media ? item.media.length : 0} file caricati attualmente.</p>
            </div>
        `;
    } else if (type === 'merch') {
        fields.innerHTML = `
            <div class="admin-form-group"><label>Item Name</label><input type="text" id="m-name" value="${item.name || ''}" required></div>
            <div class="admin-form-group"><label>Price (es: €25)</label><input type="text" id="m-price" value="${item.price || ''}" required></div>
            <div class="admin-form-group"><label>Buy Link (Instagram)</label><input type="text" id="m-link" value="${item.link || ''}"></div>
            <div class="admin-form-group">
                <label>Product Image</label>
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                    <img id="m-preview" src="${item.image || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; background:#222; ${item.image ? '' : 'display:none'}">
                    <input type="file" id="m-file" accept="image/*" style="flex-grow:1">
                </div>
                <input type="text" id="m-image-url" value="${item.image || ''}" placeholder="Oppure incolla link immagine qui">
            </div>
        `;
    }

    // Promemoria: questi servono a farti vedere l'anteprima della foto appena la selezioni o incolli il link
    const fInput = document.getElementById('m-file');
    const uInput = document.getElementById('m-image-url');
    const preview = document.getElementById('m-preview');

    if (fInput) {
        fInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
        });
    }
    if (uInput) {
        uInput.addEventListener('input', (e) => {
            if (e.target.value) {
                preview.src = e.target.value;
                preview.style.display = 'block';
            }
        });
    }
}

function closeModal() {
    document.getElementById('admin-modal').classList.remove('active');
}

async function handleModalSubmit() {
    showLoader(true);
    try {
        const type = currentEditingType;
        const index = currentEditingIndex;
        
        let newItem = { id: index === -1 ? Date.now().toString() : (type === 'event' ? state.events[index].id : (type === 'dj' ? state.djs[index].id : state.merch[index].id)) };

        // Promemoria: se hai caricato un file dal PC, lo mando prima su Cloudinary e prendo il link
        const fileInput = document.getElementById('m-file');
        if (fileInput && fileInput.files[0]) {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            newItem[type === 'event' ? 'poster' : 'image'] = uploadData.url;
        } else {
            newItem[type === 'event' ? 'poster' : 'image'] = document.getElementById('m-image-url').value;
        }

        if (type === 'event') {
            newItem.name = document.getElementById('m-name').value;
            newItem.date = document.getElementById('m-date').value;
            newItem.dateDisplay = document.getElementById('m-dateDisplay').value;
            newItem.lineup = document.getElementById('m-lineup').value;
            if (index === -1) state.events.push(newItem); else state.events[index] = newItem;
        } else if (type === 'dj') {
            newItem.name = document.getElementById('m-name').value;
            newItem.pressKit = document.getElementById('m-pressKit').value;
            
            // Promemoria: qui carico tutte le foto/video della gallery del DJ una per una
            const mediaFiles = document.getElementById('m-media-files').files;
            if (mediaFiles.length > 0) {
                const mediaUrls = [];
                for (let file of mediaFiles) {
                    const formData = new FormData();
                    formData.append('image', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    mediaUrls.push(data.url);
                }
                newItem.media = mediaUrls;
            } else {
                newItem.media = index === -1 ? [] : state.djs[index].media;
            }
            if (index === -1) state.djs.push(newItem); else state.djs[index] = newItem;
        } else if (type === 'merch') {
            newItem.name = document.getElementById('m-name').value;
            newItem.price = document.getElementById('m-price').value;
            newItem.link = document.getElementById('m-link').value;
            if (index === -1) state.merch.push(newItem); else state.merch[index] = newItem;
        }

        await saveData();
        closeModal();
        showToast('Salvato con successo');
    } catch (e) {
        console.error(e);
        showToast('Errore durante il salvataggio', 'error');
    }
    showLoader(false);
}

async function deleteItem(type, index) {
    if (!confirm('Sicuro di voler eliminare questo elemento?')) return;
    if (type === 'event') state.events.splice(index, 1);
    else if (type === 'dj') state.djs.splice(index, 1);
    else if (type === 'merch') state.merch.splice(index, 1);
    await saveData();
    showToast('Eliminato con successo');
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('active'), 10);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
