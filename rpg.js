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
    easy:   { healthMult: 1.2,  xpMult: 1.6,  healMult: 1.15 },
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
const attackButton = document.getElementById('attackButton');
const defendButton = document.getElementById('defendButton');
const healButton = document.getElementById('healButton');
const specialButton = document.getElementById('specialButton');
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
const introLine = document.getElementById('introLine');
const chooseSpecialButton = document.getElementById('chooseSpecialButton');

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
        stats: ''
    },
    Magician: {
        portrait: '🧙🏼‍♂️',
        description: 'A spellcaster with devastating attacks',
        stats: ''
    },
    Samurai: {
        portrait: '🥷🏻',
        description: 'An adaptable warrior wielding reliable offensive strikes and moderate resilience',
        stats: ''
    }
};

const class_icons = {
    Knight: '🗡️',
    Magician: '🧙🏼‍♂️',
    Samurai: '🥷🏻'
};

const classSpecialMoves = {
    Knight: {
        label: '💥 Power Swipe',
        icon: '💥',
        summaryLabel: 'Power Swipe',
        summaryDesc: 'A devastating overhead strike wreathed in blue-violet light, dealing 2-3x normal damage. Needs 3 turns to recharge after use.',
        getCooldown(user) {
            return Math.max(2, 3 - Math.floor((user.specialLevel - 1) / 2)); // 3-turn cooldown, reduced by 1 for every 2 ranks of special
        },  
        previewStats(user) {
        const base = user.attackRange[0];
        const rankBonus = (user.specialLevel - 1) * 0.5;
        const nextRankBonus = user.specialLevel * 0.5;
        const dmg = Math.round(base * (2.5 + rankBonus));
        const nextDmg = Math.round(base * (2.5 + nextRankBonus));
        const cd = this.getCooldown(user);
        const nextCd = this.getCooldown({ specialLevel: user.specialLevel + 1 });
        const cooldownText = cd !== nextCd ? `Cooldown: ${cd} → ${nextCd} turns` : `Cooldown: ${nextCd} turns`;
        return {
            damageText: `${dmg} → ${nextDmg} damage`,
            cooldownText
        };
        },
        async execute(user, target) {
        const attackConfig = window.animConfig?.[user.charClass]?.attacking;
        const swingDuration = attackConfig ? attackConfig.frames * attackConfig.speed : 60;
        const returnBuffer = 90; // extra frames to hold the glow through the ease-back-to-idle movement
        spawnPowerSwipeEffect(user, swingDuration + returnBuffer);
        await writeSlowly(`${user.name}'s blade glows with blue-violet light as they wind up a mighty swipe!`);
        const rankBonus = (user.specialLevel - 1) * 0.5;
        const multiplier = 2.5 + rankBonus;
        await user.attack(target, false, multiplier);
    }
},
    Magician: {
    label: '✨ Siphon',
    icon: '✨',
    summaryLabel: 'Siphon',
    summaryDesc: 'Deals noticeably less damage than a regular Attack — but whatever it drains heals you for the same amount.',
    previewStats(user) {
        const bonusDrain = (user.specialLevel - 1) * 6;
        const nextBonusDrain = user.specialLevel * 6;
        const drain = 11 + bonusDrain;
        const nextDrain = 11 + nextBonusDrain;
        return {
            damageText: `${drain}-${curMax} → ${nextDrain}-${nextMax} drain`,
            cooldownText: null
        };
    },
    async execute(user, target) {
        await user.siphon(target);
    }
},
    Samurai: {
    label: '👥 Shadow Strike',
    icon: '👥',
    summaryLabel: 'Shadow Strike',
    summaryDesc: 'Summon two shadow clones — all three Samurai strike at once dealing 3x damage. 5-turn cooldown.',
    getCooldown(user) {
        return Math.max(3, 5 - Math.floor((user.specialLevel - 1) / 2));
    },
    previewStats(user) {
        const base = user.attackRange[0];
        const dmg = base * 3;
        const cd = this.getCooldown(user);
        const nextCd = this.getCooldown({ specialLevel: user.specialLevel + 1 });
        return {
            damageText: `${dmg} damage (fixed)`,
            cooldownText: cd !== nextCd ? `Cooldown: ${cd} → ${nextCd} turns` : `Cooldown: ${nextCd} turns`
        };
    },
    async execute(user, target) {
    const attackConfig = window.animConfig?.[user.charClass]?.attacking;
    const swingDuration = attackConfig ? attackConfig.frames * attackConfig.speed : 60;
    const returnBuffer = 185; // extra frames to hold through the ease-back-to-idle
    spawnTripleSamuraiEffect(user, swingDuration + returnBuffer);
    await writeSlowly(`${user.name} splits into three — shadows and steel strike as one!`);
    await user.attack(target, false, 3);
}
}};

function getClassAbilities(charClass) {
    const abilities = ['attack'];
    if (defend_allowed_classes.includes(charClass)) abilities.push('defend');
    if (classSpecialMoves[charClass]) abilities.push('special');
    if ((playerConfigs[charClass]?.potions ?? 0) > 0) abilities.push('heal');
    return abilities;
}

function showClassInfo(className) {
    const info = class_info[className];
    if (!info) return;

    document.getElementById('selectedTitle').textContent = className;
    document.getElementById('portrait').textContent = info.portrait;
    document.getElementById('classDescription').textContent = info.description;
    document.getElementById('classStats').innerHTML = renderClassStatsHTML(className);
    document.getElementById('heroSetup').style.display = 'block';
}

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

    nameInput.value = '';
    nameInput.classList.remove('inputError');
    nameInput.placeholder = 'Enter hero name';
    selectedClass = '';
    classConfirmed = false;
}
// Character Class

class Character {
    constructor(name, health, attackRange, charClass, potions = 0, baseX = 0, baseY = 0, defendChance = defend_block_chance) {
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
        this.defendChance = defendChance;
        this.specialCooldown = 0;
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
        this.specialLevel = 1;
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
            this.bonusAttack += 5;
            this.recalculateStats();
            await writeSlowly(`${this.name}'s attack power increased!`);
        } else if (choice === 'defense') {
            this.bonusDefense += 5;
            await writeSlowly(`${this.name}'s defense increased!`);
        } else if (choice === 'heal') {
            this.health = this.maxHealth;
            await writeSlowly(`${this.name} was fully healed!`);
        } else if (choice === 'special') {
            this.specialLevel++;
            const move = classSpecialMoves[this.charClass];
            const moveName = move ? move.summaryLabel : 'Special Ability';
            await writeSlowly(`${this.name}'s ${moveName} upgraded to Rank ${this.specialLevel}!`);
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

    async attack(target, isFollowUp = false, damageMultiplier = 1) {
    let currentDamage = Math.round(this.attackLevel * damageMultiplier);
    this.visualState = 'attacking';

    const attackConfig = window.animConfig?.[this.charClass]?.attacking;
    this.stateTimer = attackConfig ? attackConfig.frames * attackConfig.speed : 15;

    const behavior = enemyBehaviors[this.charClass];
    let blockedByDefense = false;

    if (target.isDefending) {
        const blockSuccess = Math.random() < target.defendChance;
        if (!isFollowUp) target.lastDefendBlocked = blockSuccess;

        if (blockSuccess) {
            blockedByDefense = true;
            const [minMult, maxMult] = defend_damage_multiplier_range;
            const mult = minMult + Math.random() * (maxMult - minMult);
            currentDamage = Math.max(1, Math.floor(currentDamage * mult));
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
        const bonusDrain = (this.specialLevel - 1) * 6;
        const siphonAmount = 11 + bonusDrain;
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
    { name: 'Magician',  health: 44, attack: [14, 20], charClass: 'Magician',  potions: 3 },
    { name: 'Gorgon',    health: 36, attack: [6,  12], charClass: 'Gorgon',    potions: 1 },
    { name: 'Minotaur',  health: 40, attack: [8,  14], charClass: 'Minotaur',  potions: 0 },
    { name: 'Werewolf',  health: 42, attack: [10, 18], charClass: 'Werewolf',  potions: 0 },
    { name: 'Skeleton',  health: 44, attack: [12, 18], charClass: 'Skeleton',  potions: 0 },
];

const enemyBehaviors = {
    Werewolf: { doubleAttack: true },
    Skeleton: { counterChance: 0.35 },
    Gorgon: { poisonChance: 0.4 },
    Magician: { siphonChance: 0.35 },
};

const bossTemplate = {
    name: 'Ignis, The Beacon of False Hope',
    health: 240,
    attack: [30, 44],
    charClass: 'Boss',
    potions: 1
};

const first_boss_scale_cap = 0.85;

function spawnBoss(bossNumber) {
    const baseDifficultyMult = difficultyMultipliers[gameSettings.difficulty] ?? 1;
    const scaleStep = difficultyScaleStep[gameSettings.difficulty] ?? 0.4;
    let difficultyScale = (1 + (bossNumber - 1) * scaleStep) * baseDifficultyMult;

    if (bossNumber === 1) {
        difficultyScale = Math.min(difficultyScale, first_boss_scale_cap);
    }

    const health = Math.round(bossTemplate.health * difficultyScale);
    const attackRange = [
        Math.round(bossTemplate.attack[0] * difficultyScale),
        Math.round(bossTemplate.attack[1] * difficultyScale)
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
    Knight:   { health: 65, attack: 22, defendChance: 0.85, potions: 0 },
    Magician: { health: 55, attack: 27, defendChance: 0.50, potions: 3 },
    Samurai:  { health: 70, attack: 18, defendChance: 0.70, potions: 0 }
};

function initPlayer(name, charClass) {
    const config = playerConfigs[charClass];
    const mods = getPlayerDifficultyMods();
    const hp = Math.max(1, Math.round(config.health * mods.healthMult));
    const finalName = name.trim();
    const playerCharacter = new Character(finalName, hp, [config.attack, config.attack], charClass, config.potions, 0, 0, config.defendChance);
    playerCharacter.isEnemy = false;
    return playerCharacter;
}

function spawnRandomEnemy() {
    const template = enemyLibrary[Math.floor(Math.random() * enemyLibrary.length)];
    const mult = difficultyMultipliers[gameSettings.difficulty] ?? 1;
    const health = Math.round(template.health * mult);
    const attackRange = [
        Math.round(template.attack[0] * mult),
        Math.round(template.attack[1] * mult)
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
    playIntroCinematic(player.charClass);
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
        refreshSpecialButtonLabel();
    }
    if (currentEnemy) {
        setElementText('enemyName', currentEnemy.name);
        setElementText('enemyHealth', currentEnemy.health);
        setElementText('enemyPotions', currentEnemy.potions);
    }
}

function tickCooldowns() {
    if (player.specialCooldown > 0) {
        player.specialCooldown--;
    }
}

function toggleButtons(disabled){
    attackButton.disabled = disabled;
    defendButton.disabled = disabled;
    healButton.disabled = disabled;
    const move = classSpecialMoves[player.charClass];
    const onCooldown = player.specialCooldown > 0;
    specialButton.disabled = disabled || onCooldown;
}

let introRunId = 0;

async function playIntroCinematic(charClass) {
    introRunId++;
    const thisRun = introRunId;

    startScreen.style.display = 'none';
    loreScreen.style.display = 'flex';
    introLine.classList.remove('visible');
    introLine.textContent = `${player.name} the ${charClass} begins their journey into the unknown world of magic and monsters...`;

    // Let the black screen sit for a beat before the line appears — builds a little tension
    await sleep(500);
    if (thisRun !== introRunId) return;

    void introLine.offsetWidth; // force reflow so the fade-in transition restarts cleanly
    introLine.classList.add('visible');

    await sleep(2800);
    if (thisRun !== introRunId) return;

    introLine.classList.remove('visible');
    await sleep(900); // let the line fade back to black before cutting to battle
    if (thisRun !== introRunId) return;

    loreScreen.style.display = 'none';
    startGame();
}

// Clicking anywhere on the black screen skips straight to battle
loreScreen.addEventListener('click', () => {
    introRunId++; // invalidates the in-progress cinematic timeline
    loreScreen.style.display = 'none';
    startGame();
});

async function startGame() {
    battleScreen.classList.remove('cinematicEntry');
    void battleScreen.offsetWidth; // force reflow so the entry animation restarts cleanly
    battleScreen.classList.add('cinematicEntry');
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

attackButton.addEventListener('click', async () => {
    tickCooldowns();
    toggleButtons(true);
    player.isDefending = false;
    player.hitsThisFight++;
    await player.attack(currentEnemy);
    updateBattleUI();

    if (currentEnemy.health <= 0) {
        await handleEnemyDefeat();
    } else {
        await enemyTurn();
        if (player.health > 0) {
            toggleButtons(false);
        }
    }
});

defendButton.addEventListener('click', async () => {
    tickCooldowns();
    toggleButtons(true);
    player.isDefending = true;
    player.lastDefendBlocked = false;

    await writeSlowly(`${player.name} braces for impact, watching for an opening!`);
    await enemyTurn();

    player.isDefending = false;
    player.lastDefendBlocked = false;
    if (player.health > 0) {
        toggleButtons(false);
    }
});

specialButton.addEventListener('click', async () => {
    const move = classSpecialMoves[player.charClass];
    if (!move) return;

    tickCooldowns();

    if (player.specialCooldown > 0) {
        updateBattleUI();
        return;
    }

    toggleButtons(true);
    player.isDefending = false;
    player.hitsThisFight++;

    await move.execute(player, currentEnemy);

    if (typeof move.getCooldown === 'function') {
        player.specialCooldown = move.getCooldown(player);
    } else if (move.cooldownTurns) {
        player.specialCooldown = move.cooldownTurns;
    }

    updateBattleUI();

    if (currentEnemy.health <= 0) {
        await handleEnemyDefeat();
    } else {
        await enemyTurn();
        if (player.health > 0) {
            toggleButtons(false);
        }
    }
});

healButton.addEventListener('click', async () => {
    tickCooldowns();
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
        if (player.health > 0) {
            toggleButtons(false);
        }
    } else {
        await writeSlowly('No healing potions left!')
        toggleButtons(false)
    }
});

// Reset/Play Again

function resetGame() {
    battleScreen.style.display = 'none';
    battleScreen.classList.remove('cinematicEntry');
    victoryScreen.style.display = 'none';
    defeatScreen.style.display = 'none';
    fleeScreen.style.display = 'none';
    loreScreen.style.display = 'none';
    introRunId++; // cancels any in-progress cinematic intro
    introLine.classList.remove('visible');
    introLine.textContent = '';
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

function updateLevelUpButtonPreviews() {
    const p = player;
    const gain = 5;

    chooseAttackButton.innerHTML =
        `<span class="levelUpLabel">⚔️ Boost Attack</span>
         <span class="levelUpStat">${formatAttackRange(p.attackRange)} <span class="levelUpArrow">→</span> ${formatAttackRange([p.attackRange[0] + gain, p.attackRange[1] + gain])}</span>`;

    chooseDefenseButton.innerHTML =
        `<span class="levelUpLabel">🛡️ Boost Defense</span>
         <span class="levelUpStat">${p.bonusDefense} <span class="levelUpArrow">→</span> ${p.bonusDefense + gain} damage reduction</span>`;

    chooseHealButton.innerHTML =
        `<span class="levelUpLabel">❤️ Full Heal</span>`;

    const move = classSpecialMoves[p.charClass];
    if (chooseSpecialButton) {
        if (move && typeof move.previewStats === 'function') {
            const stats = move.previewStats(p);
            const parts = [stats.damageText];
            if (stats.cooldownText) parts.push(stats.cooldownText);
            chooseSpecialButton.innerHTML =
                `<span class="levelUpLabel">${move.icon} Upgrade ${move.summaryLabel}</span>
                 <span class="levelUpStat">${parts.join(' · ')}</span>`;
            chooseSpecialButton.style.display = 'inline-block';
        } else {
            chooseSpecialButton.style.display = 'none';
        }
    }
}

function promptLevelUpChoice() {
    return new Promise((resolve) => {
        levelUpOverlay.style.display = 'flex';
        updateLevelUpButtonPreviews();

        const cleanup = (choice) => {
            chooseAttackButton.removeEventListener('click', onAttack);
            chooseDefenseButton.removeEventListener('click', onDefense);
            chooseHealButton.removeEventListener('click', onHeal);
            if (chooseSpecialButton) chooseSpecialButton.removeEventListener('click', onSpecial);
            levelUpOverlay.style.display = 'none';
            resolve(choice);
        };

        const onAttack = () => cleanup('attack');
        const onDefense = () => cleanup('defense');
        const onHeal = () => cleanup('heal');
        const onSpecial = () => cleanup('special');

        chooseAttackButton.addEventListener('click', onAttack);
        chooseDefenseButton.addEventListener('click', onDefense);
        chooseHealButton.addEventListener('click', onHeal);
        if (chooseSpecialButton) chooseSpecialButton.addEventListener('click', onSpecial);
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

difficultySelectStart.addEventListener('change', () => {
    if (selectedClass) {
        document.getElementById('classStats').innerHTML = renderClassStatsHTML(selectedClass);
    }
});

function updateHealButtonVisibility() {
    healButton.style.display = player.potions > 0 ? 'inline-block' : 'none';
}

function refreshSpecialButtonLabel() {
    const move = classSpecialMoves[player.charClass];
    if (!move) return;
    const onCooldown = player.specialCooldown > 0;
    specialButton.textContent = onCooldown ? `${move.label} (${player.specialCooldown})` : move.label;
}

function showActionButtons(visible) {
    const display = visible ? 'inline-block' : 'none';
    attackButton.style.display = display;

    const canDefend = visible && defend_allowed_classes.includes(player.charClass);
    defendButton.style.display = canDefend ? 'inline-block' : 'none';

    const specialMove = classSpecialMoves[player.charClass];
    const canSpecial = visible && Boolean(specialMove);
    specialButton.style.display = canSpecial ? 'inline-block' : 'none';
    if (canSpecial) {
        refreshSpecialButtonLabel();
    }

    healButton.style.display = visible && player.potions > 0 ? 'inline-block' : 'none';
}

function renderClassStatsHTML(className, difficulty = difficultySelectStart.value) {
    const config = playerConfigs[className];
    if (!config) return '';

    const mods = playerDifficultyModifiers[difficulty] ?? playerDifficultyModifiers.normal;
    const hp = Math.max(1, Math.round(config.health * mods.healthMult));
    const canDefend = defend_allowed_classes.includes(className);
    const move = classSpecialMoves[className];

    const rows = [
        { icon: '❤️', label: 'Health', desc: `${hp} HP` },
        { icon: '⚔️', label: 'Attack', desc: `${config.attack} damage per hit` },
        canDefend
            ? { icon: '🛡️', label: 'Defend Chance', desc: `${Math.round(config.defendChance * 100)}% to block incoming attacks` }
            : { icon: '🛡️', label: 'Defend', desc: `Cannot defend` }
    ];

    if (move) {
        rows.push({ icon: move.icon, label: move.summaryLabel, desc: move.summaryDesc });
    }
    if (config.potions > 0) {
        rows.push({ icon: '🧪', label: 'Starting Potions', desc: `${config.potions}` });
    }

    const rowsHTML = rows.map(r =>
        `<div class="abilityRow"><span class="abilityIcon">${r.icon}</span><div><strong>${r.label}</strong><p>${r.desc}</p></div></div>`
    ).join('');

    return `<div class="abilitySummary">${rowsHTML}</div>`;
}

function formatAttackRange(range) {
    return range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`;
}
