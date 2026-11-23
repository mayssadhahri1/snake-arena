// Tests d'intégration de l'API (serveur lancé sur un port aléatoire)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';
import { ScoreStore } from '../server/scores.js';

let server;
let baseUrl;
let tmp;

before(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'snake-'));
  const store = await new ScoreStore(join(tmp, 'scores.json')).load();
  server = createApp(store).listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await rm(tmp, { recursive: true, force: true });
});

const post = (body) =>
  fetch(`${baseUrl}/api/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('GET /api/health répond ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('le classement est vide au départ', async () => {
  const res = await fetch(`${baseUrl}/api/scores`);
  assert.deepEqual(await res.json(), []);
});

test('POST /api/scores enregistre un score et renvoie le rang', async () => {
  const res = await post({ name: 'Mayssa', score: 120 });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.rank, 1);
});

test('le classement est trié du meilleur au moins bon', async () => {
  await post({ name: 'Nour', score: 300 });
  await post({ name: 'Ali', score: 50 });
  const scores = await (await fetch(`${baseUrl}/api/scores`)).json();
  assert.deepEqual(scores.map((s) => s.score), [300, 120, 50]);
});

test('un score invalide est refusé', async () => {
  const res = await post({ name: 'x', score: -5 });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).errors.length, 2);
});

test('un pseudo avec du HTML est refusé', async () => {
  const res = await post({ name: '<script>', score: 10 });
  assert.equal(res.status, 400);
});

test('un JSON mal formé renvoie 400', async () => {
  const res = await post('{pas du json');
  assert.equal(res.status, 400);
});

test('une route API inconnue renvoie 404', async () => {
  const res = await fetch(`${baseUrl}/api/inconnue`);
  assert.equal(res.status, 404);
});

test('la page du jeu est servie', async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Snake/);
});
