// db/store.js
//
// A small, dependency-free JSON file database.
// Why not SQLite? Packages like better-sqlite3 need to compile native code,
// which fails on some hosts and on developer machines without build tools
// installed. This store needs nothing but Node.js itself, so "npm install"
// always works, everywhere. Writes are queued so two saves can never
// corrupt the file even if they happen at nearly the same time.

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULTS = {
  settings: {
    business_name: 'DS Natursteine',
    whatsapp_number: '491737586673',
    contact_email: 'deine@email.de',
    address: 'Neckarsulm, Baden-Württemberg',
    opening_hours: 'Samstag, 08:00–16:00 Uhr',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    hero_headline: 'Naturstein, von Hand ausgesucht. Von Hand verlegt.',
    hero_subtext: 'Granit, Naturstein, Gartendekoration und Steingrills für Terrassen, Wege und Mauern — handverlesen aus erster Hand, geliefert oder direkt bei uns abgeholt.',
    hero_image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/img_3858-high.jpg',
    about_text_1: 'DS Natursteine ist Ihr verlässlicher Partner für hochwertige Steine jeder Art. Mit langjähriger Erfahrung und echter Leidenschaft für das Handwerk bieten wir eine breite Palette an Produkten — von Dekosteinen für den Garten bis zu individuellen Baumaterialien.',
    about_text_2: 'Unser Lager steht Ihnen offen, um die Steine hautnah zu erleben. Selbstverständlich können Sie Ihre Auswahl auch bequem online treffen und sich beraten lassen.',
    about_image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/d0b5ffc8-30aa-450d-a38d-9ca04a7cd922-standard.jpg'
  },
  products: [
    {
      id: 1, sort_order: 0, is_active: true, created_at: new Date().toISOString(),
      name: 'Naturstein Braun', tag_label: 'GR · POLYGONAL',
      price_text: 'ab 35,70 € zzgl. Versandkosten',
      description: 'Polygonale Natursteinplatten aus Griechenland — vielseitig einsetzbar für die Bodenverlegung im Außenbereich sowie für individuelle Wandverkleidungen, innen wie außen.',
      image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/img_4316-high.jpg'
    },
    {
      id: 2, sort_order: 1, is_active: true, created_at: new Date().toISOString(),
      name: 'Gartendekoration', tag_label: '70% STEIN · 30% BETON',
      price_text: '70 € – 1.400 € je nach Größe & Ausführung',
      description: 'Handgefertigte Objekte aus Naturstein und massivem Beton — von dezenten Akzenten bis zu großzügigen Skulpturen für jeden Garten.',
      image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/e12f2cc2-96ed-4a42-bad6-d75bae64e5e6-high-2d1jqq.jpg'
    },
    {
      id: 3, sort_order: 2, is_active: true, created_at: new Date().toISOString(),
      name: 'Naturstein-Farben', tag_label: 'MEHRFARBIG',
      price_text: '17 € – 280 € je nach Farbe & Format',
      description: 'Eine breite Palette an Farbtönen und Formaten für jedes Gestaltungskonzept — von warmen Erdtönen bis zu kühlem Grau.',
      image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/749c5879-c3b6-44a6-8d38-740871e9ffb9-high.jpg'
    },
    {
      id: 4, sort_order: 3, is_active: true, created_at: new Date().toISOString(),
      name: 'Steingrill für den Garten', tag_label: 'MASSIV · INDIVIDUELL',
      price_text: 'Preis auf Anfrage',
      description: 'Massive Steingrills, gebaut nach Maß — vom kompakten Modell für die kleine Terrasse bis zur großen Grillstation für gesellige Abende.',
      image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/db30377e-9ea6-4824-b42b-ce7c7c564b93-high.jpg'
    }
  ],
  portfolio: [
    { id: 1, sort_order: 0, is_active: true, created_at: new Date().toISOString(), title: 'Naturstein Terrasse', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/0f324d88-b581-4210-a85a-d04563bc419f-standard.jpg' },
    { id: 2, sort_order: 1, is_active: true, created_at: new Date().toISOString(), title: 'Natursteinmauer', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/5df37c01-2b6a-4fb0-b211-a8d4945d88b1-standard.jpg' },
    { id: 3, sort_order: 2, is_active: true, created_at: new Date().toISOString(), title: 'Naturstein Terrasse', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/c512e02a-1f83-4cab-801f-942d15035cc2-standard.jpg' },
    { id: 4, sort_order: 3, is_active: true, created_at: new Date().toISOString(), title: 'Gartenweg aus Naturstein', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/18e18fd0-637e-42b2-b075-1ec2f97999ed-standard.jpg' },
    { id: 5, sort_order: 4, is_active: true, created_at: new Date().toISOString(), title: 'Steingrill Projekt', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/img_4411-standard.jpg' },
    { id: 6, sort_order: 5, is_active: true, created_at: new Date().toISOString(), title: 'Naturstein Detailaufnahme', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/cead709e-c89d-4916-b570-4e00c4256454-standard.jpg' },
    { id: 7, sort_order: 6, is_active: true, created_at: new Date().toISOString(), title: 'Fertiggestellte Steinarbeit', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/c4962ac3-ccf0-4fae-90ae-2fbed4751382-standard.jpg' },
    { id: 8, sort_order: 7, is_active: true, created_at: new Date().toISOString(), title: 'Granitverlegung', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/a93c8f8b-c27e-4ca5-a292-faa513f67c80-standard.jpg' },
    { id: 9, sort_order: 8, is_active: true, created_at: new Date().toISOString(), title: 'Naturstein Garten', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/84a56721-b8ff-425e-95cc-1a00330e3992-standard-n7iga7.jpg' },
    { id: 10, sort_order: 9, is_active: true, created_at: new Date().toISOString(), title: 'Naturstein Außenbereich', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/c3acb3a7-6830-42df-97b1-cff844f6e065-standard.jpg' },
    { id: 11, sort_order: 10, is_active: true, created_at: new Date().toISOString(), title: 'Steinarbeit Nahaufnahme', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/img_3852-standard.jpg' },
    { id: 12, sort_order: 11, is_active: true, created_at: new Date().toISOString(), title: 'Natursteinterrasse', image_path: 'https://primary.jwwb.nl/public/k/j/j/temp-cifqvjlauqugphtnokiu/img_3858-standard.jpg' }
  ],
  reviews: [
    {
      id: 1, sort_order: 0, is_active: true, created_at: new Date().toISOString(),
      author_name: 'Julia S.', rating: 5,
      quote: 'DS hat meinen Garten in eine kleine grüne Oase verwandelt — ich war beeindruckt von der großen Auswahl, der Qualität der Steine und dem erstklassigen, persönlichen Service.'
    }
  ],
  _nextId: { products: 5, portfolio: 13, reviews: 2 }
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULTS, null, 2));
  }
}

function readRaw() {
  ensureDb();
  const text = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    const data = JSON.parse(text);
    // backfill any keys added in later versions of this file
    for (const key of Object.keys(DEFAULTS)) {
      if (!(key in data)) data[key] = DEFAULTS[key];
    }
    for (const key of Object.keys(DEFAULTS.settings)) {
      if (!(key in data.settings)) data.settings[key] = DEFAULTS.settings[key];
    }
    return data;
  } catch (err) {
    throw new Error('Datenbankdatei ist beschädigt (ungültiges JSON): ' + err.message);
  }
}

// Serialize writes so concurrent admin actions can't race and corrupt the file.
let writeQueue = Promise.resolve();
function writeRaw(data) {
  writeQueue = writeQueue.then(() => new Promise((resolve, reject) => {
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFile(tmpFile, JSON.stringify(data, null, 2), (err) => {
      if (err) return reject(err);
      fs.rename(tmpFile, DB_FILE, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  }));
  return writeQueue;
}

function nextId(data, collection) {
  if (!data._nextId) data._nextId = {};
  const id = data._nextId[collection] || 1;
  data._nextId[collection] = id + 1;
  return id;
}

// ---------- Generic collection helpers ----------
function list(collection) {
  const data = readRaw();
  return [...data[collection]].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function get(collection, id) {
  const data = readRaw();
  return data[collection].find(item => item.id === Number(id)) || null;
}

async function create(collection, fields) {
  const data = readRaw();
  const id = nextId(data, collection);
  const item = { id, created_at: new Date().toISOString(), is_active: true, sort_order: data[collection].length, ...fields, };
  item.id = id; // make sure fields can't override the generated id
  data[collection].push(item);
  await writeRaw(data);
  return item;
}

async function update(collection, id, fields) {
  const data = readRaw();
  const idx = data[collection].findIndex(item => item.id === Number(id));
  if (idx === -1) return null;
  data[collection][idx] = { ...data[collection][idx], ...fields, id: Number(id) };
  await writeRaw(data);
  return data[collection][idx];
}

async function remove(collection, id) {
  const data = readRaw();
  const before = data[collection].length;
  data[collection] = data[collection].filter(item => item.id !== Number(id));
  await writeRaw(data);
  return data[collection].length < before;
}

// ---------- Settings ----------
function getSettings() {
  return readRaw().settings;
}

async function updateSettings(fields) {
  const data = readRaw();
  data.settings = { ...data.settings, ...fields };
  await writeRaw(data);
  return data.settings;
}

module.exports = {
  DATA_DIR,
  list,
  get,
  create,
  update,
  remove,
  getSettings,
  updateSettings,
};
