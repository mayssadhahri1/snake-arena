// Logique pure du jeu Snake : aucune dépendance au DOM, donc testable avec Node.

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Crée l'état initial d'une partie
export function createGame(size = 20, random = Math.random) {
  const middle = Math.floor(size / 2);
  const snake = [
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
  ];
  return {
    size,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: placeFood(size, snake, random),
    score: 0,
    level: 1,
    over: false,
  };
}

// Place la nourriture sur une case libre (jamais sur le serpent)
export function placeFood(size, snake, random = Math.random) {
  const free = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!snake.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(random() * free.length)];
}

// Empêche le demi-tour direct (ex. : droite -> gauche)
export function changeDirection(game, dir) {
  if (!DIRECTIONS[dir] || game.over) return game;
  const cur = DIRECTIONS[game.direction];
  const next = DIRECTIONS[dir];
  if (cur.x + next.x === 0 && cur.y + next.y === 0) return game;
  return { ...game, nextDirection: dir };
}

// Vitesse du jeu en ms : plus le niveau monte, plus le serpent va vite
export function tickDelay(level) {
  return Math.max(60, 160 - (level - 1) * 12);
}

// Avance le jeu d'un pas et renvoie un nouvel état (pas de mutation)
export function step(game, random = Math.random) {
  if (game.over) return game;

  const direction = game.nextDirection;
  const d = DIRECTIONS[direction];
  const head = { x: game.snake[0].x + d.x, y: game.snake[0].y + d.y };

  const outside = head.x < 0 || head.y < 0 || head.x >= game.size || head.y >= game.size;
  const eats = game.food && head.x === game.food.x && head.y === game.food.y;

  // La queue bouge sauf si on mange : on l'exclut donc du test de collision
  const body = eats ? game.snake : game.snake.slice(0, -1);
  const hitsSelf = body.some((p) => p.x === head.x && p.y === head.y);

  if (outside || hitsSelf) return { ...game, direction, over: true };

  const snake = [head, ...body];
  if (!eats) return { ...game, snake, direction };

  const score = game.score + 10;
  const food = placeFood(game.size, snake, random);
  return {
    ...game,
    snake,
    direction,
    score,
    level: Math.floor(score / 50) + 1,
    food,
    over: food === null, // grille pleine : la partie est gagnée
  };
}
