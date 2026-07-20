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
    if (actor.deathComplete) return;
    ctx.save();
    ctx.globalAlpha = 1.0;
    // Death Animation
    let shadowAlpha = 0.5;
    let spriteAlpha = 1.0;
    let scale = 1.0;
    let rotation = 0;
    let yOffset = 0;

    if (actor.health <= 0) {
        if (actor.deathTimer === undefined) actor.deathTimer = 0;
        actor.deathTimer++;

        let progress = Math.min(1, actor.deathTimer / 45);
        shadowAlpha = 0.5 * (1 - progress)
        spriteAlpha = 1 - progress;
        scale = 1 - progress;
        rotation = progress * Math.PI * 1.5;
        yOffset = progress * 40;

        if (actor.deathTimer >= 45) {
            actor.deathComplete = true;
        }
    }
    // Ground Shadow
    ctx.beginPath();
    ctx.ellipse(actor.x, actor.baseY + 45, 35, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(0, 0, 0, ${shadowAlpha})`;
    ctx.fill();
    // Death Effect
    ctx.translate(actor.x, actor.y + yOffset);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = spriteAlpha;
    // Status
    if (actor.visualState === 'hurt' && actor.health > 0) {
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 20;
    }
    // Non-Transparent background for emoji
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    halo.addColorStop(0, '#110c22');
    halo.addColorStop(0.6, '#110c22')
    halo.addColorStop(1, 'rgba(17, 12, 34, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    // Sprite
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    const emoji = portraits[actor.charClass];
    let xNudge = 0;
    let yNudge = 0;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (actor === player && isMobile) {
        xNudge = -4;
    }
    ctx.fillText(emoji, xNudge, yNudge);
    ctx.fillText(emoji, xNudge, yNudge);
    ctx.shadowBlur = 0;
    // Name Text
    if (actor.health > 0) {
    ctx.fillStyle = '#ecf0f1'
    ctx.font = 'bold 14px monospace';
    ctx.fillText(actor.name || '???', 0, 50);
    // Inventory Potions
    if (actor.potions > 0) {
        ctx.fillStyle = '#d8b4fe'
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`🧪 x${actor.potions}`, 0, 68);
    }
    // Dynamic Health Bar
    const hpPercent = actor.maxHealth > 0 ? Math.max(0, actor.health / actor.maxHealth) : 0;
    const barWidth = 70;
    const barHeight = 6;
    const barX = 0 - barWidth / 2;
    const barY = 0 - 55;
    //
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // Health color change
    ctx.fillStyle = hpPercent < 0.3 ? '#e74c3c' : '#2ecc71';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    // Border Outline
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 310);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.6, '#1e1b4b');
    skyGradient.addColorStop(1, '#4c1d95');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, 310);
    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const stars = [[120, 50], [240, 80], [380, 40], [520, 90], [680, 60]];
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star[0], star[1], 2, 0, Math.PI * 2);
        ctx.fill();
        });
    // Mountains
    ctx.fillStyle = '#110c22';
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.lineTo(150, 240);
    ctx.lineTo(300, 310);
    ctx.lineTo(450, 220);
    ctx.lineTo(600, 310);
    ctx.lineTo(720, 260);
    ctx.lineTo(800, 310);
    ctx.closePath();
    ctx.fill();
    // Arena Floor
    ctx.fillStyle = '#11131970';
    ctx.fillRect(0, 310, canvas.width, canvas.height - 310);

    if (typeof player !== 'undefined' && player.health > 0) {
        updateActor(player, currentEnemy);
    }
    if (typeof currentEnemy !== 'undefined' && currentEnemy.health > 0) {
        updateActor(currentEnemy, player);
    }
    if (typeof player !== 'undefined' && !player.deathComplete) {
        drawActor(player);
    }
    if (typeof currentEnemy !== 'undefined' && !currentEnemy.deathComplete) {
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
        velocityY: -1.5,
        life: 100
    });
}
gameLoop();