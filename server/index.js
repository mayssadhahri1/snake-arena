// Point d'entrée : charge le classement puis démarre le serveur HTTP
import { createApp } from './app.js';
import { ScoreStore } from './scores.js';

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || './data/scores.json';

const store = await new ScoreStore(DATA_FILE).load();
const server = createApp(store).listen(PORT, () => {
  console.log(`Snake Arena disponible sur http://localhost:${PORT}`);
});

// Arrêt propre quand Docker envoie SIGTERM
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
