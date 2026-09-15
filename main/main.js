const canvas = document.querySelector("#background-canvas");
const assetRoot = canvas?.dataset.assetRoot || "../assets";
const clickSoundUrl = `${assetRoot}/SFX/${encodeURIComponent("click-決定ボタンを押す31.mp3")}`;
const selectSoundUrl = `${assetRoot}/SFX/${encodeURIComponent("select-決定ボタンを押す3.mp3")}`;

function updateResponsiveHeaderAssets() {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const headerSvg = document.querySelector(".site-header-svg");
  const mobileAssetRoot = `${assetRoot}/Mobile Layout`;
  const desktopHeaderRoot = `${assetRoot}/Header`;

  const buttonAssetMap = {
    white: {
      mobile: "Profile Button-Mobile.svg",
      desktop: "Profile Button.svg",
    },
    blue: { mobile: "Work Button-Mobile.svg", desktop: "Work Button.svg" },
    cyan: { mobile: "Fillms Button-Mobile.svg", desktop: "Films Button.svg" },
    black: {
      mobile: "Experiments Button-Mobile.svg",
      desktop: "Experiments Button.svg",
    },
  };

  if (headerSvg) {
    const headerPath = isMobile
      ? `${mobileAssetRoot}/Header-Mobile.svg`
      : `${desktopHeaderRoot}/Header.svg`;
    headerSvg.src = encodeURI(headerPath);
  }

  Object.entries(buttonAssetMap).forEach(([variant, files]) => {
    const buttonImage = document.querySelector(`.header-button-${variant} img`);
    if (!buttonImage) {
      return;
    }

    const source = isMobile
      ? `${mobileAssetRoot}/${files.mobile}`
      : `${desktopHeaderRoot}/${files.desktop}`;
    buttonImage.src = encodeURI(source);
  });
}

window.addEventListener("resize", updateResponsiveHeaderAssets);
updateResponsiveHeaderAssets();

document.addEventListener("click", (event) => {
  const navigation = event.target.closest("a");
  const clickSound = new Audio(clickSoundUrl);
  clickSound.volume = 0.35;
  clickSound.play().catch(() => {});

  if (navigation) {
    event.preventDefault();
    const selectSound = new Audio(selectSoundUrl);
    selectSound.volume = 0.35;
    selectSound.play().catch(() => {});

    window.setTimeout(() => {
      window.location.href = navigation.href;
    }, 160);
  }
});

if (canvas && window.PIXI) {
  const app = new PIXI.Application({
    view: canvas,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio, 2),
  });

  const image = PIXI.Sprite.from(`${assetRoot}/Backgrounds/window_old_BG.jpg`);
  const displacementCanvas = document.createElement("canvas");
  const displacementContext = displacementCanvas.getContext("2d");
  const displacementSize = 128;

  displacementCanvas.width = displacementSize;
  displacementCanvas.height = displacementSize;

  const displacementData = displacementContext.createImageData(
    displacementSize,
    displacementSize,
  );
  const noiseValues = new Uint8Array(displacementSize * displacementSize);
  const dragX = new Float32Array(displacementSize * displacementSize);
  const dragY = new Float32Array(displacementSize * displacementSize);
  const momentumX = new Float32Array(displacementSize * displacementSize);
  const momentumY = new Float32Array(displacementSize * displacementSize);

  for (let index = 0; index < displacementData.data.length; index += 4) {
    const value = Math.floor(Math.random() * 256);
    noiseValues[index / 4] = value;
    displacementData.data[index] = value;
    displacementData.data[index + 1] = value;
    displacementData.data[index + 2] = value;
    displacementData.data[index + 3] = 255;
  }

  displacementContext.putImageData(displacementData, 0, 0);

  const displacementTexture = PIXI.Texture.from(displacementCanvas);
  displacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

  const displacementSprite = new PIXI.Sprite(displacementTexture);
  const DisplacementFilter =
    PIXI.filters?.DisplacementFilter || window.DisplacementFilter;

  if (!DisplacementFilter) {
    app.stage.addChild(image);
    console.warn("Pixi displacement filter is unavailable.");
  } else {
    const displacementFilter = new DisplacementFilter(displacementSprite);
    const PixelateFilter = PIXI.filters?.PixelateFilter;
    const pixelateFilter = PixelateFilter ? new PixelateFilter(14) : null;

    displacementSprite.alpha = 0;
    app.stage.addChild(image, displacementSprite);
    image.filters = pixelateFilter
      ? [displacementFilter, pixelateFilter]
      : [displacementFilter];

    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      radius: 100,
      targetRadius: 100,
      velocityX: 0,
      velocityY: 0,
      previousX: window.innerWidth / 2,
      previousY: window.innerHeight / 2,
    };

    function updateDisplacementMap() {
      const radius = Math.max(
        60,
        Math.min(200, pointer.radius + Math.abs(pointer.targetRadius - 100)),
      );
      const pointerMapX = pointer.x / window.innerWidth;
      const pointerMapY = pointer.y / window.innerHeight;
      const radiusMapX = radius / window.innerWidth;
      const radiusMapY = radius / window.innerHeight;

      for (let y = 0; y < displacementSize; y += 1) {
        for (let x = 0; x < displacementSize; x += 1) {
          const mapX = x / (displacementSize - 1);
          const mapY = y / (displacementSize - 1);
          const distanceX = (mapX - pointerMapX) / radiusMapX;
          const distanceY = (mapY - pointerMapY) / radiusMapY;
          const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
          const falloff = Math.max(0, 1 - distance);
          const cellIndex = y * displacementSize + x;
          const force = falloff ** 1.6;
          const swirlX = -distanceY * pointer.velocityY * 0.45;
          const swirlY = distanceX * pointer.velocityX * 0.45;

          momentumX[cellIndex] += (pointer.velocityX + swirlX) * force * 4.5;
          momentumY[cellIndex] += (pointer.velocityY + swirlY) * force * 4.5;
          momentumX[cellIndex] *= 0.88;
          momentumY[cellIndex] *= 0.88;
          dragX[cellIndex] += momentumX[cellIndex];
          dragY[cellIndex] += momentumY[cellIndex];
          dragX[cellIndex] *= 0.965;
          dragY[cellIndex] *= 0.965;

          const noise = (noiseValues[cellIndex] - 128) * 0.12 * falloff;
          const index = cellIndex * 4;

          displacementData.data[index] = Math.max(
            0,
            Math.min(255, 128 + noise + dragX[cellIndex]),
          );
          displacementData.data[index + 1] = Math.max(
            0,
            Math.min(255, 128 + noise + dragY[cellIndex]),
          );
          displacementData.data[index + 2] = 128;
          displacementData.data[index + 3] = 255;
        }
      }

      displacementContext.putImageData(displacementData, 0, 0);
      displacementTexture.baseTexture.update();
    }

    function resizeImage() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const imageWidth = image.texture.width || image.width || 1;
      const imageHeight = image.texture.height || image.height || 1;
      const scale = Math.max(
        viewportWidth / imageWidth,
        viewportHeight / imageHeight,
      );

      image.scale.set(scale);
      image.x = (viewportWidth - imageWidth * scale) / 2;
      image.y = (viewportHeight - imageHeight * scale) / 2;
      displacementSprite.width = viewportWidth;
      displacementSprite.height = viewportHeight;
    }

    window.addEventListener("pointermove", (event) => {
      const movement = Math.hypot(
        event.clientX - pointer.targetX,
        event.clientY - pointer.targetY,
      );
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.targetRadius = Math.min(200, 100 + movement * 2);
    });

    window.addEventListener("resize", resizeImage);
    image.texture.baseTexture.on("loaded", resizeImage);
    resizeImage();

    app.ticker.add(() => {
      const elapsed = app.ticker.lastTime * 0.001;

      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      pointer.radius += (pointer.targetRadius - pointer.radius) * 0.08;
      pointer.velocityX = pointer.x - pointer.previousX;
      pointer.velocityY = pointer.y - pointer.previousY;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;

      displacementSprite.x = Math.sin(elapsed * 0.35) * 8;
      displacementSprite.y = Math.cos(elapsed * 0.25) * 8;
      displacementFilter.scale.x = 160;
      displacementFilter.scale.y = 160;
      updateDisplacementMap();
    });
  }
}

const viewLinks = document.querySelectorAll("[data-view]");
const pageViews = document.querySelectorAll("[data-page]");

function showPageView(viewName) {
  const selectedView = viewName === "about" ? "about" : "home";

  pageViews.forEach((view) => {
    view.hidden = view.dataset.page !== selectedView;
  });
}

viewLinks.forEach((link) => {
  link.addEventListener("click", () => {
    showPageView(link.dataset.view);
  });
});

window.addEventListener("hashchange", () => {
  showPageView(window.location.hash.slice(1));
});

showPageView(window.location.hash.slice(1));

function makeDraggable(element, textSelectors = "h1, h2, p") {
  let pointerOffsetX = 0;
  let pointerOffsetY = 0;

  element.addEventListener("pointerdown", (event) => {
    const bounds = element.getBoundingClientRect();

    if (textSelectors && event.target.closest(textSelectors)) {
      return;
    }

    pointerOffsetX = event.clientX - bounds.left;
    pointerOffsetY = event.clientY - bounds.top;
    element.classList.add("is-dragging");
    element.setPointerCapture(event.pointerId);
  });

  element.addEventListener("pointermove", (event) => {
    if (!element.hasPointerCapture(event.pointerId)) {
      return;
    }

    const maxLeft = window.innerWidth - element.offsetWidth;
    const maxTop = window.innerHeight - element.offsetHeight;
    const nextLeft = Math.min(
      Math.max(0, event.clientX - pointerOffsetX),
      maxLeft,
    );
    const nextTop = Math.min(
      Math.max(0, event.clientY - pointerOffsetY),
      maxTop,
    );

    element.style.left = `${nextLeft}px`;
    element.style.top = `${nextTop}px`;
    element.style.right = "auto";
    element.style.bottom = "auto";
  });

  function stopDragging(event) {
    element.classList.remove("is-dragging");
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  }

  element.addEventListener("pointerup", stopDragging);
  element.addEventListener("pointercancel", stopDragging);
}

document.querySelectorAll(".about-view .profile-card").forEach((card) => {
  makeDraggable(card);
});

document.querySelectorAll(".about-view .app-icon").forEach((icon) => {
  makeDraggable(icon, "");
});
