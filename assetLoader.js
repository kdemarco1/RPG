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