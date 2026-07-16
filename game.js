let phaserGame;
let battleScene;

const config = {
    type: Phaser.AUTO, 
    width: 800,
    height: 500,
    parent:'phaserGame',
    backgroundColor: '#2b2b2b',

    scene: {
        preload,
        create
    }
};

phaserGame = new Phaser.Game(config);

let player;
let enemy;

function preload() {

}

function create() {

    player = this.add.rectangle(200, 250, 40, 60, 0x00ff00);
    enemy = this.add.rectangle(600, 250, 40, 60, 0xff0000);
}

function update() {

}

function attackAnimation() {
    game.scene.scenes[0].tweens.add({
        targets: player,
        x: 350,
        duration: 150,
        yoyo: true
    });
}
