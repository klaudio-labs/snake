(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');

  const GRID = 18; // 18x18
  const CELL = canvas.width / GRID;

  const COLORS = {
    bg: '#0e1726',
    grid: 'rgba(255,255,255,0.06)',
    snake: '#3ddc97',
    snakeHead: '#6bffbf',
    food: '#ff5c5c',
    text: 'rgba(232,238,247,0.85)'
  };

  let snake, dir, nextDir, food, score, best, running, tickMs, lastTick;

  function loadBest(){
    try { return Number(localStorage.getItem('snake_best') || 0) || 0; }
    catch { return 0; }
  }
  function saveBest(v){
    try { localStorage.setItem('snake_best', String(v)); } catch {}
  }

  function randCell(excludeSet){
    while (true){
      const x = Math.floor(Math.random() * GRID);
      const y = Math.floor(Math.random() * GRID);
      const k = `${x},${y}`;
      if (!excludeSet.has(k)) return {x,y};
    }
  }

  function reset(){
    score = 0;
    tickMs = 110;
    running = false;
    lastTick = 0;

    dir = {x: 1, y: 0};
    nextDir = {x: 1, y: 0};

    const mid = Math.floor(GRID/2);
    snake = [
      {x: mid-1, y: mid},
      {x: mid-2, y: mid},
      {x: mid-3, y: mid},
    ];

    const occ = new Set(snake.map(p => `${p.x},${p.y}`));
    food = randCell(occ);

    scoreEl.textContent = String(score);
    best = loadBest();
    bestEl.textContent = String(best);
  }

  function showOverlay(text, btnText){
    overlay.classList.remove('hidden');
    overlay.querySelector('h1').textContent = text;
    startBtn.textContent = btnText;
  }

  function hideOverlay(){
    overlay.classList.add('hidden');
  }

  function setDir(d){
    // Prevent reversing directly
    if (running){
      if (d.x === -dir.x && d.y === -dir.y) return;
    }
    nextDir = d;
  }

  function step(){
    dir = nextDir;

    const head = snake[0];
    const nh = { x: head.x + dir.x, y: head.y + dir.y };

    // wall collision
    if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID){
      gameOver();
      return;
    }

    // self collision
    for (let i=0;i<snake.length;i++){
      if (snake[i].x === nh.x && snake[i].y === nh.y){
        gameOver();
        return;
      }
    }

    snake.unshift(nh);

    if (nh.x === food.x && nh.y === food.y){
      score += 1;
      scoreEl.textContent = String(score);
      if (score > best){ best = score; bestEl.textContent = String(best); saveBest(best); }

      // slightly speed up every 5 points
      if (score % 5 === 0) tickMs = Math.max(70, tickMs - 6);

      const occ = new Set(snake.map(p => `${p.x},${p.y}`));
      food = randCell(occ);
    } else {
      snake.pop();
    }
  }

  function gameOver(){
    running = false;
    showOverlay('Game Over', 'Reintentar');
  }

  function drawGrid(){
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i=1;i<GRID;i++){
      const p = i*CELL;
      ctx.beginPath();
      ctx.moveTo(p,0); ctx.lineTo(p,canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,p); ctx.lineTo(canvas.width,p);
      ctx.stroke();
    }
  }

  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function draw(){
    drawGrid();

    // food
    ctx.fillStyle = COLORS.food;
    const fx = food.x*CELL, fy = food.y*CELL;
    roundRect(fx+3, fy+3, CELL-6, CELL-6, 6);
    ctx.fill();

    // snake
    for (let i=snake.length-1;i>=0;i--){
      const p = snake[i];
      const x = p.x*CELL, y=p.y*CELL;
      ctx.fillStyle = (i===0) ? COLORS.snakeHead : COLORS.snake;
      roundRect(x+2, y+2, CELL-4, CELL-4, 7);
      ctx.fill();
    }

    if (!running){
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('Pulsa Jugar o desliza para empezar', canvas.width/2, canvas.height - 14);
    }
  }

  function loop(ts){
    if (running){
      if (!lastTick) lastTick = ts;
      const elapsed = ts - lastTick;
      if (elapsed >= tickMs){
        lastTick = ts;
        step();
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Keyboard
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') setDir({x:0,y:-1});
    if (k === 'arrowdown' || k === 's') setDir({x:0,y:1});
    if (k === 'arrowleft' || k === 'a') setDir({x:-1,y:0});
    if (k === 'arrowright' || k === 'd') setDir({x:1,y:0});

    if (k === ' '){
      if (!running){
        hideOverlay();
        running = true;
        lastTick = 0;
      }
    }
  }, {passive:false});

  // Buttons
  document.querySelectorAll('.ctl').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dir;
      if (d==='up') setDir({x:0,y:-1});
      if (d==='down') setDir({x:0,y:1});
      if (d==='left') setDir({x:-1,y:0});
      if (d==='right') setDir({x:1,y:0});
      if (!running){
        hideOverlay();
        running = true;
        lastTick = 0;
      }
    });
  });

  // Swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touchStart = {x: t.clientX, y: t.clientY};
  }, {passive:true});

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const threshold = 14;
    if (Math.max(ax, ay) < threshold) return;

    if (ax > ay){
      setDir(dx > 0 ? {x:1,y:0} : {x:-1,y:0});
    } else {
      setDir(dy > 0 ? {x:0,y:1} : {x:0,y:-1});
    }

    if (!running){
      hideOverlay();
      running = true;
      lastTick = 0;
    }
  }, {passive:true});

  startBtn.addEventListener('click', () => {
    reset();
    hideOverlay();
    running = true;
    lastTick = 0;
  });

  
  // FULL_WIN_MODE: if URL has ?full=1, fill the board (for demo/screenshot)
  function fillBoardWin(){
    // Build a full snake path (serpentine)
    const cells = [];
    for (let y = 0; y < GRID; y++){
      if (y % 2 === 0){
        for (let x = 0; x < GRID; x++) cells.push({x,y});
      } else {
        for (let x = GRID-1; x >= 0; x--) cells.push({x,y});
      }
    }
    snake = cells;
    running = false;
    score = GRID*GRID - 1;
    scoreEl.textContent = String(score);
    if (score > best){ best = score; bestEl.textContent = String(best); saveBest(best); }
    // Place food off-board
    food = {x:-1,y:-1};
    showOverlay('¡Victoria!', 'Reiniciar');
  }

  // Init
  reset();
  if (new URLSearchParams(location.search).get('full') === '1') {
    fillBoardWin();
  } else {
    showOverlay('Snake', 'Jugar');
  }
  requestAnimationFrame(loop);
})();
