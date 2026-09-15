const screen = document.getElementById("loginScreen");
const gridOverlay = document.getElementById("gridOverlay");

if (screen && gridOverlay) {
  const cellSize = 170;
  const gap = 0;
  const radius = 1.2;
  const trail = [];
  const trailLifetime = 600;

  function buildGrid() {
    const screenWidth = screen.clientWidth;
    const screenHeight = screen.clientHeight;
    const columns = Math.ceil(screenWidth / (cellSize + gap));
    const rows = Math.ceil(screenHeight / (cellSize + gap));

    gridOverlay.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`;
    gridOverlay.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    gridOverlay.style.justifyContent = "center";
    gridOverlay.style.alignContent = "center";

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < columns * rows; i += 1) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      fragment.appendChild(cell);
    }

    gridOverlay.innerHTML = "";
    gridOverlay.appendChild(fragment);
  }

  function updateTrail() {
    const now = performance.now();

    for (let i = trail.length - 1; i >= 0; i -= 1) {
      if (now - trail[i].time > trailLifetime) {
        trail.splice(i, 1);
      }
    }
  }

  function getRevealOpacity(distance, inner, outer) {
    if (distance <= inner) {
      return 0;
    }

    if (distance >= outer) {
      return 1;
    }

    const fadeProgress = (distance - inner) / (outer - inner);
    const softFalloff = Math.pow(fadeProgress, 2.8);
    return 0.5 * softFalloff;
  }

  function updateGridFromPointer(clientX, clientY) {
    const cells = [...gridOverlay.children];
    const rect = screen.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const columns = Math.ceil(screen.clientWidth / (cellSize + gap));
    const innerRadius = cellSize * 0.7;
    const outerRadius = cellSize * (radius + 0.9);

    cells.forEach((cell, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cellX = col * (cellSize + gap) + cellSize / 2;
      const cellY = row * (cellSize + gap) + cellSize / 2;
      let opacity = 1;

      trail.forEach((point) => {
        const dx = cellX - point.x;
        const dy = cellY - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ageFactor = 1 - (performance.now() - point.time) / trailLifetime;

        if (distance < outerRadius) {
          const trailOpacity =
            getRevealOpacity(distance, innerRadius, outerRadius) *
            Math.max(ageFactor, 0);
          opacity = Math.min(opacity, trailOpacity);
        }
      });

      const dx = cellX - x;
      const dy = cellY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < outerRadius) {
        opacity = Math.min(
          opacity,
          getRevealOpacity(distance, innerRadius, outerRadius),
        );
      }

      cell.style.opacity = opacity.toFixed(3);
    });
  }

  buildGrid();

  window.addEventListener("pointermove", (event) => {
    const rect = screen.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    trail.push({ x: localX, y: localY, time: performance.now() });
    if (trail.length > 12) {
      trail.shift();
    }
    updateTrail();
    updateGridFromPointer(event.clientX, event.clientY);
  });

  window.addEventListener("pointerleave", () => {
    trail.length = 0;
    [...gridOverlay.children].forEach((cell) => {
      cell.style.opacity = "1";
    });
  });

  window.addEventListener("resize", buildGrid);
}
