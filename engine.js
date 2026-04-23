// ═══════════════════════════════════════════════════════
// FUGA NA FLORESTA - Engine (Background, Audio, UI)
// ═══════════════════════════════════════════════════════

// ──── CLASSE BACKGROUND (Parallax em 5 camadas) ────
class Background {
    constructor(canvas) {
        this.w = canvas.width;
        this.h = canvas.height;
        this.groundY = this.h * 0.82;
        this.offsets = [0, 0, 0, 0, 0];
        this.trees = this._generateTrees(12);
        this.bushes = this._generateBushes(10);
        this.clouds = this._generateClouds(6);
        this.mountains = this._generateMountains();
        this.groundDetails = this._generateGroundDetails(30);
        this.leaves = this._generateLeaves(25);
        this.fireflies = this._generateFireflies(20);
        this.vines = this._generateVines(8);
        this.butterflies = this._generateButterflies(3);
        this.nightProgress = 0;
    }
    _generateClouds(n) {
        let c = [];
        for (let i = 0; i < n; i++) c.push({ x: Math.random() * this.w * 2, y: 20 + Math.random() * 60, w: 60 + Math.random() * 80, h: 20 + Math.random() * 20 });
        return c;
    }
    _generateMountains() {
        let m = [];
        for (let i = 0; i < 6; i++) m.push({ x: i * (this.w / 3), w: 200 + Math.random() * 150, h: 80 + Math.random() * 60 });
        return m;
    }
    _generateTrees(n) {
        let t = [];
        for (let i = 0; i < n; i++) t.push({ x: i * (this.w / 5) + Math.random() * 80, h: 100 + Math.random() * 80, w: 30 + Math.random() * 20, type: Math.floor(Math.random() * 3) });
        return t;
    }
    _generateBushes(n) {
        let b = [];
        for (let i = 0; i < n; i++) b.push({ x: i * (this.w / 4) + Math.random() * 100, w: 40 + Math.random() * 40, h: 25 + Math.random() * 20 });
        return b;
    }
    _generateGroundDetails(n) {
        let d = [];
        for (let i = 0; i < n; i++) d.push({ x: Math.random() * this.w * 2, type: Math.floor(Math.random() * 3), size: 3 + Math.random() * 6 });
        return d;
    }
    _generateLeaves(n) {
        let l = [];
        for (let i = 0; i < n; i++) l.push({ x: Math.random()*this.w, y: -20-Math.random()*100, vy: 0.3+Math.random()*0.5, vx: Math.sin(i)*0.5, rot: Math.random()*Math.PI*2, rotSpd: (Math.random()-0.5)*0.03, size: 4+Math.random()*6, color: ['#228B22','#32CD32','#6B8E23','#8B4513','#DAA520'][Math.floor(Math.random()*5)] });
        return l;
    }
    _generateFireflies(n) {
        let f = [];
        for (let i = 0; i < n; i++) f.push({ x: Math.random()*this.w, y: 50+Math.random()*(this.groundY-100), phase: Math.random()*Math.PI*2, speed: 0.3+Math.random()*0.5, radius: 30+Math.random()*50 });
        return f;
    }
    _generateVines(n) {
        let v = [];
        for (let i = 0; i < n; i++) v.push({ x: i*(this.w/4)+Math.random()*100, len: 40+Math.random()*60, sway: Math.random()*Math.PI*2 });
        return v;
    }
    _generateButterflies(n) {
        let b = [];
        for (let i = 0; i < n; i++) b.push({ x: 100+Math.random()*(this.w-200), y: 60+Math.random()*100, phase: Math.random()*Math.PI*2, color: ['#ff6b9d','#ffd93d','#74b9ff'][i%3], baseX: 100+Math.random()*(this.w-200), baseY: 60+Math.random()*100 });
        return b;
    }
    update(speed, score) {
        const rates = [0.1, 0.3, 0.5, 0.8, 1.0];
        for (let i = 0; i < 5; i++) this.offsets[i] = (this.offsets[i] + speed * rates[i]) % (this.w * 2);
        // Transição dia→noite gradual
        this.nightProgress = Math.min(1, (score || 0) / 5000);
        // Folhas caindo
        for (let l of this.leaves) {
            l.y += l.vy; l.x += l.vx + Math.sin(Date.now()*0.001+l.rot)*0.3; l.rot += l.rotSpd;
            if (l.y > this.groundY) { l.y = -10; l.x = Math.random()*this.w; }
        }
        // Borboletas
        let t = Date.now()*0.001;
        for (let b of this.butterflies) {
            b.x = b.baseX + Math.sin(t+b.phase)*60 - this.offsets[1]*0.2;
            b.y = b.baseY + Math.cos(t*0.7+b.phase)*20;
            if (b.x < -30) b.x += this.w+60;
        }
    }
    draw(ctx, isNight) {
        let np = isNight ? 1 : this.nightProgress;
        this._drawSky(ctx, np);
        this._drawClouds(ctx);
        this._drawMountains(ctx);
        this._drawVines(ctx);
        this._drawTreesBack(ctx);
        this._drawButterflies(ctx);
        this._drawBushesLayer(ctx);
        this._drawGround(ctx);
        this._drawLeaves(ctx);
        this._drawFog(ctx);
        if (np > 0.15) this._drawFireflies(ctx, np);
    }
    // Interpola entre duas cores hex conforme t (0=cor1, 1=cor2)
    _lerpColor(c1, c2, t) {
        let r1=parseInt(c1.slice(1,3),16),g1=parseInt(c1.slice(3,5),16),b1=parseInt(c1.slice(5,7),16);
        let r2=parseInt(c2.slice(1,3),16),g2=parseInt(c2.slice(3,5),16),b2=parseInt(c2.slice(5,7),16);
        let r=Math.round(r1+(r2-r1)*t),g=Math.round(g1+(g2-g1)*t),b=Math.round(b1+(b2-b1)*t);
        return `rgb(${r},${g},${b})`;
    }
    _drawSky(ctx, np) {
        let g = ctx.createLinearGradient(0, 0, 0, this.groundY);
        // Interpola cores: dia → entardecer → noite
        let topDay='#87CEEB',topSunset='#e8703a',topNight='#0a0e2a';
        let midDay='#a8dff0',midSunset='#c06040',midNight='#1a1a4a';
        let botDay='#c8f0c8',botSunset='#5a5030',botNight='#2a3a2a';
        let top,mid,bot;
        if(np<0.5){let t=np*2;top=this._lerpColor(topDay,topSunset,t);mid=this._lerpColor(midDay,midSunset,t);bot=this._lerpColor(botDay,botSunset,t);}
        else{let t=(np-0.5)*2;top=this._lerpColor(topSunset,topNight,t);mid=this._lerpColor(midSunset,midNight,t);bot=this._lerpColor(botSunset,botNight,t);}
        g.addColorStop(0,top);g.addColorStop(0.5,mid);g.addColorStop(1,bot);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.groundY);
        // Estrelas aparecem gradualmente
        if (np > 0.3) {
            let starAlpha = (np-0.3)/0.7;
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = `rgba(255,255,200,${starAlpha*(0.3+Math.random()*0.7)})`;
                ctx.fillRect(Math.random()*this.w, Math.random()*this.groundY*0.6, 1.5, 1.5);
            }
        }
    }
    _drawClouds(ctx) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let c of this.clouds) {
            let x = ((c.x - this.offsets[0]) % (this.w * 2) + this.w * 2) % (this.w * 2) - this.w * 0.5;
            ctx.beginPath(); ctx.ellipse(x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x - c.w * 0.25, c.y - 5, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + c.w * 0.25, c.y - 3, c.w * 0.35, c.h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        }
    }
    _drawMountains(ctx) {
        for (let m of this.mountains) {
            let x = ((m.x - this.offsets[1]) % (this.w * 2) + this.w * 2) % (this.w * 2) - this.w * 0.3;
            ctx.fillStyle = '#5a7a6a';
            ctx.beginPath(); ctx.moveTo(x, this.groundY); ctx.lineTo(x + m.w / 2, this.groundY - m.h); ctx.lineTo(x + m.w, this.groundY); ctx.fill();
            ctx.fillStyle = '#6a8a7a';
            ctx.beginPath(); ctx.moveTo(x + m.w / 2, this.groundY - m.h); ctx.lineTo(x + m.w * 0.55, this.groundY - m.h + 15); ctx.lineTo(x + m.w * 0.65, this.groundY); ctx.lineTo(x + m.w, this.groundY); ctx.fill();
        }
    }
    _drawTreesBack(ctx) {
        for (let t of this.trees) {
            let x = ((t.x - this.offsets[2]) % (this.w * 2) + this.w * 2) % (this.w * 2) - this.w * 0.3;
            // Tronco
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(x - t.w / 6, this.groundY - t.h * 0.5, t.w / 3, t.h * 0.5);
            // Copa
            let colors = ['#1a6a1a', '#228B22', '#2a8a2a'];
            ctx.fillStyle = colors[t.type];
            if (t.type === 0) { // Árvore redonda
                ctx.beginPath(); ctx.ellipse(x, this.groundY - t.h * 0.65, t.w * 0.7, t.h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            } else if (t.type === 1) { // Palmeira
                for (let a = 0; a < 5; a++) {
                    let angle = -Math.PI / 2 + (a - 2) * 0.5;
                    ctx.save(); ctx.translate(x, this.groundY - t.h * 0.5);
                    ctx.rotate(angle); ctx.fillStyle = '#2a8a2a';
                    ctx.beginPath(); ctx.ellipse(0, -t.h * 0.3, 8, t.h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            } else { // Pinheiro
                for (let j = 0; j < 3; j++) {
                    let y2 = this.groundY - t.h * 0.3 - j * t.h * 0.2;
                    let w2 = t.w * (1 - j * 0.25);
                    ctx.beginPath(); ctx.moveTo(x, y2 - t.h * 0.2); ctx.lineTo(x - w2, y2); ctx.lineTo(x + w2, y2); ctx.fill();
                }
            }
        }
    }
    _drawBushesLayer(ctx) {
        for (let b of this.bushes) {
            let x = ((b.x - this.offsets[3]) % (this.w * 2) + this.w * 2) % (this.w * 2) - this.w * 0.3;
            ctx.fillStyle = '#2d7a2d';
            ctx.beginPath(); ctx.ellipse(x, this.groundY - 5, b.w / 2, b.h / 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3a9a3a';
            ctx.beginPath(); ctx.ellipse(x - b.w * 0.2, this.groundY - 8, b.w * 0.3, b.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            // Flores pequenas
            if (Math.random() > 0.97) {
                ctx.fillStyle = ['#ff6b6b', '#ffd93d', '#ff9ff3'][Math.floor(Math.random() * 3)];
                ctx.beginPath(); ctx.arc(x + Math.random() * 20 - 10, this.groundY - 10 - Math.random() * 15, 3, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    _drawGround(ctx) {
        let gy = this.groundY;
        // Terra principal
        let g = ctx.createLinearGradient(0, gy, 0, this.h);
        g.addColorStop(0, '#4a7a2a'); g.addColorStop(0.15, '#6B4226'); g.addColorStop(0.5, '#8B4513'); g.addColorStop(1, '#5a3010');
        ctx.fillStyle = g; ctx.fillRect(0, gy, this.w, this.h - gy);
        // Grama no topo
        ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 2;
        for (let i = 0; i < this.w; i += 6) {
            let ox = (i + this.offsets[4] * 0.5) % this.w;
            let h = 4 + Math.sin(i * 0.3) * 3;
            ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + 2, gy - h); ctx.stroke();
        }
        // Detalhes
        for (let d of this.groundDetails) {
            let x = ((d.x - this.offsets[4]) % (this.w * 2) + this.w * 2) % (this.w * 2) - 20;
            if (d.type === 0) { ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(x, gy + 10, d.size, d.size * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
            else if (d.type === 1) { ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, gy + 5); ctx.quadraticCurveTo(x + 5, gy + 3, x + 10, gy + 8); ctx.stroke(); }
        }
    }
    _drawLeaves(ctx) {
        for (let l of this.leaves) {
            ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot);
            ctx.fillStyle = l.color;
            ctx.beginPath(); ctx.ellipse(0,0,l.size,l.size*0.4,0,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
            ctx.beginPath(); ctx.moveTo(-l.size,0); ctx.lineTo(l.size,0); ctx.stroke();
            ctx.restore();
        }
    }
    _drawFireflies(ctx, np) {
        let t = Date.now()*0.003;
        let ffAlpha = Math.min(1, (np-0.15)/0.4); // Aparecem gradualmente
        for (let f of this.fireflies) {
            let glow = (Math.sin(t+f.phase)+1)/2;
            let fx = f.x+Math.sin(t*f.speed+f.phase)*f.radius;
            let fy = f.y+Math.cos(t*f.speed*0.7+f.phase)*20;
            ctx.save(); ctx.globalAlpha = ffAlpha*(0.3+glow*0.7);
            let rg = ctx.createRadialGradient(fx,fy,0,fx,fy,8+glow*6);
            rg.addColorStop(0,'rgba(255,255,100,0.8)'); rg.addColorStop(1,'rgba(255,255,100,0)');
            ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(fx,fy,8+glow*6,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#ffa'; ctx.beginPath(); ctx.arc(fx,fy,1.5,0,Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }
    _drawVines(ctx) {
        for (let v of this.vines) {
            let vx = ((v.x - this.offsets[2]) % (this.w*2) + this.w*2) % (this.w*2) - this.w*0.3;
            let sway = Math.sin(Date.now()*0.001+v.sway)*8;
            ctx.strokeStyle='#2d5a1a'; ctx.lineWidth=3; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(vx,0);
            ctx.quadraticCurveTo(vx+sway,v.len*0.5,vx+sway*0.5,v.len); ctx.stroke();
            ctx.strokeStyle='#3a7a2a'; ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.moveTo(vx,0);
            ctx.quadraticCurveTo(vx+sway,v.len*0.5,vx+sway*0.5,v.len); ctx.stroke();
            // Folhinha na ponta
            ctx.fillStyle='#32CD32';
            ctx.beginPath(); ctx.ellipse(vx+sway*0.5,v.len,5,3,sway*0.05,0,Math.PI*2); ctx.fill();
        }
    }
    _drawButterflies(ctx) {
        let t=Date.now()*0.008;
        for (let b of this.butterflies) {
            let wingAng=Math.sin(t+b.phase)*0.6;
            ctx.save(); ctx.translate(b.x,b.y);
            // Asa esquerda
            ctx.fillStyle=b.color; ctx.globalAlpha=0.7;
            ctx.beginPath(); ctx.ellipse(-5*Math.cos(wingAng),-2,7,4,wingAng,0,Math.PI*2); ctx.fill();
            // Asa direita
            ctx.beginPath(); ctx.ellipse(5*Math.cos(wingAng),-2,7,4,-wingAng,0,Math.PI*2); ctx.fill();
            // Corpo
            ctx.globalAlpha=1; ctx.fillStyle='#333';
            ctx.fillRect(-1,-4,2,8);
            ctx.restore();
        }
    }
    _drawFog(ctx) {
        ctx.save(); ctx.globalAlpha=0.06;
        let t=Date.now()*0.0003;
        for (let i=0;i<3;i++) {
            let fx=(Math.sin(t+i*2)*this.w*0.3)+this.w*0.5;
            let rg=ctx.createRadialGradient(fx,this.groundY-40,0,fx,this.groundY-40,150);
            rg.addColorStop(0,'rgba(255,255,255,0.8)'); rg.addColorStop(1,'rgba(255,255,255,0)');
            ctx.fillStyle=rg; ctx.fillRect(fx-150,this.groundY-120,300,160);
        }
        ctx.restore();
    }
}

// ──── CLASSE AUDIO MANAGER (Sons procedurais) ────
class AudioManager {
    constructor() {
        this.ctx = null; this.enabled = false; this.masterGain = null;
        this.bgmInterval = null; this.ambienceInterval = null;
        this.bgmGain = null; this.ambienceGain = null;
        this.stepsInterval = null; this.stepsGain = null;
    }
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            this.enabled = true;
        } catch (e) { this.enabled = false; }
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    _playTone(freq, dur, type = 'sine', vol = 0.15, attack = 0.01, decay = 0.1) {
        if (!this.enabled) return;
        let o = this.ctx.createOscillator();
        let g = this.ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attack);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur - decay);
        o.connect(g); g.connect(this.masterGain);
        o.start(this.ctx.currentTime); o.stop(this.ctx.currentTime + dur);
    }
    playJump() {
        if (!this.enabled) return;
        let o = this.ctx.createOscillator();
        let g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(300, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.12, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        o.connect(g); g.connect(this.masterGain);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
    }
    playLand() { this._playTone(100, 0.1, 'triangle', 0.08, 0.005, 0.05); }
    playHit() {
        if (!this.enabled) return;
        // Som de impacto
        let o = this.ctx.createOscillator(); let g = this.ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = 150;
        o.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        o.connect(g); g.connect(this.masterGain);
        o.start(); o.stop(this.ctx.currentTime + 0.4);
        // Noise burst
        let buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        let data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        let noise = this.ctx.createBufferSource(); noise.buffer = buf;
        let ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.15, this.ctx.currentTime);
        ng.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        noise.connect(ng); ng.connect(this.masterGain);
        noise.start(); noise.stop(this.ctx.currentTime + 0.2);
    }
    playMilestone() {
        if (!this.enabled) return;
        [523, 659, 784].forEach((f, i) => {
            setTimeout(() => this._playTone(f, 0.15, 'sine', 0.15), i * 80);
        });
    }
    playAlert() {
        if (!this.enabled) return;
        for (let i = 0; i < 3; i++) setTimeout(() => this._playTone(880, 0.08, 'square', 0.1), i * 100);
    }
    startSteps(speed) {
        this.stopSteps();
        if (!this.enabled) return;
        let interval = Math.max(150, 400 - speed * 20);
        this.stepsInterval = setInterval(() => {
            this._playTone(60 + Math.random() * 20, 0.05, 'triangle', 0.04, 0.005, 0.02);
        }, interval);
    }
    stopSteps() { if (this.stepsInterval) { clearInterval(this.stepsInterval); this.stepsInterval = null; } }
    startAmbience() {
        if (!this.enabled || this.ambienceInterval) return;
        this.ambienceInterval = setInterval(() => {
            if (Math.random() > 0.5) this._playTone(2000 + Math.random() * 2000, 0.3, 'sine', 0.02);
            else this._playTone(200 + Math.random() * 100, 0.5, 'sine', 0.015);
        }, 2000);
    }
    stopAmbience() { if (this.ambienceInterval) { clearInterval(this.ambienceInterval); this.ambienceInterval = null; } }
    startBGM(bpm = 100) {
        this.stopBGM();
        if (!this.enabled) return;
        let interval = 60000 / bpm / 2;
        let beat = 0;
        const notes = [196, 220, 262, 220, 196, 165, 196, 220];
        this.bgmInterval = setInterval(() => {
            let note = notes[beat % notes.length];
            this._playTone(note, interval / 1000 * 0.8, 'triangle', 0.04);
            if (beat % 2 === 0) this._playTone(note / 2, interval / 1000 * 0.5, 'sine', 0.03);
            beat++;
        }, interval);
    }
    stopBGM() { if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; } }
    stopAll() { this.stopSteps(); this.stopAmbience(); this.stopBGM(); }
}

// ──── CLASSE UI (Textos, menus, HUD) ────
class UI {
    constructor(canvas) {
        this.w = canvas.width;
        this.h = canvas.height;
        this.milestoneText = null;
        this.milestoneTimer = 0;
        this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;
        this.floatingTexts = [];
        this.streakTimer = 0;
        this.gameOverAnim = 0;
        this.tutorialStep = 0;
        this.showTutorial = !localStorage.getItem('fugaTutorialDone');
        this.titleGlow = 0;
    }
    showMilestone(pts) { this.milestoneText = pts + '!'; this.milestoneTimer = 60; }
    triggerShake() { this.shakeTimer = 12; }
    addFloatingText(x,y,text,color='#ffd700'){this.floatingTexts.push({x,y,text,color,life:60,maxLife:60});}
    triggerStreak(){this.streakTimer=40;}
    finishTutorial(){this.showTutorial=false;localStorage.setItem('fugaTutorialDone','1');}
    update() {
        if (this.milestoneTimer > 0) this.milestoneTimer--;
        if (this.shakeTimer > 0) {
            this.shakeX = (Math.random() - 0.5) * 6;
            this.shakeY = (Math.random() - 0.5) * 6;
            this.shakeTimer--;
        } else { this.shakeX = 0; this.shakeY = 0; }
        if (this.streakTimer > 0) this.streakTimer--;
        if (this.gameOverAnim < 1) this.gameOverAnim = Math.min(1, this.gameOverAnim + 0.04);
        this.titleGlow = (Math.sin(Date.now()*0.003)+1)/2;
        for(let i=this.floatingTexts.length-1;i>=0;i--){this.floatingTexts[i].y-=1;this.floatingTexts[i].life--;if(this.floatingTexts[i].life<=0)this.floatingTexts.splice(i,1);}
    }
    drawHUD(ctx, score, highScore, speed, maxSpeed) {
        // Pontuação
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillStyle = '#000'; ctx.fillText(Math.floor(score) + '', this.w - 147, 32);
        ctx.fillStyle = '#fff'; ctx.fillText(Math.floor(score) + '', this.w - 149, 30);
        // High Score
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#ffd700'; ctx.fillText('HI ' + Math.floor(highScore), this.w - 149, 48);
        // Barra de velocidade
        let pct = Math.min((speed - 6) / (maxSpeed - 6), 1);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(10, 8, 100, 6);
        let gb = ctx.createLinearGradient(10, 0, 110, 0);
        gb.addColorStop(0, '#4CAF50'); gb.addColorStop(1, '#f44336');
        ctx.fillStyle = gb; ctx.fillRect(10, 8, 100 * pct, 6);
        // Ícone pausa
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '22px sans-serif'; ctx.fillText('⏸', 12, 38);
    }
    drawFloatingTexts(ctx){
        for(let ft of this.floatingTexts){
            ctx.save();ctx.globalAlpha=ft.life/ft.maxLife;
            ctx.font='bold 14px "Courier New"';ctx.fillStyle=ft.color;ctx.textAlign='center';
            ctx.fillText(ft.text,ft.x,ft.y);ctx.textAlign='left';ctx.restore();
        }
    }
    drawStreak(ctx){
        if(this.streakTimer<=0)return;
        let a=this.streakTimer/40;
        ctx.save();ctx.globalAlpha=a*0.4;
        ctx.strokeStyle='#ffd700';ctx.lineWidth=4;
        ctx.shadowColor='#ffd700';ctx.shadowBlur=20;
        ctx.strokeRect(3,3,this.w-6,this.h-6);
        ctx.restore();
    }
    drawTutorial(ctx,obstacleType,playerX,groundY){
        if(!this.showTutorial)return;
        ctx.save();ctx.globalAlpha=0.6+Math.sin(Date.now()*0.005)*0.4;
        ctx.font='bold 18px "Courier New"';ctx.textAlign='center';
        if(obstacleType==='javali'||obstacleType==='cobra'){
            ctx.fillStyle='#4fc3f7';
            ctx.fillText('↑ PULE!',playerX,groundY-90);
            ctx.font='28px sans-serif';ctx.fillText('⬆',playerX,groundY-100);
        } else if(obstacleType==='arara'){
            ctx.fillStyle='#ffb74d';
            ctx.fillText('↓ AGACHE!',playerX,groundY-90);
            ctx.font='28px sans-serif';ctx.fillText('⬇',playerX,groundY-100);
        }
        ctx.textAlign='left';ctx.restore();
    }
    drawMilestone(ctx) {
        if (this.milestoneTimer <= 0) return;
        let alpha = this.milestoneTimer / 60;
        let scale = 1.5 - (this.milestoneTimer / 60) * 0.5;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = `bold ${32 * scale}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(this.milestoneText, this.w / 2, this.h / 2 - 40);
        ctx.textAlign = 'left'; ctx.restore();
    }
    drawStartScreen(ctx, highScore, explorerFrame, bg) {
        bg.draw(ctx, false);
        // Overlay com gradiente
        let og=ctx.createLinearGradient(0,0,0,this.h);
        og.addColorStop(0,'rgba(0,30,0,0.55)');og.addColorStop(0.5,'rgba(0,20,0,0.35)');og.addColorStop(1,'rgba(0,30,0,0.6)');
        ctx.fillStyle=og;ctx.fillRect(0,0,this.w,this.h);
        // Título com glow pulsante
        ctx.textAlign = 'center';
        ctx.save();
        ctx.shadowColor='#ffd700';ctx.shadowBlur=15+this.titleGlow*20;
        ctx.font = 'bold 44px "Courier New", monospace';
        ctx.fillStyle = '#000'; ctx.fillText('FUGA NA FLORESTA', this.w/2+2, this.h*0.28+2);
        ctx.fillStyle = '#ffd700'; ctx.fillText('FUGA NA FLORESTA', this.w/2, this.h*0.28);
        ctx.restore();
        // Sub com brilho
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = `rgba(136,255,136,${0.7+this.titleGlow*0.3})`;
        ctx.fillText('🌿 Uma aventura na Amazônia 🌿', this.w/2, this.h*0.35);
        // Instruções piscando
        ctx.font = '18px "Courier New", monospace';
        let blink = Math.sin(Date.now()*0.005)>0;
        if(blink){ctx.fillStyle='#fff';ctx.fillText('Pressione ESPAÇO ou Toque para começar',this.w/2,this.h*0.6);}
        // High score com ícone
        ctx.font='bold 16px "Courier New", monospace';
        ctx.fillStyle='#ffd700';ctx.fillText('🏆 Recorde: '+Math.floor(highScore),this.w/2,this.h*0.7);
        // Controles em painel
        ctx.fillStyle='rgba(0,0,0,0.3)';
        let pw=500,ph=40,px=this.w/2-pw/2,py=this.h*0.78;
        ctx.beginPath();ctx.roundRect(px,py,pw,ph,8);ctx.fill();
        ctx.font='11px "Courier New", monospace';ctx.fillStyle='#ccc';
        ctx.fillText('↑/ESPAÇO = Pular  |  ↓ = Agachar  |  ENTER = Pausar',this.w/2,py+16);
        ctx.fillText('Mobile: Toque inferior = Pular/Agachar  |  Toque superior = Pausar',this.w/2,py+30);
        ctx.textAlign='left';
    }
    drawPauseScreen(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#fff'; ctx.fillText('⏸ PAUSADO', this.w / 2, this.h / 2 - 10);
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ccc'; ctx.fillText('ENTER ou Toque para continuar', this.w / 2, this.h / 2 + 25);
        ctx.textAlign = 'left';
    }
    drawGameOver(ctx, score, highScore, isNewRecord) {
        let a=this.gameOverAnim;
        ctx.fillStyle=`rgba(0,0,0,${0.6*a})`;ctx.fillRect(0,0,this.w,this.h);
        // Painel central estilizado
        ctx.save();
        let pw=340,ph=220,px=(this.w-pw)/2,py=(this.h-ph)/2;
        ctx.globalAlpha=a;
        ctx.translate(this.w/2,this.h/2);ctx.scale(0.5+a*0.5,0.5+a*0.5);ctx.translate(-this.w/2,-this.h/2);
        // Fundo do painel com gradiente
        let pg=ctx.createLinearGradient(px,py,px,py+ph);
        pg.addColorStop(0,'rgba(20,40,20,0.9)');pg.addColorStop(1,'rgba(10,20,10,0.95)');
        ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(px,py,pw,ph,16);ctx.fill();
        // Borda
        ctx.strokeStyle=isNewRecord?'#ffd700':'#4a7a4a';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(px,py,pw,ph,16);ctx.stroke();
        // Conteúdo
        ctx.textAlign='center';
        ctx.font='bold 32px "Courier New", monospace';
        ctx.fillStyle='#f44336';ctx.fillText('FIM DE JOGO',this.w/2,py+45);
        if(isNewRecord){
            ctx.save();ctx.shadowColor='#ffd700';ctx.shadowBlur=15;
            ctx.font='bold 18px "Courier New"';ctx.fillStyle='#ffd700';
            ctx.fillText('🏆 NOVO RECORDE! 🏆',this.w/2,py+75);ctx.restore();
        }
        // Separador
        ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(px+30,py+90);ctx.lineTo(px+pw-30,py+90);ctx.stroke();
        // Scores
        ctx.font='22px "Courier New"';ctx.fillStyle='#fff';
        ctx.fillText('Pontuação: '+Math.floor(score),this.w/2,py+120);
        ctx.font='16px "Courier New"';ctx.fillStyle='#ffd700';
        ctx.fillText('Recorde: '+Math.floor(highScore),this.w/2,py+148);
        // Distância
        ctx.font='13px "Courier New"';ctx.fillStyle='#8f8';
        ctx.fillText('Distância: '+Math.floor(score*0.5)+'m',this.w/2,py+170);
        // Botão retry
        let blink=Math.sin(Date.now()*0.005)>0;
        if(blink){ctx.font='16px "Courier New"';ctx.fillStyle='#aff';
        ctx.fillText('Pressione ESPAÇO ou Toque',this.w/2,py+200);}
        ctx.textAlign='left';ctx.restore();
    }
}
