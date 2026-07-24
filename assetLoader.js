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
            attacking: 'images/sprites/knight/Attack.png',
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
        Samurai: {
            idle: 'images/sprites/samurai/Idle.png',
            attacking: 'images/sprites/samurai/Attack.png',
            hurt: 'images/sprites/samurai/Hurt.png',
            defending: 'images/sprites/samurai/Defend.png',
            dead: 'images/sprites/samurai/Dead.png'
        },
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
        idle: { frames: 4, speed: 12, visualHeight: 140, offsetX: 62 },
        attacking: { frames: 4, speed: 80, visualHeight: 140, offsetX: 62 },
        hurt: { frames: 2, speed: 50, visualHeight: 140, offsetX: 62 },
        defending: { frames: 5, speed: 50, visualHeight: 140, offsetX: 62 }
    },
    Magician: {
        idle: { frames: 8, speed: 12, visualHeight: 140 },
        attacking: { frames: 7, speed: 80, visualHeight: 140 },
        hurt: { frames: 4, speed: 30, visualHeight: 140 },
        defending: { frames: 8, speed: 50, visualHeight: 140 }
    },
    Minotaur: {
        idle: { frames: 10, speed: 16, visualHeight: 190 },
        attacking: { frames: 5, speed: 80, visualHeight: 190 },
        hurt: { frames: 3, speed: 50, visualHeight: 190 },
        defending: { frames: 4, speed: 50, visualHeight: 190 }
    },
    Werewolf: {
        idle: { frames: 8, speed: 12, visualHeight: 120 },
        attacking: { frames: 6, speed: 80, visualHeight: 120 },
        hurt: { frames: 2, speed: 50, visualHeight: 120 },
        defending: { frames: 4, speed: 50, visualHeight: 120 }
    },
    Skeleton: {
        idle: { frames: 7, speed: 20, visualHeight: 140 },
        attacking: { frames: 4, speed: 80, visualHeight: 140 },
        hurt: { frames: 2, speed: 50, visualHeight: 140 },
        defending: { frames: 4, speed: 50, visualHeight: 140 }
    },
    Gorgon: {
        idle: { frames: 7, speed: 20, visualHeight: 180 },
        attacking: { frames: 7, speed: 80, visualHeight: 180 },
        hurt: { frames: 3, speed: 50, visualHeight: 180 },
        dead: { frames: 3, speed: 50, visualHeight: 180 }
    },
    Samurai: {
        idle: { frames: 6, speed: 20, visualHeight: 150, offsetX: 55 },
        attacking: { frames: 4, speed: 80, visualHeight: 150, offsetX: 55 },
        hurt: { frames: 3, speed: 50, visualHeight: 150, offsetX: 55 },
        dead: { frames: 3, speed: 50, visualHeight: 150, offsetX: 55 },
        defending: { frames: 2, speed: 50, visualHeight: 150, offsetX: 55 }
    }
};