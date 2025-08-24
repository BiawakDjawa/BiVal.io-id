// ===== USER LOGIN/REGISTER LOGIC =====
let users = JSON.parse(localStorage.getItem('game_users') || "[]");
let currentUser = localStorage.getItem('game_currentUser');
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');

function showMain() {
  authSection.style.display = "none";
  mainSection.style.display = "block";
}
function showAuth() {
  mainSection.style.display = "none";
  authSection.style.display = "block";
}
if (currentUser) showMain();

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  let uname = document.getElementById('username').value.trim();
  let pass = document.getElementById('password').value;
  let user = users.find(u => u.uname === uname && u.pass === pass);
  if (user) {
    localStorage.setItem('game_currentUser', uname);
    showMain(); loginError.textContent = "";
  } else {
    loginError.textContent = "Nama pengguna atau kata sandi salah.";
  }
});
registerForm.addEventListener('submit', e => {
  e.preventDefault();
  let uname = document.getElementById('reg-username').value.trim();
  let pass = document.getElementById('reg-password').value;
  if (users.find(u => u.uname === uname)) {
    registerError.textContent = "Nama pengguna sudah terdaftar.";
    return;
  }
  if (uname.length < 3 || pass.length < 3) {
    registerError.textContent = "Nama pengguna dan sandi minimal 3 karakter.";
    return;
  }
  users.push({ uname, pass });
  localStorage.setItem('game_users', JSON.stringify(users));
  registerError.textContent = "Pendaftaran berhasil! Silakan login.";
});
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('game_currentUser');
  showAuth();
});

// ===== GAME MENU LOGIC =====
const games = ["tetris", "blockdash", "snake"];
const gameBtns = document.querySelectorAll('.game-btn');
gameBtns.forEach(btn => btn.addEventListener('click', () => showGame(btn.dataset.game)));

function showGame(game) {
  document.getElementById('welcome').style.display = "none";
  document.querySelectorAll('.game-canvas-section').forEach(sec => sec.style.display = "none");
  gameBtns.forEach(btn => btn.classList.remove('active'));
  document.getElementById('game-'+game).style.display = "block";
  document.querySelector(`.game-btn[data-game=${game}]`).classList.add('active');
  if (game === "tetris") startTetris();
  if (game === "blockdash") startBlockDash();
  if (game === "snake") startSnake();
}

// ===== GRAPHIC UTIL =====
function drawRect(ctx, x, y, w, h, color, border="#222") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}
function drawCircle(ctx, x, y, r, color, border="#222") {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== TETRIS GAME =====
let tetrisRunning = false;
function startTetris() {
  if (tetrisRunning) return;
  tetrisRunning = true;
  const canvas = document.getElementById('tetris-canvas');
  const ctx = canvas.getContext('2d');
  const W = 10, H = 20, cell = 32;
  let board = Array.from({length:H},()=>Array(W).fill(0));
  let shapes = [
    [[1,1,1,1]], // I
    [[2,2],[2,2]], // O
    [[0,3,0],[3,3,3]], // T
    [[4,4,0],[0,4,4]], // S
    [[0,5,5],[5,5,0]], // Z
    [[6,6,6],[6,0,0]], // L
    [[7,7,7],[0,0,7]], // J
  ];
  let colors = ["#222","#1abc9c","#f1c40f","#9b59b6","#2ecc71","#e67e22","#e74c3c","#2980b9"];
  let current, pos, score=0, dropTimer=0, dropInterval=600, gameOver=false;

  function reset() {
    board = Array.from({length:H},()=>Array(W).fill(0));
    score = 0; gameOver = false;
    spawn();
    draw();
  }
  function spawn() {
    let idx = Math.floor(Math.random()*shapes.length);
    current = shapes[idx].map(r=>[...r]);
    pos = {x:Math.floor(W/2)-1, y:0};
    if (!valid(current,pos.x,pos.y)) { gameOver=true; }
  }
  function merge() {
    current.forEach((row,i)=>row.forEach((v,j)=>{
      if (v) board[pos.y+i][pos.x+j]=v;
    }));
  }
  function valid(shape, x, y) {
    for (let i=0;i<shape.length;i++)
      for (let j=0;j<shape[0].length;j++)
        if (shape[i][j] && (y+i<0||y+i>=H||x+j<0||x+j>=W||board[y+i][x+j])) return false;
    return true;
  }
  function rotate(shape) {
    return shape[0].map((_,i)=>shape.map(row=>row[i]).reverse());
  }
  function clearLines() {
    let newBoard = board.filter(row=>row.some(v=>!v));
    let lines = H-newBoard.length;
    while(newBoard.length<H) newBoard.unshift(Array(W).fill(0));
    if (lines) score+=lines*100;
    board = newBoard;
  }
  function move(dx,dy,rot) {
    let next = rot?rotate(current):current;
    let nx=pos.x+(dx||0), ny=pos.y+(dy||0);
    if (valid(next,nx,ny)) {
      current=next; pos.x=nx; pos.y=ny; draw(); return true;
    }
    return false;
  }
  function drawSandBlock(ctx, x, y, size) {
    // Body (sand color)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x+size/2, y+size/2, size/2.05, 0, Math.PI*2);
    ctx.fillStyle = "#ffe066";
    ctx.shadowColor = "#f5c542";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Grain (random dots)
    for(let i=0;i<6;i++) {
      ctx.beginPath();
      let gx = x + size/3 + Math.random()*size/3;
      let gy = y + size/3 + Math.random()*size/3;
      ctx.arc(gx, gy, 1.2, 0, Math.PI*2);
      ctx.fillStyle = "#e2c275";
      ctx.fill();
    }
    ctx.restore();
    // Border
    ctx.strokeStyle="#c9b25e"; ctx.lineWidth=2;
    ctx.strokeRect(x+1, y+1, size-2, size-2);
  }
  function hardDrop() {
    while(move(0,1,0)){}
    tick();
  }
  function tick() {
    if (!move(0,1,0)) {
      merge();
      function explodeSand() {
  let exploded = 0;
  for (let x=0; x<W; x++) {
    for (let y=0; y<H-2; y++) {
      if (board[y][x] && board[y+1][x] && board[y+2][x]) {
        // Meledakkan 3 bertumpuk
        board[y][x]=0; board[y+1][x]=0; board[y+2][x]=0;
        exploded++;
        // Optional: Efek animasi bisa ditambah di sini
      }
    }
  }
  if (exploded) score += exploded * 100;
}
      clearLines();
      function tick() {
  if (!move(0,1,0)) {
    merge();
    explodeSand();   // << TAMBAHKAN INI
    clearLines();
    spawn();
    if (gameOver) { draw(); return; }
  }
  draw();
}
      spawn();
      if (gameOver) { draw(); return; }
    }
    draw();
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Draw board
    for (let i=0;i<H;i++)
      for (let j=0;j<W;j++)
        if (board[i][j]) drawSandBlock(ctx, j*cell, i*cell, cell);
// ...
    // Draw current
    current.forEach((row,i)=>row.forEach((v,j)=>{
        if (v) drawSandBlock(ctx, (pos.x+j)*cell, (pos.y+i)*cell, cell);
    }));
    // Border
    ctx.strokeStyle = "#111"; ctx.lineWidth = 4;
    ctx.strokeRect(0,0,W*cell,H*cell);
    // Score/Game Over
    document.getElementById('tetris-score').innerHTML =
      gameOver ? "<span style='color:#e74c3c;font-weight:bold;'>Game Over</span> Skor: "+score
      : "Skor: "+score;
  }
  let req;
  function loop(ts) {
    if (!tetrisRunning) { cancelAnimationFrame(req); return; }
    if (!gameOver) {
      if (!dropTimer) dropTimer=ts;
      if (ts-dropTimer > dropInterval) { tick(); dropTimer=ts; }
      req = requestAnimationFrame(loop);
    }
  }
  reset(); dropTimer=0; req=requestAnimationFrame(loop);

  // Keyboard
  function onKey(e) {
    if (document.activeElement.tagName==="INPUT") return;
    if (gameOver && e.code==="Space") { reset(); dropTimer=0; req=requestAnimationFrame(loop); }
    if (gameOver) return;
    if (e.code==="ArrowLeft") move(-1,0,0);
    else if (e.code==="ArrowRight") move(1,0,0);
    else if (e.code==="ArrowDown") move(0,1,0);
    else if (e.code==="ArrowUp") move(0,0,1);
    else if (e.code==="Space") hardDrop();
  }
  window.onkeydown = onKey;
}

// ===== BLOCK DASH GAME (Flappy Block / Dash) =====
let blockDashRunning = false;
let blockDashCleanup = () => {}; // For removing old event listener

function startBlockDash() {
  if (blockDashRunning) return;
  blockDashRunning = true;
  const canvas = document.getElementById('blockdash-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let block, gravity, jump, pipes, score, best, gameOver, tick, frameId;

  function reset() {
    block= {x:60, y:H/2, w:40, h:40, vy:0};
    gravity = 0.62;
    jump = -10;
    pipes = [];
    tick = 0;
    score = 0;
    best = Number(localStorage.getItem('blockdash_best') || 0);
    gameOver = false;
    draw();
  }

  function addPipe() {
    let gap = 170;
    let t = Math.random() * (H - gap - 60) + 30;
    pipes.push({x:W, y:0, w:60, h:t, passed:false});
    pipes.push({x:W, y:t+gap, w:60, h:H-t-gap, passed:false});
  }

  function update() {
    if (gameOver) return;
    tick++;
    block.vy += gravity;
    block.y += block.vy;
    if (block.y+block.h>H || block.y<0) gameOver=true;
    if (tick % 80 === 0) addPipe();
    pipes.forEach(p=>p.x-=4);
    pipes = pipes.filter(p=>p.x+p.w>0);
    pipes.forEach(p=>{
      if (!p.passed && p.x+block.w>block.x && p.x<block.x+block.w && !(block.y+block.h<p.y||block.y>p.y+p.h)) {
        gameOver=true;
      }
      if (!p.passed && p.x+block.w<block.x && p.y===0) {score++; p.passed=true;}
    });
    if (gameOver && score > best) {
      best = score;
      localStorage.setItem('blockdash_best', best);
    }
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Background
    ctx.fillStyle="#bdf4f7"; ctx.fillRect(0,0,W,H);
    // Pipes
    pipes.forEach(p=>{
      drawRect(ctx,p.x,p.y,p.w,p.h,"#79c000","#4a7b00");
      ctx.beginPath();
      ctx.arc(p.x+p.w/2,p.y+p.h,p.w/2,0,Math.PI,false);
      ctx.fillStyle="#a0e800";
      ctx.fill();
      ctx.strokeStyle="#4a7b00"; ctx.stroke();
    });
    // Block
    function drawBird(ctx, x, y, w, h) {
        // Body (ellipse)
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        ctx.scale(1, 0.8);
        ctx.beginPath();
        ctx.arc(0, 0, w/2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffe066";
        ctx.fill();
        ctx.restore();
      
        // Wing
        ctx.save();
        ctx.translate(x + w*0.25, y + h*0.6);
        ctx.rotate(-0.7);
        ctx.beginPath();
        ctx.ellipse(0, 0, w*0.22, h*0.16, 0, 0, 2*Math.PI);
        ctx.fillStyle = "#ffd23f";
        ctx.fill();
        ctx.restore();
      
        // Eye
        ctx.beginPath();
        ctx.arc(x + w*0.7, y + h*0.32, w*0.11, 0, Math.PI*2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w*0.72, y + h*0.34, w*0.05, 0, Math.PI*2);
        ctx.fillStyle = "#333";
        ctx.fill();
      
        // Beak
        ctx.beginPath();
        ctx.moveTo(x + w*0.95, y + h*0.45);
        ctx.lineTo(x + w*1.13, y + h*0.44);
        ctx.lineTo(x + w*0.97, y + h*0.56);
        ctx.closePath();
        ctx.fillStyle = "#ffb84d";
        ctx.fill();
      
        // Outline
        ctx.lineWidth = 0,1;
        ctx.strokeStyle = "#222";
        ctx.strokeRect(x, y, w, h);
        ctx.invisible= 0.9
      }
    // Block 
    drawBird
    (ctx,block.x,block.y,block.w,block.h,"#ffb900","#e67e22");
     ctx.strokeStyle="#222"; ctx.lineWidth=3; ctx.strokeRect(block.x,block.y,block.w,block.h);
    // Score
    ctx.font="bold 2em Segoe UI"; ctx.fillStyle="#1f7bc1";
    ctx.fillText("Skor: "+score,20,40);
    ctx.font="1em Segoe UI";
    ctx.fillText("Rekor: "+best,20,70);
    if (gameOver) {
      ctx.textAlign="center";
      ctx.fillStyle="#e74c3c";
      ctx.font="bold 2em Segoe UI";
      ctx.fillText("Game Over",W/2,H/2-20);
      ctx.font="bold 1.1em Segoe UI";
      ctx.fillStyle="#222";
      ctx.fillText("Tekan Spasi/↑ untuk Main Lagi",W/2,H/2+30);
      ctx.textAlign="start";
    }
    document.getElementById('blockdash-score').innerHTML = "Skor: "+score+" | Rekor: "+best;
  }

  function loop() {
    if (!blockDashRunning) return;
    update();
    draw();
    if (!gameOver) {
      frameId = requestAnimationFrame(loop);
    }
  }

  function restart() {
    reset();
    frameId && cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(loop);
  }

  function keyboardHandler(e) {
    if (document.activeElement.tagName==="INPUT") return;
    if (gameOver && (e.code==="Space"||e.code==="ArrowUp")) {
      restart();
      return;
    }
    if (gameOver) return;
    if (e.code==="Space"||e.code==="ArrowUp") { block.vy=jump; }
  }

  // Remove previous event listener, if any
  blockDashCleanup();
  window.addEventListener('keydown', keyboardHandler);
  blockDashCleanup = () => window.removeEventListener('keydown', keyboardHandler);

  reset();
  frameId = requestAnimationFrame(loop);
}

// ===== SNAKE GAME =====
let snakeRunning = false;
function startSnake() {
  if (snakeRunning) return;
  snakeRunning = true;
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const size=20, W=20, H=20;
  let snake, dir, apple, score, gameOver;

  function reset() {
    snake = [{x:10,y:10}], dir="RIGHT", score=0, gameOver=false;
    apple = {x:Math.floor(Math.random()*W), y:Math.floor(Math.random()*H)};
  }
  function update() {
    if (gameOver) return;
    let head = {...snake[0]};
    if (dir==="LEFT") head.x--;
    if (dir==="RIGHT") head.x++;
    if (dir==="UP") head.y--;
    if (dir==="DOWN") head.y++;
    if (head.x<0||head.x>=W||head.y<0||head.y>=H||snake.some(s=>s.x===head.x&&s.y===head.y)) gameOver=true;
    else {
      snake.unshift(head);
      if (head.x===apple.x&&head.y===apple.y) {
        score++;
        apple = {x:Math.floor(Math.random()*W), y:Math.floor(Math.random()*H)};
      } else snake.pop();
    }
  }
  function draw() {
    ctx.clearRect(0,0,size*W,size*H);
    // Background
    ctx.fillStyle="#e6f1fa"; ctx.fillRect(0,0,size*W,size*H);
    // Apple
    drawCircle(ctx,apple.x*size+size/2,apple.y*size+size/2,size/2-2,"#f44336","#b71c1c");
    // Snake
    function drawSnakeBody(ctx, x, y, size, color1, color2) {
        // Body with gradient
        let grad = ctx.createRadialGradient(x + size/2, y + size/2, size/4, x + size/2, y + size/2, size/1.5);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.beginPath();
        ctx.ellipse(x + size/2, y + size/2, size/2.1, size/2.6, 0, 0, 2*Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "#0e2b1b";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      function drawSnakeHead(ctx, x, y, size, direction) {
        // Head
        drawSnakeBody(ctx, x, y, size, "#76c043", "#277d22");
        // Eyes position
        let eyeOffset = direction === "LEFT" || direction === "RIGHT" ? [ [0.65,0.35], [0.65,0.65] ] : [ [0.35,0.3], [0.65,0.3] ];
        if(direction==="LEFT") eyeOffset = [ [0.25,0.35],[0.25,0.65] ];
        if(direction==="UP")   eyeOffset = [ [0.35,0.25],[0.65,0.25] ];
        if(direction==="DOWN") eyeOffset = [ [0.35,0.75],[0.65,0.75] ];
        // Eyes
        eyeOffset.forEach(offset=>{
          ctx.beginPath();
          ctx.arc(x + size*offset[0], y + size*offset[1], size*0.10, 0, 2*Math.PI);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + size*offset[0], y + size*offset[1], size*0.045, 0, 2*Math.PI);
          ctx.fillStyle = "#191";
          ctx.fill();
        });
        // Tongue
        ctx.save();
        ctx.strokeStyle="#e74c3c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let tx = x+size/2, ty = y+size/2;
        if(direction==="LEFT")  { ctx.moveTo(tx-8,ty); ctx.lineTo(tx-16,ty); ctx.moveTo(tx-16,ty); ctx.lineTo(tx-14,ty-4); ctx.moveTo(tx-16,ty); ctx.lineTo(tx-14,ty+4);}
        if(direction==="RIGHT") { ctx.moveTo(tx+8,ty); ctx.lineTo(tx+16,ty); ctx.moveTo(tx+16,ty); ctx.lineTo(tx+14,ty-4); ctx.moveTo(tx+16,ty); ctx.lineTo(tx+14,ty+4);}
        if(direction==="UP")    { ctx.moveTo(tx,ty-8); ctx.lineTo(tx,ty-16); ctx.moveTo(tx,ty-16); ctx.lineTo(tx-4,ty-14); ctx.moveTo(tx,ty-16); ctx.lineTo(tx+4,ty-14);}
        if(direction==="DOWN")  { ctx.moveTo(tx,ty+8); ctx.lineTo(tx,ty+16); ctx.moveTo(tx,ty+16); ctx.lineTo(tx-4,ty+14); ctx.moveTo(tx,ty+16); ctx.lineTo(tx+4,ty+14);}
        ctx.stroke();
        ctx.restore();
      }
    for (let i=snake.length-1; i>=0; i--) {
        let seg = snake[i];
        if(i===0) { // Kepala
          drawSnakeHead(ctx, seg.x*size, seg.y*size, size, dir);
        } else {
          // Gradasi warna tubuh
          let t = i/snake.length;
          drawSnakeBody(ctx, seg.x*size, seg.y*size, size, 
            `hsl(${100-t*60},60%,55%)`, `hsl(${100-t*60},80%,30%)`);
        }
      }
    // Score
    ctx.font="bold 1.2em Segoe UI"; ctx.fillStyle="#1f7bc1";
    ctx.fillText("Skor: "+score,10,25);
    if (gameOver) {
      ctx.textAlign="center";
      ctx.fillStyle="#e74c3c";
      ctx.font="bold 2em Segoe UI";
      ctx.fillText("Game Over",size*W/2,size*H/2);
      ctx.font="bold 1.2em Segoe UI";
      ctx.fillStyle="#222";
      ctx.fillText("Tekan Spasi/↑ untuk Main Lagi",size*W/2,size*H/2+40);
      ctx.textAlign="start";
    }
    document.getElementById('snake-score').innerHTML = "Skor: "+score;
  }
  function loop() {
    if (!snakeRunning) return;
    update();
    draw();
    if (!gameOver) setTimeout(loop, 200);
  }
  reset(); draw(); setTimeout(loop, 200);

  // Keyboard
  function onKey(e) {
    if (document.activeElement.tagName==="INPUT") return;
    if (gameOver && (e.code==="Space"||e.code==="ArrowUp")) { reset(); draw(); setTimeout(loop, 200); return;}
    if (gameOver) return;
    if (e.code==="ArrowLeft" && dir!=="RIGHT") dir="LEFT";
    else if (e.code==="ArrowRight" && dir!=="LEFT") dir="RIGHT";
    else if (e.code==="ArrowUp" && dir!=="DOWN") dir="UP";
    else if (e.code==="ArrowDown" && dir!=="UP") dir="DOWN";
  }
  window.onkeydown = onKey;
}