/* Aurelia atelier interactions. The original scroll-film controller lives in main.js. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const main = $("main");
  const intro = $("[data-intro]");
  const background = [
    main,
    $(".site-header"),
    $(".site-footer"),
    $(".sound-toggle"),
  ];
  const setBackgroundInert = (value) =>
    background.forEach((node) => {
      if (node) node.inert = value;
    });
  const focusable = (root) =>
    $$(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex="0"]',
      root,
    ).filter(
      (node) => !node.closest("[inert]") && node.getClientRects().length,
    );
  const trap = (event, nodes) => {
    if (event.key !== "Tab" || !nodes.length) return;
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !nodes.includes(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  setBackgroundInert(true);
  intro.focus({ preventScroll: true });
  document.addEventListener(
    "aurelia:entered",
    () => {
      setBackgroundInert(false);
      intro.inert = true;
      intro.removeAttribute("aria-modal");
      $("h1").focus({ preventScroll: true });
    },
    { once: true },
  );
  intro.addEventListener("keydown", (event) => {
    trap(event, focusable(intro));
    if (event.key === "Escape") $("[data-enter-silent]").click();
  });
  // Font loading can alter section positions; let the original controller remeasure.
  document.fonts.ready.then(() => window.dispatchEvent(new Event("resize")));
  // Model and material changes can shift the later film. Keep its measurements current.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => window.dispatchEvent(new Event("resize"))).observe(
      main,
    );
  }
  $$("[data-scene]").forEach((panel) => {
    const sync = () => {
      panel.setAttribute(
        "aria-hidden",
        String(!panel.classList.contains("is-active")),
      );
    };
    sync();
    new MutationObserver(sync).observe(panel, {
      attributes: true,
      attributeFilter: ["class"],
    });
  });
  $("[data-year]").textContent = new Date().getFullYear();

  const menuButton = $(".menu-toggle");
  const mobileNav = $(".mobile-nav");
  function setMenu(open, returnFocus = true) {
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.inert = !open;
    [main, $(".site-footer"), $(".sound-toggle")].forEach((node) => {
      node.inert = open;
    });
    if (open) $("a", mobileNav).focus();
    else if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", () =>
    setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
  );
  $$(".mobile-nav a, .site-header a").forEach((link) =>
    link.addEventListener("click", () => {
      if (document.body.classList.contains("menu-open")) {
        setMenu(false, false);
        const target = $(link.getAttribute("href"));
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("menu-open")) return;
    if (event.key === "Escape") setMenu(false);
    trap(event, [...focusable($(".site-header")), ...focusable(mobileNav)]);
  });
  const desktop = matchMedia("(min-width: 981px)");
  desktop.addEventListener("change", (event) => {
    if (event.matches && document.body.classList.contains("menu-open"))
      setMenu(false);
  });

  // Native accordions: one material story at a time, with a corresponding detail crop.
  const materialDetails = $$("[data-materials] details");
  materialDetails.forEach((detail, index) =>
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      materialDetails.forEach((other) => {
        if (other !== detail) other.open = false;
      });
      $(".material-visual").dataset.material = String(index);
    }),
  );

  const gallery = $(".gallery");
  const galleryImage = $(".gallery-image");
  const slides = [
    {
      image: "interior-salon",
      alt: "Warm contemporary salon with panoramic ocean views",
      label: "01 / The panoramic salon",
      title: "Room to",
      italic: "exhale.",
      description:
        "Warm timber, soft textures and a horizon that belongs entirely to you.",
    },
    {
      image: "aft-deck",
      alt: "Open-air teak deck with a lounge in the golden evening light",
      label: "02 / The open-air lounge",
      title: "Stay a little",
      italic: "longer.",
      description:
        "Open-air living. Golden-hour conversations. The pleasure of an unhurried evening.",
    },
    {
      image: "craftsmanship",
      alt: "A close study of the hand-finished teak and polished yacht fittings",
      label: "03 / The considered detail",
      title: "Beauty, in every",
      italic: "detail.",
      description:
        "Natural textures and considered finishes. A tactile expression of your world.",
    },
  ];
  let slideIndex = 0;
  let galleryRequest = 0;
  const narrow = () => matchMedia("(max-width: 760px)").matches;
  function loadImage(base, preferSmall = true) {
    const image = new Image();
    image.src = `assets/img/${base}${preferSmall && narrow() ? "-sm" : ""}.webp`;
    return image.decode().then(() => image);
  }
  const pause = (ms) =>
    new Promise((resolve) => setTimeout(resolve, reduced ? 0 : ms));
  async function setSlide(index) {
    const request = ++galleryRequest;
    slideIndex = (index + slides.length) % slides.length;
    const slide = slides[slideIndex];
    try {
      const image = await loadImage(slide.image);
      if (request !== galleryRequest) return;
      gallery.classList.add("is-changing");
      await pause(300);
      if (request !== galleryRequest) return;
      galleryImage.src = image.src;
      galleryImage.alt = slide.alt;
      $(".gallery-label").textContent = slide.label;
      $(".gallery-title").replaceChildren(
        document.createTextNode(`${slide.title} `),
        Object.assign(document.createElement("em"), {
          textContent: slide.italic,
        }),
      );
      $(".gallery-description").textContent = slide.description;
      $("[data-gallery-count]").textContent =
        `${String(slideIndex + 1).padStart(2, "0")} / 03`;
      gallery.classList.remove("is-changing");
    } catch {
      if (request === galleryRequest) gallery.classList.remove("is-changing");
    }
  }
  $("[data-gallery-prev]").addEventListener("click", () =>
    setSlide(slideIndex - 1),
  );
  $("[data-gallery-next]").addEventListener("click", () =>
    setSlide(slideIndex + 1),
  );
  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSlide(slideIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSlide(slideIndex - 1);
    }
  });
  let touchStart = null;
  galleryImage.addEventListener(
    "touchstart",
    (event) => {
      touchStart = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    },
    { passive: true },
  );
  galleryImage.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
        setSlide(slideIndex + (dx < 0 ? 1 : -1));
      touchStart = null;
    },
    { passive: true },
  );

  const models = {
    s45: {
      name: "S45",
      image: "fleet-sport-45",
      category: "45 metres / Sport",
      label: "The sport collection",
      title: "Freedom,",
      italic: "in its purest form.",
      copy: "Sculpted, agile and effortlessly personal. An intimate yacht for spontaneous coastal escapes, hidden anchorages and the pleasure of following your instincts.",
      length: "45",
      character: "Coastal escapes",
      signature: "Sculpted agility",
    },
    x62: {
      name: "X62",
      image: "fleet-explorer-62",
      category: "62 metres / Explorer",
      label: "The explorer collection",
      title: "A curious spirit.",
      italic: "An open horizon.",
      copy: "Quiet capability meets generous living. An elegant explorer for extended journeys, unfamiliar coastlines and the freedom to stay a little longer.",
      length: "62",
      character: "Ocean exploration",
      signature: "Quiet capability",
    },
    f80: {
      name: "F80",
      image: "fleet-flagship-80",
      category: "80 metres / Flagship",
      label: "The flagship collection",
      title: "An ocean icon.",
      italic: "Entirely your own.",
      copy: "A commanding silhouette. Expansive decks. Panoramic living spaces that dissolve the boundary between you and the sea.",
      length: "80",
      character: "Grand touring",
      signature: "Panoramic living",
    },
  };
  const tabs = $$("[data-yacht]");
  const fleetPanel = $("#fleet-panel");
  let selectedModel = "f80";
  let fleetRequest = 0;
  async function selectModel(key) {
    const model = models[key];
    const request = ++fleetRequest;
    selectedModel = key;
    tabs.forEach((tab) => {
      const active = tab.dataset.yacht === key;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    fleetPanel.setAttribute("aria-busy", "true");
    try {
      const image = await loadImage(model.image);
      if (request !== fleetRequest) return;
      fleetPanel.classList.add("is-changing");
      await pause(300);
      if (request !== fleetRequest) return;
      const img = $("[data-fleet-image]");
      img.src = image.src;
      img.alt = `Aurelia ${model.name} ${model.category.split(" / ")[1]} yacht`;
      $("[data-fleet-category]").textContent = model.category;
      $(".fleet-image-label").textContent = model.label;
      $(".fleet-watermark").textContent = model.name;
      $("[data-fleet-title]").replaceChildren(
        document.createTextNode(model.title),
        document.createElement("br"),
        Object.assign(document.createElement("em"), {
          textContent: model.italic,
        }),
      );
      $("[data-fleet-copy]").textContent = model.copy;
      $("[data-fleet-enquire]").replaceChildren(
        document.createTextNode(`Explore your ${model.name} `),
        Object.assign(document.createElement("span"), { textContent: "↗" }),
      );
      $("[data-spec-length]").replaceChildren(
        document.createTextNode(`${model.length} `),
        Object.assign(document.createElement("span"), { textContent: "m" }),
      );
      $("[data-spec-character]").textContent = model.character;
      $("[data-spec-signature]").textContent = model.signature;
      fleetPanel.setAttribute("aria-labelledby", `tab-${key}`);
      fleetPanel.classList.remove("is-changing");
      fleetPanel.setAttribute("aria-busy", "false");
    } catch {
      if (request === fleetRequest) {
        fleetPanel.classList.remove("is-changing");
        fleetPanel.setAttribute("aria-busy", "false");
        const prior = fleetPanel
          .getAttribute("aria-labelledby")
          .replace("tab-", "");
        selectedModel = prior;
        tabs.forEach((tab) => {
          const active = tab.dataset.yacht === prior;
          tab.setAttribute("aria-selected", String(active));
          tab.tabIndex = active ? 0 : -1;
        });
      }
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectModel(tab.dataset.yacht));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].focus();
      selectModel(tabs[next].dataset.yacht);
    });
  });

  // Gallery and enquiry use native dialogs with Escape and focus restoration.
  const lightbox = $(".lightbox");
  const enquiry = $(".enquiry-dialog");
  function openDialog(dialog) {
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
  }
  $$("dialog").forEach((dialog) => {
    $("[data-dialog-close]", dialog).addEventListener("click", () =>
      dialog.close(),
    );
    dialog.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
    });
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      )
        dialog.close();
    });
  });
  $(".gallery-expand").addEventListener("click", () => {
    const slide = slides[slideIndex];
    $("img", lightbox).src = `assets/img/${slide.image}.webp`;
    $("img", lightbox).alt = slide.alt;
    $("p", lightbox).textContent = slide.label;
    openDialog(lightbox);
  });
  const form = $("#enquiry-form");
  $("[data-enquiry-open]").addEventListener("click", () => {
    form.elements.yacht.value = `Aurelia ${models[selectedModel].name}`;
    openDialog(enquiry);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    $("[data-enquiry-summary]").textContent =
      `Thank you, ${String(data.get("name")).trim()}.\n\nYour interest: ${data.get("yacht")}\nYour email: ${data.get("email")}${data.get("message") ? `\n\nYour vision:\n${data.get("message")}` : ""}\n\nThis is your enquiry preview. As Aurelia is a fictional design concept, nothing has been sent or stored.`;
    form.hidden = true;
    $(".enquiry-result").hidden = false;
    $("[data-enquiry-back]").focus();
  });
  $("[data-enquiry-back]").addEventListener("click", () => {
    form.hidden = false;
    $(".enquiry-result").hidden = true;
    form.elements.name.focus();
  });
  enquiry.addEventListener("close", () => {
    form.reset();
    form.hidden = false;
    $(".enquiry-result").hidden = true;
  });

  // Give the navigation a quiet indication of the current chapter.
  const navLinks = $$(".nav a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) =>
          link.classList.toggle(
            "is-current",
            link.hash === `#${entry.target.id}`,
          ),
        );
      });
    },
    { rootMargin: "-25% 0px -55% 0px" },
  );
  navLinks.forEach((link) => {
    const section = $(link.hash);
    if (section) sectionObserver.observe(section);
  });
})();
