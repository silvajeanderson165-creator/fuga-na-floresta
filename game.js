// ═══ FUGA NA FLORESTA - Game Loop Principal ═══

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.BASE_W = 800; this.BASE_H = 400;
        this.canvas.width = this.BASE_W; this.canvas.height = this.BASE_H;
        this.state = 'start'; // start, playing, paused, gameover
        this.score = 0; this.highScore = parseInt(localStorage.getItem('fugaHigh')) || 0;
        this.speed = 6; this.maxSpeed = 15; this.baseSpeed = 6;
        this.lastMilestone = 0; this.comboCount = 0; this.comboMultiplier = 1; this.comboTimer = 0;
        this.isNewRecord = false; this.isNight = new Date().getHours() >= 19 || new Date().getHours() < 6;
        this.obstacles = []; this.spawnTimer = 0;
        this.spawnMin = 60; this.spawnMax = 180;
        this.particles = [];
        this.slowMoTimer = 0; this.slowMoSpeed = 1;
        this.flashTimer = 0; this.flashColor = '#fff';
        this.tutorialObstaclesShown = 0;
        // Fade
        this.fadeAlpha = 1; this.fadeDir = -1; // começa com fade-in
        this.fadeCallback = null;
        // Power-ups
        this.powerups = []; this.activePowerUp = null; this.powerUpTimer = 0;
        this.invincible = false; this.powerUpSpawnTimer = 0;
        this.dashItemCount = 0; this.dashTimer = 0; this.appleSpawnTimer = 0;
        // Achievements
        this.stats = JSON.parse(localStorage.getItem('fugaStats') || '{"totalJumps":0,"totalGames":0,"totalScore":0,"maxCombo":0,"obstaclesAvoided":0,"powerUpsCollected":0,"oncasAvoided":0}');
        this.achievements = JSON.parse(localStorage.getItem('fugaAchievements') || '[]');
        this.achievementPopup = null; this.achievementPopupTimer = 0;
        this.player = new Player(this.canvas);
        this.bg = new Background(this.canvas);
        this.ui = new UI(this.canvas);
        this.audio = new AudioManager();
        this.lastTime = 0; this.accumulator = 0; this.STEP = 1000/60;
        this.easterEggTimer = 0; this.showMonkey = false;
        this.muted = localStorage.getItem('fugaMuted') === 'true';
        this._resize();
        this._bindEvents();
        this._loop(0);
    }
    _resize() {
        let w = window.innerWidth, h = window.innerHeight;
        let isMobile = ('ontouchstart' in window) || w < 768;
        if (isMobile) {
            // Mobile: preenche tela inteira ajustando a altura lógica
            this.BASE_W = 800;
            this.BASE_H = 800 * (h / w);
            this.canvas.width = this.BASE_W;
            this.canvas.height = this.BASE_H;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this.scaleRatio = w / this.BASE_W;
        } else {
            // Desktop: mantém aspect ratio original (800x400)
            this.BASE_W = 800;
            this.BASE_H = 400;
            this.canvas.width = this.BASE_W;
            this.canvas.height = this.BASE_H;
            let scale = Math.min(w / this.BASE_W, h / this.BASE_H);
            this.canvas.style.width = (this.BASE_W * scale) + 'px';
            this.canvas.style.height = (this.BASE_H * scale) + 'px';
            this.scaleRatio = scale;
        }
        
        // Atualiza a posição do chão para as entidades ativas
        let groundY = this.canvas.height * 0.82;
        if (this.player) {
            this.player.h = this.canvas.height;
            this.player.groundY = groundY;
            if (this.player.onGround) this.player.y = groundY;
        }
        if (this.bg) {
            this.bg.h = this.canvas.height;
            this.bg.groundY = groundY;
        }
        if (this.obstacles) {
            for (let obs of this.obstacles) {
                obs.groundY = groundY;
                if (obs.type === 'arara') obs.y = groundY - 65 - Math.random() * 20;
                else obs.y = groundY - obs.height;
            }
        }
        if (this.powerups) {
            for (let pu of this.powerups) pu.y = groundY - 40 - Math.random() * 50;
        }
    }
    _bindEvents() {
        window.addEventListener('resize', () => this._resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 100));
        document.addEventListener('keydown', (e) => this._onKey(e, true));
        document.addEventListener('keyup', (e) => this._onKeyUp(e));
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this._onTouch(e, true); }, {passive:false});
        this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this._onTouch(e, false); }, {passive:false});
        this.canvas.addEventListener('mousedown', (e) => this._onMouse(e));
        // Pause ao perder foco
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') this._togglePause();
        });
        window.addEventListener('blur', () => {
            if (this.state === 'playing') this._togglePause();
        });
    }
    _toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('fugaMuted', this.muted);
        if (this.audio.masterGain) this.audio.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    _initAudio() {
        if (!this.audio.enabled) { this.audio.init(); this.audio.resume(); }
        else this.audio.resume();
        if (this.muted && this.audio.masterGain) this.audio.masterGain.gain.value = 0;
    }
    _onKey(e, down) {
        if (['Space','ArrowUp','ArrowDown','Enter'].includes(e.code)) e.preventDefault();
        this.easterEggTimer = 0; this.showMonkey = false;
        if (this.state === 'start') {
            if (e.code === 'Space' || e.code === 'ArrowUp') { this._initAudio(); this._startGame(); }
            return;
        }
        if (this.state === 'gameover') {
            if (e.code === 'Space' || e.code === 'ArrowUp') { this._initAudio(); this._startGame(); }
            return;
        }
        if (e.code === 'Enter') { this._togglePause(); return; }
        if (this.state !== 'playing') return;
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (this.player.jump()) this.audio.playJump();
        }
        if (e.code === 'ArrowDown') this.player.duck(true);
    }
    _onKeyUp(e) {
        if (e.code === 'ArrowDown' && this.state === 'playing') this.player.duck(false);
    }
    _onTouch(e, start) {
        let rect = this.canvas.getBoundingClientRect();
        let touch = e.changedTouches[0];
        let y = (touch.clientY - rect.top) / rect.height;
        if (start) {
            this.easterEggTimer = 0; this.showMonkey = false;
            if (this.state === 'start' || this.state === 'gameover') { this._initAudio(); this._startGame(); return; }
            if (y < 0.3) { this._togglePause(); return; }
            if (this.state !== 'playing') return;
            this.touchStartTime = Date.now();
            this.touchHolding = true;
            if (this.player.jump()) this.audio.playJump();
            // Agachar após 200ms de toque
            this._touchDuckTimeout = setTimeout(() => {
                if (this.touchHolding && this.player.onGround) this.player.duck(true);
            }, 200);
        } else {
            this.touchHolding = false;
            if (this._touchDuckTimeout) clearTimeout(this._touchDuckTimeout);
            this.player.duck(false);
        }
    }
    _onMouse(e) {
        let rect = this.canvas.getBoundingClientRect();
        let mx = (e.clientX - rect.left) / this.scaleRatio;
        let my = (e.clientY - rect.top) / this.scaleRatio;
        // Botão mute (canto superior esquerdo, ao lado do pause)
        if (mx > 38 && mx < 70 && my < 40) { this._toggleMute(); return; }
        if (mx < 38 && my < 50 && this.state === 'playing') this._togglePause();
    }
    _togglePause() {
        if (this.state === 'playing') { this.state = 'paused'; this.audio.stopSteps(); this.audio.stopBGM(); }
        else if (this.state === 'paused') { this.state = 'playing'; this.audio.startSteps(this.speed); this.audio.startBGM(this._getBPM()); }
    }
    _fadeToState(callback) {
        this.fadeDir = 1; this.fadeAlpha = 0; this.fadeCallback = callback;
    }
    _startGame() {
        this.state = 'playing'; this.score = 0; this.speed = this.baseSpeed;
        this.lastMilestone = 0; this.isNewRecord = false;
        this.comboCount = 0; this.comboMultiplier = 1; this.comboTimer = 0;
        this.obstacles = []; this.particles = []; this.powerups = [];
        this.spawnTimer = 90; this.powerUpSpawnTimer = 300; this.appleSpawnTimer = 150;
        this.slowMoTimer = 0; this.slowMoSpeed = 1;
        this.flashTimer = 0; this.tutorialObstaclesShown = 0;
        this.activePowerUp = null; this.powerUpTimer = 0; this.invincible = false;
        this.dashItemCount = 0; this.dashTimer = 0;
        this.ui.gameOverAnim = 0;
        this.fadeDir = -1; this.fadeAlpha = 1; // fade-in
        this.player = new Player(this.canvas);
        this.stats.totalGames++; this._saveStats();
        this.audio.startSteps(this.speed); this.audio.startAmbience(); this.audio.startBGM();
    }
    _gameOver() {
        this.state = 'gameover';
        this.player.die();
        this.ui.triggerShake();
        this.ui.gameOverAnim = 0;
        this.slowMoTimer = 30; this.slowMoSpeed = 0.3;
        this.audio.playHit(); this.audio.stopAll();
        this.stats.totalScore += Math.floor(this.score);
        if (this.comboCount > this.stats.maxCombo) this.stats.maxCombo = this.comboCount;
        this._saveStats();
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('fugaHigh', this.highScore);
            this.isNewRecord = true;
        }
    }
    _getBPM() { return Math.min(140, 100 + (this.speed - this.baseSpeed) * 5); }
    _spawnObstacle() {
        let types = [], s = this.score;
        // Probabilidades conforme pontuação
        types.push('javali','javali','javali','javali'); // 40%
        types.push('cobra','cobra','cobra'); // 30%
        if (s >= 500) types.push('arara','arara','arara'); // 25% após 500
        if (s >= 1000 && Math.random() < 0.15) types.push('onca'); // 5% raro após 1000
        let type = types[Math.floor(Math.random() * types.length)];
        // Segurança: não gerar arara muito perto de obstáculo terrestre
        if (type === 'arara' && this.obstacles.length > 0) {
            let last = this.obstacles[this.obstacles.length - 1];
            if (last.type !== 'arara' && this.canvas.width - last.x < 200) return;
        }
        let groundY = this.canvas.height * 0.82;
        let obs = new Obstacle(type, this.canvas.width, groundY, this.speed);
        if (type === 'onca') this.audio.playAlert();
        this.obstacles.push(obs);
    }
    _checkCollision(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }
    _addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y, vx: (Math.random()-0.5)*4, vy: -Math.random()*3-1,
                life: 30+Math.random()*20, maxLife: 50, size: 2+Math.random()*3, color
            });
        }
    }
    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    _drawParticles(ctx) {
        for (let p of this.particles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
    _update() {
        if (this.state === 'start') {
            this.easterEggTimer++;
            if (this.easterEggTimer > 300) this.showMonkey = true;
            return;
        }
        if (this.state !== 'playing') return;
        
        // Dash Countdown
        if (this.dashTimer > 0) {
            this.dashTimer--;
            if (this.dashTimer % 5 === 0) this._addParticles(this.player.x, this.player.y, 2, '#ff3333');
            if (this.dashTimer <= 0) this.audio.playMilestone();
        }

        this.invincible = (this.activePowerUp === 'banana') || (this.dashTimer > 0);

        // Score e velocidade
        this.score += this.comboMultiplier * (this.dashTimer > 0 ? 2 : 1);
        let baseS = this.baseSpeed + this.score * 0.001;
        this.speed = Math.min(this.maxSpeed * (this.dashTimer > 0 ? 3 : 1), baseS * (this.dashTimer > 0 ? 3 : 1));
        
        // Slow-motion
        if (this.slowMoTimer > 0) { this.slowMoTimer--; if(this.slowMoTimer<=0) this.slowMoSpeed=1; }
        // Flash
        if (this.flashTimer > 0) this.flashTimer--;
        // Combo
        if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer <= 0) this.comboMultiplier = 1; }
        // Milestones
        let ms = Math.floor(this.score / 500) * 500;
        if (ms > this.lastMilestone && ms > 0) {
            this.lastMilestone = ms; this.ui.showMilestone(ms); this.audio.playMilestone();
        }
        // Player
        this.player.update();
        // Som de pouso
        if (this.player.landed) this.audio.playLand();
        // Partículas de poeira nos pés
        if (this.player.onGround && !this.player.ducking && Math.random() > 0.7) {
            this._addParticles(this.player.x, this.player.y, 1, '#a08060');
        }
        // Background
        this.bg.update(this.speed * this.slowMoSpeed, this.score);
        // Obstáculos - spawn
        this.spawnTimer -= (this.dashTimer > 0 ? 3 : 1);
        if (this.spawnTimer <= 0) {
            this._spawnObstacle();
            let range = this.spawnMax - this.spawnMin;
            let diff = Math.max(0.4, 1 - this.score * 0.0003);
            this.spawnTimer = this.spawnMin + Math.random() * range * diff;
        }
        // Obstáculos - update e colisão
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.speed = this.speed * (obs.type === 'onca' ? 1.6 : 1);
            obs.update();
            if (!obs.active) {
                this.obstacles.splice(i, 1);
                this.comboCount++;
                // Texto flutuante ao desviar
                let pts = obs.type==='onca'?'+100':obs.type==='arara'?'+50':'+25';
                let ptColor = obs.type==='onca'?'#ff6b6b':'#ffd700';
                this.ui.addFloatingText(obs.x, obs.y-10, pts, ptColor);
                if (obs.type==='onca') { this.flashTimer=8; this.flashColor='rgba(255,255,200,0.3)'; this.stats.oncasAvoided++; }
                this.stats.obstaclesAvoided++;
                // Tutorial
                this.tutorialObstaclesShown++;
                if (this.tutorialObstaclesShown >= 3) this.ui.finishTutorial();
                if (this.comboCount >= 10) {
                    this.comboMultiplier = 1.5; this.comboTimer = 300; this.comboCount = 0;
                    this.ui.triggerStreak();
                }
                continue;
            }
            if (obs.alertTimer <= 0 && this._checkCollision(this.player.hitbox, obs.hitbox)) {
                if (this.invincible) {
                    // Invencível: destrói obstáculo
                    obs.active = false;
                    this._addParticles(obs.x+obs.width/2, obs.y, 10, '#ffd700');
                    this.ui.addFloatingText(obs.x, obs.y-20, 'DESTRUÍDO!', '#ffd700');
                    continue;
                }
                this._addParticles(this.player.x, this.player.y - 30, 15, '#ff4444');
                this._gameOver(); return;
            }
        }
        // Power-ups - spawn
        this.powerUpSpawnTimer--;
        if (this.powerUpSpawnTimer <= 0 && Math.floor(this.score) % 200 < 5) {
            let type = Math.random() < 0.5 ? 'banana' : 'coco';
            let groundY = this.canvas.height * 0.82;
            this.powerups.push({ type, x: this.canvas.width+20, y: groundY-40-Math.random()*50, w:28, h:28, active:true });
            this.powerUpSpawnTimer = 300 + Math.random()*200;
        }

        // Apple (Dash collectible) - spawn
        this.appleSpawnTimer -= (this.dashTimer > 0 ? 3 : 1);
        if (this.appleSpawnTimer <= 0) {
            let groundY = this.canvas.height * 0.82;
            this.powerups.push({ type: 'maca', x: this.canvas.width+20, y: groundY-40-Math.random()*50, w:28, h:28, active:true });
            this.appleSpawnTimer = 180 + Math.random()*120;
        }
        // Power-ups - update e coleta
        for (let i=this.powerups.length-1; i>=0; i--) {
            let pu = this.powerups[i];
            pu.x -= this.speed;
            if (pu.x < -40) { this.powerups.splice(i,1); continue; }
            let ph = this.player.hitbox;
            if (ph.x < pu.x+pu.w && ph.x+ph.w > pu.x && ph.y < pu.y+pu.h && ph.y+ph.h > pu.y) {
                this.powerups.splice(i,1);
                if (pu.type === 'maca') {
                    if (this.dashTimer <= 0) {
                        this.dashItemCount++;
                        if (this.dashItemCount >= 5) {
                            this.dashItemCount = 0;
                            this.dashTimer = 120; // 2 segundos de dash
                            this.audio.playJump(); // Feedback extra
                        }
                    }
                    this._addParticles(pu.x, pu.y, 8, '#ff3333');
                    this.audio.playMilestone();
                    this.ui.addFloatingText(pu.x, pu.y-20, '+1 Maçã', '#ff3333');
                    continue;
                }
                this.activePowerUp = pu.type;
                this.powerUpTimer = pu.type==='banana'? 180 : 120; // 3s ou 2s
                this.invincible = pu.type==='banana';
                if (pu.type==='coco') { this.slowMoTimer=120; this.slowMoSpeed=0.5; }
                this.stats.powerUpsCollected++;
                this._addParticles(pu.x, pu.y, 8, pu.type==='banana'?'#ffe135':'#8B4513');
                this.audio.playMilestone();
                this.ui.addFloatingText(pu.x, pu.y-20, pu.type==='banana'?'⭐ Invencível!':'⏱ Slow-Mo!', '#fff');
            }
        }
        // Power-up ativo - countdown
        if (this.activePowerUp) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                if (this.activePowerUp==='banana') this.invincible = false;
                if (this.activePowerUp==='coco') this.slowMoSpeed = 1;
                this.activePowerUp = null;
            }
        }
        // Achievements check
        this._checkAchievements();
        // Partículas
        this._updateParticles();
        // UI
        this.ui.update();
    }
    _draw() {
        let ctx = this.ctx;
        ctx.save();
        ctx.translate(this.ui.shakeX, this.ui.shakeY);
        if (this.state === 'start') {
            this.ui.drawStartScreen(ctx, this.highScore, 0, this.bg);
            if (this.showMonkey) this._drawMonkey(ctx);
            // Mute icon na start screen
            ctx.font='18px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.7)';
            ctx.fillText(this.muted?'🔇':'🔊', 12, 25);
            this._drawFade(ctx);
            ctx.restore(); return;
        }
        // Fundo
        this.bg.draw(ctx, this.isNight);
        // Obstáculos
        for (let obs of this.obstacles) obs.draw(ctx);
        // Power-ups
        this._drawPowerUps(ctx);
        // Player (brilho dourado se invencível)
        if (this.invincible) {
            ctx.save(); ctx.shadowColor='#ffd700'; ctx.shadowBlur=20;
            this.player.draw(ctx); ctx.restore();
        } else {
            this.player.draw(ctx);
        }
        // Partículas
        this._drawParticles(ctx);
        // Textos flutuantes
        this.ui.drawFloatingTexts(ctx);
        // Tutorial
        if (this.ui.showTutorial && this.obstacles.length>0){
            let obs=this.obstacles[0];
            this.ui.drawTutorial(ctx,obs.type,this.player.x,this.player.groundY);
        }
        // HUD
        this.ui.drawHUD(ctx, this.score, this.highScore, this.speed, this.maxSpeed);
        // Mute icon
        ctx.font='18px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.7)';
        ctx.fillText(this.muted?'🔇':'🔊', 42, 38);
        
        // Dash collectible mini-bar
        let dashBarX = this.canvas.width/2 - 50;
        ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(dashBarX, 20, 100, 12);
        if (this.dashTimer > 0) {
            ctx.fillStyle='#ffea00'; 
            ctx.fillRect(dashBarX, 20, 100 * (this.dashTimer / 120), 12);
        } else {
            ctx.fillStyle='#ff3333'; 
            ctx.fillRect(dashBarX, 20, 100 * (this.dashItemCount / 5), 12);
        }
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.strokeRect(dashBarX, 20, 100, 12);
        ctx.font='12px sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center';
        ctx.fillText(this.dashTimer > 0 ? '🚀 DASH!' : '🍎 ' + this.dashItemCount + '/5', dashBarX + 50, 31);
        ctx.textAlign='left';

        // Power-up ativo indicator
        if (this.activePowerUp) {
            let pct = this.powerUpTimer / (this.activePowerUp==='banana'?180:120);
            let ico = this.activePowerUp==='banana'?'🍌':'🥥';
            let blink = this.powerUpTimer<40 && Math.sin(Date.now()*0.02)>0;
            if (!blink || this.powerUpTimer>=40) {
                ctx.font='22px sans-serif'; ctx.fillText(ico, 12, 65);
                ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(38, 55, 50, 6);
                ctx.fillStyle=this.activePowerUp==='banana'?'#ffd700':'#4fc3f7';
                ctx.fillRect(38, 55, 50*pct, 6);
            }
        }
        // Distância
        ctx.font='12px "Courier New"';ctx.fillStyle='#8f8';
        ctx.fillText(Math.floor(this.score*0.5)+'m', this.canvas.width-149, 64);
        this.ui.drawMilestone(ctx);
        // Streak
        this.ui.drawStreak(ctx);
        // Flash
        if (this.flashTimer>0){ctx.save();ctx.globalAlpha=this.flashTimer/8;
        ctx.fillStyle=this.flashColor;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.restore();}
        // Combo indicator
        if (this.comboMultiplier > 1) {
            ctx.font = 'bold 14px "Courier New"'; ctx.fillStyle = '#ff0';
            ctx.fillText('COMBO x1.5!', this.canvas.width/2 - 40, 28);
        }
        // Overlays de estado
        if (this.state === 'paused') this.ui.drawPauseScreen(ctx);
        if (this.state === 'gameover') this.ui.drawGameOver(ctx, this.score, this.highScore, this.isNewRecord);
        // Achievement popup
        if (this.achievementPopupTimer > 0) {
            this.achievementPopupTimer--;
            let a = Math.min(1, this.achievementPopupTimer/10);
            ctx.save(); ctx.globalAlpha=a;
            ctx.fillStyle='rgba(20,40,20,0.9)'; ctx.beginPath();
            ctx.roundRect(this.canvas.width/2-140, 70, 280, 40, 10); ctx.fill();
            ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.5; ctx.beginPath();
            ctx.roundRect(this.canvas.width/2-140, 70, 280, 40, 10); ctx.stroke();
            ctx.font='13px "Courier New"'; ctx.fillStyle='#ffd700'; ctx.textAlign='center';
            ctx.fillText('🏆 '+this.achievementPopup, this.canvas.width/2, 95);
            ctx.textAlign='left'; ctx.restore();
        }
        this._drawFade(ctx);
        ctx.restore();
    }
    _drawMonkey(ctx) {
        let x = this.canvas.width * 0.6, y = this.canvas.height * 0.55;
        let bounce = Math.sin(Date.now() * 0.005) * 5;
        // Corpo
        ctx.fillStyle = '#8B4513'; ctx.beginPath();
        ctx.ellipse(x, y + bounce, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
        // Rosto
        ctx.fillStyle = '#DEB887'; ctx.beginPath();
        ctx.ellipse(x, y - 20 + bounce, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
        // Olhos
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x - 5, y - 22 + bounce, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, y - 22 + bounce, 3, 0, Math.PI * 2); ctx.fill();
        // Boca (careta)
        ctx.beginPath(); ctx.arc(x, y - 14 + bounce, 6, 0, Math.PI); ctx.fill();
        // Língua
        ctx.fillStyle = '#ff6b6b'; ctx.beginPath();
        ctx.ellipse(x, y - 10 + bounce, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        // Texto
        ctx.font = '11px "Courier New"'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
        ctx.fillText('🐒 Oi! Vamos jogar?', x, y + 35 + bounce);
        ctx.textAlign = 'left';
    }
    // ──── Power-ups desenho ────
    _drawPowerUps(ctx) {
        let t = Date.now()*0.005;
        for (let pu of this.powerups) {
            let bounce = Math.sin(t+pu.x*0.1)*4;
            ctx.save(); ctx.translate(pu.x+14, pu.y+14+bounce);
            // Glow
            ctx.shadowColor = pu.type==='banana'?'#ffe135':(pu.type==='coco'?'#8B6914':'#ff3333');
            ctx.shadowBlur = 10+Math.sin(t)*5;
            ctx.font = '24px sans-serif';
            ctx.fillText(pu.type==='banana'?'🍌':(pu.type==='coco'?'🥥':'🍎'), -12, 8);
            ctx.restore();
        }
    }
    // ──── Fade system ────
    _drawFade(ctx) {
        if (this.fadeDir === -1 && this.fadeAlpha > 0) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - 0.03);
        } else if (this.fadeDir === 1 && this.fadeAlpha < 1) {
            this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.04);
            if (this.fadeAlpha >= 1 && this.fadeCallback) { this.fadeCallback(); this.fadeCallback=null; this.fadeDir=-1; }
        }
        if (this.fadeAlpha > 0) {
            ctx.save(); ctx.globalAlpha = this.fadeAlpha;
            ctx.fillStyle = '#000'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
            ctx.restore();
        }
    }
    // ──── Stats ────
    _saveStats() { localStorage.setItem('fugaStats', JSON.stringify(this.stats)); }
    // ──── Achievements ────
    _unlockAchievement(id, name) {
        if (this.achievements.includes(id)) return;
        this.achievements.push(id);
        localStorage.setItem('fugaAchievements', JSON.stringify(this.achievements));
        this.achievementPopup = name;
        this.achievementPopupTimer = 120;
        this.audio.playMilestone();
    }
    _checkAchievements() {
        let s = this.score, st = this.stats;
        if (s >= 100) this._unlockAchievement('primeiros_passos', 'Primeiros Passos — 100 pts!');
        if (s >= 500) this._unlockAchievement('explorador', 'Explorador — 500 pts!');
        if (s >= 1000) this._unlockAchievement('aventureiro', 'Aventureiro — 1000 pts!');
        if (s >= 2500) this._unlockAchievement('veterano', 'Veterano — 2500 pts!');
        if (s >= 5000) this._unlockAchievement('lendario', 'Lendário — 5000 pts!');
        if (st.totalGames >= 10) this._unlockAchievement('persistente', 'Persistente — 10 partidas!');
        if (st.oncasAvoided >= 1) this._unlockAchievement('esquiva_felina', 'Esquiva Felina — Desviou da onça!');
        if (st.oncasAvoided >= 5) this._unlockAchievement('domador', 'Domador — 5 onças desviadas!');
        if (st.powerUpsCollected >= 1) this._unlockAchievement('coletor', 'Coletor — Pegou um power-up!');
        if (this.comboCount >= 10) this._unlockAchievement('combo_master', 'Combo Master — 10 seguidos!');
    }
    _loop(time) {
        let dt = time - this.lastTime; this.lastTime = time;
        if (dt > 100) dt = 100;
        this.accumulator += dt;
        while (this.accumulator >= this.STEP) { this._update(); this.accumulator -= this.STEP; }
        this._draw();
        requestAnimationFrame((t) => this._loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });
