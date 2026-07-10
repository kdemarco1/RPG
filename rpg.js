// RPG

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const startScreen = document.getElementById("startScreen");
const battleScreen = document.getElementById("battleScreen");
const nameInput = document.getElementById("nameInput");
const logBox = document.getElementById("log");

let selectedClass = "";

let classConfirmed = false;
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
    
    let classIcon = "";
    if (player.charClass === "Knight"){
        classIcon = "🛡️";
    }
    else if (player.charClass === "Magician"){
        classIcon = "🧙🏼‍♂️";
    }
    else if (player.charClass === "Archer"){
        classIcon = "🏹";
    }
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

// Character Class
class Character {
    constructor(name, health, attackRange, charClass, potions = 0) {
        this.name = name;
        this.health = health;
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

// Characters
let player = new Character("", 0, [0, 0], "", 0);
const enemy1 = new Character("Magician", getRandomInt(20, 24), [12, 20], "Magician", 0);
const enemy2 = new Character("Monster", getRandomInt(20, 35), [4, 10], "Monster", 0);

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

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);

async function startGame() {

    startScreen.style.display = "none";
    battleScreen.style.display = "block";

    await writeSlowly(
        `${player.name} the ${player.charClass} begins their adventure!`
    );
};
