const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const DjSchema = new mongoose.Schema({
    id: String,
    name: String,
    image: String,
    pressKit: String,
    media: [String]
});

const Dj = mongoose.model('Dj', DjSchema);

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const djs = await Dj.find();
        console.log(JSON.stringify(djs, null, 2));
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

checkData();
