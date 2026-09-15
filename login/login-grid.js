const screen = document.getElementById("loginScreen");
const gridOverlay = document.getElementById("gridOverlay");

if (screen && gridOverlay) {
  const cellSize = 170;
  const gap = 0;
  const radius = 0.55;
  const trail = [];
  const trailLifetime = 900;

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
    const eased = 1 - Math.pow(1 - fadeProgress, 5);
    const softFalloff = Math.pow(eased, 1.6);
    return 0.1 * softFalloff;
  }

  function resetGrid() {
    trail.length = 0;
    [...gridOverlay.children].forEach((cell) => {
      cell.style.opacity = "1";
      cell.style.transition = "none";
    });

    requestAnimationFrame(() => {
      [...gridOverlay.children].forEach((cell) => {
        cell.style.transition = "opacity 500ms ease-in-out";
      });
    });
  }

  function updateGridFromPointer(clientX, clientY) {
    const cells = [...gridOverlay.children];
    const rect = screen.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const columns = Math.ceil(screen.clientWidth / (cellSize + gap));
    const innerRadius = cellSize * 1.2;
    const outerRadius = cellSize * (radius + 1.5);

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
        const trailRadius = outerRadius * 1.35;

        if (distance < trailRadius) {
          const trailOpacity =
            getRevealOpacity(distance, innerRadius * 1.05, trailRadius) *
            Math.max(ageFactor, 0) *
            1.7;
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
      cell.style.transition = "opacity 500ms ease-in-out";
    });
  }

  buildGrid();

  window.addEventListener("pointermove", (event) => {
    const rect = screen.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    trail.push({ x: localX, y: localY, time: performance.now() });
    if (trail.length > 7) {
      trail.shift();
    }
    updateTrail();
    updateGridFromPointer(event.clientX, event.clientY);
  });

  screen.addEventListener("pointerleave", resetGrid);
  window.addEventListener("pointerleave", resetGrid);
  document.addEventListener("mouseleave", resetGrid);

  window.addEventListener("resize", buildGrid);
}
