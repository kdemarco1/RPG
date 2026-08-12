const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const damagePopUps = [];
const siphonEffects = [];
const blockEffects = [];
const powerSwipeEffects = [];
const counterStanceEffects = [];
const tripleSamuraiEffects = [];

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

function spawnSiphonEffect(fromActor, toActor, duration = 50) {
    siphonEffects.push({
        fromActor,
        toActor,
        life: duration,
        maxLife: duration,
        phase: Math.random() * Math.PI * 2
    });
}

function spawnBlockEffect(actor, duration = 26) {
    blockEffects.push({
        actor,
        life: duration,
        maxLife: duration
    });
}

function spawnPowerSwipeEffect(actor, duration = 34) {
    powerSwipeEffects.push({
        actor,
        life: duration,
        maxLife: duration,
        burstDuration: Math.min(24, duration) // the radial flash only plays at the very start
    });
}

function spawnTripleSamuraiEffect(actor, duration = 40) {
    tripleSamuraiEffects.push({
        actor,
        life: duration,
        maxLife: duration
    });
}


// Ramps 0->1, holds at 1, then ramps back to 0 — for effects that should stay "on" through
// an action instead of a symmetric pulse that peaks in the middle and fades early.
function fadeInHoldOut(progress, fadeInFrac = 0.12, fadeOutFrac = 0.25) {
    if (progress < fadeInFrac) return progress / fadeInFrac;
    if (progress > 1 - fadeOutFrac) return Math.max(0, (1 - progress) / fadeOutFrac);
    return 1;
}

function updateAnimation(actor) {
    if (actor.frameIndex === undefined) {
        actor.frameIndex = 0;
        actor.tickCount = 0;
        actor.currentAnim = "idle";
    }
    let targetAnim = "idle";

    const hasDeathAnim = Boolean(
        loadedSprites[actor.charClass]?.dead &&
        window.animConfig?.[actor.charClass]?.dead
    );

    // Determine animation state
    if (actor.visualState === "attacking")
        targetAnim = "attacking";
    else if (actor.visualState === "dead")
        targetAnim = hasDeathAnim ? "dead" : "hurt"; // fallback keeps the hurt pose under the swirl/fade
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
        if (actor.currentAnim === "defending" || actor.currentAnim === "dead") {
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
        if (actor.stateTimer === undefined) actor.stateTimer = 0;
        const attackConfig = window.animConfig?.[actor.charClass]?.attacking;
        const totalDuration = attackConfig ? attackConfig.frames * attackConfig.speed : 15;
        const elapsed = totalDuration - actor.stateTimer;
        const progress = Math.min(1, elapsed / totalDuration);

        const anticipation = 0.15; // first 15% pulls back slightly
        let lungeAmount;
        if (progress < anticipation) {
            const t = progress / anticipation;
            lungeAmount = -0.08 * Math.sin(t * Math.PI); // small pull-back
        } else {
            const t = (progress - anticipation) / (1 - anticipation);
            lungeAmount = easeOutBack(Math.min(1, t)) * GAME_CONFIG.actor.lungeFactor;
        }

        actor.x = actor.baseX + (target.baseX - actor.baseX) * lungeAmount;
    } else if (actor.visualState === "dead") {
        actor.x = actor.baseX;
        actor.y = actor.baseY + Math.min(actor.deathTimer || 0, 40);
    } else if (actor.visualState === "hurt") {
        actor.x = actor.baseX + (Math.random() - 0.5) * GAME_CONFIG.actor.shakeIntensity;
        actor.y = actor.baseY;
    } else {
        const dx = actor.baseX - actor.x;
        actor.x += dx * GAME_CONFIG.actor.returnSpeed;
        if (typeof portraits[actor.charClass] === "string") {
            if (actor.bobPhase === undefined) actor.bobPhase = Math.random() * 1000;
            const bob = Math.sin((performance.now() + actor.bobPhase) * GAME_CONFIG.actor.breathingSpeed) * GAME_CONFIG.actor.breathingAmplitude;
            actor.y += (actor.baseY + bob - actor.y) * GAME_CONFIG.actor.returnSpeed;
        } else {
            actor.y += (actor.baseY - actor.y) * GAME_CONFIG.actor.returnSpeed;
        }
    }
}

function updateActor(actor, target) {
    if (!actor || actor.deathComplete) return;
    if (actor.displayedHealth === undefined) actor.displayedHealth = actor.health;
    actor.displayedHealth += (actor.health - actor.displayedHealth) * 0.15;
    if (Math.abs(actor.displayedHealth - actor.health) < 0.5) actor.displayedHealth = actor.health;

    updateAnimation(actor);
    updateState(actor);
    updateDamageEffects(actor);
    updateMovement(actor, target);
}

function getActivePowerSwipeGlow(actor) {
    for (const effect of powerSwipeEffects) {
        if (effect.actor === actor && effect.life > 0) return effect;
    }
    return null;
}

function getActiveTripleSamuraiGlow(actor) {
    for (const effect of tripleSamuraiEffects) {
        if (effect.actor === actor && effect.life > 0) return effect;
    }
    return null;
}

function drawSprite(actor, spriteAlpha, scale, rotation, yOffset) {

    ctx.save();

    const hasDeathAnim = Boolean(
        loadedSprites[actor.charClass]?.dead &&
        window.animConfig?.[actor.charClass]?.dead
    );

    if (actor.visualState === "dead" && !hasDeathAnim) {
        // Fallback: swirl, shrink, and fade away
        const progress = Number.isFinite(actor.deathTimer) ? Math.min(1, actor.deathTimer / 45) : 0;
        spriteAlpha = 1 - progress;
        scale *= (1 - progress);
        rotation = progress * Math.PI * 1.5;
        yOffset = progress * 40;
    } else if (actor.visualState === "dead" && hasDeathAnim) {
        // Real death animation: play frames normally, just fade near the very end
        const fadeStart = 35;
        if (actor.deathTimer >= fadeStart) {
            const fadeProgress = (actor.deathTimer - fadeStart) / (GAME_CONFIG.actor.deathTime - fadeStart);
            spriteAlpha = 1 - Math.min(1, fadeProgress);
        }
    }

    ctx.translate(actor.x, actor.y + yOffset);

    ctx.rotate(rotation);

    let scaleX = scale;
    let scaleY = scale;

    if (actor.visualState === "hurt" && actor.health > 0) {
        if (actor.stateTimer === undefined) actor.stateTimer = 0;
        const hurtProgress = 1 - (actor.stateTimer / 20); // stateTimer set to 20 on hurt
        const squash = Math.sin(Math.min(1, hurtProgress) * Math.PI) * 0.15;
        scaleX = scale * (1 + squash);
        scaleY = scale * (1 - squash);
    } else if (actor.visualState === "defending" || actor.isDefending) {
        const pulse = Math.sin(performance.now() * 0.006) * 0.03;
        scaleX = scale * (1 + pulse);
        scaleY = scale * (1 - pulse);
    }

    const shouldFlip = Boolean(actor.isEnemy);
    ctx.scale(scaleX * (shouldFlip ? -1 : 1), scaleY);

    ctx.globalAlpha = spriteAlpha;

    const powerSwipeGlow = getActivePowerSwipeGlow(actor);
    if (powerSwipeGlow) {
        const glowProgress = 1 - powerSwipeGlow.life / powerSwipeGlow.maxLife;
        const glowStrength = fadeInHoldOut(glowProgress);
        // A gentle living pulse layered on top so the held glow doesn't look static
        const livingPulse = Math.sin(performance.now() * 0.012) * 3;
        ctx.shadowColor = "#8a5cff";
        ctx.shadowBlur = 10 + glowStrength * 22 + livingPulse;
    }
    const tripleGlow = getActiveTripleSamuraiGlow(actor);
    if (tripleGlow) {
        const p = 1 - tripleGlow.life / tripleGlow.maxLife;
        const strength = fadeInHoldOut(p);
        const pulse = Math.sin(performance.now() * 0.014) * 3;
        ctx.shadowColor = "#f5d060";
        ctx.shadowBlur = 10 + strength * 22 + pulse;
    } else if (actor.visualState === "hurt" && actor.health > 0) {
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

            const offsetX = (config.offsetX || 0) * scale;
            const offsetY = (config.offsetY || 0) * scale;

            ctx.drawImage(sprite, sourceX, 0, frameWidth, frameHeight, -(frameWidth * drawScale) / 2 + offsetX, -frameHeight * drawScale + offsetY, frameWidth * drawScale, frameHeight * drawScale);
        }
    }
    ctx.restore();
}

function getSpriteHeight(actor) {
    const characterConfig = window.animConfig?.[actor.charClass] || window.animConfig?.Knight;
    const config = characterConfig?.[actor.currentAnim] || characterConfig?.idle;
    const visualScale = actor.isBoss ? GAME_CONFIG.actor.bossScale : 1;

    if (config?.visualHeight) {
        return config.visualHeight * visualScale;
    }

    const sprite = loadedSprites[actor.charClass]?.[actor.currentAnim] || loadedSprites[actor.charClass]?.idle;
    return sprite ? sprite.height * 2 * visualScale : 80;
}

function drawHealthBar(actor, hpPercent, yOffset) {

    const width = actor.isBoss ? GAME_CONFIG.ui.healthBarWidth * 2 : GAME_CONFIG.ui.healthBarWidth;
    const height = actor.isBoss ? GAME_CONFIG.ui.healthBarHeight * 1.5 : GAME_CONFIG.ui.healthBarHeight;

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
    ctx.lineWidth = actor.isBoss ? 2 : 1;
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

    const labelX = actor.isEnemy ? 15 : -7;
    const labelY = 20;

    ctx.strokeText(actor.name || "???", labelX, labelY);
    ctx.fillText(actor.name || "???", labelX, labelY);

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

    const labelX = actor.isEnemy ? 15 : -7;
    const labelY = 38;

    ctx.strokeText(`🧪 x${actor.potions}`, labelX, labelY);
    ctx.fillText(`🧪 x${actor.potions}`, labelX, labelY);

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
        (actor.displayedHealth ?? actor.health) / actor.maxHealth;
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

function drawBlockEffects() {
    for (let i = blockEffects.length - 1; i >= 0; i--) {
        const effect = blockEffects[i];
        effect.life--;

        if (effect.life <= 0 || !effect.actor) {
            blockEffects.splice(i, 1);
            continue;
        }

        const progress = 1 - effect.life / effect.maxLife;
        const alpha = Math.sin(progress * Math.PI); // fades in, peaks, fades out
        const spriteHeight = getSpriteHeight(effect.actor);
        const centerX = effect.actor.x;
        const centerY = effect.actor.y - spriteHeight * 0.55;
        const radius = 18 + progress * 42;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Soft gold burst
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, "rgba(241, 196, 15, 0.85)");
        gradient.addColorStop(0.6, "rgba(241, 196, 15, 0.35)");
        gradient.addColorStop(1, "rgba(241, 196, 15, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Thin glowing ring
        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#f1c40f";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.68, 0, Math.PI * 2);
        ctx.stroke();

        // Shield glyph flash
        ctx.shadowBlur = 8;
        ctx.font = "bold 22px monospace";
        ctx.textAlign = "center";
        ctx.fillText("🛡️", centerX, centerY + 8);

        ctx.restore();
    }
}

function drawPowerSwipeEffects() {
    for (let i = powerSwipeEffects.length - 1; i >= 0; i--) {
        const effect = powerSwipeEffects[i];
        effect.life--;

        if (effect.life <= 0 || !effect.actor) {
            powerSwipeEffects.splice(i, 1);
            continue;
        }

        // The radial burst is just the activation flash — it only plays for the first
        // burstDuration frames, even though the effect (and the sprite's outline glow)
        // stays alive for the full swing + return.
        const elapsed = effect.maxLife - effect.life;
        if (elapsed > effect.burstDuration) continue;

        const burstProgress = elapsed / effect.burstDuration;
        const alpha = Math.sin(burstProgress * Math.PI);
        const spriteHeight = getSpriteHeight(effect.actor);
        const centerX = effect.actor.x;
        const centerY = effect.actor.y - spriteHeight * 0.5;
        const radius = 24 + burstProgress * 55;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Blue-violet arcane burst
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, "rgba(140, 92, 246, 0.9)");
        gradient.addColorStop(0.55, "rgba(90, 60, 220, 0.45)");
        gradient.addColorStop(1, "rgba(90, 60, 220, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing ring to sell the "charged strike" feel
        ctx.strokeStyle = "#8a5cff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#8a5cff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.62, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

function drawTripleSamuraiEffects() {
    for (let i = tripleSamuraiEffects.length - 1; i >= 0; i--) {
        const effect = tripleSamuraiEffects[i];
        effect.life--;

        if (effect.life <= 0 || !effect.actor) {
            tripleSamuraiEffects.splice(i, 1);
            continue;
        }

        const actor = effect.actor;
        const progress = 1 - effect.life / effect.maxLife;
        const alpha = fadeInHoldOut(progress, 0.04, 0.12) * 0.65;

        // Mirror the real actor's live animation state exactly
        const animKey = actor.currentAnim || 'idle';
        const charSprites = loadedSprites[actor.charClass];
        const characterConfig = window.animConfig?.[actor.charClass];
        const config = characterConfig?.[animKey] || characterConfig?.idle;
        const sprite = charSprites?.[animKey] || charSprites?.idle;

        if (!sprite?.loaded || !config) continue;

        const frameWidth = sprite.width / config.frames;
        const frameIndex = actor.frameIndex ?? 0;
        const drawScale = 2;
        const offsetX = (config.offsetX || 0);
        const offsetY = (config.offsetY || 0);

        // Clones flank the real actor — use actor.x so they follow the lunge
        const clonePositions = [actor.x - 72, actor.x + 72];

        for (const cx of clonePositions) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = "#f5d060";
            ctx.shadowBlur = 18;
            ctx.translate(cx, actor.y);
            // Same facing as player (player is not flipped, so no scale(-1,1))
            ctx.drawImage(
                sprite,
                frameIndex * frameWidth, 0,
                frameWidth, sprite.height,
                -(frameWidth * drawScale) / 2 + offsetX,
                -sprite.height * drawScale + offsetY,
                frameWidth * drawScale,
                sprite.height * drawScale
            );
            ctx.restore();
        }
    }
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

    drawBlockEffects();
    drawPowerSwipeEffects();
    drawTripleSamuraiEffects();
    
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

    for (let i = siphonEffects.length - 1; i >= 0; i--) {
        const effect = siphonEffects[i];
        effect.life--;

        if (effect.life <= 0 || !effect.fromActor || !effect.toActor) {
            siphonEffects.splice(i, 1);
            continue;
        }

        const progress = 1 - effect.life / effect.maxLife;
        const alpha = Math.sin(progress * Math.PI);

        const fromPos = getHealthBarCenter(effect.fromActor);
        const toPos = getHealthBarCenter(effect.toActor);
        const x1 = fromPos.x;
        const y1 = fromPos.y;
        const x2 = toPos.x;
        const y2 = toPos.y;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const segments = 24;
        for (let s = 0; s <= segments; s++) {
            const t = s / segments;
            const baseX = x1 + dx * t;
            const baseY = y1 + dy * t;
            const taper = Math.sin(t * Math.PI);
            const wave = Math.sin(t * Math.PI * 4 + effect.phase + progress * 12) * 10 * taper;
            const px = baseX + nx * wave;
            const py = baseY + ny * wave;
            if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
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

function getHealthBarCenter(actor) {
    const width = actor.isBoss ? GAME_CONFIG.ui.healthBarWidth * 2 : GAME_CONFIG.ui.healthBarWidth;
    const height = actor.isBoss ? GAME_CONFIG.ui.healthBarHeight * 1.5 : GAME_CONFIG.ui.healthBarHeight;
    const spriteHeight = getSpriteHeight(actor);
    const barTopY = -(spriteHeight + 8);

    return {
        x: actor.x,
        y: actor.y + barTopY + height / 2
    };
}

gameLoop();