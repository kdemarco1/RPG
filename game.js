const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const damagePopUps = [];

function updateAnimation(actor) {
    if (actor.frameIndex === undefined) {
        actor.frameIndex = 0;
        actor.tickCount = 0;
        actor.currentAnim = "idle";
    }
    let targetAnim = "idle";
    // Determine animation state
    if (actor.visualState === "attacking")
        targetAnim = "attacking";
    else if (actor.health <= 0)
        targetAnim = "hurt";
    else if (actor.visualState === "hurt")
        targetAnim = "hurt";
    else if (actor.visualState === "defending" || actor.isDefending)
        targetAnim = "defending";
    // Reset frames on animation switch
    if (actor.currentAnim !== targetAnim) {
        actor.currentAnim = targetAnim;
        actor.frameIndex = 0;
        actor.tickCount = 0;
    }
    const characterConfig = window.animConfig?.[actor.charClass] || window.animConfig?.Knight;
    const config = characterConfig?.[actor.currentAnim];
    if (!config) return
    actor.tickCount++;
    // Advance frame based on animation speed
    if (actor.tickCount >= config.speed) {
        actor.tickCount = 0;
        if (actor.currentAnim === "defending") {
            if (actor.frameIndex < config.frames - 1)
                actor.frameIndex++;
        } else {
            actor.frameIndex =
                (actor.frameIndex + 1) % config.frames;
        }
    }
    if (!actor.isDefending && actor.currentAnim === "defending" && actor.visualState !== "defending") {
        actor.currentAnim = "idle";
        actor.frameIndex = 0;
    }
}

function updateState(actor) {
    if (actor.stateTimer > 0) {
        actor.stateTimer--;
        if (actor.stateTimer === 0 && actor.visualState !== "dead") {
            actor.visualState = "idle";
        }
    }

    if (actor.visualState === "dead") {
        if (typeof actor.deathTimer !== "number") {
            actor.deathTimer = 0;
        }
        actor.deathTimer += 1;

        if (actor.deathTimer >= 45) {
            actor.deathComplete = true;
        }
    }
}

function updateDamageEffects(actor) {
    if (actor.pendingDamageEffect !== undefined) {
        const isPlayer = (actor === player);
        spawnDamagePopup(actor.baseX, actor.baseY, actor.pendingDamageEffect, isPlayer);
        delete actor.pendingDamageEffect;
        actor.isDefending = false;
    }
}

function updateMovement(actor, target) {
    if (actor.visualState === "attacking" && target) {
        actor.x = actor.baseX + (target.baseX - actor.baseX) * GAME_CONFIG.actor.lungeFactor;
    } else if (actor.visualState === "dead") {
        actor.x = actor.baseX;
        actor.y = actor.baseY + Math.min(actor.deathTimer || 0, 40);
    } else if (actor.visualState === "hurt") {
        actor.x = actor.baseX + (Math.random() - 0.5) * GAME_CONFIG.actor.shakeIntensity;
        actor.y = actor.baseY;
    } else if (actor.visualState === "dead") {
        actor.x = actor.baseX;
    } else {
        actor.x += (actor.baseX - actor.x) * GAME_CONFIG.actor.returnSpeed;
        if (typeof portraits[actor.charClass] === "string") {
            const bob = Math.sin(performance.now() * GAME_CONFIG.actor.breathingSpeed) * GAME_CONFIG.actor.breathingAmplitude;
            actor.y += (actor.baseY + bob - actor.y) * GAME_CONFIG.actor.returnSpeed;
        } else {
            actor.y += (actor.baseY - actor.y) * GAME_CONFIG.actor.returnSpeed;
        }
    }
}

function updateActor(actor, target) {
    if (!actor || actor.deathComplete) return;
    updateAnimation(actor);
    updateState(actor);
    updateDamageEffects(actor);
    updateMovement(actor, target);
}

function drawSprite(actor, spriteAlpha, scale, rotation, yOffset) {

    ctx.save();
    const progress = Number.isFinite(actor.deathTimer) ? Math.min(1, actor.deathTimer / 45) : 0;
    spriteAlpha = 1 - progress;
    scale *= (1 - progress);
    rotation = progress * Math.PI * 1.5;
    yOffset = progress * 40;

    ctx.translate(actor.x, actor.y + yOffset);

    ctx.rotate(rotation);

    const shouldFlip = Boolean(actor.isEnemy);
    ctx.scale(scale * (shouldFlip ? -1 : 1), scale);

    ctx.globalAlpha = spriteAlpha;

    if (actor.visualState === "hurt" && actor.health > 0) {
        ctx.shadowColor = "#e74c3c";
        ctx.shadowBlur = 20;
    }

    const charSprites = loadedSprites[actor.charClass];

    if (charSprites && actor.currentAnim) {

        const sprite = charSprites[actor.currentAnim] || charSprites.idle;
        const characterConfig = window.animConfig?.[actor.charClass] || window.animConfig?.Knight;
        const config = characterConfig?.[actor.currentAnim] || characterConfig?.idle;

        if (sprite && sprite.loaded && config) {

            const frameWidth = sprite.width / config.frames;
            const frameHeight = sprite.height;

            const sourceX = actor.frameIndex * frameWidth;

            const drawScale = 2;

            const offsetY = (config.offsetY || 0) * scale;

            ctx.drawImage(
                sprite,
                sourceX,
                0,
                frameWidth,
                frameHeight,
                -(frameWidth * drawScale) / 2,
                -frameHeight * drawScale + offsetY,
                frameWidth * drawScale,
                frameHeight * drawScale
            );

        }
    }

    ctx.restore();

}

function getSpriteHeight(actor) {
    const sprite = loadedSprites[actor.charClass]?.[actor.currentAnim] || loadedSprites[actor.charClass]?.idle;
    const visualScale = actor.isBoss ? GAME_CONFIG.actor.bossScale : 1;
    return sprite ? sprite.height * 2 * visualScale : 80;
}

function drawHealthBar(actor, hpPercent, yOffset) {

    const width = GAME_CONFIG.ui.healthBarWidth;
    const height = GAME_CONFIG.ui.healthBarHeight;

    ctx.save();
    ctx.translate(actor.x, actor.y + yOffset);

    const spriteHeight = getSpriteHeight(actor);
    const x = -width / 2 - 6;
    const y = -(spriteHeight + 8);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = hpPercent < 0.3 ? "#e74c3c" : "#2ecc71";
    ctx.fillRect(x, y, width * hpPercent, height);

    ctx.strokeStyle = "#7f8c8d";
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
}

function drawActorName(actor, yOffset) {
    ctx.save();
    ctx.translate(actor.x, actor.y + yOffset);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 4;

    const labelY = 20;

    ctx.strokeText(actor.name || "???", 0, labelY);
    ctx.fillText(actor.name || "???", 0, labelY);

    ctx.restore();
}

function drawPotionCount(actor, yOffset) {
    if (actor.potions <= 0) return;

    ctx.save();
    ctx.translate(actor.x, actor.y + yOffset);

    ctx.fillStyle = "#a0d094";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 3;

    const spriteHeight = getSpriteHeight(actor);
    const barTopY = -(spriteHeight + 8);
    const nameY = barTopY - 14;
    const labelY = nameY - 16;             // sit just above the name

    ctx.strokeText(`🧪 x${actor.potions}`, 0, labelY);
    ctx.fillText(`🧪 x${actor.potions}`, 0, labelY);

    ctx.restore();
}

function drawActor(actor) {

    if (!actor || actor.deathComplete)
        return;
    let shadowAlpha = 0.5;
    let spriteAlpha = 1;
    let rotation = 0;
    let yOffset = 0;
    const scale = actor.isBoss ? GAME_CONFIG.actor.bossScale : 1;
    drawSprite(
        actor,
        spriteAlpha,
        scale,
        rotation,
        yOffset
    );
    if (actor.health <= 0)
        return;
    const hpPercent =
        actor.health / actor.maxHealth;
    drawHealthBar(
        actor,
        hpPercent,
        yOffset
    );
    drawPotionCount(
        actor,
        yOffset
    );
    drawActorName(
        actor,
        yOffset
    );
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    BackgroundManager.update(now);
    BackgroundManager.draw(now);

    if (typeof player !== 'undefined' && !player.deathComplete) {
        updateActor(player, currentEnemy);
    }
    if (typeof currentEnemy !== 'undefined' && !currentEnemy.deathComplete) {
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
        velocityY: GAME_CONFIG.popup.velocityY,
        life: GAME_CONFIG.popup.lifetime
    });
}
gameLoop();