const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const damagePopUps = [];

const portraits = {
    Knight: '🗡️',
    Magician: '🧙🏼‍♂️',
    Archer: '🏹',
    Zombie: '🧟',
    Ghoul: '👻',
    Mimic: '📦',
    Basilisk: '🐍'
};

function updateActor(actor, target) {
    if (!actor) return;

    if (actor.pendingDamageEffect !== undefined) {
        const isPlayer = (actor === player);
        spawnDamagePopup(actor.baseX, actor.baseY, actor.pendingDamageEffect, isPlayer);
        delete actor.pendingDamageEffect;
    }

    if (actor.stateTimer > 0) {
        actor.stateTimer--;
        if (actor.stateTimer === 0 && actor.visualState !== 'dead') {
            actor.visualState = 'idle';
        }
    }

    if (actor.visualState === 'attacking' && target) {
        const lungeFactor = 0.4;
        actor.x = actor.baseX + (target.baseX - actor.baseX) * lungeFactor;
    }
    else if (actor.visualState === 'hurt') {
        const shakeIntensity = 8;
        actor.x = actor.baseX + (Math.random() - 0.5) * shakeIntensity;
        actor.y = actor.baseY;
    }
    else if (actor.visualState === 'dead') {
        actor.y += (canvas.height + 100 - actor.y) * 0.1;
    }
    else {
        actor.x += (actor.baseX -actor.x) * 0.2;
        const breathingSpeed = 0.005;
        const breathingAmplitude = 5;
        const bob = Math.sin(Date.now() * breathingSpeed) * breathingAmplitude;
        actor.y += (actor.baseY + bob - actor.y) * 0.2;
    }
}

function drawActor(actor) {
    if (!actor) return;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(actor.x, actor.baseY + 50, 40, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgb(0, 0, 0, 0.2)';
    ctx.fill();
    ctx.fillStyle = actor.visualState === 'hurt' ? '#e74c3c' : '#2c3e50';
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 3;
    const width = 100;
    const height = 130;
    const rx = actor.x - width / 2;
    const ry = actor.y - height / 2;
    ctx.fillRect(rx, ry, width, height);
    ctx.strokeRect(rx, ry, width, height);
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = portraits[actor.charClass];
    ctx.fillText(emoji, actor.x, actor.y - 10);
    ctx.fillStyle = '#ecf0f1'
    ctx.font = 'bold 14px monospace';
    ctx.fillText(actor.name || '???', actor.x, actor.y + 45);
    const hpPercent = actor.maxHealth > 0 ? Math.max(0, actor.health / actor.maxHealth) : 0;
    const barWidth = 80;
    const barHeight = 8;
    const barX = actor.x - barWidth / 2;
    const barY = ry - 20;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpPercent < 0.3 ? '#e74c3c' : '#2ecc71';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#7f8c8d'
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 310);
    ctx.lineTo(750, 310);
    ctx.stroke();

    if (typeof player !== 'undefined' && player.health > 0) {
        updateActor(player, currentEnemy);
    }
    if (typeof currentEnemy !== 'undefined') {
        updateActor(currentEnemy, player);
    }
    if (typeof player !== 'undefined' && player.health > 0) {
        drawActor(player);
    }
    if (typeof currentEnemy !== 'undefined') {
        drawActor(currentEnemy);
    }

    for (let i = damagePopUps.length - 1; i >= 0; i--) {
        const popup = damagePopUps[i];
        popup.y += popup.velocityY;
        popup.alpha -= 1 / popup.life;
        popup.life--;

        if (popup.life <= 0) {
            damagePopUps.splice(i, 1);
            continue
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, popup.alpha);
        ctx.fillStyle = popup.color;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgb(0, 0, 0, 1)';
        ctx.shadowBlur = 4;
        ctx.fillText(popup.text, popup.x, popup.y);
        ctx.restore();
    }
    requestAnimationFrame(gameLoop);
}


function spawnDamagePopup(x, y, amount, isPlayer) {
    let text = `-${amount}`;
    let color = isPlayer ? '#e74c3c' : '#f1c40f';

    if (typeof amount === 'string' && amount.startsWith('+')) {
        text = amount;
        color = '#2ecc71';
    } else if (typeof amount === 'number' && amount < 0) {
        text = `+${Math.abs(amount)}`;
        color = '#2ecc71';
    }
    
    damagePopUps.push({
        x: x,
        y: y - 50,
        text: text,
        color: color,
        alpha: 1.0,
        velocityY: -1.8,
        life: 100
    });
}
gameLoop();