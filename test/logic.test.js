// Tests unitaires de la logique du jeu
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, changeDirection, placeFood, tickDelay } from '../public/logic.js';

// Générateur "aléatoire" fixe pour des tests reproductibles
const firstCell = () => 0;

test('une nouvelle partie commence avec un serpent de 3 cases', () => {
  const game = createGame(20, firstCell);
  assert.equal(game.snake.length, 3);
  assert.equal(game.score, 0);
  assert.equal(game.over, false);
});

test('le serpent avance d\'une case dans sa direction', () => {
  const game = createGame(20, firstCell);
  const next = step(game);
  assert.deepEqual(next.snake[0], { x: game.snake[0].x + 1, y: game.snake[0].y });
  assert.equal(next.snake.length, 3);
});

test('le demi-tour direct est ignoré', () => {
  const game = createGame(20, firstCell);
  assert.equal(changeDirection(game, 'left').nextDirection, 'right');
  assert.equal(changeDirection(game, 'up').nextDirection, 'up');
});

test('manger fait grandir le serpent et augmente le score', () => {
  const game = createGame(20, firstCell);
  const head = game.snake[0];
  const withFood = { ...game, food: { x: head.x + 1, y: head.y } };
  const next = step(withFood, firstCell);
  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 10);
});

test('toucher un mur termine la partie', () => {
  const game = { ...createGame(5, firstCell), snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }], food: { x: 0, y: 0 } };
  assert.equal(step(game).over, true);
});

test('se mordre la queue termine la partie', () => {
  // Serpent en forme de U : en montant, la tête touche son propre corps
  const snake = [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }];
  const game = { ...createGame(6, firstCell), snake, direction: 'left', nextDirection: 'up', food: { x: 5, y: 5 } };
  assert.equal(step(game).over, true);
});

test('la tête peut prendre la place de la queue qui avance', () => {
  const snake = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
  const game = { ...createGame(6, firstCell), snake, direction: 'left', nextDirection: 'down', food: { x: 5, y: 5 } };
  assert.equal(step(game).over, false);
});

test('la nourriture n\'apparaît jamais sur le serpent', () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  for (let i = 0; i < 50; i++) {
    const food = placeFood(2, snake);
    assert.ok(!snake.some((p) => p.x === food.x && p.y === food.y));
  }
});

test('le jeu accélère avec le niveau sans descendre sous 60 ms', () => {
  assert.ok(tickDelay(2) < tickDelay(1));
  assert.equal(tickDelay(100), 60);
});
