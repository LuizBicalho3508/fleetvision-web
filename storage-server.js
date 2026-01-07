import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Função genérica para CRUD em arquivos JSON
const handleCrud = (filename) => {
  const filePath = `${DATA_DIR}/${filename}.json`;
  
  // Cria arquivo se não existir
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');

  const read = () => {
    try { return JSON.parse(fs.readFileSync(filePath)); } catch (e) { return []; }
  };
  
  const write = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return { read, write };
};

// --- ROTAS GENÉRICAS (FACTORY) ---
const createRoutes = (resource, filename) => {
  const db = handleCrud(filename);

  app.get(`/storage/${resource}`, (req, res) => res.json(db.read()));
  
  app.post(`/storage/${resource}`, (req, res) => {
    const data = db.read();
    const newItem = { id: Date.now(), ...req.body, created_at: new Date() };
    data.push(newItem);
    db.write(data);
    res.json(newItem);
  });

  app.put(`/storage/${resource}/:id`, (req, res) => {
    const data = db.read();
    const index = data.findIndex(i => i.id == req.params.id);
    if (index !== -1) {
      data[index] = { ...data[index], ...req.body };
      db.write(data);
      res.json(data[index]);
    } else res.status(404).json({ error: 'Not found' });
  });

  app.delete(`/storage/${resource}/:id`, (req, res) => {
    let data = db.read();
    data = data.filter(i => i.id != req.params.id);
    db.write(data);
    res.json({ success: true });
  });
};

// --- INICIALIZA ROTAS PARA CADA MÓDULO ---
createRoutes('trackers', 'trackers');       // Estoque
createRoutes('alerts', 'alerts');           // Regras de Alerta
createRoutes('maintenance', 'maintenance'); // Módulo Manutenção
createRoutes('finance', 'finance');         // Módulo Financeiro
createRoutes('drivers', 'drivers');         // Motoristas Extras

// --- CONFIGURAÇÕES (KEY-VALUE) ---
const settingsDb = handleCrud('settings');
app.get('/storage/settings/:key', (req, res) => {
  const data = settingsDb.read();
  const item = Array.isArray(data) ? data.find(d => d.key === req.params.key) : null;
  res.json(item ? item.value : null);
});
app.post('/storage/settings', (req, res) => {
  let data = settingsDb.read();
  const { key, value } = req.body;
  const index = data.findIndex(d => d.key === key);
  if (index !== -1) data[index].value = value;
  else data.push({ key, value });
  settingsDb.write(data);
  res.json({ success: true });
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Universal Storage Server rodando na porta 3001');
});
