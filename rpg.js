// RPG

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const startScreen = document.getElementById("startScreen");
const battleScreen = document.getElementById("battleScreen");
const nameInput = document.getElementById("nameInput");
const logBox = document.getElementById("log");

let selectedClass = "";

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

// Character Class
class Character {
    constructor(name, health, attackRange, charClass, potions = 0) {
        this.name = name;
        this.health = health;
        this.attackRange = attackRange; // Array: [min, max]
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
let player = new Character("", 0, [0, 0], "", 3);
const enemy1 = new Character("Magician", getRandomInt(20, 24), [12, 20], "Magician", 0);
const enemy2 = new Character("Monster", getRandomInt(20, 35), [4, 10], "Monster", 0);

// Main Game Loop
async function startGame() {
    console.clear();
    
    // 1. Setup Player
    player.name = prompt("Welcome to the RPG game! Please enter your character's name:") || "Hero";
    
    await writeSlowly(`Your character's name is ${player.name}!`);
    console.log("You now must choose your character's class. Each Class comes with 3 healing potions to use during battle.");
    console.log("Each class has different health and attack levels with the attack level changing each time you attack.\n");
    
    // 2. Class Selection
    while (true) {
        let choice = prompt("1. Knight\n2. Magician\n3. Archer\nPress I for more information about each class, or 1, 2, or 3 to choose your class.");
        
        if (choice && choice.toUpperCase() === "I") {
            console.clear();
            await writeSlowly("Knight: moderate health, high attack");
            await writeSlowly("Magician: low health, high attack");
            await writeSlowly("Archer: high health, low attack\n");
        } else if (choice === "1") {
            player.charClass = "Knight";
            player.health = getRandomInt(17, 26);
            player.attackRange = [12, 20];
            await writeSlowly("You have chosen to be a Knight!\n");
            await writeSlowly(`Your health is ${player.health} and your attack level is ${player.attackRange[0]}-${player.attackRange[1]}.`);
            break;
        } else if (choice === "2") {
            player.charClass = "Magician";
            player.health = getRandomInt(10, 20);
            player.attackRange = [14, 25];
            await writeSlowly("You have chosen to be a Magician!\n");
            await writeSlowly(`Your health is ${player.health} and your attack level is ${player.attackRange[0]}-${player.attackRange[1]}.`);
            break;
        } else if (choice === "3") {
            player.charClass = "Archer";
            player.health = getRandomInt(26, 34);
            player.attackRange = [3, 10];
            await writeSlowly("You have chosen to be an Archer!\n");
            await writeSlowly(`Your health is ${player.health} and your attack level is ${player.attackRange[0]}-${player.attackRange[1]}.`);
            break;
        } else {
            await writeSlowly("Invalid choice. Please choose 1, 2, or 3.\n");
        }
    }

    // 3. Fight or Flee
    await writeSlowly("\nThere are 2 enemies ahead!");
    
    while (true) {
        let startingChoice = prompt("Would you like to fight or flee?");
        if (startingChoice && startingChoice.toLowerCase() === "flee") {
            await writeSlowly(`${player.name} chose to flee! You live to fight another day.`);
            return; // Exits the game
        } else if (startingChoice && startingChoice.toLowerCase() === "fight") {
            await writeSlowly(`${player.name} chose to fight! Prepare for battle...`);
            await sleep(1000);
            break;
        } else {
            await writeSlowly("Invalid choice. Please choose 'fight' or 'flee'.");
        }
    }

    let currentEnemy = enemy1;
    
    if (currentEnemy.charClass === player.charClass) {
        await writeSlowly(`\n${player.name} sees another ${currentEnemy.name}!`);
    } else {
        await writeSlowly(`\n${player.name} sees a ${currentEnemy.name}!`);
    }

    // 4. Battle Loop
    while (true) {
        player.isDefending = false;
        
        let action = prompt(`Your Health: ${player.health} | Healing Potions: ${player.potions}\nEnemy's Health: ${currentEnemy.health}\n1. Attack\n2. Defend\n3. Heal\n\nEnter 1, 2, or 3:`);
        
        if (action === "1") {
            await player.attack(currentEnemy);
            await sleep(600);
        } else if (action === "2") {
            player.isDefending = true;
            await writeSlowly(`${player.name} braces for impact!`);
        } else if (action === "3") {
            if (player.potions > 0) {
                let healingAmount = getRandomInt(10, 20);
                player.health += healingAmount;
                player.potions -= 1;
                await writeSlowly(`${player.name} used a healing potion and restored ${healingAmount} health!`);
                await writeSlowly(`Current health: ${player.health}`);
                await writeSlowly(`Potions left: ${player.potions}`);
            } else {
                await writeSlowly("No healing potions left!");
            }
        } else {
            await writeSlowly("Invalid choice. Please choose 1, 2, or 3.");
            continue; // Restarts the loop to ask again
        }

        // Check if enemy is defeated
        if (currentEnemy.health <= 0) {
            await writeSlowly(`\nVictory! ${currentEnemy.name} has been defeated!`);
            
            if (currentEnemy === enemy1) {
                while (true) {
                    let challenge = prompt("Challenge the next foe? (Yes or No)");
                    if (challenge && challenge.toLowerCase() === "yes") {
                        await writeSlowly(`\n${player.name} chose to challenge the next foe...\n`);
                        currentEnemy = enemy2;
                        
                        if (currentEnemy.charClass === player.charClass) {
                            await writeSlowly(`${player.name} sees another ${currentEnemy.charClass}!`);
                        } else {
                            await writeSlowly(`${player.name} sees a ${currentEnemy.charClass}!`);
                        }
                        break;
                    } else if (challenge && challenge.toLowerCase() === "no") {
                        await writeSlowly(`\n${player.name} chose to flee! You live to fight another day. Game Over.`);
                        return; // Exits the game
                    } else {
                        await writeSlowly("Invalid choice. Please choose 'Yes' or 'No'.");
                    }
                }
                continue; // Skips the enemy attack phase and starts the next round
            } else {
                await writeSlowly(`All enemies have been defeated! Congratulations, ${player.name}, you win the game!`);
                break; // Ends the game loop
            }
        }

        // Enemy attacks player
        console.log("\n");
        await currentEnemy.attack(player);
        await sleep(600);

        // Check if player is defeated
        if (player.health <= 0) {
            await writeSlowly(`\nDefeat! ${player.name} has fallen in battle. Game over.`);
            break;
        }
    }
}

document.querySelectorAll(".classButton").forEach(button => {

    button.addEventListener("click", () => {
        selectedClass = button.dataset.class;
        document.getElementById("classDescription").textContent = `${selectedClass} selected!`;
    });
});

document.getElementById("startButton").addEventListener("click", () => {
    startGame();
});