const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const damagePopUps = [];

// Background Image
const backgroundImages = {
    Zombie: 'images/backgrounds/zombie.png',
    Ghoul: 'images/backgrounds/ghoul.png',
    Demon: 'images/backgrounds/demon.png',
    Basilisk: 'images/backgrounds/basilisk.png',
    Magician: 'images/backgrounds/magician.png',
    Boss: 'images/backgrounds/boss.png',
    default: 'images/backgrounds/default.png'
};

const loadedBackgrounds = {};

for (const key in backgroundImages) {

    loadedBackgrounds[key] = loadImage(
        backgroundImages[key],
        `Background failed to load for "${key}"`
    );

}
// Computes the source/dest rects for a "cover" fit + sway, then draws with the given alpha
function drawBackgroundImage(img, swayX, swayY, alpha) {
    if (!img || !img.loaded) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(swayX, swayY);
 
    const targetW = canvas.width;
    const targetH = canvas.height;
    const coverScale = Math.max(targetW / img.width, targetH / img.height);
    const sWidth = targetW / coverScale;
    const sHeight = targetH / coverScale;
    const sx = (img.width - sWidth) / 2;
    const sy = (img.height - sHeight) / 2;
    const swayScale = 1.06;
    const drawW = targetW * swayScale;
    const drawH = targetH * swayScale;
    const offsetX = (targetW - drawW) / 2;
    const offsetY = (targetH - drawH) / 2;
 
    ctx.drawImage(img, sx, sy, sWidth, sHeight, offsetX, offsetY, drawW, drawH);
    ctx.restore();
}
const portraits = {
        Knight: {
        idle: 'images/sprites/knight/Idle.png',
        attacking: 'images/sprites/knight/Run+Attack.png',
        hurt: 'images/sprites/knight/Hurt.png',
        defending: 'images/sprites/knight/Defend.png',
        dead: 'images/sprites/knight/Dead.png'
    },
    Magician: {
        idle: 'images/sprites/magician/Idle.png',
        attacking: 'images/sprites/magician/Attack.png',
        hurt: 'images/sprites/magician/Hurt.png',
        dead: 'images/sprites/magician/Dead.png'
    },
    Archer: '🏹',
    Zombie: '🧟',
    Minotaur: {
        idle: 'images/sprites/minotaur/Idle.png',
        attacking: 'images/sprites/minotaur/Attack.png',
        hurt: 'images/sprites/minotaur/Hurt.png',
        dead: 'images/sprites/minotaur/Dead.png'
    },
    Werewolf: {
        idle: 'images/sprites/werewolf/Idle.png',
        attacking: 'images/sprites/werewolf/Attack.png',
        hurt: 'images/sprites/werewolf/Hurt.png',
        dead: 'images/sprites/werewolf/Dead.png'
    },
    Skeleton: {
        idle: 'images/sprites/skeleton/Idle.png',
        attacking: 'images/sprites/skeleton/Attack.png',
        hurt: 'images/sprites/skeleton/Hurt.png',
        dead: 'images/sprites/skeleton/Dead.png'
    },
    Boss: '🐉'
};

const loadedSprites = {};
for (const charKey in portraits) {
    if (typeof portraits[charKey] === 'object') {
        loadedSprites[charKey] = {};
        for (const animKey in portraits[charKey]) {
            loadedSprites[charKey][animKey] = loadImage(
            portraits[charKey][animKey],`Sprite failed to load: ${charKey} -> ${animKey}`);
        }
    }
}

const animConfig = {
    idle:      { frames: 4, speed: 12 },
    attacking: { frames: 4, speed: 50 },
    hurt:      { frames: 2, speed: 50 },
    defending: { frames: 5, speed: 50 }
};

function updateAnimation(actor) {

    if (actor.frameIndex === undefined) {
        actor.frameIndex = 0;
        actor.tickCount = 0;
        actor.currentAnim = "idle";
    }

    let targetAnim = "idle";

    if (actor.visualState === "attacking")
        targetAnim = "attacking";
    else if (actor.visualState === "hurt" || actor.health <= 0)
        targetAnim = "hurt";
    else if (actor.visualState === "defending" || actor.isDefending)
        targetAnim = "defending";

    if (actor.currentAnim !== targetAnim) {

        actor.currentAnim = targetAnim;
        actor.frameIndex = 0;
        actor.tickCount = 0;

    }

    const config = animConfig[actor.currentAnim];

    if (!config) return;

    actor.tickCount++;

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

    if (
        !actor.isDefending &&
        actor.currentAnim === "defending" &&
        actor.visualState !== "defending"
    ) {

        actor.currentAnim = "idle";
        actor.frameIndex = 0;

    }

}

function updateState(actor) {

    if (actor.stateTimer > 0) {

        actor.stateTimer--;

        if (
            actor.stateTimer === 0 &&
            actor.visualState !== "dead"
        ) {

            actor.visualState = "idle";

        }

    }

}

function updateDamageEffects(actor) {

    if (actor.pendingDamageEffect !== undefined) {

        const isPlayer = actor === player;

        spawnDamagePopup(
            actor.baseX,
            actor.baseY,
            actor.pendingDamageEffect,
            isPlayer
        );

        delete actor.pendingDamageEffect;

        actor.isDefending = false;

    }

}

function updateMovement(actor, target) {

    if (actor.visualState === "attacking" && target) {

        actor.x =
            actor.baseX +
            (target.baseX - actor.baseX) *
                GAME_CONFIG.actor.lungeFactor;

    }
    else if (actor.visualState === "hurt") {

        actor.x =
            actor.baseX +
            (Math.random() - 0.5) *
                GAME_CONFIG.actor.shakeIntensity;

        actor.y = actor.baseY;

    }
    else if (actor.visualState === "dead") {

        actor.y +=
            (canvas.height + 100 - actor.y) * 0.1;

    }
    else {

        actor.x +=
            (actor.baseX - actor.x) *
            GAME_CONFIG.actor.returnSpeed;

        if (typeof portraits[actor.charClass] === "string") {

            const bob =
                Math.sin(
                    performance.now() *
                    GAME_CONFIG.actor.breathingSpeed
                ) *
                GAME_CONFIG.actor.breathingAmplitude;

            actor.y +=
                (actor.baseY + bob - actor.y) *
                GAME_CONFIG.actor.returnSpeed;

        }
        else {

            actor.y +=
                (actor.baseY - actor.y) *
                GAME_CONFIG.actor.returnSpeed;

        }

    }

}

function updateActor(actor, target) {
    if (!actor) return;
    updateAnimation(actor);
    updateState(actor);
    updateDamageEffects(actor);
    updateMovement(actor, target);
}

function drawSprite(actor, spriteAlpha, scale, rotation, yOffset) {

    ctx.save();

    ctx.translate(actor.x, actor.y + yOffset);

    ctx.rotate(rotation);

    ctx.scale(scale, scale);

    ctx.globalAlpha = spriteAlpha;

    if (actor.visualState === "hurt" && actor.health > 0) {
        ctx.shadowColor = "#e74c3c";
        ctx.shadowBlur = 20;
    }

    const charSprites = loadedSprites[actor.charClass];

    if (charSprites && actor.currentAnim) {

        const sprite = charSprites[actor.currentAnim];
        const config = animConfig[actor.currentAnim];

        if (sprite && sprite.loaded && config) {

            const frameWidth = sprite.width / config.frames;
            const frameHeight = sprite.height;

            const sourceX = actor.frameIndex * frameWidth;

            const drawScale = 2;

            ctx.drawImage(
                sprite,
                sourceX,
                0,
                frameWidth,
                frameHeight,
                -(frameWidth * drawScale) / 2,
                -(frameHeight * drawScale) / 2,
                frameWidth * drawScale,
                frameHeight * drawScale
            );

        }

    }

    const portrait = portraits[actor.charClass];

    if (typeof portrait === "string") {

        const halo = ctx.createRadialGradient(0, -32, 0, 0, -32, 25);

        halo.addColorStop(0, "#110c22");
        halo.addColorStop(0.6, "#110c22");
        halo.addColorStop(1, "rgba(17,12,34,0)");

        ctx.fillStyle = halo;

        ctx.beginPath();

        ctx.arc(0, -32, 25, 0, Math.PI * 2);

        ctx.fill();

        ctx.font = "64px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let xNudge = 0;

        if (
            actor === player &&
            /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        ) {
            xNudge = -4;
        }

        ctx.fillText(portrait, xNudge, -32);

    }

    ctx.restore();

}

function drawHealthBar(actor, hpPercent, yOffset) {

    const width = GAME_CONFIG.ui.healthBarWidth;
    const height = GAME_CONFIG.ui.healthBarHeight;

    ctx.save();

    ctx.translate(actor.x, actor.y + yOffset);

    const x = -width / 2;

    let spriteHeight = 64;

    const charSprites = loadedSprites[actor.charClass];

    if (charSprites && charSprites[actor.currentAnim]) {

        const sprite = charSprites[actor.currentAnim];

        if (sprite && sprite.loaded) {

            spriteHeight = sprite.height * 2;

        }
    }

    // place above the sprite
    const y = -(spriteHeight / 2) - 15;


    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle =
        hpPercent < 0.3
        ? "#e74c3c"
        : "#2ecc71";


    ctx.fillRect(
        x,
        y,
        width * hpPercent,
        height
    );


    ctx.strokeStyle = "#7f8c8d";

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.restore();
}

function drawActorName(actor, yOffset) {

    ctx.save();

    ctx.translate(actor.x, actor.y + yOffset);

    ctx.fillStyle = "#ecf0f1";

    ctx.font = "bold 14px monospace";

    ctx.textAlign = "center";

    ctx.fillText(
        actor.name || "???",
        0,
        22
    );

    ctx.restore();

}

function drawPotionCount(actor, yOffset) {

    if (actor.potions <= 0)
        return;

    ctx.save();

    ctx.translate(actor.x, actor.y + yOffset);

    ctx.fillStyle = "#a0d094";

    ctx.font = "bold 11px monospace";

    ctx.textAlign = "center";

    ctx.fillText(
        `🧪 x${actor.potions}`,
        0,
        38
    );

    ctx.restore();

}

function drawActor(actor) {

    if (!actor || actor.deathComplete)
        return;
    let shadowAlpha = 0.5;
    let spriteAlpha = 1;
    let rotation = 0;
    let yOffset = 0;
    const scale =
        actor.isBoss
            ? GAME_CONFIG.actor.bossScale
            : 1;
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
    drawActorName(
        actor,
        yOffset
    );
    drawPotionCount(
        actor,
        yOffset
    );
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    BackgroundManager.update(now);
    BackgroundManager.draw(now);
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
        velocityY: GAME_CONFIG.popup.velocityY,
        life: GAME_CONFIG.popup.lifetime
    });
}
gameLoop();