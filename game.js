const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    ctx.fillText(actor.breathingAmplitude || player.name, actor.x, actor.y + 45);
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#7f8c8d'
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 410);
    ctx.lineTo(750, 410);
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
    requestAnimationFrame(gameLoop);
}
gameLoop();