const BackgroundManager = {

    activeKey: "default",

    previousImage: null,

    transitionStart: 0,

    transitionDuration: GAME_CONFIG.background.transitionDuration,

    getCurrentKey() {

        if (
            typeof currentEnemy !== "undefined" &&
            currentEnemy &&
            loadedBackgrounds[currentEnemy.charClass]
        ) {
            return currentEnemy.charClass;
        }

        return "default";
    },

    update(now) {

        const newKey = this.getCurrentKey();

        if (newKey !== this.activeKey) {

            this.previousImage = loadedBackgrounds[this.activeKey] || null;

            this.activeKey = newKey;

            this.transitionStart = now;

        }

    },

    draw(now) {

        const swayX = Math.sin(now / 4000) * GAME_CONFIG.background.swayX;
        const swayY = Math.cos(now / 5000) * GAME_CONFIG.background.swayY;

        const currentImage = loadedBackgrounds[this.activeKey];

        const elapsed = now - this.transitionStart;

        const inTransition =
            this.previousImage &&
            elapsed < this.transitionDuration;

        if (inTransition) {

            const progress = elapsed / this.transitionDuration;

            drawBackgroundImage(
                this.previousImage,
                swayX,
                swayY,
                1
            );

            drawBackgroundImage(
                currentImage,
                swayX,
                swayY,
                progress
            );

        }
        else if (currentImage && currentImage.loaded) {

            drawBackgroundImage(
                currentImage,
                swayX,
                swayY,
                1
            );

        }
        else {

            ctx.save();

            ctx.translate(swayX, swayY);

            ctx.fillStyle = "#0f172a";

            ctx.fillRect(
                -20,
                -20,
                canvas.width + 40,
                canvas.height + 40
            );

            ctx.restore();

        }

    }

};