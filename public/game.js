// Partie interface : dessin sur le canvas, clavier, tactile et appels à l'API
import { createGame, step, changeDirection, tickDelay } from './logic.js';

const GRID = 20;
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const cell = canvas.width / GRID;

const $ = (id) => document.getElementById(id);
const ui = {
  score: $('score'), level: $('level'), best: $('best'),
  overlay: $('overlay'), title: $('overlay-title'), text: $('overlay-text'),
  form: $('score-form'), name: $('player-name'), message: $('form-message'),
  start: $('start-btn'), board: $('leaderboard'),
};

let game = createGame(GRID);
let timer = null;
let paused = false;
let best = Number(localStorage.getItem('snake-best')) || 0;
ui.best.textContent = best;
ui.name.value = localStorage.getItem('snake-name') || '';

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  z: 'up', s: 'down', q: 'left', d: 'right',
  w: 'up', a: 'left', // clavier QWERTY
};

// ---------- Dessin ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Quadrillage léger
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let i = 1; i < GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke();
  }

  // Nourriture
  if (game.food) {
    ctx.fillStyle = '#f85149';
    ctx.beginPath();
    ctx.arc((game.food.x + 0.5) * cell, (game.food.y + 0.5) * cell, cell * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Serpent : la couleur s'éclaircit de la tête vers la queue
  game.snake.forEach((p, i) => {
    const t = i / game.snake.length;
    ctx.fillStyle = i === 0 ? '#56d364' : `rgba(63, 185, 80, ${1 - t * 0.6})`;
    ctx.beginPath();
    ctx.roundRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2, 5);
    ctx.fill();
  });
}

function updateStats() {
  ui.score.textContent = game.score;
  ui.level.textContent = game.level;
}

// ---------- Boucle de jeu ----------
function loop() {
  const previousLevel = game.level;
  game = step(game);
  draw();
  updateStats();

  if (game.over) return endGame();
  // On relance le minuteur uniquement si la vitesse a changé
  if (game.level !== previousLevel) schedule();
}

function schedule() {
  clearInterval(timer);
  timer = setInterval(loop, tickDelay(game.level));
}

function startGame() {
  game = createGame(GRID);
  paused = false;
  hideOverlay();
  draw();
  updateStats();
  schedule();
}

function togglePause() {
  // Pas de pause avant le début ni après la fin de la partie
  const overlayVisible = !ui.overlay.classList.contains('hidden');
  if (game.over || (overlayVisible && !paused)) return;
  paused = !paused;
  if (paused) {
    clearInterval(timer);
    showOverlay('Pause', 'Appuie sur Espace pour reprendre.', false, 'Reprendre');
  } else {
    hideOverlay();
    schedule();
  }
}

function endGame() {
  clearInterval(timer);
  if (game.score > best) {
    best = game.score;
    localStorage.setItem('snake-best', best);
    ui.best.textContent = best;
  }
  const won = game.food === null;
  showOverlay(won ? 'Victoire !' : 'Partie terminée', `Score final : ${game.score}`, game.score > 0, 'Rejouer');
}

// ---------- Écran superposé ----------
function showOverlay(title, text, withForm, buttonLabel) {
  ui.title.textContent = title;
  ui.text.textContent = text;
  ui.form.hidden = !withForm;
  ui.message.textContent = '';
  ui.start.textContent = buttonLabel;
  ui.overlay.classList.remove('hidden');
  if (withForm) ui.name.focus();
}

function hideOverlay() {
  ui.overlay.classList.add('hidden');
}

// ---------- API classement ----------
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/scores?limit=10');
    const scores = await res.json();
    ui.board.replaceChildren(
      ...(scores.length
        ? scores.map((s) => {
            const li = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = s.name; // textContent : pas d'injection HTML possible
            const score = document.createElement('strong');
            score.textContent = s.score;
            li.append(name, score);
            return li;
          })
        : [Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Aucun score pour le moment' })])
    );
  } catch {
    ui.board.innerHTML = '<li class="empty">Classement indisponible</li>';
  }
}

ui.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = ui.name.value.trim();
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: game.score }),
    });
    const data = await res.json();
    if (!res.ok) {
      ui.message.textContent = data.errors?.join(' · ') || data.error;
      return;
    }
    localStorage.setItem('snake-name', name);
    ui.form.hidden = true;
    ui.message.textContent = data.rank ? `Bravo, tu es classé(e) n°${data.rank} !` : 'Score enregistré.';
    loadLeaderboard();
  } catch {
    ui.message.textContent = 'Impossible de joindre le serveur.';
  }
});

// ---------- Contrôles ----------
document.addEventListener('keydown', (e) => {
  if (e.target === ui.name) return; // ne pas jouer pendant la saisie du pseudo
  if (e.code === 'Space') {
    e.preventDefault();
    return togglePause();
  }
  const dir = KEYS[e.key] || KEYS[e.key.toLowerCase()];
  if (dir) {
    e.preventDefault();
    game = changeDirection(game, dir);
  }
});

document.querySelectorAll('.pad button').forEach((btn) =>
  btn.addEventListener('click', () => { game = changeDirection(game, btn.dataset.dir); })
);

ui.start.addEventListener('click', () => (paused ? togglePause() : startGame()));

draw();
loadLeaderboard();
