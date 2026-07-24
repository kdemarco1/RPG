function drawBackgroundImage(img, swayX, swayY, alpha) {
    if (!img || !img.loaded) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(swayX, swayY);
 
    const targetW = canvas.width;
    const targetH = canvas.height;
    const coverScale = Math.max(targetW / img.width, targetH / img.height);
    const sWidth = targetW / coverScale;
    const sHeight = targetH / coverScale;
    const sx = (img.width - sWidth) / 2;
    const sy = (img.height - sHeight) / 2;
    const swayScale = 1.06;
    const drawW = targetW * swayScale;
    const drawH = targetH * swayScale;
    const offsetX = (targetW - drawW) / 2;
    const offsetY = (targetH - drawH) / 2;
 
    ctx.drawImage(img, sx, sy, sWidth, sHeight, offsetX, offsetY, drawW, drawH);
    ctx.restore();
}
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