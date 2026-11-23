// Application Express : sert le jeu (fichiers statiques) et l'API du classement
import express from 'express';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { validateScore } from './scores.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  // Sonde utilisée par Docker et Jenkins pour vérifier que le service répond
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
  });

  app.get('/api/scores', (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    res.json(store.top(limit));
  });

  app.post('/api/scores', async (req, res, next) => {
    try {
      const errors = validateScore(req.body);
      if (errors.length) return res.status(400).json({ errors });
      const saved = await store.add(req.body.name, req.body.score);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.use(express.static(publicDir));

  // Route API inconnue
  app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));

  // Gestion centralisée des erreurs (JSON mal formé, erreur d'écriture...)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  });

  return app;
}
