// RPG

// Constants
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const enemy_attack_delay = 600;
const next_foe_delay= 1000;
const text_delay_multiplier = 20;
const max_text_delay = 3000;
const max_enemies = 3;

// DOM References
const startScreen = document.getElementById('startScreen');
const battleScreen = document.getElementById('battleScreen');
const nameInput = document.getElementById('nameInput');
const logBox = document.getElementById('log');
const confirmClassButton = document.getElementById('confirmClassButton');
const beginAdventureButton = document.getElementById('beginAdventureButton');
const attackButton = document.getElementById('attackButton');
const defendButton = document.getElementById('defendButton');
const healButton = document.getElementById('healButton');

// Game Stats
let selectedClass = '';
let classConfirmed = false;
let enemiesDefeated = 0;
let currentEnemy;


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function writeSlowly(text, delayMultiplier = text_delay_multiplier) {
    const message = document.createElement("p");
    message.textContent = text;
    logBox.appendChild(message);
    logBox.scrollTop = logBox.scrollHeight;
    await sleep(Math.min(delayMultiplier * text.length, max_text_delay)); 
}

// Class Selection

const class_info = {
    Knight: {
        portrait: '🗡️',
        description: 'A powerful warrior who relies on armor and strength',
        stats: 'Health: Medium<br><br>Attack: Medium-High'
    },
    Magician: {
        portrait: '🧙🏼‍♂️',
        description: 'A spellcaster with devastating attacks',
        stats: 'Health: Low<br><br>Attack: High'
    },
    Archer: {
        portrait: '🏹',
        description: 'A ranged fighter with excellent survival',
        stats: 'Health: High<br><br>Attack: Low'
    }
};

const class_icons = {
    Knight: '🗡️',
    Magician: '🧙🏼‍♂️',
    Archer: '🏹'
};

function showClassInfo(className) {
    const info = class_info[className];
    if (!info) return;

    document.getElementById('selectedTitle').textContent = className;
    document.getElementById('portrait').textContent = info.portrait;
    document.getElementById('classDescription').textContent = info.description;
    document.getElementById('classStats').innerHTML = info.stats;
}

function updateCharacterCard() {
    const classIcon = class_icons[player.charClass] || '';

    document.getElementById("selectedTitle").textContent = player.name;
    document.getElementById("classDescription").innerHTML = 
        `<strong> ✔ Class Confirmed</strong><br><br>
        <strong>${classIcon}</strong> ${player.charClass}<br><br>
        <strong>❤️ </strong> ${player.health} HP<br><br>
        <strong>⚔️ </strong> ${player.attackRange[0]}-${player.attackRange[1]}<br><br>
        <strong>🧪 </strong> ${player.potions}`;
    document.getElementById("classStats").innerHTML = '';
    confirmClassButton.style.display = "none";
    beginAdventureButton.style.display = "inline-block";
    document.querySelectorAll(".classButton").forEach(button=>{button.disabled = true; });
    document.getElementById("portrait").style.display = "none";
}

// Restore class-selection screen after play again

function resetClassSelectionUI() {
    document.querySelectorAll('.classButton').forEach(button => {
        button.classList.remove('selected');
        button.disabled = false;
    });

    document.getElementById('portrait').style.display = '';
    document.getElementById('portrait').textContent = '';
    document.getElementById('selectedTitle').textContent = '';
    document.getElementById('classDescription').textContent = '';
    document.getElementById('classStats').innerHTML = '';

    confirmClassButton.style.display = 'none';
    beginAdventureButton.style.display = 'none';
    nameInput.value = '';
    selectedClass = '';
    classConfirmed = false;
}

// Character Class

class Character {
    constructor(name, health, attackRange, charClass, potions = 0) {
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.attackRange = attackRange;
        this.charClass = charClass;
        this.potions = potions;
        this.isDefending = false;
    }

    get attackLevel() {
        return getRandomInt(this.attackRange[0], this.attackRange[1]);
    }

    async attack(target) {
        let currentDamage = this.attackLevel;
        
        if (target.isDefending) {
            currentDamage = Math.floor(currentDamage / 2);
            await writeSlowly(`${target.name} blocked the attack from ${this.name}! ${target.name} takes ${currentDamage} damage.`);
        } else if (target === player) {
            await writeSlowly(`${this.name} attacks you, dealing ${currentDamage} damage.`);
        } else {
            await writeSlowly(`${this.name} attacks the ${target.name}, dealing ${currentDamage} damage.`);
        }
        
        await target.takeDamage(currentDamage);
    }

    async takeDamage(damageValue) {
        this.health = Math.max(0, this.health - damageValue);
        await writeSlowly(`${this.name}'s health is now ${this.health}`);
    }
}

let player = new Character('', 0, [0, 0], '', 0);

const enemyLibrary = [
    {name: 'Magician', healthRange: [40,48], attackRange: [14, 20], charClass: 'Magician'},
    {name: 'Zombie', healthRange: [32,40], attackRange: [6, 12], charClass: 'Zombie'},
    {name: 'Ghoul', healthRange: [24,48], attackRange: [6, 14], charClass: 'Ghoul'},
    {name: 'Mimic', healthRange: [38,48], attackRange: [10, 22], charClass: 'Mimic'},
    {name: 'Basilisk', healthRange: [40,48], attackRange: [12, 20], charClass: 'Basilisk'},
];

const playerConfigs = {
    Knight: {healthRange: [45,55], attackRange: [8, 13], potions: 3},
    Magician: {healthRange: [30, 40], attackRange: [12, 20], potions: 5},
    Archer: {healthRange: [50, 60], attackRange: [6, 12], potions: 2}
};

function initPlayer(name, charClass) {
    const config = playerConfigs[charClass];
    const hp = getRandomInt(config.healthRange[0], config.healthRange[1]);
    const finalName = name.trim();
    return new Character(finalName, hp, config.attackRange, charClass, config.potions);
}

function spawnRandomEnemy(){
    const template = enemyLibrary[Math.floor(Math.random() * enemyLibrary.length)];
    const health = getRandomInt(template.healthRange[0], template.healthRange[1]);
    return new Character(template.name, health, template.attackRange, template.charClass, 0);
}

// Class Selection listeners

document.querySelectorAll('.classButton').forEach(button => {
    button.addEventListener('click', () => {
        selectedClass = button.dataset.class;
        document.querySelectorAll('.classButton').forEach(b => b.classList.remove('selected'));
        button.classList.add('selected');
        showClassInfo(selectedClass);
        confirmClassButton.style.display = 'inline-block';
        confirmClassButton.textContent = `Confirm ${selectedClass}`;
    });
});

confirmClassButton.addEventListener('click', () => {
    if (classConfirmed || !selectedClass) return;
    classConfirmed = true;
    player = initPlayer(nameInput.value, selectedClass);
    updateCharacterCard();
});

// Battle UI

function updateBattleUI(){
    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerHealth').textContent = player.health;
    document.getElementById('playerPotions').textContent = player.potions;
    document.getElementById('enemyName').textContent = currentEnemy.name;
    document.getElementById('enemyHealth').textContent = currentEnemy.health

    const playerPercent = player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0;
    const enemyPercent = currentEnemy.maxHealth > 0 ? (currentEnemy.health / currentEnemy.maxHealth) * 100: 0;

    document.getElementById('playerHealthBar').style.width = playerPercent + '%';
    document.getElementById('enemyHealthBar').style.width = enemyPercent + '%';
    document.getElementById('playerHealthBar').style.backgroundColor = playerPercent < 30 ? '#e74c3c' : '#2ecc71';
    document.getElementById('enemyHealthBar').style.backgroundColor = enemyPercent < 30 ? '#e74c3c' : '#2ecc71';
}

function toggleButtons(disabled){
    attackButton.disabled = disabled;
    defendButton.disabled = disabled;
    healButton.disabled = disabled;
}

function showActionButtons(visible) {
    const display = visible ? 'inline-block' : 'none';
    attackButton.style.display = display;
    defendButton.style.display = display;
    healButton.style.display = display;
}

beginAdventureButton.addEventListener('click', startGame);

async function startGame() {
    startScreen.style.display = 'none';
    battleScreen.style.display = 'block';
    await writeSlowly(`${player.name} the ${player.charClass} begins their adventure!`);
    startEncounter(spawnRandomEnemy());
}

async function startEncounter(enemy){
    currentEnemy = enemy
    updateBattleUI();
    
    const enemyType = currentEnemy.charClass === player.charClass ? "another" : "a";
    await writeSlowly(`${player.name} sees ${enemyType} ${currentEnemy.name}!`);
    toggleButtons(false);
}

async function enemyTurn(){
    await sleep(enemy_attack_delay);
    await currentEnemy.attack(player);
    updateBattleUI();

    if (player.health <= 0){
        await writeSlowly(`Defeat! ${player.name} has fallen in battle Game over.`);
        showActionButtons(false);
        document.getElementById('playAgainButton').style.display = 'inline-block';
    }
    else {
        toggleButtons(false);
    }
}

async function handleEnemyDefeat(){
    await writeSlowly(`Victory! ${currentEnemy.name} has been defeated!`);
    enemiesDefeated++;

    if (enemiesDefeated < max_enemies){
        await writeSlowly(`Will you challenge the next foe or flee?`);
        showActionButtons(false);
        document.getElementById('choiceButtons').style.display = 'block';
    } else {
        await writeSlowly(`All enemies have been defeated! Congratulations, ${player.name}, you win!`);
        toggleButtons(true);
        document.getElementById('playAgainButton').style.display = 'inline-block';
    }
}

document.getElementById('nextFoeButton').addEventListener('click', async () => {
    document.getElementById('choiceButtons').style.display = 'none';
    showActionButtons(true);

    await writeSlowly(`${player.name} bravely steps forward and challenges the next foe!`)
    await sleep(next_foe_delay);
    startEncounter(spawnRandomEnemy());
});

document.getElementById('fleeButton').addEventListener('click', async () => {
    await writeSlowly(`${player.name} chose to flee! You live to fight another day`);
    document.getElementById('choiceButtons').style.display = 'none';
    document.getElementById('playAgainButton').style.display = 'inline-block';
});

attackButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;
    await player.attack(currentEnemy);
    updateBattleUI();

    if (currentEnemy.health <= 0) {
        await handleEnemyDefeat();
    } else {
        await enemyTurn();
    }
});

defendButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = true;

    await writeSlowly(`${player.name} brace for impact! Damage will be halved.`);
    await enemyTurn();
});

healButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;
    
    if (player.potions > 0) {
        const healingAmount = getRandomInt(15, 25);
        player.health = Math.min(player.health + healingAmount, player.maxHealth);
        player.potions -= 1;

        await writeSlowly(`${player.name} used a healing potion and restored ${healingAmount} health!`)
        updateBattleUI();
        await enemyTurn();
    } else {
        await writeSlowly('No healing potions left!')
        toggleButtons(false)
    }
});

// Reset/Play Again

function resetGame() {
    battleScreen.style.display = 'none';
    startScreen.style.display = '';
    document.getElementById('playAgainButton').style.display = 'none';
    document.getElementById('choiceButtons').style.display = 'none';
    logBox.innerHTML = '';

    showActionButtons(true);
    resetClassSelectionUI();

    enemiesDefeated = 0;
    player = new Character('', 0, [0,0], '', 0);
    currentEnemy = undefined;
}

document.getElementById('playAgainButton').addEventListener('click', resetGame);