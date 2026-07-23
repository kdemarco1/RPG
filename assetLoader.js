function loadImage(path, errorMessage = "Failed to load image") {
    const img = new Image();
    img.loaded = false;
    img.onload = () => {
        img.loaded = true;
    };
    img.onerror = () => {
        console.error(`${errorMessage}: ${path}`);
    };
    img.src = path;
    return img;
}
// Background Image
const backgroundImages = {
    Basilisk: 'images/backgrounds/basilisk.png',
    Magician: 'images/backgrounds/magician.png',
    Gorgon: 'images/backgrounds/gorgon.png',
    Minotaur: 'images/backgrounds/minotaur.png',
    Werewolf: 'images/backgrounds/werewolf.png',
    Skeleton: 'images/backgrounds/skeleton.png',
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
        Gorgon: {
            idle: 'images/sprites/gorgon/Idle.png',
            attacking: 'images/sprites/gorgon/Attack.png',
            hurt: 'images/sprites/gorgon/Hurt.png',
            dead: 'images/sprites/gorgon/Dead.png'
        },
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
    const portrait = portraits[charKey];
    const spriteSource = typeof portrait === 'object' ? portrait : null;

    if (spriteSource) {
        loadedSprites[charKey] = {};
        for (const animKey in spriteSource) {
            loadedSprites[charKey][animKey] = loadImage(
                spriteSource[animKey],
                `Sprite failed to load: ${charKey} -> ${animKey}`
            );
        }
    }
}

window.animConfig = {
    Knight: {
        idle: { frames: 4, speed: 12 },
        attacking: { frames: 6, speed: 50 },
        hurt: { frames: 2, speed: 50 },
        defending: { frames: 5, speed: 50 }
    },
    Magician: {
        idle: { frames: 8, speed: 12 },
        attacking: { frames: 7, speed: -1000 },
        hurt: { frames: 4, speed: 30 },
        defending: { frames: 8, speed: 50 }
    },
    Minotaur: {
        idle: { frames: 10, speed: 16 },
        attacking: { frames: 4, speed: 50 },
        hurt: { frames: 2, speed: 50 },
        defending: { frames: 4, speed: 50 }
    },
    Werewolf: {
        idle: { frames: 8, speed: 12 },
        attacking: { frames: 4, speed: 50 },
        hurt: { frames: 2, speed: 50 },
        defending: { frames: 4, speed: 50 }
    },
    Skeleton: {
        idle: { frames: 7, speed: 20 },
        attacking: { frames: 4, speed: 50 },
        hurt: { frames: 2, speed: 50 },
        defending: { frames: 4, speed: 50 }
    },
    Gorgon: {
        idle: { frames: 7, speed: 20 },
        attacking: { frames: 7, speed: 10 },
        hurt: { frames: 3, speed: 50 },
        dead: { frames: 3, speed: 50 }
    }
};