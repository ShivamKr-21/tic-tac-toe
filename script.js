/**
 * Tic-Tac-Toe Game Engine
 * Features:
 *  - Player vs Player & Player vs AI
 *  - Easy, Medium, and Unbeatable (Minimax) AI
 *  - Web Audio API Sound Synthesizer (Zero asset dependencies)
 *  - Pure Canvas Confetti System
 *  - Strike-through SVG win animation
 *  - Scoreboard tracking with local storage
 */

(() => {
  // --- Game State ---
  let board = ['', '', '', '', '', '', '', '', ''];
  let currentPlayer = 'X';
  let isGameActive = true;
  let gameMode = 'ai'; // 'ai' or 'pvp'
  let aiDifficulty = 'hard'; // 'easy', 'medium', 'hard'
  let playerSymbol = 'X';
  let aiSymbol = 'O';
  let isAiThinking = false;
  let soundEnabled = true;

  const scores = {
    x: 0,
    o: 0,
    ties: 0
  };

  // Winning Combinations & SVG Line Coordinates for 300x300 viewBox
  const WIN_COMBOS = [
    { combo: [0, 1, 2], line: { x1: 20, y1: 50, x2: 280, y2: 50 } },     // Row 1
    { combo: [3, 4, 5], line: { x1: 20, y1: 150, x2: 280, y2: 150 } },   // Row 2
    { combo: [6, 7, 8], line: { x1: 20, y1: 250, x2: 280, y2: 250 } },   // Row 3
    { combo: [0, 3, 6], line: { x1: 50, y1: 20, x2: 50, y2: 280 } },     // Col 1
    { combo: [1, 4, 7], line: { x1: 150, y1: 20, x2: 150, y2: 280 } },   // Col 2
    { combo: [2, 5, 8], line: { x1: 250, y1: 20, x2: 250, y2: 280 } },   // Col 3
    { combo: [0, 4, 8], line: { x1: 25, y1: 25, x2: 275, y2: 275 } },     // Diag \
    { combo: [2, 4, 6], line: { x1: 275, y1: 25, x2: 25, y2: 275 } }      // Diag /
  ];

  // --- DOM Elements ---
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('board');
  const statusBanner = document.getElementById('status-banner');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTiesEl = document.getElementById('score-ties');
  const labelXEl = document.getElementById('label-x');
  const labelOEl = document.getElementById('label-o');
  const cardX = document.getElementById('card-x');
  const cardO = document.getElementById('card-o');
  const restartBtn = document.getElementById('restart-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');
  const soundBtn = document.getElementById('sound-btn');
  const soundOnIcon = document.querySelector('.sound-on');
  const soundOffIcon = document.querySelector('.sound-off');
  const winLineSvg = document.getElementById('win-line-svg');
  const winLine = document.getElementById('win-line');
  const difficultyGroup = document.getElementById('difficulty-group');
  const symbolGroup = document.getElementById('symbol-group');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // Load sound preference
  try {
    const savedSound = localStorage.getItem('ttt_sound');
    if (savedSound !== null) {
      soundEnabled = savedSound === 'true';
    }
  } catch (e) {
    // Local storage not accessible
  }

  // --- Web Audio Synthesizer ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  }

  function playMoveSound(symbol) {
    if (symbol === 'X') {
      playTone(520, 0.08, 'triangle', 0.2);
    } else {
      playTone(420, 0.08, 'sine', 0.22);
    }
  }

  function playWinSound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 0.2, 'sine', 0.25);
        }, idx * 110);
      });
    } catch (e) {}
  }

  function playTieSound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      playTone(330, 0.16, 'sawtooth', 0.1);
      setTimeout(() => {
        playTone(280, 0.25, 'sawtooth', 0.08);
      }, 150);
    } catch (e) {}
  }

  function playResetSound() {
    playTone(300, 0.07, 'triangle', 0.12);
  }

  // --- Confetti Particle System ---
  let confettiCtx = null;
  let particles = [];
  let confettiAnimationId = null;

  function initConfetti() {
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
  }

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function fireConfetti() {
    if (!confettiCtx) initConfetti();
    if (!confettiCanvas) return;

    particles = [];
    const colors = ['#38bdf8', '#f43f5e', '#a855f7', '#fbbf24', '#34d399', '#ec4899'];
    const count = 90;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 100,
        y: confettiCanvas.height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1,
        decay: Math.random() * 0.012 + 0.008
      });
    }

    if (!confettiAnimationId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.globalAlpha = Math.max(0, p.life);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      confettiCtx.restore();
    }

    if (particles.length > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  // --- Game Core Logic ---

  function init() {
    initConfetti();
    updateSoundUI();
    updatePlayerLabels();
    setupEventListeners();
    resetBoard();
  }

  function setupEventListeners() {
    // Board cells
    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCellClick(e);
        }
      });
    });

    // Action buttons
    restartBtn.addEventListener('click', () => {
      playResetSound();
      resetBoard();
    });

    resetScoresBtn.addEventListener('click', () => {
      playResetSound();
      resetScores();
    });

    // Sound toggle
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      try {
        localStorage.setItem('ttt_sound', soundEnabled);
      } catch (e) {}
      updateSoundUI();
      if (soundEnabled) {
        initAudio();
        playTone(600, 0.08, 'sine', 0.15);
      }
    });

    // Mode Selector
    const modeBtns = document.querySelectorAll('#mode-control .segment-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;
        
        // Show/hide AI specific options
        if (gameMode === 'ai') {
          difficultyGroup.style.display = 'flex';
          symbolGroup.style.display = 'flex';
        } else {
          difficultyGroup.style.display = 'none';
          symbolGroup.style.display = 'none';
        }

        updatePlayerLabels();
        resetBoard();
      });
    });

    // Difficulty Selector
    const diffBtns = document.querySelectorAll('#difficulty-control .segment-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aiDifficulty = btn.dataset.difficulty;
        resetBoard();
      });
    });

    // Symbol Selector
    const symBtns = document.querySelectorAll('#symbol-control .segment-btn');
    symBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        symBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playerSymbol = btn.dataset.symbol;
        aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
        updatePlayerLabels();
        resetBoard();
      });
    });
  }

  function updateSoundUI() {
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      soundBtn.setAttribute('title', 'Sound is ON (Click to mute)');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      soundBtn.setAttribute('title', 'Sound is MUTED (Click to enable)');
    }
  }

  function updatePlayerLabels() {
    if (gameMode === 'ai') {
      if (playerSymbol === 'X') {
        labelXEl.textContent = 'You (X)';
        labelOEl.textContent = 'Computer (AI)';
      } else {
        labelXEl.textContent = 'Computer (AI)';
        labelOEl.textContent = 'You (O)';
      }
    } else {
      labelXEl.textContent = 'Player X';
      labelOEl.textContent = 'Player O';
    }
  }

  function resetBoard() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    isAiThinking = false;

    // Reset visual board
    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
      cell.removeAttribute('aria-disabled');
    });

    // Hide win line
    winLineSvg.classList.remove('visible');
    winLine.setAttribute('x1', '0');
    winLine.setAttribute('y1', '0');
    winLine.setAttribute('x2', '0');
    winLine.setAttribute('y2', '0');

    updateUI();

    // If AI is 'X', it goes first
    if (gameMode === 'ai' && playerSymbol === 'O') {
      triggerAiMove();
    }
  }

  function resetScores() {
    scores.x = 0;
    scores.o = 0;
    scores.ties = 0;
    scoreXEl.textContent = '0';
    scoreOEl.textContent = '0';
    scoreTiesEl.textContent = '0';
    resetBoard();
  }

  function handleCellClick(e) {
    const cell = e.currentTarget;
    const index = parseInt(cell.dataset.index, 10);

    if (board[index] !== '' || !isGameActive || isAiThinking) {
      return;
    }

    // In AI mode, verify it is player's turn
    if (gameMode === 'ai' && currentPlayer !== playerSymbol) {
      return;
    }

    makeMove(index, currentPlayer);

    if (isGameActive && gameMode === 'ai' && currentPlayer === aiSymbol) {
      triggerAiMove();
    }
  }

  function makeMove(index, symbol) {
    board[index] = symbol;
    const cell = cells[index];
    cell.textContent = symbol;
    cell.classList.add(symbol.toLowerCase(), 'taken');
    playMoveSound(symbol);

    const winData = checkWin(board);

    if (winData) {
      handleGameOver('win', winData);
    } else if (isBoardFull(board)) {
      handleGameOver('tie');
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateUI();
    }
  }

  function triggerAiMove() {
    isAiThinking = true;
    updateUI();

    // Natural simulated thinking delay (350ms - 550ms)
    const delay = Math.random() * 200 + 350;

    setTimeout(() => {
      if (!isGameActive) {
        isAiThinking = false;
        return;
      }

      const move = getAiMove();
      if (move !== -1 && board[move] === '') {
        makeMove(move, aiSymbol);
      }
      isAiThinking = false;
      updateUI();
    }, delay);
  }

  function getAiMove() {
    const availableMoves = getAvailableIndices(board);
    if (availableMoves.length === 0) return -1;

    if (aiDifficulty === 'easy') {
      // Pick random
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (aiDifficulty === 'medium') {
      // 1. Can AI win immediately?
      for (const idx of availableMoves) {
        board[idx] = aiSymbol;
        if (checkWin(board)) {
          board[idx] = '';
          return idx;
        }
        board[idx] = '';
      }

      // 2. Can opponent win immediately? Block it!
      for (const idx of availableMoves) {
        board[idx] = playerSymbol;
        if (checkWin(board)) {
          board[idx] = '';
          return idx;
        }
        board[idx] = '';
      }

      // 3. Take center if open (70% chance)
      if (board[4] === '' && Math.random() < 0.7) {
        return 4;
      }

      // 4. Otherwise random move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Hard (Unbeatable Minimax)
    return getBestMoveMinimax();
  }

  function getBestMoveMinimax() {
    let bestScore = -Infinity;
    let bestMove = -1;
    const available = getAvailableIndices(board);

    // If whole board is empty, take corner or center randomly for variety
    if (available.length === 9) {
      const openings = [0, 2, 4, 6, 8];
      return openings[Math.floor(Math.random() * openings.length)];
    }

    for (const idx of available) {
      board[idx] = aiSymbol;
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[idx] = '';

      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove !== -1 ? bestMove : available[0];
  }

  function minimax(currentBoard, depth, isMaximizing, alpha, beta) {
    const winResult = checkWin(currentBoard);

    if (winResult) {
      return winResult.winner === aiSymbol ? (10 - depth) : (depth - 10);
    }

    if (isBoardFull(currentBoard)) {
      return 0;
    }

    const available = getAvailableIndices(currentBoard);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of available) {
        currentBoard[idx] = aiSymbol;
        const evaluation = minimax(currentBoard, depth + 1, false, alpha, beta);
        currentBoard[idx] = '';
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of available) {
        currentBoard[idx] = playerSymbol;
        const evaluation = minimax(currentBoard, depth + 1, true, alpha, beta);
        currentBoard[idx] = '';
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Pruning
      }
      return minEval;
    }
  }

  function getAvailableIndices(b) {
    const list = [];
    for (let i = 0; i < 9; i++) {
      if (b[i] === '') list.push(i);
    }
    return list;
  }

  function checkWin(b) {
    for (const item of WIN_COMBOS) {
      const [a, c, d] = item.combo;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return {
          winner: b[a],
          combo: item.combo,
          line: item.line
        };
      }
    }
    return null;
  }

  function isBoardFull(b) {
    return b.every(cell => cell !== '');
  }

  function handleGameOver(type, winData = null) {
    isGameActive = false;

    if (type === 'win') {
      const winner = winData.winner;
      if (winner === 'X') {
        scores.x++;
        scoreXEl.textContent = scores.x;
      } else {
        scores.o++;
        scoreOEl.textContent = scores.o;
      }

      // Highlight winning cells
      winData.combo.forEach(idx => {
        cells[idx].classList.add('winner');
      });

      // Draw SVG strike line
      const { x1, y1, x2, y2 } = winData.line;
      winLine.setAttribute('x1', x1);
      winLine.setAttribute('y1', y1);
      winLine.setAttribute('x2', x2);
      winLine.setAttribute('y2', y2);
      winLineSvg.classList.add('visible');

      // Banner text
      if (gameMode === 'ai') {
        if (winner === playerSymbol) {
          statusText.textContent = '🎉 Congratulations, You Won!';
          fireConfetti();
        } else {
          statusText.textContent = '🤖 Computer Won! Better luck next time.';
        }
      } else {
        statusText.textContent = `🎉 Player ${winner} Wins!`;
        fireConfetti();
      }

      statusIndicator.className = 'status-indicator ' + (winner === 'X' ? '' : 'o-turn');
      playWinSound();
    } else {
      // Tie
      scores.ties++;
      scoreTiesEl.textContent = scores.ties;
      statusText.textContent = "🤝 It's a Tie Game!";
      statusIndicator.className = 'status-indicator tie-turn';
      playTieSound();
    }

    // Disable remaining empty cells
    cells.forEach(cell => {
      if (!cell.classList.contains('taken')) {
        cell.disabled = true;
      }
    });

    // Remove active turn indicators on scoreboard
    cardX.classList.remove('active-turn');
    cardO.classList.remove('active-turn');
  }

  function updateUI() {
    // Cell hover ghost preview
    const previewSymbol = isAiThinking ? '' : currentPlayer;
    const previewClass = currentPlayer === 'X' ? 'x-preview' : 'o-preview';

    cells.forEach(cell => {
      cell.setAttribute('data-preview', previewSymbol);
      cell.classList.remove('x-preview', 'o-preview');
      if (!cell.classList.contains('taken')) {
        cell.classList.add(previewClass);
      }
    });

    // Scorecard active turn highlight
    if (isGameActive) {
      if (currentPlayer === 'X') {
        cardX.classList.add('active-turn');
        cardO.classList.remove('active-turn');
        statusIndicator.className = 'status-indicator';
      } else {
        cardX.classList.remove('active-turn');
        cardO.classList.add('active-turn');
        statusIndicator.className = 'status-indicator o-turn';
      }

      // Status text
      if (isAiThinking) {
        statusText.textContent = '🤖 Computer is thinking...';
      } else if (gameMode === 'ai') {
        statusText.textContent = currentPlayer === playerSymbol ? `Your turn (${playerSymbol})` : `Computer's turn (${aiSymbol})`;
      } else {
        statusText.textContent = `Player ${currentPlayer}'s turn`;
      }
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
