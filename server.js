const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [];

app.get('/api/tasks', (req, res) => {
  const { status } = req.query;
  if (status && status !== 'ALL') return res.json(tasks.filter(t => t.status === status));
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description = '', priority = 'MEDIUM' } = req.body || {};
  if (!title || !title.trim()) return res.status(400).send('Missing title');
  const task = {
    id: Date.now().toString(),
    title: title.trim(),
    description: (description || '').trim(),
    priority,
    status: 'TODO',
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['TODO','IN_PROGRESS','DONE'];
  if (!allowed.includes(status)) return res.status(400).send('Invalid status');
  const t = tasks.find(x => x.id === id);
  if (!t) return res.status(404).send('Not found');
  t.status = status;
  res.json(t);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const idx = tasks.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).send('Not found');
  tasks.splice(idx,1);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`Server listening http://localhost:${PORT}`));