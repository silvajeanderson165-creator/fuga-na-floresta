// ═══ FUGA NA FLORESTA - Entidades (Player + Obstacle) ═══

class Player {
    constructor(canvas) {
        this.w = canvas.width; this.h = canvas.height;
        this.groundY = this.h * 0.82;
        this.x = this.w * 0.15;
        this.y = this.groundY;
        this.width = 35; this.height = 60;
        this.vy = 0; this.gravity = 0.65; this.jumpForce = -13;
        this.onGround = true; this.ducking = false; this.dead = false;
        this.frame = 0; this.frameTimer = 0; this.frameInterval = 8;
        this.duckHeight = 30;
        this.blinkTimer = 0; this.wasInAir = false;
    }
    get hitbox() {
        let pad = 0.1, w = this.width, h = this.ducking ? this.duckHeight : this.height;
        let bx = this.x - w/2, by = this.y - h;
        return { x: bx + w*pad, y: by + h*pad, w: w*(1-2*pad), h: h*(1-2*pad) };
    }
    jump() {
        if (this.onGround && !this.dead) { this.vy = this.jumpForce; this.onGround = false; return true; }
        return false;
    }
    duck(d) { if (!this.dead) this.ducking = d; }
    die() { this.dead = true; this.ducking = false; }
    update() {
        if (this.dead) { this.blinkTimer++; return; }
        this.vy += this.gravity; this.y += this.vy;
        let wasAir = !this.onGround;
        if (this.y >= this.groundY) { this.y = this.groundY; this.vy = 0; this.onGround = true; }
        else this.onGround = false;
        if (wasAir && this.onGround) this.landed = true; else this.landed = false;
        if (this.onGround && !this.ducking) {
            this.frameTimer++; if (this.frameTimer >= this.frameInterval) { this.frameTimer = 0; this.frame = (this.frame + 1) % 4; }
        }
    }
    draw(ctx) {
        let x = this.x, bh = this.ducking ? this.duckHeight : this.height, by = this.y - bh;
        // Sombra no chão
        let shadowScale = this.onGround ? 1 : Math.max(0.3, 1-(this.groundY-this.y)/120);
        ctx.save(); ctx.globalAlpha=0.25;
        ctx.fillStyle='#000'; ctx.beginPath();
        ctx.ellipse(x, this.groundY+2, 18*shadowScale, 5*shadowScale, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Piscar ao morrer
        ctx.save();
        if (this.dead) {
            if (Math.floor(this.blinkTimer/4)%2===0) ctx.globalAlpha=0.4;
            ctx.translate(x, this.y); ctx.rotate(0.4); ctx.translate(-x, -this.y);
        }
        // Pernas
        let legOff = this.onGround && !this.ducking ? Math.sin(this.frame * Math.PI/2) * 8 : 0;
        if (this.ducking) {
            ctx.fillStyle = '#6B5B3A'; ctx.fillRect(x-14, by+bh-10, 10, 10); ctx.fillRect(x+4, by+bh-10, 10, 10);
        } else {
            ctx.fillStyle = '#6B5B3A';
            ctx.fillRect(x-10, by+bh-22+legOff, 8, 22-legOff);
            ctx.fillRect(x+2, by+bh-22-legOff, 8, 22+legOff);
            // Botas
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(x-12, this.y-6, 12, 6);
            ctx.fillRect(x, this.y-6, 12, 6);
        }
        // Corpo
        if (this.ducking) {
            ctx.fillStyle = '#D2B48C'; ctx.fillRect(x-15, by+4, 30, 16);
            // Cabeça deitada
            ctx.fillStyle = '#E8C89E'; ctx.beginPath(); ctx.arc(x+12, by+10, 9, 0, Math.PI*2); ctx.fill();
            // Chapéu
            ctx.fillStyle = '#8B7355'; ctx.fillRect(x+4, by, 18, 5);
            ctx.fillRect(x+7, by-4, 12, 5);
        } else {
            // Torso
            ctx.fillStyle = '#D2B48C'; ctx.fillRect(x-12, by+16, 24, 22);
            // Mochila
            ctx.fillStyle = '#8B6914'; ctx.fillRect(x-16, by+18, 6, 16);
            // Braços
            let armOff = this.onGround ? Math.sin(this.frame * Math.PI/2) * 6 : -4;
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(x-16, by+18+armOff, 5, 14);
            ctx.fillRect(x+11, by+18-armOff, 5, 14);
            // Cabeça
            ctx.fillStyle = '#E8C89E'; ctx.beginPath(); ctx.arc(x, by+10, 11, 0, Math.PI*2); ctx.fill();
            // Olhos
            ctx.fillStyle = '#333';
            if (this.dead) {
                ctx.fillText('x', x-5, by+12); ctx.fillText('x', x+2, by+12);
            } else {
                ctx.fillRect(x-5, by+8, 3, 3); ctx.fillRect(x+3, by+8, 3, 3);
            }
            // Chapéu safari
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x-14, by-1, 28, 5);
            ctx.fillRect(x-9, by-8, 18, 8);
            ctx.fillStyle = '#76623E'; ctx.fillRect(x-9, by-1, 18, 2);
        }
        // Contorno preto sutil
        ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1;
        if(!this.ducking){
            ctx.strokeRect(x-12,by+16,24,22); // torso
            ctx.beginPath();ctx.arc(x,by+10,11,0,Math.PI*2);ctx.stroke(); // cabeça
        }
        ctx.restore();
    }
}

// ──── Obstáculos ────
class Obstacle {
    constructor(type, canvasW, groundY, speed) {
        this.type = type; this.speed = speed; this.active = true;
        this.groundY = groundY; this.alertTimer = 0; this.showAlert = false;
        switch(type) {
            case 'javali':
                this.width = 50; this.height = 35; this.x = canvasW + 20;
                this.y = groundY - this.height; break;
            case 'cobra':
                this.width = 55; this.height = 15; this.x = canvasW + 20;
                this.y = groundY - this.height; break;
            case 'arara':
                this.width = 40; this.height = 25; this.x = canvasW + 20;
                this.y = groundY - 65 - Math.random()*20; break;
            case 'onca':
                this.width = 55; this.height = 40; this.x = canvasW + 80;
                this.y = groundY - this.height; this.speed *= 1.6;
                this.showAlert = true; this.alertTimer = 60; break;
        }
    }
    get hitbox() {
        let p = 0.1;
        return { x: this.x+this.width*p, y: this.y+this.height*p, w: this.width*(1-2*p), h: this.height*(1-2*p) };
    }
    update() {
        if (this.alertTimer > 0) { this.alertTimer--; return; }
        this.x -= this.speed;
        if (this.x < -this.width - 20) this.active = false;
    }
    draw(ctx) {
        if (this.showAlert && this.alertTimer > 0) {
            let blink = Math.sin(Date.now()*0.02) > 0;
            if (blink) { ctx.font='bold 28px sans-serif'; ctx.fillStyle='#ff0'; ctx.fillText('⚠', this.x-10, this.y-5); }
            return;
        }
        switch(this.type) {
            case 'javali': this._drawJavali(ctx); break;
            case 'cobra': this._drawCobra(ctx); break;
            case 'arara': this._drawArara(ctx); break;
            case 'onca': this._drawOnca(ctx); break;
        }
    }
    _drawJavali(ctx) {
        let x=this.x, y=this.y;
        // Corpo
        ctx.fillStyle='#6B4226'; ctx.beginPath();
        ctx.ellipse(x+25,y+20,24,14,0,0,Math.PI*2); ctx.fill();
        // Cabeça
        ctx.fillStyle='#5a3a1a'; ctx.beginPath();
        ctx.ellipse(x+6,y+16,10,10,0,0,Math.PI*2); ctx.fill();
        // Olho
        ctx.fillStyle='#f00'; ctx.beginPath(); ctx.arc(x+4,y+13,2,0,Math.PI*2); ctx.fill();
        // Presas
        ctx.fillStyle='#fff';
        ctx.fillRect(x-1,y+18,3,5); ctx.fillRect(x+5,y+18,3,5);
        // Pernas
        ctx.fillStyle='#4a2a10';
        let lo=Math.sin(Date.now()*0.015)*3;
        ctx.fillRect(x+10,y+28+lo,5,7); ctx.fillRect(x+20,y+28-lo,5,7);
        ctx.fillRect(x+32,y+28+lo,5,7); ctx.fillRect(x+40,y+28-lo,5,7);
    }
    _drawCobra(ctx) {
        let x=this.x, y=this.y;
        ctx.strokeStyle='#2d5a1a'; ctx.lineWidth=8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(x,y+10);
        for(let i=0;i<5;i++) ctx.quadraticCurveTo(x+i*12+6,y+(i%2?2:14),x+(i+1)*11,y+8);
        ctx.stroke();
        // Cabeça
        ctx.fillStyle='#3a7a2a'; ctx.beginPath();
        ctx.ellipse(x+2,y+8,7,6,-0.3,0,Math.PI*2); ctx.fill();
        // Olho
        ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(x,y+6,2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(x,y+6,1,0,Math.PI*2); ctx.fill();
        // Língua
        if(Math.sin(Date.now()*0.01)>0){
            ctx.strokeStyle='#f00'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(x-5,y+8); ctx.lineTo(x-10,y+5); ctx.moveTo(x-5,y+8); ctx.lineTo(x-10,y+11); ctx.stroke();
        }
    }
    _drawArara(ctx) {
        let x=this.x, y=this.y;
        let wingOff=Math.sin(Date.now()*0.02)*8;
        // Corpo
        ctx.fillStyle='#e63946'; ctx.beginPath();
        ctx.ellipse(x+20,y+14,18,8,0,0,Math.PI*2); ctx.fill();
        // Asa
        ctx.fillStyle='#457b9d';
        ctx.beginPath(); ctx.moveTo(x+15,y+10); ctx.lineTo(x+25,y-5+wingOff); ctx.lineTo(x+35,y+10); ctx.fill();
        // Cabeça
        ctx.fillStyle='#f1fa8c'; ctx.beginPath(); ctx.arc(x+5,y+12,7,0,Math.PI*2); ctx.fill();
        // Bico
        ctx.fillStyle='#222'; ctx.beginPath(); ctx.moveTo(x-2,y+11); ctx.lineTo(x-8,y+14); ctx.lineTo(x-2,y+15); ctx.fill();
        // Olho
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(x+3,y+10,2,0,Math.PI*2); ctx.fill();
        // Cauda
        ctx.fillStyle='#2a9d8f';
        ctx.beginPath(); ctx.moveTo(x+36,y+12); ctx.lineTo(x+48,y+8); ctx.lineTo(x+48,y+18); ctx.fill();
    }
    _drawOnca(ctx) {
        let x=this.x, y=this.y;
        // Corpo
        ctx.fillStyle='#e8a317'; ctx.beginPath();
        ctx.ellipse(x+28,y+22,26,16,0,0,Math.PI*2); ctx.fill();
        // Manchas
        ctx.fillStyle='#8B4513';
        [[15,18],[25,14],[35,20],[20,26],[38,28]].forEach(([dx,dy])=>{
            ctx.beginPath(); ctx.arc(x+dx,y+dy,3,0,Math.PI*2); ctx.fill();
        });
        // Cabeça
        ctx.fillStyle='#d4951a'; ctx.beginPath(); ctx.arc(x+5,y+16,10,0,Math.PI*2); ctx.fill();
        // Orelhas
        ctx.beginPath(); ctx.moveTo(x-2,y+8); ctx.lineTo(x-6,y+2); ctx.lineTo(x+2,y+8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+8,y+8); ctx.lineTo(x+12,y+2); ctx.lineTo(x+14,y+8); ctx.fill();
        // Olhos
        ctx.fillStyle='#0f0'; ctx.beginPath(); ctx.arc(x+1,y+14,2.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+9,y+14,2.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(x+1,y+14,1,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+9,y+14,1,0,Math.PI*2); ctx.fill();
        // Boca
        ctx.strokeStyle='#000'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(x+5,y+20,4,0,Math.PI); ctx.stroke();
        // Pernas com animação
        ctx.fillStyle='#d4951a';
        let lo=Math.sin(Date.now()*0.02)*5;
        ctx.fillRect(x+10,y+32+lo,6,8); ctx.fillRect(x+22,y+32-lo,6,8);
        ctx.fillRect(x+34,y+32+lo,6,8); ctx.fillRect(x+44,y+32-lo,6,8);
        // Cauda
        ctx.strokeStyle='#e8a317'; ctx.lineWidth=4; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(x+52,y+18);
        ctx.quadraticCurveTo(x+60,y+10+Math.sin(Date.now()*0.01)*5,x+55,y+5); ctx.stroke();
    }
}
