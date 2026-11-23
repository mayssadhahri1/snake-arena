// Stockage du classement dans un fichier JSON (simple et suffisant pour ce projet)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const MAX_ENTRIES = 100;

// Valide un score reçu par l'API et renvoie la liste des erreurs
export function validateScore(body) {
  const errors = [];
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 20) errors.push('Le pseudo doit faire entre 2 et 20 caractères');
  if (name && !/^[\p{L}\p{N} _-]+$/u.test(name)) errors.push('Le pseudo contient des caractères non autorisés');
  if (!Number.isInteger(body?.score) || body.score < 0 || body.score > 100000) {
    errors.push('Le score doit être un entier entre 0 et 100000');
  }
  return errors;
}

export class ScoreStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.scores = [];
  }

  // Charge le fichier s'il existe, sinon démarre avec un classement vide
  async load() {
    try {
      this.scores = JSON.parse(await readFile(this.filePath, 'utf8'));
    } catch {
      this.scores = [];
    }
    return this;
  }

  async save() {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.scores, null, 2));
  }

  top(limit = 10) {
    return this.scores.slice(0, limit);
  }

  // Ajoute un score, trie le classement et renvoie le rang obtenu
  async add(name, score) {
    const entry = { name: name.trim(), score, date: new Date().toISOString() };
    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
    this.scores = this.scores.slice(0, MAX_ENTRIES);
    await this.save();
    const rank = this.scores.indexOf(entry) + 1;
    return { ...entry, rank: rank || null };
  }
}
