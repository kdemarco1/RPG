// RPG

// Constants
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const enemy_attack_delay = 1000;
const next_foe_delay= 1800;
let text_delay_multiplier = 35;
const max_text_delay = 4000;
const boss_interval = 3;
let bossesDefeated = 0;
const character_lift = 40;
const xp_per_level = 30;
const defend_block_chance = 0.75;
const defend_damage_multiplier_range = [0.15, 0.35]; // fraction of damage that still gets through on a successful block
const defend_allowed_classes = ['Knight', 'Magician', 'Samurai'];
const gameSettings = {
    textSpeed: 'normal',
    difficulty: 'normal',
    screenShake: true,
    confetti: true,
    soundVolume: 50
};
const textSpeedValues = { slow: 55, normal: 35, fast: 15 };
const difficultyMultipliers = { easy: 0.6, normal: 1, hard: 1.5 };
const difficultyScaleStep = { easy: 0.15, normal: 0.4, hard: 0.7 };
// Player-side difficulty tuning: Easy makes the hero tougher/faster-leveling, Hard makes survival tighter
const playerDifficultyModifiers = {
    easy:   { healthMult: 1.2,  xpMult: 1.25, healMult: 1.15 },
    normal: { healthMult: 1,    xpMult: 1,    healMult: 1 },
    hard:   { healthMult: 0.85, xpMult: 0.8,  healMult: 0.8 }
};

function getPlayerDifficultyMods() {
    return playerDifficultyModifiers[gameSettings.difficulty] ?? playerDifficultyModifiers.normal;
}

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
const victoryScreen = document.getElementById('victoryScreen');
const victoryMessage = document.getElementById('victoryMessage');
const victoryPlayAgainButton = document.getElementById('victoryPlayAgainButton');
const defeatScreen = document.getElementById('defeatScreen');
const defeatMessage = document.getElementById('defeatMessage');
const defeatPlayAgainButton = document.getElementById('defeatPlayAgainButton');
const fleeScreen = document.getElementById('fleeScreen');
const fleeMessage = document.getElementById('fleeMessage');
const fleePlayAgainButton = document.getElementById('fleePlayAgainButton');
const levelUpOverlay = document.getElementById('levelUpOverlay');
const chooseAttackButton = document.getElementById('chooseAttackButton');
const chooseDefenseButton = document.getElementById('chooseDefenseButton');
const chooseHealButton = document.getElementById('chooseHealButton');
const continueAdventureButton = document.getElementById('continueAdventureButton');
const mainMenu = document.getElementById('mainMenu');
const startGameMenuButton = document.getElementById('startGameMenuButton');
const openSettingsButton = document.getElementById('openSettingsButton');
const settingsScreen = document.getElementById('settingsScreen');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const textSpeedSelect = document.getElementById('textSpeedSelect');
const difficultySelectStart = document.getElementById('difficultySelectStart');
const screenShakeToggle = document.getElementById('screenShakeToggle');
const confettiToggle = document.getElementById('confettiToggle');
const volumeSlider = document.getElementById('volumeSlider');
const backToMenuButton = document.getElementById('backToMenuButton');
const loreScreen = document.getElementById('loreScreen');
const loreTitle = document.getElementById('loreTitle');
const loreText = document.getElementById('loreText');
const loreAbilities = document.getElementById('loreAbilities');
const loreSkipButton = document.getElementById('loreSkipButton');
const loreBeginButton = document.getElementById('loreBeginButton');

// Game Stats
let selectedClass = '';
let classConfirmed = false;
let enemiesDefeated = 0;
let currentEnemy;


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function writeSlowly(text, delayMultiplier = text_delay_multiplier) {
    logBox.textContent = text;
    await sleep(Math.min(delayMultiplier * text.length, max_text_delay)); 
}

// Class Selection
const class_info = {
    Knight: {
        portrait: '🗡️',
        description: 'A powerful warrior who relies on armor and strength',
        stats: 'Health: High<br><br>Attack: Medium-High'
    },
    Magician: {
        portrait: '🧙🏼‍♂️',
        description: 'A spellcaster with devastating attacks',
        stats: 'Health: Low<br><br>Attack: High'
    },
    Samurai: {
        portrait: '🥷🏻',
        description: 'An adaptable warrior wielding reliable offensive strikes and moderate resilience',
        stats: 'Health: Medium<br><br>Attack: Medium'
    }
};

const class_icons = {
    Knight: '🗡️',
    Magician: '🧙🏼‍♂️',
    Samurai: '🥷🏻'
};

// Lore intro screen — class-specific story beats and ability blurbs
const classLore = {
    Knight: [
        "The kingdom's outer villages have gone quiet — too quiet.",
        "Farmers speak of shapes moving at the treeline where no shapes should be.",
        "You were trained for exactly this moment: to stand between darkness and the innocent.",
        "Shield raised and faith unshaken, you set out toward the borderlands."
    ],
    Magician: [
        "The old tomes warned of a rot spreading beneath the hills.",
        "Your masters dismissed it as superstition — until the messengers stopped returning.",
        "You alone answered the call, spellbook bound tight against your hip.",
        "Whatever waits in the dark has never faced power quite like yours."
    ],
    Samurai: [
        "Your clan's banner has not flown in open battle for a generation.",
        "But the reports from the eastern road can no longer be ignored.",
        "You sharpen your blade in silence, recalling your teacher's final lesson.",
        "Discipline. Patience. Strike only when the moment is true."
    ]
};

const classAbilityInfo = {
    attack: { icon: '⚔️', label: 'Attack', desc: 'Strike your foe for damage based on your weapon and level.' },
    defend: { icon: '🛡️', label: 'Defend', desc: 'Brace for the blow — a good chance to block most of the damage, then strike back.' },
    heal: { icon: '🧪', label: 'Heal', desc: 'Drink a potion to restore health mid-battle.' }
};

function getClassAbilities(charClass) {
    const abilities = ['attack'];
    if (defend_allowed_classes.includes(charClass)) abilities.push('defend');
    if ((playerConfigs[charClass]?.potions ?? 0) > 0) abilities.push('heal');
    return abilities;
}

function showClassInfo(className) {
    const info = class_info[className];
    if (!info) return;

    document.getElementById('selectedTitle').textContent = className;
    document.getElementById('portrait').textContent = info.portrait;
    document.getElementById('classDescription').textContent = info.description;
    document.getElementById('classStats').innerHTML = info.stats;
    document.getElementById('heroSetup').style.display = 'block';
}

function updateCharacterCard() {
    const classIcon = class_icons[player.charClass] || '';

    document.getElementById("selectedTitle").textContent = player.name;
    document.getElementById("classDescription").innerHTML = 
        `<strong> ✔ Class Confirmed</strong><br><br>
        <strong>${classIcon}</strong> ${player.charClass}<br><br>
        <strong>❤️ </strong> ${player.health} HP<br><br>
        <strong>⚔️ </strong> ${player.attackRange[0]}-${player.attackRange[1]}<br><br>
        <strong>🧪 </strong> ${player.potions}<br><br>
        <strong>🎚️ </strong> ${gameSettings.difficulty}`;
    document.getElementById("classStats").innerHTML = '';
    document.getElementById("heroSetup").style.display = "none";
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
    document.getElementById('selectedTitle').textContent = 'Select a class above to begin';
    document.getElementById('classDescription').textContent = '';
    document.getElementById('classStats').innerHTML = '';
    document.getElementById('heroSetup').style.display = 'none';
    difficultySelectStart.value = 'normal';

    beginAdventureButton.style.display = 'none';
    nameInput.value = '';
    nameInput.classList.remove('inputError');
    nameInput.placeholder = 'Enter hero name';
    selectedClass = '';
    classConfirmed = false;
}
// Character Class

class Character {
    constructor(name, health, attackRange, charClass, potions = 0, baseX = 0, baseY = 0) {
        this.name = name;
        this.baseMaxHealth = health;
        this.health = health;
        this.maxHealth = health;
        this.baseAttackRange = [...attackRange];
        this.attackRange = attackRange;
        this.charClass = charClass;
        this.potions = potions;
        this.isDefending = false;
        this.lastDefendBlocked = false;
        this.x = baseX;
        this.y = baseY;
        this.baseX = baseX;
        this.baseY = baseY;
        this.isEnemy = false;
        this.visualState = 'idle';
        this.stateTimer = 0;
        this.totalXP = 0;
        this.hitsThisFight = 0;
        this.bonusAttack = 0;
        this.bonusDefense = 0;
        this.poison = null;
    }

    get attackLevel() {
        return getRandomInt(this.attackRange[0], this.attackRange[1]);
    }

    get level() {
        return 1 + Math.floor(this.totalXP / xp_per_level);
    }

    get currentLevelProgress() {
        return this.totalXP % xp_per_level;
    }

    recalculateStats() {
        const attackBonus = Math.floor(this.totalXP * 0.06) + this.bonusAttack;

        this.attackRange = [
            this.baseAttackRange[0] + attackBonus,
            this.baseAttackRange[1] + attackBonus
        ];
}

    async applyLevelUpChoice(choice) {
        if (choice === 'attack') {
            this.bonusAttack += 3;
            this.recalculateStats();
            await writeSlowly(`${this.name}'s attack power increased!`);
        } else if (choice === 'defense') {
            this.bonusDefense += 3;
            await writeSlowly(`${this.name}'s defense increased!`);
        } else if (choice === 'heal') {
            this.health = this.maxHealth;
            await writeSlowly(`${this.name} was fully healed!`);
        }
        updateBattleUI();
    }
    
    async gainXP(amount) {
        const oldLevel = this.level;
        const oldXP = this.totalXP;
        this.totalXP += amount;
        this.recalculateStats();

        await writeSlowly(`${this.name} gained ${amount} XP!`);
        await animateXpBar(oldXP, this.totalXP);

        const levelsGained = this.level - oldLevel;
        for (let i = 0; i < levelsGained; i++) {
            await writeSlowly(`${this.name} reached Level ${oldLevel + i + 1}!`);
            if (this === player) {
                const choice = await promptLevelUpChoice();
                await this.applyLevelUpChoice(choice);
            }
        }
    }

    async attack(target, isFollowUp = false) {
    let currentDamage = this.attackLevel;
    this.visualState = 'attacking';

    const attackConfig = window.animConfig?.[this.charClass]?.attacking;
    this.stateTimer = attackConfig ? attackConfig.frames * attackConfig.speed : 15;

    const behavior = enemyBehaviors[this.charClass];
    let blockedByDefense = false;

    if (target.isDefending) {
        const blockSuccess = Math.random() < defend_block_chance;
        target.lastDefendBlocked = blockSuccess;

        if (blockSuccess) {
            blockedByDefense = true;
            const [minMult, maxMult] = defend_damage_multiplier_range;
            const mult = minMult + Math.random() * (maxMult - minMult);
            currentDamage = Math.max(1, Math.floor(currentDamage * mult));
            spawnBlockEffect(target);
            await writeSlowly(`${target.name} blocks the attack from ${this.name}! Only ${currentDamage} damage gets through.`);
        } else {
            await writeSlowly(`${target.name} tries to block, but ${this.name} breaks through the guard! ${target.name} takes ${currentDamage} damage.`);
        }
    } else if (target === player) {
        await writeSlowly(`${this.name} attacks you, dealing ${currentDamage} damage.`);
    } else {
        await writeSlowly(`${this.name} attacks the ${target.name}, dealing ${currentDamage} damage.`);
    }

    await target.takeDamage(currentDamage);

    // Skeleton
    if (blockedByDefense && behavior?.counterChance && target.health > 0 && Math.random() < behavior.counterChance) {
        await writeSlowly(`${this.name} sees an opening and counters!`);
        await target.takeDamage(this.attackLevel);
    }

    // Gorgon
    if (behavior?.poisonChance && target.health > 0 && Math.random() < behavior.poisonChance) {
        const poisonDamage = Math.max(2, Math.round(currentDamage * 0.3));
        target.poison = { turnsLeft: 3, damagePerTurn: poisonDamage };
        await writeSlowly(`${target.name} has been poisoned!`);
    }

    // Werewolf
    if (behavior?.doubleAttack && !isFollowUp && target.health > 0) {
        await writeSlowly(`${this.name} lunges again for a second strike!`);
        await this.attack(target, true);
    }
}

    async siphon(target) {
        const siphonAmount = getRandomInt(12, 24);
        const actualDrain = Math.min(siphonAmount, target.health);

        spawnSiphonEffect(target, this, 110);

        target.pendingDamageEffect = actualDrain;
        await target.takeDamage(actualDrain);

        this.health = Math.min(this.health + actualDrain, this.maxHealth);
        this.pendingDamageEffect = `+${actualDrain}`;

        await writeSlowly(`${this.name} siphons ${actualDrain} health from ${target.name}!`);
}

    async takeDamage(damageValue) {
        if (!Number.isFinite(damageValue)) {
            console.error('NaN damage blocked!', { source: this.name, damageValue });
            damageValue = 0;
        }
        const mitigatedDamage = Math.max(1, Math.round(damageValue - this.bonusDefense));
        this.health = Math.max(0, this.health - mitigatedDamage);
        this.pendingDamageEffect = mitigatedDamage;

            if (this.health <= 0) {
                this.visualState = 'dead';
                this.deathTimer = 0;
                this.deathComplete = false;
            } else {
                this.visualState = 'hurt';
                this.stateTimer = 20;
            }
    await writeSlowly(`${this.name}'s health is now ${this.health}`);
}

    async tickPoison() {
        if (!this.poison || this.poison.turnsLeft <= 0) return;
        const dmg = this.poison.damagePerTurn;
        await writeSlowly(`${this.name} suffers ${dmg} poison damage!`);
        await this.takeDamage(dmg);
        this.poison.turnsLeft--;
        if (this.poison.turnsLeft <= 0) {
                this.poison = null;
        }
    }
}

let player = new Character('', 0, [0, 0], '', 0);

const enemyLibrary = [
    {name: 'Magician', healthRange: [40,48], attackRange: [14, 20], charClass: 'Magician', potions: 3},
    {name: 'Gorgon', healthRange: [32,40], attackRange: [6, 12], charClass: 'Gorgon', potions: 1},
    {name: 'Minotaur', healthRange: [24,48], attackRange: [6, 14], charClass: 'Minotaur', potions: 0},
    {name: 'Werewolf', healthRange: [38,48], attackRange: [10, 22], charClass: 'Werewolf', potions: 0},
    {name: 'Skeleton', healthRange: [40,48], attackRange: [12, 20], charClass: 'Skeleton', potions: 0},
];

const enemyBehaviors = {
    Werewolf: { doubleAttack: true },
    Skeleton: { counterChance: 0.35 },
    Gorgon: { poisonChance: 0.4 },
    Magician: { siphonChance: 0.35 },
};

const bossTemplate = {
    name: 'Ignis, The Beacon of False Hope',
    healthRange: [220, 260],
    attackRange: [30, 44],
    charClass: 'Boss',
    potions: 1
};

// The first boss is capped regardless of difficulty so a fresh, low-level hero always has a
// realistic shot at it. Every boss after that fully respects the chosen difficulty scaling.
const first_boss_scale_cap = 0.85;

function spawnBoss(bossNumber) {
    const baseDifficultyMult = difficultyMultipliers[gameSettings.difficulty] ?? 1;
    const scaleStep = difficultyScaleStep[gameSettings.difficulty] ?? 0.4;
    let difficultyScale = (1 + (bossNumber - 1) * scaleStep) * baseDifficultyMult;

    if (bossNumber === 1) {
        difficultyScale = Math.min(difficultyScale, first_boss_scale_cap);
    }

    const health = Math.round(getRandomInt(bossTemplate.healthRange[0], bossTemplate.healthRange[1]) * difficultyScale);
    const attackRange = [
        Math.round(bossTemplate.attackRange[0] * difficultyScale),
        Math.round(bossTemplate.attackRange[1] * difficultyScale)
    ];
    const bossName = bossNumber > 1 ? `${bossTemplate.name} (Tier ${bossNumber})` : bossTemplate.name;

    const boss = new Character(bossName, health, attackRange, bossTemplate.charClass, bossTemplate.potions);
    boss.isEnemy = true;
    boss.isBoss = true;
    return boss;
}

function spawnNextEncounter() {
    if (enemiesDefeated > 0 && enemiesDefeated % boss_interval === 0) {
        return spawnBoss(bossesDefeated + 1);
    }
    return spawnRandomEnemy();
}

const playerConfigs = {
    Knight: {healthRange: [55,75], attackRange: [16, 26], potions: 0},
    Magician: {healthRange: [50, 70], attackRange: [20, 30], potions: 3},
    Samurai: {healthRange: [70, 80], attackRange: [14, 22], potions: 0}
};

function initPlayer(name, charClass) {
    const config = playerConfigs[charClass];
    const mods = getPlayerDifficultyMods();
    const baseHp = getRandomInt(config.healthRange[0], config.healthRange[1]);
    const hp = Math.max(1, Math.round(baseHp * mods.healthMult));
    const finalName = name.trim();
    const playerCharacter = new Character(finalName, hp, config.attackRange, charClass, config.potions);
    playerCharacter.isEnemy = false;
    return playerCharacter;
}

function spawnRandomEnemy(){
    const template = enemyLibrary[Math.floor(Math.random() * enemyLibrary.length)];
    const mult = difficultyMultipliers[gameSettings.difficulty] ?? 1;
    const health = Math.round(getRandomInt(template.healthRange[0], template.healthRange[1]) * mult);
    const attackRange = [
        Math.round(template.attackRange[0] * mult),
        Math.round(template.attackRange[1] * mult)
    ];
    const enemy = new Character(template.name, health, attackRange, template.charClass, template.potions);
    enemy.isEnemy = true;
    return enemy;
}

// Class Selection listeners

document.querySelectorAll('.classButton').forEach(button => {
    button.addEventListener('click', () => {
        selectedClass = button.dataset.class;
        document.querySelectorAll('.classButton').forEach(b => b.classList.remove('selected'));
        button.classList.add('selected');
        showClassInfo(selectedClass);
    });
});

confirmClassButton.addEventListener('click', () => {
    if (classConfirmed || !selectedClass) return;

    const trimmedName = nameInput.value.trim();
    if (!trimmedName) {
        nameInput.classList.add('inputError');
        nameInput.placeholder = 'Please enter a name!';
        nameInput.focus();
        return;
    }
    nameInput.classList.remove('inputError');

    classConfirmed = true;
    gameSettings.difficulty = difficultySelectStart.value;
    player = initPlayer(trimmedName, selectedClass);
    updateCharacterCard();
});

nameInput.addEventListener('input', () => {
    nameInput.classList.remove('inputError');
});

// Battle UI

function updateBattleUI(){
    const setElementText = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };
    if (player) {
        setElementText('playerName', player.name);
        setElementText('playerHealth', player.health);
        setElementText('playerPotions', player.potions);
        setElementText('playerLevelLabel', `Level ${player.level}`);
        updateHealButtonVisibility();
    }
    if (currentEnemy) {
        setElementText('enemyName', currentEnemy.name);
        setElementText('enemyHealth', currentEnemy.health);
        setElementText('enemyPotions', currentEnemy.potions);
    }
}

function toggleButtons(disabled){
    attackButton.disabled = disabled;
    defendButton.disabled = disabled;
    healButton.disabled = disabled;
}

beginAdventureButton.addEventListener('click', () => {
    showLoreScreen(player.charClass);
});

let loreRunId = 0;
let loreSkipRequested = false;

function showLoreScreen(charClass) {
    loreRunId++;
    const thisRun = loreRunId;
    loreSkipRequested = false;

    startScreen.style.display = 'none';
    loreScreen.style.display = 'block';

    loreTitle.textContent = `${player.name} the ${charClass}`;
    loreText.innerHTML = '';
    loreAbilities.innerHTML = '';
    loreAbilities.classList.remove('visible');
    loreBeginButton.style.display = 'none';

    const sentences = classLore[charClass] || classLore.Knight;
    runLoreSequence(sentences, thisRun);
}

// Sleeps for `ms`, but returns early if the reader hits Skip — keeps skip feeling instant
async function sleepUnlessSkipped(ms) {
    const step = 50;
    let elapsed = 0;
    while (elapsed < ms) {
        if (loreSkipRequested) return;
        await sleep(Math.min(step, ms - elapsed));
        elapsed += step;
    }
}

function appendLoreSentence(text) {
    const line = document.createElement('p');
    line.className = 'loreSentence';
    line.textContent = text;
    loreText.appendChild(line);
    void line.offsetWidth; // force reflow so the fade-in transition actually plays
    line.classList.add('visible');
}

async function runLoreSequence(sentences, runId) {
    for (let i = 0; i < sentences.length; i++) {
        if (runId !== loreRunId) return;

        if (loreSkipRequested) {
            for (let j = i; j < sentences.length; j++) appendLoreSentence(sentences[j]);
            break;
        }

        appendLoreSentence(sentences[i]);
        await sleepUnlessSkipped(500);
        if (runId !== loreRunId) return;

        if (loreSkipRequested) {
            for (let j = i + 1; j < sentences.length; j++) appendLoreSentence(sentences[j]);
            break;
        }

        const holdTime = Math.min(Math.max(sentences[i].length * text_delay_multiplier, 900), max_text_delay);
        await sleepUnlessSkipped(holdTime);
    }

    if (runId !== loreRunId) return;
    revealAbilitySummary(player.charClass, runId);
}

function revealAbilitySummary(charClass, runId) {
    const abilities = getClassAbilities(charClass);
    loreAbilities.innerHTML = abilities.map(key => {
        const info = classAbilityInfo[key];
        return `<div class="loreAbilityRow"><span class="loreAbilityIcon">${info.icon}</span><div><strong>${info.label}</strong><p>${info.desc}</p></div></div>`;
    }).join('');

    requestAnimationFrame(() => {
        if (runId !== loreRunId) return;
        loreAbilities.classList.add('visible');
        loreBeginButton.style.display = 'inline-block';
    });
}

loreSkipButton.addEventListener('click', () => {
    loreSkipRequested = true;
});

loreBeginButton.addEventListener('click', () => {
    loreScreen.style.display = 'none';
    startGame();
});

async function startGame() {
    startScreen.style.display = 'none';
    battleScreen.style.display = 'block';
    player.baseX = canvas.width * 0.25;
    player.baseY = canvas.height - 40 - character_lift;
    player.x = player.baseX;
    player.y = player.baseY;
    showActionButtons(true);
    await writeSlowly(`${player.name} the ${player.charClass} begins their adventure!`);
    startEncounter(spawnNextEncounter());
}

async function startEncounter(enemy){
    currentEnemy = enemy
    currentEnemy.baseX = canvas.width * 0.76;
    currentEnemy.baseY = canvas.height - 40 - character_lift;
    currentEnemy.x = currentEnemy.baseX;
    currentEnemy.y = currentEnemy.baseY;
    player.hitsThisFight = 0;

    updateBattleUI();
    if (currentEnemy.isBoss) {
        shakeScreen();
        await writeSlowly(`A powerful boss approaches: ${currentEnemy.name}!`);
    } else {
        const enemyType = currentEnemy.charClass === player.charClass ? "another" : "a";
        await writeSlowly(`${player.name} sees ${enemyType} ${currentEnemy.name}!`);
    }
    toggleButtons(false);
}

async function handlePlayerDefeat() {
    await writeSlowly(`Defeat! ${player.name} has fallen in battle.`);
    battleScreen.style.display = 'none';
    defeatMessage.textContent = `${player.name} the ${player.charClass} fell after defeating ${enemiesDefeated} foe${enemiesDefeated === 1 ? '' : 's'}. Better luck next time.`;
    defeatScreen.style.display = 'block';
}

async function enemyTurn(){
    await sleep(enemy_attack_delay);

    await player.tickPoison();
    if (player.health <= 0) {
        await handlePlayerDefeat();
        return;
    }

    const healthPercentage = currentEnemy.health / currentEnemy.maxHealth;
    const behavior = enemyBehaviors[currentEnemy.charClass];

    let decidedToHeal = false;
    let decidedToSiphon = false;

    if (healthPercentage < 0.3 && currentEnemy.potions > 0 && Math.random() < 0.75) {
        decidedToHeal = true;
    } else if (behavior?.siphonChance) {
        const needsHealth = healthPercentage < 0.6; // hurting enough to want to drain
        const randomSpecial = Math.random() < behavior.siphonChance;
        if (needsHealth || randomSpecial) {
            decidedToSiphon = true;
        }
    }

    if (decidedToHeal) {
        const healingAmount = getRandomInt(15, 25);
        currentEnemy.health = Math.min(currentEnemy.health + healingAmount, currentEnemy.maxHealth);
        currentEnemy.potions -= 1;
        currentEnemy.pendingDamageEffect = `+${healingAmount}`;
        await writeSlowly(`${currentEnemy.name} drank a potion, restoring ${healingAmount} HP!`);
    } else if (decidedToSiphon) {
        await currentEnemy.siphon(player);
    } else {
        await currentEnemy.attack(player);
    }
    updateBattleUI();

    if (player.health <= 0){
        await handlePlayerDefeat();
    }
    else {
        toggleButtons(false);
    }
}

async function handleEnemyDefeat(){
    await writeSlowly(`Victory! ${currentEnemy.name} has been defeated!`);
    enemiesDefeated++;
    const wasBoss = currentEnemy.isBoss;
    if (wasBoss) {
        bossesDefeated++;
    }

    const avgPlayerDamage = (player.attackRange[0] + player.attackRange[1]) / 2;
    const expectedHits = Math.max(1, Math.ceil(currentEnemy.maxHealth / avgPlayerDamage));
    const actualHits = Math.max(1, player.hitsThisFight);
    const efficiency = Math.min(2, expectedHits / actualHits);

    const baseXP = Math.round(currentEnemy.maxHealth * 0.6) * (wasBoss ? 1.5 : 1);
    const xpReward = Math.round(baseXP * efficiency * getPlayerDifficultyMods().xpMult);

    await player.gainXP(xpReward);
    updateBattleUI();

    if (wasBoss) {
        battleScreen.style.display = 'none';
        victoryMessage.textContent = `${player.name} the ${player.charClass} has slain ${bossesDefeated === 1 ? 'the boss' : `${bossesDefeated} bosses`} and ${enemiesDefeated} foes total, reaching Level ${player.level}! Will you push onward, or bank this victory and rest?`;
        victoryScreen.style.display = 'block';
        if (gameSettings.confetti) launchConfetti(); // <-- this line is the only change
    } else {
        writeSlowly(`Will you challenge the next foe or flee?`);
        showActionButtons(false);
        document.getElementById('choiceButtons').style.display = 'block';
    }
}

document.getElementById('nextFoeButton').addEventListener('click', async () => {
    document.getElementById('choiceButtons').style.display = 'none';
    showActionButtons(true);

    await writeSlowly(`${player.name} bravely steps forward and challenges the next foe!`)
    await sleep(next_foe_delay);
    startEncounter(spawnNextEncounter());
});

document.getElementById('fleeButton').addEventListener('click', async () => {
    await writeSlowly(`${player.name} chose to flee! You live to fight another day`);
    document.getElementById('choiceButtons').style.display = 'none';
    document.getElementById('playAgainButton').style.display = 'inline-block';
});

attackButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;
    player.hitsThisFight++;
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
    player.lastDefendBlocked = false;

    await writeSlowly(`${player.name} braces for impact, watching for an opening!`);
    await enemyTurn();

    // If the block succeeded and the player is still standing, they get a bonus counter-attack
    if (player.health > 0 && player.lastDefendBlocked && currentEnemy.health > 0) {
        await writeSlowly(`${player.name} capitalizes on the opening and strikes back!`);
        player.hitsThisFight++;
        await player.attack(currentEnemy);
        updateBattleUI();

        if (currentEnemy.health <= 0) {
            await handleEnemyDefeat();
            return;
        }
        toggleButtons(false);
    }
});

healButton.addEventListener('click', async () => {
    toggleButtons(true);
    player.isDefending = false;
    
    if (player.potions > 0) {
        const healingAmount = Math.max(1, Math.round(getRandomInt(15, 25) * getPlayerDifficultyMods().healMult));
        player.health = Math.min(player.health + healingAmount, player.maxHealth);
        player.potions -= 1;

        player.pendingDamageEffect = `+${healingAmount}`;
        
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
    victoryScreen.style.display = 'none';
    defeatScreen.style.display = 'none';
    fleeScreen.style.display = 'none';
    loreScreen.style.display = 'none';
    loreRunId++; // cancels any in-progress lore sequence
    loreSkipRequested = false;
    loreText.innerHTML = '';
    loreAbilities.classList.remove('visible');
    loreAbilities.innerHTML = '';
    loreBeginButton.style.display = 'none';
    document.getElementById('confettiContainer').innerHTML = '';
    startScreen.style.display = 'none';
    mainMenu.style.display = '';
    document.getElementById('choiceButtons').style.display = 'none';
    logBox.innerHTML = '';

    showActionButtons(true);
    resetClassSelectionUI();

    enemiesDefeated = 0;
    bossesDefeated = 0;
    player = new Character('', 0, [0,0], '', 0);
    currentEnemy = undefined;
}

document.getElementById('playAgainButton').addEventListener('click', resetGame);
victoryPlayAgainButton.addEventListener('click', resetGame);
defeatPlayAgainButton.addEventListener('click', resetGame);
fleePlayAgainButton.addEventListener('click', resetGame);

const confettiColors = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#ffffff'];

function launchConfetti(pieceCount = 80) {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = ''; // clear any leftover pieces

    for (let i = 0; i < pieceCount; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        piece.style.animationDuration = `${2 + Math.random() * 2}s`;
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(piece);
    }
}

document.getElementById('fleeButton').addEventListener('click', async () => {
    document.getElementById('choiceButtons').style.display = 'none';
    await writeSlowly(`${player.name} chose to flee! You live to fight another day`);
    battleScreen.style.display = 'none';
    fleeMessage.textContent = `${player.name} the ${player.charClass} fled after defeating ${enemiesDefeated} foe${enemiesDefeated === 1 ? '' : 's'}.`;
    fleeScreen.style.display = 'block';
});

async function animateXpBar(startXP, endXP) {
    const xpFill = document.getElementById('playerXpFill');
    const levelLabel = document.getElementById('playerLevelLabel');
    if (!xpFill) return;

    let currentXP = startXP;

    while (currentXP < endXP) {
        const currentLevel = 1 + Math.floor(currentXP / xp_per_level);
        const levelStartXP = (currentLevel - 1) * xp_per_level;
        const levelEndXP = currentLevel * xp_per_level;
        const target = Math.min(endXP, levelEndXP);

        const endPercent = ((target - levelStartXP) / xp_per_level) * 100;

        if (levelLabel) levelLabel.textContent = `Level ${currentLevel}`;
        xpFill.style.transition = 'width 0.6s ease-out';
        xpFill.style.width = `${endPercent}%`;
        await sleep(650);

        if (target === levelEndXP && target < endXP) {
            // hit a level boundary mid-gain — flash full, then reset for the next level
            await sleep(150);
            xpFill.style.transition = 'none';
            xpFill.style.width = '0%';
            await sleep(100);
        }

        currentXP = target;
    }
}

function promptLevelUpChoice() {
    return new Promise((resolve) => {
        levelUpOverlay.style.display = 'flex';

        function onAttack() { cleanup('attack'); }
        function onDefense() { cleanup('defense'); }
        function onHeal() { cleanup('heal'); }

        function cleanup(choice) {
            levelUpOverlay.style.display = 'none';
            chooseAttackButton.removeEventListener('click', onAttack);
            chooseDefenseButton.removeEventListener('click', onDefense);
            chooseHealButton.removeEventListener('click', onHeal);
            resolve(choice);
        }

        chooseAttackButton.addEventListener('click', onAttack);
        chooseDefenseButton.addEventListener('click', onDefense);
        chooseHealButton.addEventListener('click', onHeal);
    });
}

continueAdventureButton.addEventListener('click', async () => {
    victoryScreen.style.display = 'none';
    battleScreen.style.display = 'block';
    showActionButtons(true);

    await writeSlowly(`${player.name} presses onward, seeking the next challenge!`);
    await sleep(next_foe_delay);
    startEncounter(spawnNextEncounter());
});

function shakeScreen() {
    const canvasEl = document.getElementById('gameCanvas');
    canvasEl.classList.remove('shake');
    void canvasEl.offsetWidth;
    canvasEl.classList.add('shake');
}

startGameMenuButton.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    startScreen.style.display = '';
});

openSettingsButton.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    settingsScreen.style.display = '';
});

closeSettingsButton.addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    mainMenu.style.display = '';
});

textSpeedSelect.addEventListener('change', () => {
    gameSettings.textSpeed = textSpeedSelect.value;
    text_delay_multiplier = textSpeedValues[gameSettings.textSpeed];
});

screenShakeToggle.addEventListener('change', () => {
    gameSettings.screenShake = screenShakeToggle.checked;
});

confettiToggle.addEventListener('change', () => {
    gameSettings.confetti = confettiToggle.checked;
});

volumeSlider.addEventListener('input', () => {
    gameSettings.soundVolume = parseInt(volumeSlider.value, 10);
    // no audio system yet — this just stores the value for when sound is added
});

backToMenuButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    resetClassSelectionUI();
    mainMenu.style.display = '';
});

function updateHealButtonVisibility() {
    healButton.style.display = player.potions > 0 ? 'inline-block' : 'none';
}

function showActionButtons(visible) {
    const display = visible ? 'inline-block' : 'none';
    attackButton.style.display = display;

    const canDefend = visible && defend_allowed_classes.includes(player.charClass);
    defendButton.style.display = canDefend ? 'inline-block' : 'none';

    healButton.style.display = visible && player.potions > 0 ? 'inline-block' : 'none';
}