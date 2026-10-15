
(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  document.documentElement.classList.add('js-ready');
  document.body.classList.add('is-intro-open');

  const header = document.querySelector('[data-header]');
  const cursorGlow = document.querySelector('.cursor-glow');
  const soundToggle = document.querySelector('[data-sound-toggle]');
  const soundLabel = document.querySelector('[data-sound-label]');
  const enterSoundBtn = document.querySelector('[data-enter-sound]');
  const enterSilentBtn = document.querySelector('[data-enter-silent]');

  const cinemaItems = [];
  let viewportHeight = window.innerHeight;
  let scrollY = window.scrollY;
  let needsUpdate = true;
  let lastPointerX = -999;
  let lastPointerY = -999;
  let cursorNeedsUpdate = false;
  let audioEnabled = false;
  let introClosed = false;
  let lastFrameTime = 0;

  // Seconds-based damping feels the same on 60 Hz and high-refresh displays.
  const motion = {
    response: isCoarsePointer ? 0.32 : 0.28,
    maxProgressPerSecond: 0.14,
    settleThreshold: 0.0003,
    sceneHysteresis: 0.006,
    seekThreshold: 1 / 48,
  };

  const audio = {
    ocean: createAudio('assets/audio/ocean-bg.mp3', { loop: true, volume: 0 }),
    from: createAudio('assets/audio/from-vision-score.mp3', { loop: true, volume: 0 }),
    sea: createAudio('assets/audio/to-open-sea-score.mp3', { loop: true, volume: 0 }),
    sonar: createAudio('assets/audio/sonar-intro.mp3', { loop: false, volume: 0 })
  };

  function createAudio(src, options = {}) {
    const element = new Audio(src);
    element.preload = 'auto';
    element.loop = Boolean(options.loop);
    element.volume = options.volume ?? 0;
    return element;
  }

  function safePlay(element) {
    if (!element) return;
    const promise = element.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {});
    }
  }

  function updateSoundUI() {
    if (!soundToggle || !soundLabel) return;
    soundToggle.classList.toggle('is-on', audioEnabled);
    soundToggle.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
    soundLabel.textContent = audioEnabled ? 'Sound On' : 'Sound Off';
  }

  function unlockAudio({ playSonar = false } = {}) {
    audioEnabled = true;

    safePlay(audio.ocean);
    safePlay(audio.from);
    safePlay(audio.sea);

    if (playSonar) {
      try {
        audio.sonar.currentTime = 0;
        audio.sonar.volume = 0.54;
        safePlay(audio.sonar);
        setTimeout(() => fadeAndPause(audio.sonar, 1600), 4800);
      } catch (error) {}
    }

    updateSoundUI();
    requestScrollUpdate();
  }

  function disableAudio() {
    audioEnabled = false;
    updateSoundUI();
    requestScrollUpdate();
  }

  function fadeAndPause(element, duration = 1200) {
    if (!element) return;
    const startVolume = element.volume || 0;
    const started = performance.now();

    function step(now) {
      const progress = clamp((now - started) / duration);
      element.volume = startVolume * (1 - progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.pause();
        element.volume = 0;
      }
    }

    requestAnimationFrame(step);
  }

  function closeIntro() {
    if (introClosed) return;
    introClosed = true;
    document.body.classList.add('has-entered');
    document.body.classList.remove('is-intro-open');
    document.dispatchEvent(new Event('aurelia:entered'));
    setTimeout(() => {
      const intro = document.querySelector('[data-intro]');
      if (intro) intro.setAttribute('aria-hidden', 'true');
    }, 950);
  }

  function setupReveals() {
    const revealNodes = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      revealNodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealNodes.forEach((node) => observer.observe(node));
  }

  function setupCinemaSections() {
    document.querySelectorAll('[data-cinema]').forEach((section) => {
      const video = section.querySelector('video');
      const panels = Array.from(section.querySelectorAll('[data-scene]'));
      const progressBar = section.querySelector('.cinema-progress span');
      const currentScene = section.querySelector('[data-current-scene]');
      const audioZone = section.dataset.audioZone;

      if (!video || !panels.length) return;

      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const item = {
        section,
        video,
        panels,
        progressBar,
        currentScene,
        audioZone,
        top: 0,
        height: 1,
        duration: 0,
        progress: 0,
        targetProgress: 0,
        frameProgress: 0,
        activeIndex: -1,
        isVisible: false,
        primed: false,
      };

      video.addEventListener('loadedmetadata', () => {
        item.duration = Number.isFinite(video.duration) ? video.duration : 0;
        video.pause();
        needsUpdate = true;
      });

      video.addEventListener('canplay', () => {
        video.pause();
        needsUpdate = true;
      }, { once: true });

      video.addEventListener("seeked", () => {
        const duration = item.duration || video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          item.frameProgress = clamp(
            video.currentTime / Math.max(0.001, duration - 0.08),
          );
        }
      });

      cinemaItems.push(item);
    });

    refreshMeasurements();
  }

  function refreshMeasurements() {
    viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    cinemaItems.forEach((item) => {
      const rect = item.section.getBoundingClientRect();
      item.top = rect.top + window.scrollY;
      item.height = item.section.offsetHeight;
    });
    needsUpdate = true;
  }

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', scrollY > 44);
  }

  function updateCinemaTarget(item) {
    const travel = Math.max(1, item.height - viewportHeight);
    const wasVisible = item.isVisible;
    item.targetProgress = clamp((scrollY - item.top) / travel);
    item.isVisible =
      scrollY + viewportHeight > item.top && scrollY < item.top + item.height;

    // Anchors and re-entry start at the right point; only continuous scrolling trails.
    if (!item.isVisible || !wasVisible || prefersReducedMotion) {
      item.progress = item.targetProgress;
    }
  }

  function updateCinemaPresentation(item, progress) {
    if (item.progressBar) {
      item.progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    }

    const sceneCount = item.panels.length;
    const nextIndex = Math.min(
      sceneCount - 1,
      Math.floor(progress * sceneCount),
    );
    if (nextIndex === item.activeIndex) return;

    // A tiny dead band prevents flickering when hovering on a chapter boundary.
    if (
      item.activeIndex >= 0 &&
      nextIndex > item.activeIndex &&
      progress < (item.activeIndex + 1) / sceneCount + motion.sceneHysteresis
    )
      return;
    if (
      item.activeIndex >= 0 &&
      nextIndex < item.activeIndex &&
      progress > item.activeIndex / sceneCount - motion.sceneHysteresis
    )
      return;

    const previousIndex = item.activeIndex;
    item.panels.forEach((panel, index) => {
      panel.classList.toggle(
        "is-leaving",
        index === previousIndex && index !== nextIndex,
      );
      panel.classList.toggle("is-active", index === nextIndex);
    });
    item.activeIndex = nextIndex;
    if (item.currentScene)
      item.currentScene.textContent = String(nextIndex + 1).padStart(2, "0");
  }

  function updateCinemaItem(item, deltaTime) {
    const video = item.video;
    const duration =
      item.duration || (Number.isFinite(video.duration) ? video.duration : 0);

    if (!prefersReducedMotion && item.isVisible) {
      const distance = item.targetProgress - item.progress;
      const easedStep = distance * (1 - Math.exp(-deltaTime / motion.response));
      const maxStep = motion.maxProgressPerSecond * deltaTime;
      item.progress = clamp(
        item.progress + clamp(easedStep, -maxStep, maxStep),
      );
      if (
        Math.abs(item.targetProgress - item.progress) < motion.settleThreshold
      ) {
        item.progress = item.targetProgress;
      }
    }

    const canScrub =
      item.isVisible &&
      duration > 0 &&
      video.readyState >= 2 &&
      !prefersReducedMotion;
    if (canScrub) {
      const targetTime = Math.max(0, duration - 0.08) * item.progress;
      // Finish decoding the current seek before submitting a new one. The next
      // frame always uses the newest eased target, never a queue of old positions.
      if (
        !video.seeking &&
        Math.abs(video.currentTime - targetTime) > motion.seekThreshold
      ) {
        try {
          video.currentTime = targetTime;
        } catch (error) {
          // Metadata and decoding can briefly be unavailable on mobile browsers.
        }
      }
    }

    // Copy and chapter count follow the decoded movie, not the raw wheel input.
    updateCinemaPresentation(
      item,
      canScrub ? item.frameProgress : item.progress,
    );
  }

  function sectionVisibilityAmount(section) {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= viewportHeight) return 0;

    const entering = clamp((viewportHeight - rect.top) / viewportHeight);
    const leaving = clamp(rect.bottom / viewportHeight);
    return Math.min(entering, leaving, 1);
  }

  function setAudioVolume(element, target, speed = 0.04) {
    if (!element) return;
    element.volume = clamp(lerp(element.volume || 0, target, speed), 0, 1);
  }

  function updateAudio() {
    const targets = {
      ocean: audioEnabled ? 0.25 : 0,
      from: 0,
      sea: 0
    };

    if (audioEnabled) {
      cinemaItems.forEach((item) => {
        const amount = sectionVisibilityAmount(item.section);
        if (item.audioZone === 'from') targets.from = Math.max(targets.from, amount * 0.16);
        if (item.audioZone === 'sea') targets.sea = Math.max(targets.sea, amount * 0.15);
      });
    }

    setAudioVolume(audio.ocean, targets.ocean, 0.035);
    setAudioVolume(audio.from, targets.from, 0.045);
    setAudioVolume(audio.sea, targets.sea, 0.045);

    if (audioEnabled) {
      if (audio.ocean.paused) safePlay(audio.ocean);
      if (audio.from.paused) safePlay(audio.from);
      if (audio.sea.paused) safePlay(audio.sea);
    } else {
      if (audio.ocean.volume < 0.002) audio.ocean.pause();
      if (audio.from.volume < 0.002) audio.from.pause();
      if (audio.sea.volume < 0.002) audio.sea.pause();
    }
  }

  function updateCursor() {
    if (!cursorGlow || !cursorNeedsUpdate) return;
    cursorGlow.style.transform = `translate3d(${lastPointerX}px, ${lastPointerY}px, 0)`;
    cursorNeedsUpdate = false;
  }

  function render(now) {
    const deltaTime = lastFrameTime
      ? Math.min((now - lastFrameTime) / 1000, 0.05)
      : 1 / 60;
    lastFrameTime = now;
    if (needsUpdate) {
      scrollY = window.scrollY || window.pageYOffset;
      updateHeader();
      cinemaItems.forEach(updateCinemaTarget);
      needsUpdate = false;
    }

    cinemaItems.forEach((item) => updateCinemaItem(item, deltaTime));
    updateAudio();
    updateCursor();
    requestAnimationFrame(render);
  }

  function requestScrollUpdate() {
    scrollY = window.scrollY || window.pageYOffset;
    needsUpdate = true;
  }

  function unlockVideos() {
    cinemaItems.forEach((item) => {
      const video = item.video;
      if (item.primed) return;
      item.primed = true;
      video.muted = true;
      video.playsInline = true;
      try {
        const promise = video.play();
        if (promise && typeof promise.then === "function") {
          promise
            .then(() => {
              video.pause();
              if (video.readyState >= 1 && video.currentTime === 0) {
                video.currentTime = 0.01;
              }
            })
            .catch(() => {});
        }
      } catch (error) {}
    });
  }

  enterSoundBtn?.addEventListener('click', () => {
    unlockAudio({ playSonar: true });
    unlockVideos();
    closeIntro();
  });

  enterSilentBtn?.addEventListener('click', () => {
    unlockVideos();
    closeIntro();
  });

  soundToggle?.addEventListener('click', () => {
    if (audioEnabled) {
      disableAudio();
    } else {
      unlockAudio({ playSonar: false });
    }
  });

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    refreshMeasurements();
  }, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(refreshMeasurements, 250);
  }, { passive: true });

  window.addEventListener('touchstart', unlockVideos, { once: true, passive: true });
  window.addEventListener('pointerdown', unlockVideos, { once: true, passive: true });

  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      cursorNeedsUpdate = true;
    }, { passive: true });
  }

  window.addEventListener('load', () => {
    document.body.classList.add('is-loaded');
    refreshMeasurements();
  }, { once: true });

  setupReveals();
  setupCinemaSections();
  updateSoundUI();
  requestAnimationFrame(render);
})();
