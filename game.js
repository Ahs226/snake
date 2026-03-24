// ─── 상수 ───────────────────────────────────────────────
const CELL_SIZE  = 20;
const COLS       = 20;
const ROWS       = 20;
const BASE_SPEED = 150;  // ms (낮을수록 빠름)
const MIN_SPEED  = 60;   // 최소 인터벌

// ─── 게임 상태 ───────────────────────────────────────────
const STATE = { IDLE: 'idle', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };

// ─── DOM ─────────────────────────────────────────────────
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');
const scoreEl     = document.getElementById('score');
const bestEl      = document.getElementById('best');
const restartBtn  = document.getElementById('restartBtn');

// ─── 게임 변수 ────────────────────────────────────────────
let snake, direction, dirQueue, food, score, bestScore, gameState, intervalId;

// ─── 초기화 ──────────────────────────────────────────────
function init() {
  snake     = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  dirQueue  = [];
  food      = spawnFood();
  score     = 0;
  bestScore = parseInt(localStorage.getItem('snakeBest') || '0');
  gameState = STATE.IDLE;

  scoreEl.textContent = score;
  bestEl.textContent  = bestScore;

  clearInterval(intervalId);
  draw();
}

// ─── 게임 시작 / 재시작 ───────────────────────────────────
function startGame() {
  snake     = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  dirQueue  = [];
  food      = spawnFood();
  score     = 0;
  scoreEl.textContent = score;
  gameState = STATE.PLAYING;

  clearInterval(intervalId);
  intervalId = setInterval(gameLoop, BASE_SPEED);
}

// ─── 게임 루프 ────────────────────────────────────────────
function gameLoop() {
  // 방향 큐에서 다음 방향 꺼내기
  if (dirQueue.length > 0) {
    direction = dirQueue.shift();
  }

  const head    = snake[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // 벽 충돌
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    gameOver();
    return;
  }

  // 자기 몸 충돌
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver();
    return;
  }

  snake.unshift(newHead);

  // 먹이 먹었는지 확인
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    scoreEl.textContent = score;

    // 최고 점수 갱신
    if (score > bestScore) {
      bestScore = score;
      bestEl.textContent = bestScore;
      localStorage.setItem('snakeBest', bestScore);
    }

    food = spawnFood();

    // 속도 증가
    const newSpeed = Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / 50) * 10);
    clearInterval(intervalId);
    intervalId = setInterval(gameLoop, newSpeed);
  } else {
    snake.pop();  // 꼬리 제거 (이동)
  }

  draw();
}

// ─── 게임 오버 ────────────────────────────────────────────
function gameOver() {
  clearInterval(intervalId);
  gameState = STATE.GAMEOVER;
  draw();
}

// ─── 먹이 생성 ────────────────────────────────────────────
function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

// ─── 렌더링 ───────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGrid();
  drawFood();
  drawSnake();
  drawOverlay();
}

function drawBackground() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  ctx.strokeStyle = '#0f3460';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(canvas.width, y * CELL_SIZE);
    ctx.stroke();
  }
}

function drawFood() {
  const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
  const r  = CELL_SIZE / 2 - 2;

  // 글로우 효과
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur  = 10;

  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawSnake() {
  snake.forEach((seg, i) => {
    const x = seg.x * CELL_SIZE;
    const y = seg.y * CELL_SIZE;
    const pad = 1;

    if (i === 0) {
      // 머리 — 진한 초록
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur  = 8;
    } else {
      // 몸통 — 초록, 꼬리로 갈수록 약간 어둡게
      const alpha = Math.max(0.5, 1 - i * 0.03);
      ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);
    ctx.shadowBlur = 0;

    // 머리에 눈 그리기
    if (i === 0) {
      drawSnakeEyes(seg);
    }
  });
}

function drawSnakeEyes(head) {
  const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
  const eyeR = 2;
  const offset = 4;

  ctx.fillStyle = '#1a1a2e';

  let eye1, eye2;
  const dir = direction;

  if (dir.x === 1) {       // 오른쪽
    eye1 = { x: cx + 3, y: cy - offset };
    eye2 = { x: cx + 3, y: cy + offset };
  } else if (dir.x === -1) { // 왼쪽
    eye1 = { x: cx - 3, y: cy - offset };
    eye2 = { x: cx - 3, y: cy + offset };
  } else if (dir.y === -1) { // 위
    eye1 = { x: cx - offset, y: cy - 3 };
    eye2 = { x: cx + offset, y: cy - 3 };
  } else {                   // 아래
    eye1 = { x: cx - offset, y: cy + 3 };
    eye2 = { x: cx + offset, y: cy + 3 };
  }

  [eye1, eye2].forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOverlay() {
  if (gameState === STATE.PLAYING) return;

  // 반투명 배경
  ctx.fillStyle = 'rgba(22, 33, 62, 0.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  if (gameState === STATE.IDLE) {
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('SNAKE GAME', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Courier New';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 + 20);
  }

  if (gameState === STATE.PAUSED) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Courier New';
    ctx.fillText('Press P to Resume', canvas.width / 2, canvas.height / 2 + 24);
  }

  if (gameState === STATE.GAMEOVER) {
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px Courier New';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Courier New';
    ctx.fillText('Press SPACE or Restart', canvas.width / 2, canvas.height / 2 + 40);
  }
}

// ─── 키보드 입력 ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  // 방향키 스크롤 방지
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }

  // Space: 시작 / 재시작
  if (e.key === ' ') {
    if (gameState === STATE.IDLE || gameState === STATE.GAMEOVER) {
      startGame();
    }
    return;
  }

  // P: 일시정지 / 재개
  if (e.key === 'p' || e.key === 'P') {
    if (gameState === STATE.PLAYING) {
      clearInterval(intervalId);
      gameState = STATE.PAUSED;
      draw();
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      const currentSpeed = Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / 50) * 10);
      intervalId = setInterval(gameLoop, currentSpeed);
    }
    return;
  }

  if (gameState !== STATE.PLAYING) return;

  // 방향 전환 — 반대 방향 무시, 큐에 추가
  const cur = dirQueue.length > 0 ? dirQueue[dirQueue.length - 1] : direction;
  let next = null;

  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': next = { x:  0, y: -1 }; break;
    case 'ArrowDown':  case 's': case 'S': next = { x:  0, y:  1 }; break;
    case 'ArrowLeft':  case 'a': case 'A': next = { x: -1, y:  0 }; break;
    case 'ArrowRight': case 'd': case 'D': next = { x:  1, y:  0 }; break;
  }

  if (next && !(next.x === -cur.x && next.y === -cur.y)) {
    dirQueue.push(next);
  }
});

// ─── 버튼 클릭 ────────────────────────────────────────────
restartBtn.addEventListener('click', () => {
  startGame();
});

// ─── 시작 ─────────────────────────────────────────────────
init();
