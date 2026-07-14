// RPG

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const startScreen = document.getElementById("startScreen");
const battleScreen = document.getElementById("battleScreen");
const nameInput = document.getElementById("nameInput");
const logBox = document.getElementById("log");
let selectedClass = "";
let classConfirmed = false;
let enemiesDefeated = 0;
let maxEnemies = 3;
const confirmClassButton = document.getElementById("confirmClassButton")


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function writeSlowly(text, delayMultiplier = 20) {
    let message = document.createElement("p");
    message.textContent = text;
    logBox.appendChild(message);
    logBox.scrollTop = logBox.scrollHeight;
    await sleep(delayMultiplier * text.length); 
}

function showClassInfo(className){

    const title = document.getElementById("selectedTitle");
    const portrait = document.getElementById("portrait")
    const description = document.getElementById("classDescription");
    const stats = document.getElementById("classStats");

    if (className === "Knight"){
        title.textContent = "Knight";
        portrait.textContent = "🗡️";
        description.textContent = "A powerful warrior who relies on armor and strength";
        stats.innerHTML = "Health: Medium<br><br>Attack: Medium-High";
    }
        
    if (className === "Magician"){
        title.textContent = "Magician";    
        portrait.textContent = "🧙🏼‍♂️";
        description.textContent = "A spellcaster with devastating attacks";
        stats.innerHTML = "Health: Low<br><br>Attack: High";
        }

    if (className === "Archer"){
        title.textContent = "Archer";
        portrait.textContent = "🏹";
        description.textContent = "A ranged fighter with excellent survival";
        stats.innerHTML = "Health: High<br><br>Attack: Low";
        }
};

function updateCharacterCard(){
    
    const icons = {
        'Knight': '🛡️',
        'Magician': '🧙🏼‍♂️',
        'Archer': '🏹'
    };

    let classIcon = icons[player.charClass] || '';

    document.getElementById("selectedTitle").textContent = player.name;
    document.getElementById("classDescription").innerHTML = 
        `<strong> ✔ Class Confirmed</strong><br><br>
        <strong>${classIcon}</strong> ${player.charClass}<br><br>
        <strong>❤️ </strong> ${player.health} HP<br><br>
        <strong>⚔️ </strong> ${player.attackRange[0]}-${player.attackRange[1]}<br><br>
        <strong>🧪 </strong> ${player.potions}`;
    document.getElementById("classStats").innerHTML =
        ``;
    confirmClassButton.style.display = "none";
    document.getElementById("beginAdventureButton").style.display = "inline-block";
    document.querySelectorAll(".classButton").forEach(button=>{button.disabled = true;});
    document.getElementById("portrait").style.display = "none";
}

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
        this.health -= damageValue;
        if (this.health < 0) this.health = 0;
        await writeSlowly(`${this.name}'s health is now ${this.health}`);
    }
}
let player = new Character("", 0, [0, 0], "", 0);
const enemyLibrary = [
    {name: "Magician", healthRange: [20,24], attackRange: [12, 20], charClass: "Magician"},
    {name: "Zombie", healthRange: [16,20], attackRange: [4, 10], charClass: "Zombie"},
    {name: "Ghoul", healthRange: [12,24], attackRange: [6, 16], charClass: "Ghoul"},
    {name: "Mimic", healthRange: [14,24], attackRange: [10, 22], charClass: "Mimic"},
    {name: "Basilisk", healthRange: [20,24], attackRange: [16, 22], charClass: "Basilisk"},
]

document.querySelectorAll(".classButton").forEach(button => {

    button.addEventListener("click", () => {
        selectedClass = button.dataset.class;
        document.querySelectorAll(".classButton").forEach(button => {button.classList.remove("selected");
        });
        button.classList.add("selected");
        showClassInfo(selectedClass);
        confirmClassButton.style.display = "inline-block";
        confirmClassButton.textContent = `Confirm ${selectedClass}`;
    });
});

confirmClassButton.addEventListener("click",()=>{
    classConfirmed = true;
    player.name = nameInput.value;
    player.charClass = selectedClass;

    if (selectedClass === "Knight"){
        player.health = getRandomInt(17,26);
        player.attackRange = [12,20];
        player.potions = 3;
    }
    else if (selectedClass === "Magician"){
        player.health = getRandomInt(10,20);
        player.attackRange = [14,25];
        player.potions = 5;
    }
    else{
        player.health = getRandomInt(26,34);
        player.attackRange = [3,10];
        player.potions = 3;
    }
    updateCharacterCard();
});

let currentEnemy;
const attackButton = document.getElementById("attackButton");
const defendButton = document.getElementById("defendButton");
const healButton = document.getElementById("healButton");

function updateBattleUI(){
    document.getElementById("playerName").textContent = player.name;
    document.getElementById("playerHealth").textContent = player.health;
    document.getElementById("playerPotions").textContent = player.potions;
    document.getElementById("enemyName").textContent = currentEnemy.name;
    document.getElementById("enemyHealth").textContent = currentEnemy.health

    const playerPercent = player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0;
    const enemyPercent = player.maxHealth > 0 ? (currentEnemy.health / currentEnemy.maxHealth) * 100: 0;

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

const beginAdventureButton = document.getElementById("beginAdventureButton");
beginAdventureButton.addEventListener("click", startGame);

async function startGame() {
    player.name = nameInput.value;
    player.charClass = selectedClass;
    player.maxHealth = player.health;

    if (selectedClass === 'Knight'){
        player.health = getRandomInt(17, 26);
        player.attackRange = [12, 20];
    } else if (selectedClass === "Magician"){
        player.health = getRandomInt(10, 20);
        player.attackRange = [14, 25];
    } else if (selectedClass === "Archer"){
        player.health = getRandomInt(26, 34);
        player.attackRange = [3,10];
    }
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("battleScreen").style.display = "block";
    await writeSlowly(
        `${player.name} the ${player.charClass} begins their adventure!`
    );
    currentEnemy = spawnRandomEnemy();
    startEncounter(currentEnemy);
    updateBattleUI();
};

async function startEncounter(enemy){
    currentEnemy = enemy
    updateBattleUI();
    
    let enemyType = currentEnemy.charClass === player.charClass ? "another" : "a";
    await writeSlowly(`${player.name} sees ${enemyType} ${currentEnemy.name}!`);
    toggleButtons(false);
}


async function enemyTurn(){

    await sleep(600);
    await currentEnemy.attack(player);
    updateBattleUI();

    if (player.health <= 0){
        await writeSlowly(`Defeat! ${player.name} has fallen in battle Game over.`);
        document.getElementById('attackButton').style.display = 'none';
        document.getElementById('defendButton').style.display = 'none';
        document.getElementById('healButton').style.display = 'none';
        document.getElementById('playAgainButton').style.display = 'inline-block';
    }
    else {
        toggleButtons(false);
    }
}

async function handleEnemyDefeat(){
    await writeSlowly(`Victory! ${currentEnemy.name} has been defeated!`);

    enemiesDefeated++;

    if (enemiesDefeated < maxEnemies){
        await writeSlowly(`Will you challenge the next foe or flee?`);
        attackButton.style.display = 'none';
        defendButton.style.display = 'none';
        healButton.style.display = 'none';

        document.getElementById('choiceButtons').style.display = 'block';
    }
    else {
        await writeSlowly(`All enemies have been defeated! Congratulations, ${player.name}, you win!`);
        toggleButtons(true);
        document.getElementById('playAgainButton').style.display = 'inline-block';
    }
}

document.getElementById('nextFoeButton').addEventListener('click', async () => {
    document.getElementById('choiceButtons').style.display = 'none';
    attackButton.style.display = 'inline-block';
    defendButton.style.display = 'inline-block';
    healButton.style.display = 'inline-block';

    await writeSlowly(`${player.name} bravely steps forward and challenges the next foe!`)
    await sleep(1000);
    startEncounter(enemy2);
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

    if (currentEnemy.health <= 0){
        await handleEnemyDefeat();
    }
    else {
        await enemyTurn();
    }
});

defendButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;

    await writeSlowly(`${player.name} brace for impact! Damage will be halved.`);
    await enemyTurn();
});

healButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;
    
    if (player.potions > 0){
        let healingAmount = getRandomInt(10, 20);
        player.health += Math.min(player.health + healingAmount, player.maxHealth);
        player.potions -= 1;

        await writeSlowly(`${player.name} used a healing potion and restored ${healingAmount} health!`)
        updateBattleUI();
        await enemyTurn();
    }
    else {
        await writeSlowly('No healing potions left!')
        toggleButtons(false)
    }
});

function spawnRandomEnemy(){
    const template = enemyLibrary[Math.floor(Math.random() * enemyLibrary.length)];
    const health = getRandomInt(template.healthRange[0], template.healthRange[1]);
    return new Character(template.name, health, template.attackRange, template.charClass, 0);
};

function resetGame() {
    battleScreen.style.display = 'none';
    document.getElementById('startScreen').style.display = 'inline-block';
    document.getElementById('battleScreen').style.display = 'none';
    document.getElementById('playAgainButton').style.display = 'none';
    enemy1.health = enemy1.maxHealth;
    currentEnemy = spawnRandomEnemy();
    updateBattleUI();
};

document.getElementById('playAgainButton').addEventListener('click', resetGame);