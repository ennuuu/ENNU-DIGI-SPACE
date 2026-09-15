const motionTabs = document.querySelectorAll(".motion-tab");
const motionGallery = document.querySelector(".motion-gallery");
const motionGalleryStage = document.querySelector(".motion-gallery-stage");
const motionProjectViews = document.querySelectorAll("[data-project-view]");
const projectScrollPrompt = document.querySelector(".project-scroll-prompt");
const isMobileViewport = () => window.matchMedia("(max-width: 820px)").matches;
let projectScrollPromptTimer = 0;
let projectScrollPromptHideTimer = 0;

function showProjectScrollPrompt() {
  if (!projectScrollPrompt) {
    return;
  }

  window.clearTimeout(projectScrollPromptTimer);
  window.clearTimeout(projectScrollPromptHideTimer);
  projectScrollPrompt.hidden = false;
  projectScrollPrompt.classList.remove("project-scroll-prompt-fading");
  projectScrollPrompt.classList.add("project-scroll-prompt-visible");

  projectScrollPromptTimer = window.setTimeout(() => {
    projectScrollPrompt.classList.remove("project-scroll-prompt-visible");
    projectScrollPrompt.classList.add("project-scroll-prompt-fading");
    projectScrollPromptHideTimer = window.setTimeout(() => {
      projectScrollPrompt.classList.remove("project-scroll-prompt-fading");
      projectScrollPrompt.hidden = true;
    }, 420);
  }, 1500);
}

function hideProjectScrollPrompt() {
  if (!projectScrollPrompt) {
    return;
  }

  window.clearTimeout(projectScrollPromptTimer);
  window.clearTimeout(projectScrollPromptHideTimer);
  projectScrollPrompt.classList.remove("project-scroll-prompt-fading");
  projectScrollPrompt.classList.remove("project-scroll-prompt-visible");
  projectScrollPrompt.hidden = true;
}

function showMotionProject(projectName) {
  const projectNames = new Set(
    Array.from(motionTabs, (tab) => tab.dataset.project),
  );
  const selectedProject = projectNames.has(projectName) ? projectName : null;

  if (motionGallery) {
    motionGallery.hidden = Boolean(selectedProject);
  }

  motionProjectViews.forEach((view) => {
    const isSelected = view.dataset.projectView === selectedProject;
    view.hidden = !isSelected;

    if (isMobileViewport()) {
      const carousel = view.querySelector(".project-carousel");
      const detail = view.querySelector(".project-detail");

      if (carousel) {
        carousel.hidden = !isSelected;
      }

      if (detail) {
        detail.hidden = !isSelected;
        if (isSelected) {
          detail.classList.add("project-detail-visible");
        } else {
          detail.classList.remove("project-detail-visible");
        }
      }
    }
  });

  if (selectedProject) {
    showProjectScrollPrompt();
  } else {
    hideProjectScrollPrompt();
  }
}

window.addEventListener("hashchange", () => {
  showMotionProject(window.location.hash.slice(1));
});

showMotionProject(window.location.hash.slice(1));

function resetMotionGalleryTilt() {
  if (!motionGalleryStage) {
    return;
  }

  motionGalleryStage.style.setProperty("--gallery-tilt-x", "0deg");
  motionGalleryStage.style.setProperty("--gallery-tilt-y", "0deg");
  motionGalleryStage.style.setProperty("--gallery-zoom", "1");
  motionGalleryStage.style.setProperty("--gallery-shift-x", "0px");
  motionGalleryStage.style.setProperty("--gallery-shift-y", "0px");
}

window.addEventListener("pointermove", (event) => {
  if (!motionGalleryStage || motionGallery.hidden || isMobileViewport()) {
    return;
  }

  const normalizedX = event.clientX / window.innerWidth - 0.5;
  const normalizedY = event.clientY / window.innerHeight - 0.5;
  const cursorDistance = Math.min(
    1,
    Math.hypot(normalizedX, normalizedY) / Math.SQRT1_2,
  );

  motionGalleryStage.style.setProperty(
    "--gallery-tilt-x",
    `${normalizedY * 7}deg`,
  );
  motionGalleryStage.style.setProperty(
    "--gallery-tilt-y",
    `${normalizedX * -9}deg`,
  );
  motionGalleryStage.style.setProperty(
    "--gallery-zoom",
    `${1 + cursorDistance * 0.1}`,
  );
  motionGalleryStage.style.setProperty(
    "--gallery-shift-x",
    `${normalizedX * -110}px`,
  );
  motionGalleryStage.style.setProperty(
    "--gallery-shift-y",
    `${normalizedY * -85}px`,
  );
});

window.addEventListener("blur", resetMotionGalleryTilt);

function initializeProjectView(projectView) {
  const carousel = projectView.querySelector(".project-carousel");
  const detail = projectView.querySelector(".project-detail");
  if (!carousel || !detail) {
    return;
  }

  let transitionTimer = 0;

  if (isMobileViewport()) {
    return;
  }

  function showDetail() {
    window.clearTimeout(transitionTimer);
    carousel.hidden = false;
    carousel.classList.add("project-carousel-state-hidden");
    detail.hidden = false;
    detail.scrollLeft = 0;

    window.requestAnimationFrame(() => {
      detail.classList.add("project-detail-visible");
    });

    transitionTimer = window.setTimeout(() => {
      carousel.hidden = true;
    }, 520);
  }

  function hideDetail() {
    window.clearTimeout(transitionTimer);
    detail.classList.remove("project-detail-visible");
    detail.scrollLeft = 0;
    carousel.hidden = false;
    carousel.classList.add("project-carousel-state-hidden");

    window.requestAnimationFrame(() => {
      carousel.classList.remove("project-carousel-state-hidden");
    });

    transitionTimer = window.setTimeout(() => {
      detail.hidden = true;
    }, 520);
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (projectView.hidden || !detail.hidden) {
        return;
      }

      if (event.deltaY > 0 || event.deltaX > 0) {
        event.preventDefault();
        showDetail();
      }
    },
    { passive: false },
  );

  detail.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY || event.deltaX;

      if (delta < 0 && detail.scrollLeft <= 0) {
        hideDetail();
        return;
      }

      detail.scrollLeft += delta;
    },
    { passive: false },
  );

  let pointerStartY = 0;
  let pointerActive = false;

  carousel.addEventListener("pointerdown", (event) => {
    pointerStartY = event.clientY;
    pointerActive = true;
    carousel.classList.add("is-swiping");
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointerup", (event) => {
    if (!pointerActive) {
      return;
    }

    const verticalDistance = event.clientY - pointerStartY;
    pointerActive = false;
    carousel.classList.remove("is-swiping");

    if (verticalDistance < -50) {
      showDetail();
    }

    if (carousel.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
  });

  carousel.addEventListener("pointercancel", () => {
    pointerActive = false;
    carousel.classList.remove("is-swiping");
  });
}

motionProjectViews.forEach(initializeProjectView);

document.querySelectorAll(".motion-back-button").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.hash = "";
  });
});

const PROJECT_VIDEO_TRIM_SECONDS = 2;

document.querySelectorAll(".project-video").forEach((video) => {
  const trimSeconds = Number(
    video.dataset.trimSeconds ?? PROJECT_VIDEO_TRIM_SECONDS,
  );

  const applyTrim = () => {
    if (!Number.isFinite(video.duration) || trimSeconds <= 0) {
      return;
    }

    const trimCutoff = Math.max(0, video.duration - trimSeconds);
    if (video.currentTime >= trimCutoff) {
      video.currentTime = 0;
    }
  };

  video.addEventListener("loadedmetadata", applyTrim);
  video.addEventListener("timeupdate", applyTrim);
});

motionTabs.forEach((tab) => {
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;

  tab.addEventListener("pointerdown", (event) => {
    if (isMobileViewport()) {
      window.location.hash = tab.dataset.project;
      return;
    }

    if (event.target.closest("video, iframe")) {
      return;
    }

    const bounds = tab.getBoundingClientRect();
    offsetX = event.clientX - bounds.left;
    offsetY = event.clientY - bounds.top;
    moved = false;
    tab.setPointerCapture(event.pointerId);
  });

  tab.addEventListener("pointermove", (event) => {
    if (isMobileViewport()) {
      return;
    }

    if (!tab.hasPointerCapture(event.pointerId)) {
      return;
    }

    moved = true;

    const maxLeft = window.innerWidth - tab.offsetWidth;
    const maxTop = window.innerHeight - tab.offsetHeight;
    tab.style.left = `${Math.min(Math.max(0, event.clientX - offsetX), maxLeft)}px`;
    tab.style.top = `${Math.min(Math.max(0, event.clientY - offsetY), maxTop)}px`;
    tab.style.right = "auto";
  });

  function stopDragging(event) {
    if (isMobileViewport()) {
      return;
    }

    if (!moved) {
      window.location.hash = tab.dataset.project;
    }
    if (tab.hasPointerCapture(event.pointerId)) {
      tab.releasePointerCapture(event.pointerId);
    }
  }

  tab.addEventListener("pointerup", stopDragging);
  tab.addEventListener("pointercancel", stopDragging);

  tab.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.hash = tab.dataset.project;
    }
  });
});
