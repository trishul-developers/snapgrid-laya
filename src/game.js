import { SCORING_CONFIG, TRANSLATIONS, PIECE_DEFINITIONS, PIECE_SPAWN_WEIGHTS, PALETTES, PALETTE_COLOR_KEYS } from './game-data.js';

(function() {
      'use strict';


      /* ==========================================================================
         1. OFFLINE INDIAN LOCALIZATION DICTIONARY (11 LANGUAGES)
         ========================================================================== */


      /* ==========================================================================
         3. SOUND SYNTHESIS & HAPTICS ENGINE (100% OFFLINE)
         ========================================================================== */
      class SoundEngine {
        constructor() {
          this.ctx = null;
          this.enabled = true;
        }

        init() {
          if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
          }
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
        }

        playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
          if (!this.enabled) return;
          this.init();
          if (!this.ctx) return;
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
          } catch(e) {}
        }

        pickup() {
          this.playTone(520, 'sine', 0.06, 0.12);
        }

        snapDrop() {
          if (!this.enabled) return;
          this.init();
          if (!this.ctx) return;
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
          } catch(e) {}
        }

        snapInvalid() {
          this.playTone(130, 'sawtooth', 0.12, 0.1);
        }

        lineClear(lines, combo) {
          if (!this.enabled) return;
          this.init();
          if (!this.ctx) return;
          const baseFreq = 330 * Math.pow(1.08, Math.min(combo, 12));
          const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
          notes.slice(0, Math.min(4, lines + 1)).forEach((freq, idx) => {
            setTimeout(() => {
              this.playTone(freq, 'sine', 0.22, 0.2);
            }, idx * 60);
          });
        }

        layaFlowChirp() {
          this.playTone(880, 'sine', 0.05, 0.08);
          setTimeout(() => this.playTone(1174, 'sine', 0.05, 0.06), 40);
        }

        gameOver() {
          if (!this.enabled) return;
          const notes = [392, 311, 261];
          notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.28, 0.25), i * 160);
          });
        }
      }

      const sound = new SoundEngine();

      const haptics = {
        enabled: true,
        vibrate(pattern) {
          if (!this.enabled || !('vibrate' in navigator)) return;
          try {
            navigator.vibrate(pattern);
          } catch(e) {}
        },
        pickup() { this.vibrate(12); },
        drop() { this.vibrate(25); },
        singleClear() { this.vibrate([30, 40, 50]); },
        multiClear() { this.vibrate([40, 30, 60, 30, 90]); },
        invalid() { this.vibrate([80, 50, 120]); }
      };

      /* ==========================================================================
         4. PARTICLE BURST CANVAS SYSTEM
         ========================================================================== */
      class ParticleSystem {
        constructor(canvas) {
          this.canvas = canvas;
          this.ctx = canvas.getContext('2d');
          this.particles = [];
          this.animId = null;
          this.resize();
          window.addEventListener('resize', () => this.resize());
        }

        resize() {
          const rect = this.canvas.parentElement.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          this.dpr = dpr;
          this.canvas.width = Math.round(rect.width * dpr);
          this.canvas.height = Math.round(rect.height * dpr);
          this.canvas.style.width = `${rect.width}px`;
          this.canvas.style.height = `${rect.height}px`;
        }

        burst(x, y, color) {
          const count = 10;
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4.5;
            this.particles.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1.2,
              size: 4 + Math.random() * 4,
              color,
              alpha: 1,
              life: 1,
              decay: 0.025 + Math.random() * 0.035
            });
          }
          if (!this.animId) {
            this.update();
          }
        }

        update() {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          const dpr = this.dpr || 1;
          for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // gravity
            p.life -= p.decay;
            p.alpha = Math.max(0, p.life);

            if (p.life <= 0) {
              this.particles.splice(i, 1);
              continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            const px = p.x * dpr;
            const py = p.y * dpr;
            const pSize = p.size * dpr;
            this.ctx.roundRect ? this.ctx.roundRect(px, py, pSize, pSize, 2 * dpr) : this.ctx.rect(px, py, pSize, pSize);
            this.ctx.fill();
            this.ctx.restore();
          }

          if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.update());
          } else {
            this.animId = null;
          }
        }
      }

      /* ==========================================================================
         5. CORE GAME ENGINE
         ========================================================================== */
      class BlockGame {
        constructor() {
          // Default Settings
          this.gridSize = 10; // 8, 10, or 12
          this.mode = 'easy'; // 'easy' (instant refill) or 'hard' (batch refill)
          this.slotCount = 4; // 3 or 4
          this.theme = 'dark'; // 'light' or 'dark'
          this.currentLang = 'en'; // Active language code
          this.activePalette = 'pastel';
          this.customColors = { ...PALETTES.pastel.colors };
          this.isGameOver = false;
          this.undoState = null;
          this.lineClearTimeout = null;
          this.pendingGameOverTimeout = null;

          // Gameplay Runtime State
          this.board = [];
          this.boardColors = [];
          this.tray = []; // Array of piece objects or null
          this.colorBag = []; // Dynamic balanced palette rotation bag
          this.score = 0;
          this.bestScore = 0;
          this.comboStreak = 0;
          this.graceDrops = 0; // Combo grace drop counter (resets after 2 non-clears)
          this.maxCombo = 0;
          this.totalLines = 0;
          this.speedMultiplier = 1;
          this.speedPeak = 1;

          // Laya Rhythm Cadence Timer (4.0 seconds)
          this.cadenceDuration = 4000;
          this.cadenceRemaining = 0;
          this.lastFrameTime = performance.now();
          this.cadenceActive = false;
          this.cadenceRafId = null;

          // Dragging State
          this.draggedSlotIndex = null;
          this.draggedPiece = null;
          this.dragStartX = 0;
          this.dragStartY = 0;
          this.avatarX = 0;
          this.avatarY = 0;
          this.isDragging = false;

          // DOM Elements
          this.boardEl = document.getElementById('game-board');
          this.trayEl = document.getElementById('tray-container');
          this.avatarEl = document.getElementById('drag-avatar');
          this.avatarGridEl = document.getElementById('drag-avatar-grid');
          this.currentScoreEl = document.getElementById('current-score');
          this.bestScoreEl = document.getElementById('best-score');
          this.comboBadgeEl = document.getElementById('combo-badge');
          this.speedBadgeEl = document.getElementById('speed-badge');
          this.cadenceBarEl = document.getElementById('cadence-bar');
          this.floatingLayerEl = document.getElementById('floating-layer');
          this.headerGridTagEl = document.getElementById('header-grid-tag');
          this.headerModeTextEl = document.getElementById('header-mode-text');
          this.gameOverRestartEl = document.getElementById('btn-gameover-restart');
          this.gameoverBannerEl = document.getElementById('gameover-banner');
          this.undoButtonEl = document.getElementById('btn-undo');
          this.undoContainerEl = document.getElementById('undo-bar-container');
          this.settingsTopActionsEl = document.getElementById('settings-top-actions');
          this.tutorialHintEl = document.getElementById('tutorial-hint-overlay');
          this.tutorialDismissed = false;
          this.stagedSettings = null;
          this.initialSettingsSnapshot = null;
          this.pendingConfirmCancel = null;

          // Initialize Particle System
          this.particles = new ParticleSystem(document.getElementById('particle-canvas'));

          // Load Saved Configurations
          this.loadStorage();

          // Build Board & Setup Listeners first
          this.resetGame();
          this.setupEvents();

          // Apply Theme, Palette & Translations after state is ready
          this.applyTheme(this.theme);
          this.applyPalette(this.activePalette);
          this.setLanguage(this.currentLang);
        }

        /* ----------------------------------------------------------------------
           i18n Localization Helpers
           ---------------------------------------------------------------------- */
        t(key) {
          const lang = this.currentLang || 'en';
          if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined) {
            return TRANSLATIONS[lang][key];
          }
          if (TRANSLATIONS['en'] && TRANSLATIONS['en'][key] !== undefined) {
            return TRANSLATIONS['en'][key];
          }
          return key;
        }

        setLanguage(langCode) {
          if (!TRANSLATIONS[langCode]) {
            langCode = 'en';
          }
          this.currentLang = langCode;
          try {
            localStorage.setItem('laya_lang', langCode);
            localStorage.setItem('laya_soul_lang', langCode);
          } catch(e) {}

          const select = document.getElementById('setting-lang-select');
          if (select) {
            select.value = langCode;
          }

          this.applyTranslations();
        }

        applyTranslations() {
          // Translate all data-i18n static elements
          document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
          });

          // Translate all data-i18n-title elements
          document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.setAttribute('title', this.t(key));
          });

          document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            el.setAttribute('aria-label', this.t(key));
          });

          // Header mode text update
          if (this.headerModeTextEl) {
            this.headerModeTextEl.textContent = this.mode === 'easy' ? this.t('easy_mode') : this.t('hard_mode');
          }

          // Status Badges update
          this.updateBadges();
        }

        /* ----------------------------------------------------------------------
           Storage & Leaderboards
           ---------------------------------------------------------------------- */
        loadStorage() {
          try {
            const savedSettings = localStorage.getItem('blockdrop_settings');
            if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              if ([8, 10, 12].includes(parsed.gridSize)) this.gridSize = parsed.gridSize;
              if (parsed.mode) this.mode = parsed.mode;
              if (parsed.slotCount) this.slotCount = parsed.slotCount;
              if (parsed.theme) this.theme = parsed.theme;
              if (parsed.sound !== undefined) sound.enabled = parsed.sound;
              if (parsed.vibrate !== undefined) haptics.enabled = parsed.vibrate;
              if (parsed.activePalette) this.activePalette = parsed.activePalette;
              if (parsed.customColors) this.customColors = parsed.customColors;
            }

            const savedLang = localStorage.getItem('laya_lang') || localStorage.getItem('laya_soul_lang');
            if (savedLang && TRANSLATIONS[savedLang]) {
              this.currentLang = savedLang;
            }
          } catch(e) {}
          this.updateBestScoreDisplay();
        }

        saveGameState() {
          if (this.isGameOver) {
            this.clearSavedGameState();
            return;
          }
          if (!this.board || !this.board.length || !this.tray) return;

          try {
            const state = {
              gridSize: this.gridSize,
              mode: this.mode,
              slotCount: this.slotCount,
              board: this.board,
              boardColors: this.boardColors,
              tray: this.tray,
              colorBag: this.colorBag,
              score: this.score,
              comboStreak: this.comboStreak,
              graceDrops: this.graceDrops,
              maxCombo: this.maxCombo,
              totalLines: this.totalLines,
              speedMultiplier: this.speedMultiplier,
              speedPeak: this.speedPeak,
              undoState: this.mode === 'easy' ? this.undoState : null,
              savedAt: Date.now()
            };
            localStorage.setItem('blockdrop_saved_game', JSON.stringify(state));
          } catch(e) {}
        }

        clearSavedGameState() {
          this.stopCadenceTimer();
          try {
            localStorage.removeItem('blockdrop_saved_game');
          } catch(e) {}
        }

        loadSavedGameState() {
          try {
            const raw = localStorage.getItem('blockdrop_saved_game');
            if (!raw) return false;
            const state = JSON.parse(raw);
            if (!state || !Array.isArray(state.board) || !Array.isArray(state.boardColors) || !Array.isArray(state.tray)) {
              return false;
            }
            if (![8, 10, 12].includes(state.gridSize) || state.board.length !== state.gridSize || !state.board[0] || state.board[0].length !== state.gridSize) {
              return false;
            }

            this.gridSize = state.gridSize || this.gridSize;
            this.mode = state.mode || this.mode;
            this.slotCount = state.slotCount || this.slotCount;
            this.board = state.board;
            this.boardColors = state.boardColors;
            this.tray = state.tray;
            if (Array.isArray(state.colorBag)) {
              this.colorBag = state.colorBag;
            }
            this.score = Number(state.score) || 0;
            this.comboStreak = Number(state.comboStreak) || 0;
            this.graceDrops = Number(state.graceDrops) || 0;
            this.maxCombo = Number(state.maxCombo) || 0;
            this.totalLines = Number(state.totalLines) || 0;
            this.speedMultiplier = Number(state.speedMultiplier) || 1;
            this.speedPeak = Number(state.speedPeak) || 1;
            const undoState = state.undoState;
            this.undoState = this.mode === 'easy' &&
              undoState &&
              Array.isArray(undoState.board) &&
              undoState.board.length === this.gridSize &&
              Array.isArray(undoState.boardColors) &&
              undoState.boardColors.length === this.gridSize &&
              Array.isArray(undoState.tray)
              ? undoState
              : null;

            return true;
          } catch(e) {
            return false;
          }
        }

        saveStorage() {
          try {
            const settings = {
              gridSize: this.gridSize,
              mode: this.mode,
              slotCount: this.slotCount,
              theme: this.theme,
              sound: sound.enabled,
              vibrate: haptics.enabled,
              activePalette: this.activePalette,
              customColors: this.customColors
            };
            localStorage.setItem('blockdrop_settings', JSON.stringify(settings));
          } catch(e) {}
          this.saveGameState();
        }

        getLeaderboardKey() {
          return `${this.mode}_${this.gridSize}`;
        }

        getLeaderboard(key = this.getLeaderboardKey()) {
          try {
            const data = localStorage.getItem('blockdrop_leaderboards');
            const allLb = data ? JSON.parse(data) : {};
            return allLb[key] || [];
          } catch(e) {
            return [];
          }
        }

        recordScore(score, maxCombo, lines) {
          if (score <= 0) return false;
          try {
            const key = this.getLeaderboardKey();
            const data = localStorage.getItem('blockdrop_leaderboards');
            const allLb = data ? JSON.parse(data) : {};
            const list = allLb[key] || [];

            const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            list.push({ score, maxCombo, lines, date: dateStr });
            list.sort((a, b) => b.score - a.score);
            allLb[key] = list.slice(0, 5); // Keep top 5
            localStorage.setItem('blockdrop_leaderboards', JSON.stringify(allLb));

            // Check if this was rank 1
            return list[0].score === score;
          } catch(e) {
            return false;
          }
        }

        updateBestScoreDisplay() {
          const list = this.getLeaderboard();
          this.bestScore = list.length > 0 ? list[0].score : 0;
          this.bestScoreEl.textContent = this.bestScore.toLocaleString();
        }

        /* ----------------------------------------------------------------------
           Theme & Palette Management
           ---------------------------------------------------------------------- */
        applyTheme(theme) {
          this.theme = theme;
          document.body.setAttribute('data-theme', theme);
          const metaColor = document.getElementById('meta-theme-color');
          if (metaColor) {
            metaColor.content = theme === 'dark' ? '#090D16' : '#F8F9FB';
          }
          // Sync settings UI switch
          document.getElementById('seg-theme-light').classList.toggle('active', theme === 'light');
          document.getElementById('seg-theme-dark').classList.toggle('active', theme === 'dark');
        }

        applyPalette(palKey) {
          this.activePalette = palKey;
          let colors = {};
          if (palKey === 'custom') {
            colors = this.customColors;
          } else if (PALETTES[palKey]) {
            colors = PALETTES[palKey].colors;
          }

          // Update CSS variables
          const root = document.documentElement;
          root.style.setProperty('--color-dot', colors.dot);
          root.style.setProperty('--color-bar', colors.bar);
          root.style.setProperty('--color-square', colors.square);
          root.style.setProperty('--color-corner', colors.corner);
          root.style.setProperty('--color-tshape', colors.tshape);
          root.style.setProperty('--color-zshape', colors.zshape);

          // Sync custom color pickers in UI
          document.getElementById('picker-dot').value = colors.dot;
          document.getElementById('picker-bar').value = colors.bar;
          document.getElementById('picker-square').value = colors.square;
          document.getElementById('picker-corner').value = colors.corner;
          document.getElementById('picker-tshape').value = colors.tshape;
          document.getElementById('picker-zshape').value = colors.zshape;

          // Sync palette cards
          document.querySelectorAll('.palette-card').forEach(card => {
            card.classList.toggle('active', card.dataset.palette === palKey);
          });

          // Re-render board colors & tray
          this.renderBoard();
          this.renderTray();
        }

        getColorForCategory(category) {
          if (this.activePalette === 'custom') {
            return this.customColors[category] || '#0EA5E9';
          }
          const pal = PALETTES[this.activePalette] || PALETTES.pastel;
          return pal.colors[category] || '#0EA5E9';
        }

        getPieceColor(piece) {
          if (!piece) return '#0EA5E9';
          const key = piece.colorKey || piece.category;
          return this.getColorForCategory(key);
        }

        resolveColor(val) {
          if (!val) return '';
          if (typeof val === 'string' && (val.startsWith('#') || val.startsWith('rgb'))) {
            return val;
          }
          return this.getColorForCategory(val);
        }

        getNextColorKey(excludeKeys = []) {
          const keys = PALETTE_COLOR_KEYS;
          if (!this.colorBag || this.colorBag.length === 0) {
            const shuffled = [...keys];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            this.colorBag = shuffled;
          }

          const candidateIdx = this.colorBag.findIndex(k => !excludeKeys.includes(k));
          if (candidateIdx !== -1) {
            const [chosen] = this.colorBag.splice(candidateIdx, 1);
            return chosen;
          }

          const available = keys.filter(k => !excludeKeys.includes(k));
          if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
          }

          return this.colorBag.pop() || keys[Math.floor(Math.random() * keys.length)];
        }

        /* ----------------------------------------------------------------------
           Board Initialization & Rendering
           ---------------------------------------------------------------------- */
        resetGame(forceFresh = false) {
          this.isGameOver = false;
          this.stopCadenceTimer();
          if (this.gameOverRestartEl) this.gameOverRestartEl.hidden = true;
          if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
          if (forceFresh) {
            this.undoState = null;
            if (this.lineClearTimeout !== null) clearTimeout(this.lineClearTimeout);
            if (this.pendingGameOverTimeout !== null) clearTimeout(this.pendingGameOverTimeout);
            this.lineClearTimeout = null;
            this.pendingGameOverTimeout = null;
            this.tutorialDismissed = false;
          }

          let resumed = false;
          if (!forceFresh) {
            resumed = this.loadSavedGameState();
          }

          this.cadenceRemaining = 0;
          this.cadenceActive = false;
          if (this.cadenceBarEl) {
            this.cadenceBarEl.style.width = '0%';
          }

          if (!resumed) {
            // Initialize fresh empty board
            this.board = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0));
            this.boardColors = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(''));

            this.score = 0;
            this.comboStreak = 0;
            this.graceDrops = 0;
            this.maxCombo = 0;
            this.totalLines = 0;
            this.speedMultiplier = 1;
            this.speedPeak = 1;
            this.colorBag = [];

            this.tray = Array(this.slotCount).fill(null);
            this.refillFullTray();
          }

          this.currentScoreEl.textContent = this.score.toLocaleString();
          this.updateBestScoreDisplay();
          this.updateBadges();

          // Header tags
          this.headerGridTagEl.textContent = `${this.gridSize}x${this.gridSize}`;
          this.headerModeTextEl.textContent = this.mode === 'easy' ? this.t('easy_mode') : this.t('hard_mode');
          this.updateUndoButton();

          // Build Board Grid DOM
          this.boardEl.className = `grid-container grid-${this.gridSize}`;
          this.boardEl.innerHTML = '';
          for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
              const cell = document.createElement('div');
              cell.className = 'board-cell';
              cell.dataset.row = r;
              cell.dataset.col = c;
              this.boardEl.appendChild(cell);
            }
          }

          // Build Tray Container DOM
          this.trayEl.className = `tray-container tray-${this.slotCount}`;
          this.renderBoard();
          this.renderTray();
          this.saveStorage();

          if (resumed) {
            this.dismissTutorialHint(true);
            if (this.score > 0) {
              setTimeout(() => {
                this.showFloatingText(120, 60, `⚡ ${this.t('resumed_session')}`);
              }, 300);
            }
          } else {
            this.showTutorialHint();
          }
        }

        showTutorialHint() {
          if (this.tutorialDismissed) return;
          if (this.score > 0) return;
          const hasPiecesOnBoard = this.board && this.board.some(row => row.some(cell => cell === 1));
          if (hasPiecesOnBoard) return;
          if (!this.tutorialHintEl) {
            this.tutorialHintEl = document.getElementById('tutorial-hint-overlay');
          }
          if (this.tutorialHintEl) {
            this.tutorialHintEl.classList.add('visible');
            this.tutorialHintEl.classList.remove('fade-out');
          }
        }

        dismissTutorialHint(immediate = false) {
          if (!this.tutorialHintEl) {
            this.tutorialHintEl = document.getElementById('tutorial-hint-overlay');
          }
          if (this.tutorialDismissed && (!this.tutorialHintEl || !this.tutorialHintEl.classList.contains('visible'))) {
            return;
          }
          this.tutorialDismissed = true;
          if (!this.tutorialHintEl) return;
          if (immediate) {
            this.tutorialHintEl.classList.remove('visible', 'fade-out');
          } else {
            if (!this.tutorialHintEl.classList.contains('visible')) return;
            this.tutorialHintEl.classList.add('fade-out');
            setTimeout(() => {
              if (this.tutorialHintEl) {
                this.tutorialHintEl.classList.remove('visible', 'fade-out');
              }
            }, 300);
          }
        }

        renderBoard() {
          if (!this.board || !this.board.length || !this.boardEl) return;
          const cells = this.boardEl.children;
          if (!cells || cells.length === 0) return;
          for (let r = 0; r < this.gridSize; r++) {
            if (!this.board[r]) continue;
            for (let c = 0; c < this.gridSize; c++) {
              const idx = r * this.gridSize + c;
              const cell = cells[idx];
              if (!cell) continue;
              if (this.board[r][c] === 1) {
                cell.className = 'board-cell filled';
                const cellVal = this.boardColors[r] && this.boardColors[r][c];
                cell.style.backgroundColor = this.resolveColor(cellVal) || 'var(--md-sys-color-primary)';
              } else {
                cell.className = 'board-cell';
                cell.style.backgroundColor = '';
              }
            }
          }
        }

        /* ----------------------------------------------------------------------
           Tray & Piece Generation Mechanics
           ---------------------------------------------------------------------- */
        getRandomPiece(excludeColorKeys = []) {
          const weightedPieces = PIECE_DEFINITIONS.map(piece => {
            const weight = PIECE_SPAWN_WEIGHTS[piece.id];
            if (!Number.isFinite(weight) || weight < 0) {
              throw new Error(`Invalid spawn weight for piece "${piece.id}"`);
            }
            return { piece, weight };
          }).filter(entry => entry.weight > 0);
          const weightedPoolSize = weightedPieces.reduce((total, entry) => total + entry.weight, 0);
          if (weightedPoolSize <= 0) {
            throw new Error('At least one piece must have a positive spawn weight');
          }

          let selection = Math.random() * weightedPoolSize;
          let template = null;
          for (const entry of weightedPieces) {
            selection -= entry.weight;
            if (selection < 0) {
              template = entry.piece;
              break;
            }
          }
          if (!template) {
            throw new Error('Unable to select a piece from the weighted pool');
          }
          const colorKey = this.getNextColorKey(excludeColorKeys);
          return {
            id: template.id,
            name: template.name,
            category: template.category,
            matrix: template.matrix.map(row => [...row]),
            colorKey: colorKey,
            color: this.getColorForCategory(colorKey)
          };
        }

        captureUndoState() {
          return {
            board: this.board.map(row => [...row]),
            boardColors: this.boardColors.map(row => [...row]),
            tray: this.tray.map(piece => piece ? {
              ...piece,
              matrix: piece.matrix.map(row => [...row])
            } : null),
            colorBag: this.colorBag ? [...this.colorBag] : [],
            score: this.score,
            comboStreak: this.comboStreak,
            graceDrops: this.graceDrops,
            maxCombo: this.maxCombo,
            totalLines: this.totalLines,
            speedMultiplier: this.speedMultiplier,
            speedPeak: this.speedPeak,
            cadenceRemaining: this.cadenceRemaining,
            cadenceActive: this.cadenceActive
          };
        }

        updateUndoButton() {
          const isEasy = this.mode === 'easy';
          const canUndo = isEasy && !!this.undoState && !this.isGameOver;
          if (this.undoContainerEl) {
            this.undoContainerEl.hidden = !isEasy;
          }
          if (this.undoButtonEl) {
            this.undoButtonEl.hidden = !isEasy;
            this.undoButtonEl.disabled = !canUndo;
            this.undoButtonEl.classList.toggle('can-undo', canUndo);
          }
        }

        undoLastMove() {
          if (this.mode !== 'easy' || !this.undoState || this.isGameOver) return;

          this.stopCadenceTimer();

          if (this.lineClearTimeout !== null) clearTimeout(this.lineClearTimeout);
          if (this.pendingGameOverTimeout !== null) clearTimeout(this.pendingGameOverTimeout);
          this.lineClearTimeout = null;
          this.pendingGameOverTimeout = null;

          const previous = this.undoState;
          this.undoState = null;
          this.board = previous.board.map(row => [...row]);
          this.boardColors = previous.boardColors.map(row => [...row]);
          this.tray = previous.tray.map(piece => piece ? {
            ...piece,
            matrix: piece.matrix.map(row => [...row])
          } : null);
          if (previous.colorBag) {
            this.colorBag = [...previous.colorBag];
          }
          this.score = previous.score;
          this.comboStreak = previous.comboStreak;
          this.graceDrops = previous.graceDrops;
          this.maxCombo = previous.maxCombo;
          this.totalLines = previous.totalLines;
          this.speedMultiplier = previous.speedMultiplier;
          this.speedPeak = previous.speedPeak;
          this.cadenceRemaining = previous.cadenceRemaining;
          this.cadenceActive = previous.cadenceActive;

          this.currentScoreEl.textContent = this.score.toLocaleString();
          const pct = this.cadenceActive && this.cadenceRemaining > 0
            ? Math.max(0, Math.min(100, (this.cadenceRemaining / this.cadenceDuration) * 100))
            : 0;
          this.cadenceBarEl.style.width = `${pct}%`;
          if (this.cadenceActive && this.cadenceRemaining > 0) {
            this.startCadenceTimer();
          }
          this.renderBoard();
          this.renderTray();
          this.updateBadges();
          this.updateUndoButton();
          this.saveGameState();
        }

        refillFullTray() {
          const chosenColors = [];
          for (let i = 0; i < this.slotCount; i++) {
            const piece = this.getRandomPiece(chosenColors);
            this.tray[i] = piece;
            if (piece && piece.colorKey) {
              chosenColors.push(piece.colorKey);
            }
          }

          if (this.mode === 'hard') {
            const anyFits = this.tray.some(p => p && this.canPieceFitAnywhere(p));
            if (!anyFits) {
              const fittingTemplates = PIECE_DEFINITIONS.filter(def => this.canPieceFitAnywhere(def));
              const fallbackTemplate = PIECE_DEFINITIONS.find(def => def.id === 'dot_1') || {
                id: 'dot_1',
                name: '1x1 Dot',
                category: 'dot',
                matrix: [[1]]
              };
              const chosenTemplate = fittingTemplates.length > 0
                ? fittingTemplates[Math.floor(Math.random() * fittingTemplates.length)]
                : fallbackTemplate;

              const targetSlot = Math.floor(Math.random() * this.slotCount);
              const otherColors = this.tray
                .filter((p, idx) => p && idx !== targetSlot && p.colorKey)
                .map(p => p.colorKey);
              const colorKey = this.getNextColorKey(otherColors);
              this.tray[targetSlot] = {
                id: chosenTemplate.id,
                name: chosenTemplate.name,
                category: chosenTemplate.category,
                matrix: chosenTemplate.matrix.map(row => [...row]),
                colorKey: colorKey,
                color: this.getColorForCategory(colorKey)
              };
            }
          }
        }

        renderTray() {
          if (!this.trayEl || !this.tray || !this.board || !this.board.length) return;
          this.trayEl.innerHTML = '';
          for (let i = 0; i < this.slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'tray-slot';
            slot.dataset.slotIndex = i;

            const piece = this.tray[i];
            if (piece) {
              const pieceEl = document.createElement('div');
              pieceEl.className = 'tray-piece';
              pieceEl.dataset.slotIndex = i;

              // Check if piece can fit anywhere on board
              const canFit = this.canPieceFitAnywhere(piece);
              if (!canFit) {
                pieceEl.classList.add('unplaceable');
              }

              const rows = piece.matrix.length;
              const cols = piece.matrix[0].length;
              pieceEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
              pieceEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

              // Mini tile dimensions to fit comfortably inside slot
              const tileSize = Math.min(18, Math.floor(56 / Math.max(rows, cols)));
              pieceEl.style.width = `${cols * tileSize + (cols - 1) * 2}px`;
              pieceEl.style.height = `${rows * tileSize + (rows - 1) * 2}px`;

              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  const tile = document.createElement('div');
                  tile.className = 'tray-piece-tile';
                  tile.style.width = `${tileSize}px`;
                  tile.style.height = `${tileSize}px`;
                  if (piece.matrix[r][c] === 1) {
                    tile.style.backgroundColor = this.getPieceColor(piece);
                  } else {
                    tile.style.visibility = 'hidden';
                  }
                  pieceEl.appendChild(tile);
                }
              }
              slot.appendChild(pieceEl);
            } else {
              slot.classList.add('empty');
            }
            this.trayEl.appendChild(slot);
          }
        }

        /* ----------------------------------------------------------------------
           Collision Math & Placement Rules
           ---------------------------------------------------------------------- */
        canPieceFitAt(piece, r, c) {
          const pRows = piece.matrix.length;
          const pCols = piece.matrix[0].length;
          if (r < 0 || c < 0 || r + pRows > this.gridSize || c + pCols > this.gridSize) {
            return false;
          }
          for (let pr = 0; pr < pRows; pr++) {
            for (let pc = 0; pc < pCols; pc++) {
              if (piece.matrix[pr][pc] === 1) {
                if (this.board[r + pr][c + pc] !== 0) {
                  return false;
                }
              }
            }
          }
          return true;
        }

        canPieceFitAnywhere(piece) {
          const pRows = piece.matrix.length;
          const pCols = piece.matrix[0].length;
          for (let r = 0; r <= this.gridSize - pRows; r++) {
            for (let c = 0; c <= this.gridSize - pCols; c++) {
              if (this.canPieceFitAt(piece, r, c)) {
                return true;
              }
            }
          }
          return false;
        }

        checkGameOver() {
          const activePieces = this.tray.filter(p => p !== null);
          if (activePieces.length === 0) return false;

          for (const piece of activePieces) {
            if (this.canPieceFitAnywhere(piece)) {
              return false; // Found at least one valid move!
            }
          }
          return true; // ZERO valid moves remain!
        }

        findFullLines(targetBoard) {
          const fullRows = [];
          const fullCols = [];

          for (let r = 0; r < this.gridSize; r++) {
            let full = true;
            for (let c = 0; c < this.gridSize; c++) {
              if (targetBoard[r][c] === 0) {
                full = false;
                break;
              }
            }
            if (full) fullRows.push(r);
          }

          for (let c = 0; c < this.gridSize; c++) {
            let full = true;
            for (let r = 0; r < this.gridSize; r++) {
              if (targetBoard[r][c] === 0) {
                full = false;
                break;
              }
            }
            if (full) fullCols.push(c);
          }

          return { fullRows, fullCols };
        }

        /* ----------------------------------------------------------------------
           Drag & Drop Engine with 75px Ergonomic Touch Offset
           ---------------------------------------------------------------------- */
        setupEvents() {
          // Tray Slot Touch & Mouse Pickup
          const onStart = (e) => {
            if (this.isDragging) return;
            const isTouch = !!(e.touches && e.touches.length);
            const touch = isTouch ? e.touches[0] : e;
            const targetSlot = e.target.closest('.tray-slot');
            if (!targetSlot) return;

            const slotIdx = parseInt(targetSlot.dataset.slotIndex, 10);
            if (isNaN(slotIdx) || !this.tray[slotIdx]) return;

            e.preventDefault();
            this.startDrag(slotIdx, touch.clientX, touch.clientY, isTouch);
          };

          const onMove = (e) => {
            if (!this.isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            e.preventDefault();
            this.updateDrag(touch.clientX, touch.clientY);
          };

          const onEnd = (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            this.finishDrag();
          };

          // Attach listeners to window for fluid drag outside container
          this.trayEl.addEventListener('touchstart', onStart, { passive: false });
          this.trayEl.addEventListener('mousedown', onStart);

          window.addEventListener('touchmove', onMove, { passive: false });
          window.addEventListener('mousemove', onMove);

          window.addEventListener('touchend', onEnd);
          window.addEventListener('mouseup', onEnd);
          window.addEventListener('touchcancel', onEnd);

          // User interaction dismisses tutorial hint
          window.addEventListener('pointerdown', () => this.dismissTutorialHint(), { passive: true });
          window.addEventListener('touchstart', () => this.dismissTutorialHint(), { passive: true });

          // Top Header Action Listeners
          const btnTheme = document.getElementById('btn-theme');
          if (btnTheme) {
            btnTheme.addEventListener('click', () => {
              const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
              this.applyTheme(nextTheme);
              this.updateThemeIcon();
              this.saveStorage();
            });
          }

          const headerGridTag = document.getElementById('header-grid-tag');
          if (headerGridTag) {
            headerGridTag.addEventListener('click', () => {
              const gridSizes = [8, 10, 12];
              const nextSize = gridSizes[(gridSizes.indexOf(this.gridSize) + 1) % gridSizes.length];
              this.handleGridSettingChange(nextSize);
            });
          }

          const headerModeText = document.getElementById('header-mode-text');
          if (headerModeText) {
            headerModeText.addEventListener('click', () => {
              const nextMode = this.mode === 'easy' ? 'hard' : 'easy';
              this.handleModeSettingChange(nextMode);
            });
          }

          const btnSound = document.getElementById('btn-sound');
          if (btnSound) {
            btnSound.addEventListener('click', () => {
              sound.enabled = !sound.enabled;
              this.updateSoundIcon();
              this.saveStorage();
            });
          }

          const btnVibrate = document.getElementById('btn-vibrate');
          if (btnVibrate) {
            btnVibrate.addEventListener('click', () => {
              haptics.enabled = !haptics.enabled;
              this.updateVibrateIcon();
              this.saveStorage();
            });
          }

          const btnLeaderboard = document.getElementById('btn-leaderboard');
          if (btnLeaderboard) {
            btnLeaderboard.addEventListener('click', () => {
              this.showLeaderboardModal();
            });
          }

          const btnSettings = document.getElementById('btn-settings');
          if (btnSettings) {
            btnSettings.addEventListener('click', () => {
              this.showSettingsModal();
            });
          }

          const btnRestart = document.getElementById('btn-restart');
          if (btnRestart) {
            btnRestart.addEventListener('click', () => {
              this.promptRestart(this.t('confirm_restart_title'), this.t('confirm_restart_msg'));
            });
          }

          if (this.undoButtonEl) {
            this.undoButtonEl.addEventListener('click', () => this.undoLastMove());
          }

          if (this.gameOverRestartEl) {
            this.gameOverRestartEl.addEventListener('click', () => {
              if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
              this.clearSavedGameState();
              this.resetGame(true);
            });
          }

          const btnBannerRestart = document.getElementById('btn-banner-restart');
          if (btnBannerRestart) {
            btnBannerRestart.addEventListener('click', () => {
              if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
              this.clearSavedGameState();
              this.resetGame(true);
            });
          }

          const btnBannerStats = document.getElementById('btn-banner-stats');
          if (btnBannerStats) {
            btnBannerStats.addEventListener('click', () => {
              this.showStatsAfterReview();
            });
          }

          window.addEventListener('popstate', () => {
            const gameOverModal = document.getElementById('modal-gameover');
            if (this.isGameOver && gameOverModal && gameOverModal.classList.contains('open')) {
              this.hideModals();
              if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = false;
              if (this.gameOverRestartEl) this.gameOverRestartEl.hidden = true;
            }
          });

          // Modal Close Actions
          const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
          if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', () => this.hideModals());
          const btnCloseLbBottom = document.getElementById('btn-close-lb-bottom');
          if (btnCloseLbBottom) btnCloseLbBottom.addEventListener('click', () => this.hideModals());

          const btnCloseSettings = document.getElementById('btn-close-settings');
          if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => this.cancelSettings());

          const btnTopCancelSettings = document.getElementById('btn-top-cancel-settings');
          if (btnTopCancelSettings) btnTopCancelSettings.addEventListener('click', () => this.cancelSettings());
          const btnTopSaveSettings = document.getElementById('btn-top-save-settings');
          if (btnTopSaveSettings) btnTopSaveSettings.addEventListener('click', () => this.saveAndApplySettings());

          const settingLangSelect = document.getElementById('setting-lang-select');
          if (settingLangSelect) {
            settingLangSelect.addEventListener('change', (e) => {
              if (this.stagedSettings) this.stagedSettings.lang = e.target.value;
              this.setLanguage(e.target.value);
              this.updateSettingsDirtyState();
            });
          }

          const btnPlayAgain = document.getElementById('btn-play-again');
          if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => {
              this.hideModals();
              if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
              this.clearSavedGameState();
              this.resetGame(true);
            });
          }

          const btnGoViewBoard = document.getElementById('btn-go-view-board');
          if (btnGoViewBoard) {
            btnGoViewBoard.addEventListener('click', () => this.viewBoardAfterGameOver());
          }

          const btnGoLeaderboard = document.getElementById('btn-go-leaderboard');
          if (btnGoLeaderboard) {
            btnGoLeaderboard.addEventListener('click', () => {
              this.hideModals();
              this.showLeaderboardModal();
            });
          }

          // Leaderboard Segment Tabs
          const lbSegmentedTabs = document.getElementById('lb-segmented-tabs');
          if (lbSegmentedTabs) {
            lbSegmentedTabs.addEventListener('click', (e) => {
              const btn = e.target.closest('.segment-btn');
              if (!btn) return;
              document.querySelectorAll('#lb-segmented-tabs .segment-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              this.renderLeaderboardList(btn.dataset.tab);
            });
          }

          // Settings Controls (Staging)
          const segGrid8 = document.getElementById('seg-grid-8');
          if (segGrid8) segGrid8.addEventListener('click', () => this.stageGridSize(8));
          const segGrid10 = document.getElementById('seg-grid-10');
          if (segGrid10) segGrid10.addEventListener('click', () => this.stageGridSize(10));
          const segGrid12 = document.getElementById('seg-grid-12');
          if (segGrid12) segGrid12.addEventListener('click', () => this.stageGridSize(12));

          const segModeEasy = document.getElementById('seg-mode-easy');
          if (segModeEasy) segModeEasy.addEventListener('click', () => this.stageMode('easy'));
          const segModeHard = document.getElementById('seg-mode-hard');
          if (segModeHard) segModeHard.addEventListener('click', () => this.stageMode('hard'));

          const segSlots3 = document.getElementById('seg-slots-3');
          if (segSlots3) segSlots3.addEventListener('click', () => this.stageSlots(3));
          const segSlots4 = document.getElementById('seg-slots-4');
          if (segSlots4) segSlots4.addEventListener('click', () => this.stageSlots(4));

          const segThemeLight = document.getElementById('seg-theme-light');
          if (segThemeLight) {
            segThemeLight.addEventListener('click', () => {
              if (this.stagedSettings) this.stagedSettings.theme = 'light';
              segThemeLight.classList.add('active');
              const darkBtn = document.getElementById('seg-theme-dark');
              if (darkBtn) darkBtn.classList.remove('active');
              this.applyTheme('light');
              this.updateThemeIcon();
              this.updateSettingsDirtyState();
            });
          }
          const segThemeDark = document.getElementById('seg-theme-dark');
          if (segThemeDark) {
            segThemeDark.addEventListener('click', () => {
              if (this.stagedSettings) this.stagedSettings.theme = 'dark';
              segThemeDark.classList.add('active');
              const lightBtn = document.getElementById('seg-theme-light');
              if (lightBtn) lightBtn.classList.remove('active');
              this.applyTheme('dark');
              this.updateThemeIcon();
              this.updateSettingsDirtyState();
            });
          }

          const switchSound = document.getElementById('switch-sound');
          if (switchSound) {
            switchSound.addEventListener('change', (e) => {
              if (this.stagedSettings) this.stagedSettings.sound = e.target.checked;
              sound.enabled = e.target.checked;
              this.updateSoundIcon();
              this.updateSettingsDirtyState();
            });
          }

          const switchVibrate = document.getElementById('switch-vibrate');
          if (switchVibrate) {
            switchVibrate.addEventListener('change', (e) => {
              if (this.stagedSettings) this.stagedSettings.vibrate = e.target.checked;
              haptics.enabled = e.target.checked;
              this.updateVibrateIcon();
              this.updateSettingsDirtyState();
            });
          }

          // Palette selection
          document.querySelectorAll('.palette-card').forEach(card => {
            card.addEventListener('click', () => {
              const pal = card.dataset.palette;
              if (this.stagedSettings) this.stagedSettings.palette = pal;
              document.querySelectorAll('.palette-card').forEach(c => c.classList.toggle('active', c === card));
              this.applyPalette(pal);
              this.updateSettingsDirtyState();
            });
          });

          // Custom color pickers
          const categories = ['dot', 'bar', 'square', 'corner', 'tshape', 'zshape'];
          categories.forEach(cat => {
            const picker = document.getElementById(`picker-${cat}`);
            if (picker) {
              picker.addEventListener('input', (e) => {
                if (this.stagedSettings) {
                  this.stagedSettings.customColors[cat] = e.target.value;
                  this.stagedSettings.palette = 'custom';
                }
                this.customColors[cat] = e.target.value;
                document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('active'));
                this.applyPalette('custom');
                this.updateSettingsDirtyState();
              });
            }
          });

          // Confirm Modal Actions
          const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
          if (btnConfirmCancel) {
            btnConfirmCancel.addEventListener('click', () => {
              if (this.pendingConfirmCancel) {
                this.pendingConfirmCancel();
                this.pendingConfirmCancel = null;
              }
              this.hideModals();
            });
          }
          const btnConfirmOk = document.getElementById('btn-confirm-ok');
          if (btnConfirmOk) {
            btnConfirmOk.addEventListener('click', () => {
              if (this.pendingConfirmAction) {
                this.pendingConfirmAction();
                this.pendingConfirmAction = null;
              }
              this.hideModals();
            });
          }

          // Auto-save on exit, pagehide, and tab switch
          window.addEventListener('beforeunload', () => this.saveGameState());
          window.addEventListener('pagehide', () => this.saveGameState());
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              this.saveGameState();
            }
          });
        }

        updateThemeIcon() {
          const svg = document.getElementById('theme-icon-svg');
          if (!svg) return;
          if (this.theme === 'dark') {
            svg.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
          } else {
            svg.innerHTML = `
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
          }
        }

        updateSoundIcon() {
          const svg = document.getElementById('sound-icon-svg');
          if (svg) {
            if (sound.enabled) {
              svg.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
            } else {
              svg.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>`;
            }
          }
          const switchSound = document.getElementById('switch-sound');
          if (switchSound) switchSound.checked = sound.enabled;
        }

        updateVibrateIcon() {
          const svg = document.getElementById('vibrate-icon-svg');
          if (svg) {
            if (haptics.enabled) {
              svg.innerHTML = `
                <path d="M18 8a6 6 0 0 1 0 8M22 6a10 10 0 0 1 0 12M2 8a6 6 0 0 0 0 8M6 6a10 10 0 0 0 0 12"></path>
                <rect x="7" y="5" width="10" height="14" rx="2"></rect>`;
            } else {
              svg.innerHTML = `
                <rect x="7" y="5" width="10" height="14" rx="2"></rect>
                <line x1="1" y1="1" x2="23" y2="23"></line>`;
            }
          }
          const switchVibrate = document.getElementById('switch-vibrate');
          if (switchVibrate) switchVibrate.checked = haptics.enabled;
        }

        /* ----------------------------------------------------------------------
           Dragging Mechanics Implementation
           ---------------------------------------------------------------------- */
        startDrag(slotIdx, clientX, clientY, isTouch = false) {
          const piece = this.tray[slotIdx];
          if (!piece) return;

          this.dismissTutorialHint();

          this.isDragging = true;
          this.isTouchDrag = !!isTouch;
          this.draggedSlotIndex = slotIdx;
          this.draggedPiece = piece;
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.lastTargetRow = null;
          this.lastTargetCol = null;

          // Sound & Haptics
          sound.pickup();
          haptics.pickup();

          // Hide piece in slot
          const slotEl = this.trayEl.children[slotIdx];
          if (slotEl) {
            slotEl.style.opacity = '0.15';
          }

          // Cache board cell dimensions and strides once at drag start
          const firstCell = this.boardEl.children[0];
          const secondCell = this.boardEl.children[1];
          const nextRowCell = this.boardEl.children[this.gridSize];
          const c0 = firstCell ? firstCell.getBoundingClientRect() : { left: 0, top: 0, width: 28 };
          const cellWidth = c0.width || 28;
          const strideX = (secondCell && c0) ? (secondCell.getBoundingClientRect().left - c0.left) : (cellWidth + 3);
          const strideY = (nextRowCell && c0) ? (nextRowCell.getBoundingClientRect().top - c0.top) : (cellWidth + 3);

          this.cachedGridGeometry = {
            left: c0.left,
            top: c0.top,
            cellWidth,
            strideX,
            strideY
          };
          this.cachedBoardRect = this.boardEl.getBoundingClientRect();

          // Render Drag Avatar scaled to exact board cell dimensions
          const rows = piece.matrix.length;
          const cols = piece.matrix[0].length;
          this.avatarGridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
          this.avatarGridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          this.avatarGridEl.style.gap = this.gridSize === 12 ? '2px' : '3px';
          this.avatarGridEl.innerHTML = '';

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const tile = document.createElement('div');
              tile.className = 'drag-tile';
              tile.style.width = `${cellWidth}px`;
              tile.style.height = `${cellWidth}px`;
              if (piece.matrix[r][c] === 1) {
                tile.style.backgroundColor = this.getPieceColor(piece);
              } else {
                tile.style.visibility = 'hidden';
              }
              this.avatarGridEl.appendChild(tile);
            }
          }

          this.avatarEl.style.transition = 'none';
          this.avatarEl.style.display = 'block';
          this.updateDrag(clientX, clientY);
        }

        getGridTargetCoords() {
          const geom = this.cachedGridGeometry;
          if (!geom) return { targetRow: -1, targetCol: -1 };

          const targetCol = Math.round((this.avatarX - geom.left) / geom.strideX);
          const targetRow = Math.round((this.avatarY - geom.top) / geom.strideY);
          return { targetRow, targetCol };
        }

        updateDrag(clientX, clientY) {
          if (!this.isDragging || !this.draggedPiece) return;

          const geom = this.cachedGridGeometry || {
            left: 0,
            top: 0,
            cellWidth: 28,
            strideX: 31,
            strideY: 31
          };
          const cellWidth = geom.cellWidth;
          const gap = this.gridSize === 12 ? 2 : 3;

          const rows = this.draggedPiece.matrix.length;
          const cols = this.draggedPiece.matrix[0].length;
          const avatarWidth = cols * cellWidth + (cols - 1) * gap;
          const avatarHeight = rows * cellWidth + (rows - 1) * gap;

          // Desktop mouse: 0px offset (centered under cursor); Touch: 75px offset above finger
          const verticalOffset = this.isTouchDrag ? 75 : 0;
          this.avatarX = clientX - avatarWidth / 2;
          this.avatarY = clientY - avatarHeight / 2 - verticalOffset;

          this.avatarEl.style.transform = `translate3d(${this.avatarX}px, ${this.avatarY}px, 0)`;

          // Nearest Grid Coordinate Calculation
          const { targetRow, targetCol } = this.getGridTargetCoords();

          // Only update previews if grid coordinate has actually changed
          if (targetRow === this.lastTargetRow && targetCol === this.lastTargetCol) {
            return;
          }
          this.lastTargetRow = targetRow;
          this.lastTargetCol = targetCol;

          this.clearPreviews();

          if (this.canPieceFitAt(this.draggedPiece, targetRow, targetCol)) {
            // Draw Ghost Cells
            const pieceColor = this.getPieceColor(this.draggedPiece);
            for (let pr = 0; pr < rows; pr++) {
              for (let pc = 0; pc < cols; pc++) {
                if (this.draggedPiece.matrix[pr][pc] === 1) {
                  const br = targetRow + pr;
                  const bc = targetCol + pc;
                  const cell = this.boardEl.children[br * this.gridSize + bc];
                  if (cell) {
                    cell.classList.add('ghost');
                    cell.style.color = pieceColor;
                    cell.style.backgroundColor = pieceColor;
                  }
                }
              }
            }

            // Predictive Line Highlight
            const simBoard = this.board.map(row => [...row]);
            for (let pr = 0; pr < rows; pr++) {
              for (let pc = 0; pc < cols; pc++) {
                if (this.draggedPiece.matrix[pr][pc] === 1) {
                  simBoard[targetRow + pr][targetCol + pc] = 1;
                }
              }
            }
            const { fullRows, fullCols } = this.findFullLines(simBoard);

            fullRows.forEach(r => {
              for (let c = 0; c < this.gridSize; c++) {
                this.boardEl.children[r * this.gridSize + c].classList.add('line-preview');
              }
            });

            fullCols.forEach(c => {
              for (let r = 0; r < this.gridSize; r++) {
                this.boardEl.children[r * this.gridSize + c].classList.add('line-preview');
              }
            });
          }
        }

        clearPreviews() {
          const cells = this.boardEl.children;
          for (let i = 0; i < cells.length; i++) {
            cells[i].classList.remove('ghost', 'line-preview');
            const r = Math.floor(i / this.gridSize);
            const c = i % this.gridSize;
            if (this.board[r][c] === 0) {
              cells[i].style.backgroundColor = '';
            }
          }
        }

        finishDrag() {
          if (!this.isDragging || !this.draggedPiece) return;

          const { targetRow, targetCol } = this.getGridTargetCoords();
          const piece = this.draggedPiece;
          const slotIdx = this.draggedSlotIndex;
          const slotEl = this.trayEl.children[slotIdx];

          this.clearPreviews();

          if (this.canPieceFitAt(piece, targetRow, targetCol)) {
            // Valid Placement!
            this.avatarEl.style.display = 'none';
            if (slotEl) slotEl.style.opacity = '1';
            this.placePiece(piece, targetRow, targetCol, slotIdx);
            this.isDragging = false;
            this.draggedPiece = null;
            this.draggedSlotIndex = null;
            this.cachedGridGeometry = null;
            this.cachedBoardRect = null;
            this.lastTargetRow = null;
            this.lastTargetCol = null;
          } else {
            // Invalid placement - smoothly animate snap back to tray slot
            sound.snapInvalid();
            haptics.invalid();

            const slotRect = slotEl ? slotEl.getBoundingClientRect() : null;
            if (slotRect) {
              const cellWidth = this.cachedGridGeometry ? this.cachedGridGeometry.cellWidth : 28;
              const gap = this.gridSize === 12 ? 2 : 3;
              const rows = piece.matrix.length;
              const cols = piece.matrix[0].length;
              const avatarWidth = cols * cellWidth + (cols - 1) * gap;
              const avatarHeight = rows * cellWidth + (rows - 1) * gap;

              const returnX = slotRect.left + (slotRect.width - avatarWidth) / 2;
              const returnY = slotRect.top + (slotRect.height - avatarHeight) / 2;

              this.avatarEl.style.transition = 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)';
              this.avatarEl.style.transform = `translate3d(${returnX}px, ${returnY}px, 0)`;

              setTimeout(() => {
                this.avatarEl.style.display = 'none';
                this.avatarEl.style.transition = 'none';
                if (slotEl) slotEl.style.opacity = '1';
                this.isDragging = false;
                this.draggedPiece = null;
                this.draggedSlotIndex = null;
                this.cachedGridGeometry = null;
                this.cachedBoardRect = null;
                this.lastTargetRow = null;
                this.lastTargetCol = null;
              }, 200);
            } else {
              this.avatarEl.style.display = 'none';
              if (slotEl) slotEl.style.opacity = '1';
              this.isDragging = false;
              this.draggedPiece = null;
              this.draggedSlotIndex = null;
              this.cachedGridGeometry = null;
              this.cachedBoardRect = null;
              this.lastTargetRow = null;
              this.lastTargetCol = null;
            }
          }
        }

        /* ----------------------------------------------------------------------
           Piece Placement & Scoring Logic
           ---------------------------------------------------------------------- */
        placePiece(piece, targetRow, targetCol, slotIdx) {
          if (this.lineClearTimeout !== null) {
            clearTimeout(this.lineClearTimeout);
            this.lineClearTimeout = null;
          }

          this.undoState = this.mode === 'easy' ? this.captureUndoState() : null;
          this.updateUndoButton();

          const rows = piece.matrix.length;
          const cols = piece.matrix[0].length;
          const colorKey = piece.colorKey || piece.category;

          let tileCount = 0;
          for (let pr = 0; pr < rows; pr++) {
            for (let pc = 0; pc < cols; pc++) {
              if (piece.matrix[pr][pc] === 1) {
                this.board[targetRow + pr][targetCol + pc] = 1;
                this.boardColors[targetRow + pr][targetCol + pc] = colorKey;
                tileCount++;
              }
            }
          }

          // Sound & Haptics
          sound.snapDrop();
          haptics.drop();

          // Base placement score (+10 per individual block tile)
          const basePlacementPts = Math.floor(tileCount * SCORING_CONFIG.pointsPerTile * SCORING_CONFIG.multiplier);
          let addedScore = basePlacementPts;

          // Check Laya Rhythm Cadence Bonus
          if (this.cadenceActive && this.cadenceRemaining > 0) {
            this.speedMultiplier = Math.min(SCORING_CONFIG.cadenceMaxMultiplier, this.speedMultiplier + 1);
            if (this.speedMultiplier > this.speedPeak) {
              this.speedPeak = this.speedMultiplier;
            }
            const speedBonus = Math.floor(
              SCORING_CONFIG.cadenceBonusBasePoints * this.speedMultiplier * SCORING_CONFIG.multiplier
            );
            addedScore += speedBonus;

            sound.layaFlowChirp();
            this.showFloatingText(
              targetCol * 28 + 40,
              targetRow * 28 + 30,
              `⚡ ${this.t('laya_flow')} x${this.speedMultiplier} +${speedBonus}`
            );
          } else {
            this.speedMultiplier = 1;
          }

          // Reset Cadence Timer to 4.0 seconds and start on-demand timer
          this.cadenceRemaining = this.cadenceDuration;
          this.startCadenceTimer();

          // Floating base score
          this.showFloatingText(
            targetCol * 28 + 20,
            targetRow * 28 + 20,
            `+${basePlacementPts}`
          );

          // Remove piece from tray
          this.tray[slotIdx] = null;

          // Immediate render of placed piece
          this.renderBoard();

          // Check Simultaneous Row & Column Clearing
          const { fullRows, fullCols } = this.findFullLines(this.board);
          const linesCleared = fullRows.length + fullCols.length;

          if (linesCleared > 0) {
            this.handleLineClears(fullRows, fullCols, linesCleared);
          } else {
            // Missing a clear increments grace drops counter
            this.graceDrops++;
            if (this.graceDrops >= 2) {
              this.comboStreak = 0;
            }
            this.updateBadges();
          }

          // Update Score
          this.score += addedScore;
          this.currentScoreEl.textContent = this.score.toLocaleString();

          // Refill Tray according to game mode
          if (this.mode === 'easy') {
            // Easy Mode: Instant refill for this specific slot with non-duplicate color
            const activeColors = this.tray
              .filter((p, idx) => p && idx !== slotIdx && p.colorKey)
              .map(p => p.colorKey);
            this.tray[slotIdx] = this.getRandomPiece(activeColors);
          } else {
            // Hard Mode: Batch refill only when ALL slots are empty
            const remainingCount = this.tray.filter(p => p !== null).length;
            if (remainingCount === 0) {
              this.refillFullTray();
            }
          }

          // Render tray evaluated against already-cleared board state
          this.renderTray();
          // Synchronously persist post-clear game state
          this.saveGameState();

          // Strict Game Over Check
          this.pendingGameOverTimeout = setTimeout(() => {
            this.pendingGameOverTimeout = null;
            if (this.checkGameOver()) {
              this.triggerGameOver();
            }
          }, 320);
        }

        handleLineClears(fullRows, fullCols, totalLines) {
          this.comboStreak++;
          this.graceDrops = 0;
          this.totalLines += totalLines;
          if (this.comboStreak > this.maxCombo) {
            this.maxCombo = this.comboStreak;
          }

          // Line clear score calculation
          const lineBasePts = totalLines <= 4
            ? SCORING_CONFIG.lineClearBasePoints[totalLines]
            : SCORING_CONFIG.lineClearBasePoints[4] +
              (totalLines - 4) * SCORING_CONFIG.pointsPerLineBeyondFour;

          const comboMult = this.comboStreak;
          const lineClearTotalPts = Math.floor(lineBasePts * comboMult * SCORING_CONFIG.multiplier);
          this.score += lineClearTotalPts;
          this.currentScoreEl.textContent = this.score.toLocaleString();

          // Audio & Haptic Feedback
          sound.lineClear(totalLines, this.comboStreak);
          if (totalLines > 1 || this.comboStreak > 1) {
            haptics.multiClear();
          } else {
            haptics.singleClear();
          }

          // Animate clearing cells & emit particles
          const clearingSet = new Set();
          fullRows.forEach(r => {
            for (let c = 0; c < this.gridSize; c++) clearingSet.add(`${r},${c}`);
          });
          fullCols.forEach(c => {
            for (let r = 0; r < this.gridSize; r++) clearingSet.add(`${r},${c}`);
          });

          const boardRect = this.boardEl.getBoundingClientRect();
          clearingSet.forEach(coord => {
            const [r, c] = coord.split(',').map(Number);
            const cell = this.boardEl.children[r * this.gridSize + c];
            if (cell) {
              cell.classList.add('clearing');
              const cellRect = cell.getBoundingClientRect();
              const particleX = cellRect.left - boardRect.left + cellRect.width / 2;
              const particleY = cellRect.top - boardRect.top + cellRect.height / 2;
              this.particles.burst(particleX, particleY, this.resolveColor(this.boardColors[r][c]) || '#0EA5E9');
            }
          });

          // Floating score text for line clear & combo
          const midRow = fullRows.length > 0 ? fullRows[0] : Math.floor(this.gridSize / 2);
          const midCol = fullCols.length > 0 ? fullCols[0] : Math.floor(this.gridSize / 2);
          const comboText = comboMult > 1 ? ` x${comboMult} ${this.t('combo')}!` : '!';
          this.showFloatingText(
            midCol * 30 + 30,
            midRow * 30 + 10,
            `+${lineClearTotalPts} (${totalLines} ${this.t('lines_cleared')}${comboText})`
          );

          this.updateBadges();

          // Immediately clear logical board cells synchronously
          clearingSet.forEach(coord => {
            const [r, c] = coord.split(',').map(Number);
            this.board[r][c] = 0;
            this.boardColors[r][c] = '';
          });

          // After visual animation finishes, synchronize DOM board cells
          this.lineClearTimeout = setTimeout(() => {
            this.lineClearTimeout = null;
            this.renderBoard();
          }, 280);
        }

        /* ----------------------------------------------------------------------
           Floating Text & Status Badges
           ---------------------------------------------------------------------- */
        showFloatingText(x, y, text) {
          const el = document.createElement('div');
          el.className = 'floating-score';
          el.textContent = text;
          const boardRect = this.boardEl ? this.boardEl.getBoundingClientRect() : null;
          const maxW = (boardRect && boardRect.width > 40) ? (boardRect.width - 20) : (window.innerWidth - 40);
          const maxH = (boardRect && boardRect.height > 40) ? (boardRect.height - 20) : (window.innerHeight - 40);
          el.style.left = `${Math.max(20, Math.min(x, maxW))}px`;
          el.style.top = `${Math.max(20, Math.min(y, maxH))}px`;
          this.floatingLayerEl.appendChild(el);
          setTimeout(() => el.remove(), 850);
        }

        showFloatingScore(x, y, text) {
          this.showFloatingText(x, y, text);
        }

        updateBadges() {
          // Combo Badge
          if (this.comboStreak >= 2) {
            this.comboBadgeEl.textContent = `${this.t('combo')} x${this.comboStreak} 🔥`;
            this.comboBadgeEl.classList.add('active');
          } else {
            this.comboBadgeEl.classList.remove('active');
          }

          // Speed Badge: Laya Flow
          if (this.speedMultiplier > 1 && this.cadenceRemaining > 0) {
            this.speedBadgeEl.textContent = `⚡ ${this.t('laya_flow')} x${this.speedMultiplier}`;
            this.speedBadgeEl.classList.add('active');
          } else {
            this.speedBadgeEl.classList.remove('active');
          }
        }

        /* ----------------------------------------------------------------------
           Soul Rhythm Cadence Timer Loop (requestAnimationFrame)
           ---------------------------------------------------------------------- */
        stopCadenceTimer() {
          if (this.cadenceRafId !== null) {
            cancelAnimationFrame(this.cadenceRafId);
            this.cadenceRafId = null;
          }
          this.cadenceActive = false;
        }

        startCadenceTimer() {
          if (this.cadenceRafId !== null) {
            cancelAnimationFrame(this.cadenceRafId);
            this.cadenceRafId = null;
          }
          this.cadenceActive = true;
          this.lastFrameTime = performance.now();
          this.cadenceRafId = requestAnimationFrame((t) => this.tickCadence(t));
        }

        tickCadence(now) {
          if (!this.cadenceActive || this.cadenceRemaining <= 0) {
            this.cadenceActive = false;
            this.cadenceRemaining = 0;
            this.cadenceRafId = null;
            this.speedMultiplier = 1;
            this.updateBadges();
            this.cadenceBarEl.style.width = '0%';
            return;
          }

          const dt = Math.min(now - this.lastFrameTime, 100);
          this.lastFrameTime = now;

          this.cadenceRemaining -= dt;
          if (this.cadenceRemaining <= 0) {
            this.cadenceRemaining = 0;
            this.cadenceActive = false;
            this.cadenceRafId = null;
            this.speedMultiplier = 1;
            this.updateBadges();
            this.cadenceBarEl.style.width = '0%';
            return;
          } else {
            const pct = Math.max(0, Math.min(100, (this.cadenceRemaining / this.cadenceDuration) * 100));
            this.cadenceBarEl.style.width = `${pct}%`;
          }

          this.cadenceRafId = requestAnimationFrame((t) => this.tickCadence(t));
        }

        /* ----------------------------------------------------------------------
           Game Over & Leaderboards Handling
           ---------------------------------------------------------------------- */
        triggerGameOver() {
          this.isGameOver = true;
          this.stopCadenceTimer();
          if (this.gameOverRestartEl) this.gameOverRestartEl.hidden = true;
          if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
          this.clearSavedGameState();
          sound.gameOver();
          haptics.invalid();

          const isNewRecord = this.recordScore(this.score, this.maxCombo, this.totalLines);

          document.getElementById('go-score').textContent = this.score.toLocaleString();
          document.getElementById('go-lines').textContent = this.totalLines;
          document.getElementById('go-max-combo').textContent = `x${this.maxCombo}`;
          document.getElementById('go-speed-peak').textContent = `x${this.speedPeak}`;
          document.getElementById('go-new-record').style.display = isNewRecord ? 'inline-block' : 'none';

          if (!window.history.state || !window.history.state.layaGameOver) {
            window.history.pushState({ layaGameOver: true }, '', window.location.href);
          }
          document.getElementById('modal-gameover').classList.add('open');
        }

        viewBoardAfterGameOver() {
          this.hideModals();
          if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = false;
          if (this.gameOverRestartEl) this.gameOverRestartEl.hidden = true;
        }

        showStatsAfterReview() {
          if (this.gameoverBannerEl) this.gameoverBannerEl.hidden = true;
          document.getElementById('modal-gameover').classList.add('open');
        }

        showLeaderboardModal() {
          const currentTabKey = this.getLeaderboardKey();
          document.querySelectorAll('#lb-segmented-tabs .segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === currentTabKey);
          });
          this.renderLeaderboardList(currentTabKey);
          document.getElementById('modal-leaderboard').classList.add('open');
        }

        renderLeaderboardList(key) {
          const list = this.getLeaderboard(key);
          const container = document.getElementById('leaderboard-items');
          container.innerHTML = '';

          if (list.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                ${this.t('no_scores_yet')}
              </div>`;
            return;
          }

          list.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';

            const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;

            row.innerHTML = `
              <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
              <div class="leaderboard-details">
                <div class="leaderboard-score">${item.score.toLocaleString()}</div>
                <div class="leaderboard-meta">
                  <span>${this.t('combo')}: x${item.maxCombo}</span>
                  <span>${this.t('lines_cleared')}: ${item.lines}</span>
                  <span>${item.date}</span>
                </div>
              </div>
            `;
            container.appendChild(row);
          });
        }

        showSettingsModal() {
          this.stagedSettings = {
            gridSize: this.gridSize,
            mode: this.mode,
            slotCount: this.slotCount,
            theme: this.theme,
            sound: sound.enabled,
            vibrate: haptics.enabled,
            palette: this.activePalette,
            customColors: { ...this.customColors },
            lang: this.currentLang
          };
          this.initialSettingsSnapshot = {
            ...this.stagedSettings,
            customColors: { ...this.stagedSettings.customColors }
          };

          this.renderSettingsDialog();
          this.updateSettingsDirtyState();
          document.getElementById('modal-settings').classList.add('open');
        }

        renderSettingsDialog() {
          const staged = this.stagedSettings || {
            gridSize: this.gridSize,
            mode: this.mode,
            slotCount: this.slotCount,
            theme: this.theme,
            sound: sound.enabled,
            vibrate: haptics.enabled,
            palette: this.activePalette,
            customColors: this.customColors,
            lang: this.currentLang
          };

          const seg8 = document.getElementById('seg-grid-8');
          const seg10 = document.getElementById('seg-grid-10');
          const seg12 = document.getElementById('seg-grid-12');
          if (seg8) seg8.classList.toggle('active', staged.gridSize === 8);
          if (seg10) seg10.classList.toggle('active', staged.gridSize === 10);
          if (seg12) seg12.classList.toggle('active', staged.gridSize === 12);

          const segEasy = document.getElementById('seg-mode-easy');
          const segHard = document.getElementById('seg-mode-hard');
          if (segEasy) segEasy.classList.toggle('active', staged.mode === 'easy');
          if (segHard) segHard.classList.toggle('active', staged.mode === 'hard');

          const segSlots3 = document.getElementById('seg-slots-3');
          const segSlots4 = document.getElementById('seg-slots-4');
          if (segSlots3) segSlots3.classList.toggle('active', staged.slotCount === 3);
          if (segSlots4) segSlots4.classList.toggle('active', staged.slotCount === 4);

          const segThemeLight = document.getElementById('seg-theme-light');
          const segThemeDark = document.getElementById('seg-theme-dark');
          if (segThemeLight) segThemeLight.classList.toggle('active', staged.theme === 'light');
          if (segThemeDark) segThemeDark.classList.toggle('active', staged.theme === 'dark');

          const switchSound = document.getElementById('switch-sound');
          if (switchSound) switchSound.checked = staged.sound;

          const switchVibrate = document.getElementById('switch-vibrate');
          if (switchVibrate) switchVibrate.checked = staged.vibrate;

          document.querySelectorAll('.palette-card').forEach(card => {
            card.classList.toggle('active', card.dataset.palette === staged.palette);
          });

          const categories = ['dot', 'bar', 'square', 'corner', 'tshape', 'zshape'];
          categories.forEach(cat => {
            const picker = document.getElementById(`picker-${cat}`);
            if (picker && staged.customColors && staged.customColors[cat]) {
              picker.value = staged.customColors[cat];
            }
          });

          const langSelect = document.getElementById('setting-lang-select');
          if (langSelect) {
            langSelect.value = staged.lang;
          }
        }

        stageGridSize(size) {
          if (!this.stagedSettings) return;
          this.stagedSettings.gridSize = size;
          const seg8 = document.getElementById('seg-grid-8');
          const seg10 = document.getElementById('seg-grid-10');
          const seg12 = document.getElementById('seg-grid-12');
          if (seg8) seg8.classList.toggle('active', size === 8);
          if (seg10) seg10.classList.toggle('active', size === 10);
          if (seg12) seg12.classList.toggle('active', size === 12);
          this.updateSettingsDirtyState();
        }

        stageMode(mode) {
          if (!this.stagedSettings) return;
          this.stagedSettings.mode = mode;
          this.stagedSettings.slotCount = mode === 'easy' ? 4 : 3;
          const segEasy = document.getElementById('seg-mode-easy');
          const segHard = document.getElementById('seg-mode-hard');
          if (segEasy) segEasy.classList.toggle('active', mode === 'easy');
          if (segHard) segHard.classList.toggle('active', mode === 'hard');

          const segSlots3 = document.getElementById('seg-slots-3');
          const segSlots4 = document.getElementById('seg-slots-4');
          if (segSlots3) segSlots3.classList.toggle('active', this.stagedSettings.slotCount === 3);
          if (segSlots4) segSlots4.classList.toggle('active', this.stagedSettings.slotCount === 4);
          this.updateSettingsDirtyState();
        }

        stageSlots(count) {
          if (!this.stagedSettings) return;
          this.stagedSettings.slotCount = count;
          const segSlots3 = document.getElementById('seg-slots-3');
          const segSlots4 = document.getElementById('seg-slots-4');
          if (segSlots3) segSlots3.classList.toggle('active', count === 3);
          if (segSlots4) segSlots4.classList.toggle('active', count === 4);
          this.updateSettingsDirtyState();
        }

        checkSettingsDirty() {
          if (!this.stagedSettings || !this.initialSettingsSnapshot) return false;
          const s = this.stagedSettings;
          const init = this.initialSettingsSnapshot;
          if (s.gridSize !== init.gridSize) return true;
          if (s.mode !== init.mode) return true;
          if (s.slotCount !== init.slotCount) return true;
          if (s.theme !== init.theme) return true;
          if (s.sound !== init.sound) return true;
          if (s.vibrate !== init.vibrate) return true;
          if (s.palette !== init.palette) return true;
          if (s.lang !== init.lang) return true;
          if (s.customColors && init.customColors) {
            const categories = ['dot', 'bar', 'square', 'corner', 'tshape', 'zshape'];
            for (const cat of categories) {
              if (s.customColors[cat] !== init.customColors[cat]) return true;
            }
          }
          return false;
        }

        updateSettingsDirtyState() {
          if (!this.settingsTopActionsEl) return;
          const isDirty = this.checkSettingsDirty();
          this.settingsTopActionsEl.hidden = !isDirty;
        }

        cancelSettings() {
          if (this.initialSettingsSnapshot) {
            this.theme = this.initialSettingsSnapshot.theme;
            this.applyTheme(this.theme);
            this.updateThemeIcon();
            sound.enabled = this.initialSettingsSnapshot.sound;
            this.updateSoundIcon();
            haptics.enabled = this.initialSettingsSnapshot.vibrate;
            this.updateVibrateIcon();
            this.activePalette = this.initialSettingsSnapshot.palette;
            this.customColors = { ...this.initialSettingsSnapshot.customColors };
            this.applyPalette(this.activePalette);
            if (this.currentLang !== this.initialSettingsSnapshot.lang) {
              this.setLanguage(this.initialSettingsSnapshot.lang);
            }
          }
          this.stagedSettings = null;
          this.initialSettingsSnapshot = null;
          this.updateSettingsDirtyState();
          this.hideModals();
        }

        saveAndApplySettings() {
          if (!this.stagedSettings) {
            this.updateSettingsDirtyState();
            this.hideModals();
            return;
          }

          // Apply non-gameplay settings immediately without resetting the board
          this.theme = this.stagedSettings.theme;
          this.applyTheme(this.theme);
          this.updateThemeIcon();

          sound.enabled = this.stagedSettings.sound;
          this.updateSoundIcon();

          haptics.enabled = this.stagedSettings.vibrate;
          this.updateVibrateIcon();

          this.activePalette = this.stagedSettings.palette;
          this.customColors = { ...this.stagedSettings.customColors };
          this.applyPalette(this.activePalette);

          if (this.currentLang !== this.stagedSettings.lang) {
            this.setLanguage(this.stagedSettings.lang);
          }

          // Check if gameplay rules changed
          const rulesChanged =
            this.stagedSettings.gridSize !== this.gridSize ||
            this.stagedSettings.mode !== this.mode ||
            this.stagedSettings.slotCount !== this.slotCount;

          if (!rulesChanged) {
            this.saveStorage();
            this.stagedSettings = null;
            this.initialSettingsSnapshot = null;
            this.updateSettingsDirtyState();
            this.hideModals();
            return;
          }

          // Gameplay rules changed
          const isBoardEmpty = this.board.every(row => row.every(cell => cell === 0));
          const isUnplayed = (this.score === 0 && isBoardEmpty) || this.isGameOver;

          const applyRules = () => {
            this.gridSize = this.stagedSettings.gridSize;
            this.mode = this.stagedSettings.mode;
            this.slotCount = this.stagedSettings.slotCount;
            this.clearSavedGameState();
            this.resetGame(true);
            this.saveStorage();
            this.stagedSettings = null;
            this.initialSettingsSnapshot = null;
            this.updateSettingsDirtyState();
            this.hideModals();
          };

          if (isUnplayed) {
            applyRules();
          } else {
            // Prompt once via modal-confirm
            document.getElementById('confirm-title').textContent = this.t('confirm_restart_title');
            document.getElementById('confirm-message').textContent = this.t('apply_restart_warning');
            this.pendingConfirmAction = applyRules;
            this.pendingConfirmCancel = () => {
              if (this.stagedSettings) {
                this.stagedSettings.gridSize = this.gridSize;
                this.stagedSettings.mode = this.mode;
                this.stagedSettings.slotCount = this.slotCount;
              }
              this.saveStorage();
              this.stagedSettings = null;
              this.initialSettingsSnapshot = null;
              this.updateSettingsDirtyState();
            };
            document.getElementById('modal-confirm').classList.add('open');
          }
        }

        updateGridSizeSetting() {
          const seg8 = document.getElementById('seg-grid-8');
          const seg10 = document.getElementById('seg-grid-10');
          const seg12 = document.getElementById('seg-grid-12');
          if (seg8) seg8.classList.toggle('active', this.gridSize === 8);
          if (seg10) seg10.classList.toggle('active', this.gridSize === 10);
          if (seg12) seg12.classList.toggle('active', this.gridSize === 12);
        }

        hideModals() {
          document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
        }

        promptRestart(title, message) {
          document.getElementById('confirm-title').textContent = title;
          document.getElementById('confirm-message').textContent = message;
          this.pendingConfirmAction = () => {
            this.clearSavedGameState();
            this.resetGame(true);
          };
          document.getElementById('modal-confirm').classList.add('open');
        }

        handleGridSettingChange(size) {
          if (this.gridSize === size) return;
          const isBoardEmpty = this.board.every(row => row.every(cell => cell === 0));
          const isUnplayed = (this.score === 0 && isBoardEmpty) || this.isGameOver;
          const doChange = () => {
            this.clearSavedGameState();
            this.gridSize = size;
            this.updateGridSizeSetting();
            this.resetGame(true);
            this.saveStorage();
          };

          if (isUnplayed) {
            doChange();
          } else {
            this.promptRestart(this.t('change_grid_title'), this.t('change_grid_msg'));
            this.pendingConfirmAction = doChange;
          }
        }

        handleModeSettingChange(mode) {
          if (this.mode === mode) return;
          const isBoardEmpty = this.board.every(row => row.every(cell => cell === 0));
          const isUnplayed = (this.score === 0 && isBoardEmpty) || this.isGameOver;
          const doChange = () => {
            this.clearSavedGameState();
            this.mode = mode;
            this.slotCount = mode === 'easy' ? 4 : 3;
            this.resetGame(true);
            this.saveStorage();
          };

          if (isUnplayed) {
            doChange();
          } else {
            this.promptRestart(this.t('change_mode_title'), this.t('change_mode_msg'));
            this.pendingConfirmAction = doChange;
          }
        }

        handleSlotsSettingChange(count) {
          if (this.slotCount === count) return;
          this.clearSavedGameState();
          this.slotCount = count;
          this.resetGame(true);
          this.saveStorage();
        }

        showUpdateNotification(registration) {
          if (document.getElementById('app-update-banner')) return;
          const banner = document.createElement('div');
          banner.id = 'app-update-banner';
          banner.className = 'app-update-pill';
          banner.setAttribute('role', 'alert');
          banner.innerHTML = `
            <span>🚀 ${this.t('update_available') || 'New version available!'}</span>
            <button class="update-action-btn" id="btn-apply-update">${this.t('refresh') || 'Update'}</button>
          `;
          document.body.appendChild(banner);
          const btn = document.getElementById('btn-apply-update');
          if (btn) {
            btn.addEventListener('click', () => {
              if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              window.location.reload();
            });
          }
        }
      }

      // Bootstrap Game on Window Load
      window.addEventListener('DOMContentLoaded', () => {
        window.game = new BlockGame();
        if (window.game.updateThemeIcon) window.game.updateThemeIcon();
        if (window.game.updateSoundIcon) window.game.updateSoundIcon();
        if (window.game.updateVibrateIcon) window.game.updateVibrateIcon();

        // Register Service Worker for Offline PWA Support with Over-the-Air Auto-Updates
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          navigator.serviceWorker.register('./sw.js').then((registration) => {
            // Actively check for updates on startup & on focus
            registration.update().catch(() => {});
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
              }
            });

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (window.game && window.game.showUpdateNotification) {
                      window.game.showUpdateNotification(registration);
                    }
                  }
                });
              }
            });
          }).catch(() => {});

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      });
    })();

