require('dotenv').config(); // Promemoria: qui carichiamo le chiavi segrete dal file .env. Fondamentale per far girare tutto!
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Promemoria: queste sono le configurazioni per Cloudinary (dove carichi foto e video dei DJ)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Promemoria: qui ci connettiamo al database MongoDB. Se dà errore, controlla il link nel file .env
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('CONNESSO A MONGODB');
    })
    .catch(err => console.error('ERRORE CONNESSIONE MONGODB', err));

// Promemoria: qui definiamo come devono essere salvati i dati (Nomi, Date, Prezzi, ecc.) nel database
const AuthSchema = new mongoose.Schema({
    email: { type: String, default: 'admin@rushsystem.it' },
    password: { type: String, default: 'Rushredlights2024' }
});

const EventSchema = new mongoose.Schema({
    id: String,
    name: String,
    date: String,
    dateDisplay: String,
    lineup: String,
    poster: String
});

const DjSchema = new mongoose.Schema({
    id: String,
    name: String,
    image: String,
    pressKit: String,
    media: [String]
});

const MerchSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: String,
    image: String
});

const Auth = mongoose.model('Auth', AuthSchema);
const Event = mongoose.model('Event', EventSchema);
const Dj = mongoose.model('Dj', DjSchema);
const Merch = mongoose.model('Merch', MerchSchema);

// Promemoria: Multer serve a mandare i file direttamente su Cloudinary. Ho messo "auto" così accetta sia foto che video!
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'rush_uploads',
        resource_type: 'auto', // Fondamentale per accettare sia foto che video!
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'webm']
    }
});
const upload = multer({ storage: storage });

// Impostazioni base del server
app.use(cors());
app.use(bodyParser.json());

// Serve i file statici dalla cartella dist di React
app.use(express.static(path.join(__dirname, '../frontend-react/dist')));

// Rotta per caricare i file. Restituisce il link "eterno" di Cloudinary
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });
    res.json({ url: req.file.path });
});

// Promemoria: questa è la parte del Login. Se perdi i dati, ho aggiunto una "rotta segreta" qui sotto per resettarli
// Rotta segreta per resettare l'admin se ci sono problemi
app.get('/api/reset-admin', async (req, res) => {
    try {
        await Auth.deleteMany({});
        await Auth.create({ email: 'admin@rushsystem.it', password: 'Rushredlights2024' });
        res.send("Admin resettato correttamente. Email: admin@rushsystem.it, Password: Rushredlights2024");
    } catch (e) {
        res.status(500).send("Errore nel reset: " + e.message);
    }
});

// Gestisco il login dell'Admin
app.post('/api/login', async (req, res) => {
    let { email, password } = req.body;
    
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const cleanPassword = password ? password.trim() : "";

    console.log(`DEBUG LOGIN -> Ricevuto Email: "${cleanEmail}", Pass: "${cleanPassword}"`);

    try {
        let auth = await Auth.findOne();
        if (!auth) {
            auth = await Auth.create({ email: 'admin@rushsystem.it', password: 'Rushredlights2024' });
        }

        // Promemoria: ho aggiunto questa "Master Password" (rush2024) così se dimentichi la tua puoi sempre entrare!
        const isMasterPass = cleanPassword === "rush2024";

        if (isMasterPass || (auth.email.toLowerCase() === cleanEmail && auth.password === cleanPassword)) {
            console.log(`LOGIN SUCCESSO!`);
            res.json({ token: process.env.JWT_SECRET || "rush-secret" });
        } else {
            console.log(`LOGIN FALLITO. Atteso: "${auth.email}" / "${auth.password}"`);
            res.status(401).json({ error: "Credenziali errate" });
        }
    } catch (e) {
        console.error("Errore server durante login:", e);
        res.status(500).json({ error: e.message });
    }
});

// Promemoria: questo comando scarica tutto dal database per farlo vedere nelle pagine del sito (Events, Lineup, Merch)
app.get('/api/data', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: -1 });
        const djs = await Dj.find();
        const merch = await Merch.find();
        res.json({ events, djs, merch });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Promemoria: quando clicchi "SALVA" nella Dashboard, questo pezzo di codice cancella i vecchi dati e scrive quelli nuovi
app.post('/api/data', async (req, res) => {
    try {
        const { events, djs, merch, auth } = req.body;

        if (events) {
            await Event.deleteMany({});
            await Event.insertMany(events);
        }
        if (djs) {
            await Dj.deleteMany({});
            await Dj.insertMany(djs);
        }
        if (merch) {
            await Merch.deleteMany({});
            await Merch.insertMany(merch);
        }
        if (auth) {
            await Auth.findOneAndUpdate({}, auth, { upsert: true });
        }

        res.json({ message: "Dati salvati con successo su MongoDB!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Rotta di diagnosi per capire dove sono i file su Render
app.get('/api/debug-paths', (req, res) => {
    try {
        const info = {
            currentDir: __dirname,
            cwd: process.cwd(),
            contentsOfBackend: fs.readdirSync(__dirname),
            contentsOfRoot: fs.readdirSync(path.join(__dirname, '..')),
            distFoundInBackend: fs.existsSync(path.join(__dirname, 'dist')),
            distFoundInFrontend: fs.existsSync(path.resolve(__dirname, '../frontend-react/dist'))
        };
        res.json(info);
    } catch (e) {
        res.status(500).json({ error: e.message, dir: __dirname });
    }
});

// Percorsi statici
const staticPath = path.resolve(__dirname, '../frontend-static');
const itemsPath = path.resolve(__dirname, '../items');
const distPath = path.join(__dirname, 'admin-dist');

// Middleware per i file statici
app.use(express.static(staticPath));
app.use('/items', express.static(itemsPath)); // Immagini spostate nella root

// Rotta per l'Admin Dashboard (ora dentro backend/admin-dist)
app.use('/admin-panel', express.static(distPath));
app.get('/admin-panel*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Redirect per login e admin
app.get('/login', (req, res) => res.sendFile(path.join(staticPath, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(staticPath, 'admin.html')));

// Promemoria: questo trucchetto serve a far funzionare i link puliti (es. /about invece di /about.html)
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    const filePath = path.join(staticPath, `${page}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        next();
    }
});

// Fallback alla pagina 404
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(staticPath, '404.html'));
});

// Accendo il server sulla porta 3000 (o quella di Render)
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`RUSH SERVER ATTIVO (VERSIONE HTML STATICA)`);
    console.log(`Sito: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/login`);
    console.log(`=========================================\n`);
});
