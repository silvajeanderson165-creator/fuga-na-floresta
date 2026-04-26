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
        
        // Animação (do usuário)
        this.frame = 0;
        this.frameInterval = 8;
        this.legSwing = 0;
        this.armSwing = 0;
        this.blinkTimer = 0;
        
        // Cores do personagem tribal (do usuário)
        this.colors = {
            skin: '#D4A373',
            hair: '#4A2511',
            clothes: '#FF6B35',
            clothesDark: '#E85D2C',
            eyes: '#2C1810',
            detail: '#8B4513'
        };
    }

    get hitbox() {
        let pad = 0.1, w = this.width, h = this.ducking ? 30 : this.height;
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
        
        if (this.y >= this.groundY) { 
            this.y = this.groundY; this.vy = 0; this.onGround = true; 
        } else {
            this.onGround = false;
        }
        
        if (wasAir && this.onGround) this.landed = true; else this.landed = false;
        
        this.frame++;
        if (this.onGround && !this.ducking) {
            this.legSwing = Math.sin(this.frame / 5) * 0.3;
            this.armSwing = Math.sin(this.frame / 5) * 0.2;
        } else {
            this.legSwing = 0;
            this.armSwing = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Se morto, tomba para frente e pisca
        if (this.dead) {
            if (Math.floor(this.blinkTimer/4)%2===0) ctx.globalAlpha=0.4;
            ctx.translate(this.x, this.y);
            ctx.rotate(0.4);
            ctx.translate(-this.x, -this.y);
        }

        // Ajusta as posições X e Y para baterem com o código de desenho do usuário
        let drawX = this.x - this.width / 2;
        let drawY = this.y - this.height;

        if (this.ducking) {
            this.drawDucking(ctx, drawX, drawY);
        } else if (!this.onGround) {
            this.drawJumping(ctx, drawX, drawY);
        } else {
            this.drawRunning(ctx, drawX, drawY);
        }

        ctx.restore();
    }

    drawRunning(ctx, x, y) {
        // PERNAS (Perfil)
        this.drawLeg(ctx, x + 10, y + 35, this.legSwing);      // Perna de trás
        this.drawLeg(ctx, x + 18, y + 35, -this.legSwing);     // Perna da frente

        // BRAÇO ATRÁS (Sombra)
        this.drawArm(ctx, x + 16, y + 20, -this.armSwing, true);

        // CORPO (Perfil lateral)
        ctx.fillStyle = this.colors.clothes; ctx.fillRect(x + 8, y + 20, 18, 22);
        ctx.fillStyle = this.colors.clothesDark; ctx.fillRect(x + 8, y + 20, 18, 3);
        ctx.fillRect(x + 20, y + 23, 4, 19); // Detalhe na frente

        // CABEÇA (Perfil virado para a direita)
        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 10, y + 5, 16, 18);
        ctx.fillStyle = this.colors.hair; 
        ctx.fillRect(x + 8, y + 2, 16, 8); // Topo
        ctx.fillRect(x + 8, y + 5, 6, 12); // Nuca
        
        ctx.fillStyle = this.colors.detail; ctx.fillRect(x + 8, y + 8, 18, 2); // Faixa
        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 9, y + 12, 3, 4); // Orelha

        // ROSTO (Perfil - só o lado direito aparece)
        if (this.dead) {
            ctx.strokeStyle = this.colors.eyes; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x+19,y+12); ctx.lineTo(x+22,y+15); ctx.moveTo(x+22,y+12); ctx.lineTo(x+19,y+15); ctx.stroke();
        } else {
            ctx.fillStyle = this.colors.eyes; ctx.fillRect(x + 19, y + 12, 3, 3); // Olho
            ctx.fillRect(x + 21, y + 18, 4, 2); // Boca (na beirada direita)
        }

        // BRAÇO FRENTE
        this.drawArm(ctx, x + 14, y + 20, this.armSwing, false);
    }

    drawJumping(ctx, x, y) {
        ctx.fillStyle = this.colors.detail;
        ctx.fillRect(x + 10, y + 40, 6, 16); ctx.fillRect(x + 18, y + 40, 6, 16);
        ctx.fillRect(x + 10, y + 56, 8, 4); ctx.fillRect(x + 18, y + 56, 8, 4);

        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 14, y + 10, 5, 15); // Braço cima

        ctx.fillStyle = this.colors.clothes; ctx.fillRect(x + 8, y + 20, 18, 22);
        ctx.fillStyle = this.colors.clothesDark; ctx.fillRect(x + 8, y + 20, 18, 3);

        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 10, y + 5, 16, 18);
        ctx.fillStyle = this.colors.hair; ctx.fillRect(x + 8, y + 2, 16, 8); ctx.fillRect(x + 8, y + 5, 6, 12);
        ctx.fillStyle = this.colors.detail; ctx.fillRect(x + 8, y + 8, 18, 2);
        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 9, y + 12, 3, 4);

        ctx.fillStyle = this.colors.eyes; ctx.fillRect(x + 19, y + 12, 3, 3);
    }

    drawDucking(ctx, x, y) {
        y = y + 30; // Mais baixo

        ctx.fillStyle = this.colors.detail; ctx.fillRect(x + 10, y + 8, 6, 12); ctx.fillRect(x + 18, y + 8, 6, 12);
        ctx.fillStyle = this.colors.clothes; ctx.fillRect(x + 6, y, 22, 15);
        ctx.fillStyle = this.colors.clothesDark; ctx.fillRect(x + 6, y, 22, 2);
        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 14, y + 5, 5, 10);

        ctx.fillStyle = this.colors.skin; ctx.fillRect(x + 12, y - 10, 16, 13);
        ctx.fillStyle = this.colors.hair; ctx.fillRect(x + 10, y - 13, 16, 6); ctx.fillRect(x + 10, y - 10, 6, 8);
        ctx.fillStyle = this.colors.detail; ctx.fillRect(x + 10, y - 10, 18, 2);
        ctx.fillStyle = this.colors.eyes; ctx.fillRect(x + 21, y - 5, 3, 2);
    }

    drawLeg(ctx, x, y, swing) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
        ctx.fillStyle = this.colors.detail; ctx.fillRect(0, 0, 6, 15); ctx.fillRect(0, 15, 6, 10); 
        ctx.fillRect(0, 25, 9, 4); // Pé apontando para a direita
        ctx.restore();
    }

    drawArm(ctx, x, y, swing, isBack = false) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
        ctx.fillStyle = isBack ? this.colors.detail : this.colors.skin; 
        ctx.fillRect(0, 0, 5, 15); ctx.fillRect(0, 15, 5, 4);
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
        ctx.strokeStyle='#c2185b'; ctx.lineWidth=8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(x,y+10);
        for(let i=0;i<5;i++) ctx.quadraticCurveTo(x+i*12+6,y+(i%2?2:14),x+(i+1)*11,y+8);
        ctx.stroke();
        // Cabeça
        ctx.fillStyle='#e91e63'; ctx.beginPath();
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
