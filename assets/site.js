const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const header = document.querySelector(".site-header");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (header) {
  const syncHeader = () => {
    header.classList.toggle("is-light", window.scrollY > 80);
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const services = {
  product: {
    number: "01",
    title: "Product/UI",
    body: "I design clear, usable digital products across web and mobile, from early flows to polished Figma interfaces.",
    list: ["Product flows", "Wireframes", "High-fidelity UI"]
  },
  mobile: {
    number: "02",
    title: "Mobile App",
    body: "I design mobile app screens, user flows, onboarding, dashboards, profiles, forms, and interaction states for iOS and Android products.",
    list: ["Onboarding flows", "App screens", "Mobile prototypes"]
  },
  saas: {
    number: "03",
    title: "SaaS/Web App",
    body: "I design dashboards, admin panels, portals, CRMs, analytics pages, internal tools, and complex web app interfaces.",
    list: ["Dashboards", "Admin panels", "Data-heavy UI"]
  },
  audit: {
    number: "04",
    title: "UX Audit",
    body: "I review existing products, identify friction, improve weak flows, and redesign screens for better usability and clarity.",
    list: ["UX reviews", "Flow cleanup", "Screen redesigns"]
  },
  websites: {
    number: "05",
    title: "Websites",
    body: "I design clean, responsive websites and landing pages for startups, SaaS products, portfolios, campaigns, and digital services.",
    list: ["Landing pages", "Portfolio sites", "Responsive design"]
  },
  ai: {
    number: "06",
    title: "AI Product",
    body: "I design AI-powered product experiences, AI assistants, prompt-based flows, chatbot interfaces, agent workflows, and AI-assisted prototypes.",
    list: ["AI assistants", "Prompt flows", "Agent workflows"]
  },
  illustration: {
    number: "07",
    title: "Illustration",
    body: "I create custom vector illustrations, icons, empty states, onboarding visuals, hero graphics, and product visuals for apps and websites.",
    list: ["Custom icons", "Empty states", "Hero graphics"]
  }
};

document.querySelectorAll(".services-layout").forEach((serviceLayout) => {
  const serviceCards = [...serviceLayout.querySelectorAll(".service-card")];
  const rail = serviceLayout.querySelector(".service-rail");
  const detailNumber = serviceLayout.querySelector(".detail-number");
  const detailTitle = serviceLayout.querySelector("[data-service-title]");
  const detailBody = serviceLayout.querySelector("[data-service-body]");
  const detailList = serviceLayout.querySelector("[data-service-list]");
  const prevButton = serviceLayout.querySelector("[data-service-prev]");
  const nextButton = serviceLayout.querySelector("[data-service-next]");

  function getSelectedIndex() {
    return Math.max(0, serviceCards.findIndex((card) => card.classList.contains("is-selected")));
  }

  function syncArrowState() {
    const selectedIndex = getSelectedIndex();
    if (prevButton) prevButton.disabled = selectedIndex <= 0;
    if (nextButton) nextButton.disabled = selectedIndex >= serviceCards.length - 1;
  }

  function selectService(key, shouldScroll = true) {
    const data = services[key];
    if (!data || !detailNumber || !detailTitle || !detailBody || !detailList) return;

    serviceCards.forEach((card) => {
      const selected = card.dataset.service === key;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
      if (selected && shouldScroll) {
        card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      }
    });

    detailNumber.textContent = data.number;
    detailTitle.textContent = data.title;
    detailBody.textContent = data.body;
    detailList.replaceChildren(...data.list.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }));
    syncArrowState();
  }

  function selectByOffset(offset) {
    const nextIndex = Math.max(0, Math.min(serviceCards.length - 1, getSelectedIndex() + offset));
    const nextCard = serviceCards[nextIndex];
    if (nextCard) selectService(nextCard.dataset.service);
  }

  serviceCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (rail?.dataset.suppressClick === "true") {
        event.preventDefault();
        return;
      }
      selectService(card.dataset.service);
    });
  });

  if (!rail) return;

  let isDown = false;
  let didMove = false;
  let startX = 0;
  let startScroll = 0;
  let wheelTimer = 0;

  rail.addEventListener("pointerdown", (event) => {
    isDown = true;
    didMove = false;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("is-dragging");
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!isDown) return;
    if (Math.abs(event.clientX - startX) > 8) didMove = true;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });

  const syncToNearestCard = () => {
    const railCenter = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    const nearest = serviceCards.reduce((best, card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - railCenter);
      return distance < best.distance ? { card, distance } : best;
    }, { card: serviceCards[getSelectedIndex()], distance: Infinity }).card;
    if (nearest) selectService(nearest.dataset.service, false);
  };

  const stopDrag = (event) => {
    isDown = false;
    rail.classList.remove("is-dragging");
    rail.releasePointerCapture?.(event.pointerId);
    if (didMove) {
      rail.dataset.suppressClick = "true";
      syncToNearestCard();
      window.setTimeout(() => {
        delete rail.dataset.suppressClick;
      }, 0);
    }
  };

  rail.addEventListener("pointerup", stopDrag);
  rail.addEventListener("pointercancel", stopDrag);

  rail.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(syncToNearestCard, 160);
  }, { passive: true });

  rail.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectByOffset(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectByOffset(-1);
    }
  });

  prevButton?.addEventListener("click", () => selectByOffset(-1));
  nextButton?.addEventListener("click", () => selectByOffset(1));

  const initialCard = serviceCards.find((card) => card.classList.contains("is-selected")) || serviceCards[0];
  if (initialCard) selectService(initialCard.dataset.service, false);
});

document.querySelectorAll("[data-ticker]").forEach((ticker) => {
  ticker.addEventListener("click", () => {
    ticker.classList.toggle("is-paused");
  });

  ticker.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    ticker.classList.toggle("is-paused");
  });
});

document.querySelectorAll("[data-process-set]").forEach((processSet) => {
  const cards = Array.from(processSet.querySelectorAll(".process-step, .process-col"));
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((item) => item.classList.remove("is-selected"));
      card.classList.add("is-selected");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      cards.forEach((item) => item.classList.remove("is-selected"));
      card.classList.add("is-selected");
    });
  });
});

// Playground Board Interactivity
const playgroundContainer = document.querySelector('.playground-section');
if (playgroundContainer) {
  const playgroundItems = [
    {
      id: "zucchini-food-carousel",
      title: "Zucchini Food Carousel",
      category: "User Interactions",
      tags: ["interactions"],
      mediaType: "video",
      thumbnail: "/assets/figma/1ee71db6ac809222102a5f90bb63603fbbdcb08f.png",
      videoSrc: "/assets/work/Zucchini Food Carousel Interaction.mp4",
      poster: "/assets/figma/1ee71db6ac809222102a5f90bb63603fbbdcb08f.png",
      alt: "Zucchini Food Carousel interaction",
      featured: true,
      pos: { x: 50, y: 51, size: "feature" }
    },
    {
      id: "dream-buddy",
      title: "Dream Buddy",
      category: "User Interactions",
      tags: ["interactions"],
      mediaType: "video",
      thumbnail: "/assets/figma/292e1469c323e1fb0db7c47cf29e03cf9d1b2a3b.png",
      videoSrc: "/assets/work/Art Shop Product Card Hover Interaction.mp4",
      poster: "/assets/figma/292e1469c323e1fb0db7c47cf29e03cf9d1b2a3b.png",
      alt: "Dream Buddy interaction",
      pos: { x: 23, y: 22, size: "medium" }
    },
    {
      id: "battery-charging-status",
      title: "Battery Charging Status",
      category: "Visual Effects",
      tags: ["effects"],
      mediaType: "video",
      thumbnail: "/assets/figma/b16174b9b9d31569486f8b8a1bb3f8e0468893b2.png",
      videoSrc: "/assets/work/Battery Charging Status Widget Interaction.mp4",
      poster: "/assets/figma/b16174b9b9d31569486f8b8a1bb3f8e0468893b2.png",
      alt: "Battery Charging Status widget",
      pos: { x: 78, y: 25, size: "medium" }
    },
    {
      id: "expressive-character-sheet",
      title: "Expressive Character Sheet",
      category: "Artworks",
      tags: ["artworks"],
      mediaType: "image",
      thumbnail: "/assets/work/Expressive Character Sheet.png",
      imageSrc: "/assets/work/Expressive Character Sheet.png",
      alt: "Expressive Character Sheet",
      pos: { x: 86, y: 62, size: "wide" }
    },
    {
      id: "car-selection-gallery",
      title: "Car selection gallery",
      category: "Interactive Games",
      tags: ["games"],
      mediaType: "video",
      thumbnail: "/assets/figma/48c889d92e4272c4996f05d5eee3e4c330381403.png",
      videoSrc: "/assets/work/Car Selection Gallery Interaction.mp4",
      poster: "/assets/figma/48c889d92e4272c4996f05d5eee3e4c330381403.png",
      alt: "Car selection gallery interaction",
      pos: { x: 10, y: 22, size: "small" }
    },
    {
      id: "custom-dessert-selector",
      title: "Custom Dessert Selector",
      category: "Interactive Games",
      tags: ["games"],
      mediaType: "video",
      thumbnail: "/assets/figma/316fc73faf5a63c12c64c709b8becc45b4d1460a.png",
      videoSrc: "/assets/work/Custom Dessert Box Selector Interaction.mp4",
      poster: "/assets/figma/316fc73faf5a63c12c64c709b8becc45b4d1460a.png",
      alt: "Custom Dessert Selector interaction",
      pos: { x: 16, y: 46, size: "small" }
    },
    {
      id: "navigation-image-reveal",
      title: "Navigation Image reveal",
      category: "User Interactions",
      tags: ["interactions"],
      mediaType: "video",
      thumbnail: "/assets/figma/062e42fc656bb9eb84bcb34c99f896eb7b760ef2.png",
      videoSrc: "/assets/work/Navigation Tabs Image Reveal Interaction.mp4",
      poster: "/assets/figma/062e42fc656bb9eb84bcb34c99f896eb7b760ef2.png",
      alt: "Navigation Image reveal interaction",
      pos: { x: 21, y: 72, size: "medium" }
    },
    {
      id: "book-3d-cover",
      title: "Book3d cover rotation",
      category: "User Interactions",
      tags: ["interactions", "effects"],
      mediaType: "video",
      thumbnail: "/assets/figma/e942ad15b7cec5068b22494754e808b99e019394.png",
      videoSrc: "/assets/work/Book 3D Cover Rotation Interaction.mp4",
      poster: "/assets/figma/e942ad15b7cec5068b22494754e808b99e019394.png",
      alt: "Book 3D cover rotation",
      pos: { x: 62, y: 80, size: "small" }
    },
    {
      id: "data-insight-card-flip",
      title: "Data Insight Card Flip",
      category: "Visual Effects",
      tags: ["effects"],
      mediaType: "video",
      thumbnail: "/assets/figma/37b2352dc66365d6ed787d1342787e4138587b3a.png",
      videoSrc: "/assets/work/Data Insight Card Flip Interaction.mp4",
      poster: "/assets/figma/37b2352dc66365d6ed787d1342787e4138587b3a.png",
      alt: "Data Insight Card Flip interaction",
      pos: { x: 65, y: 60, size: "small" }
    },
    {
      id: "landing-page-chat-card",
      title: "Landing Page Chat card",
      category: "UI Designs",
      tags: ["designs"],
      mediaType: "video",
      thumbnail: "/assets/figma/806cfb6178eb1eac5761a7d02b64e60a5c8cac92.png",
      videoSrc: "/assets/work/Ayoverse Landing Page Chat Card Interaction.mp4",
      poster: "/assets/figma/806cfb6178eb1eac5761a7d02b64e60a5c8cac92.png",
      alt: "Landing Page Chat card interaction",
      pos: { x: 79, y: 78, size: "medium" }
    },
    {
      id: "nirvana",
      title: "Nirvana",
      category: "Artworks",
      tags: ["artworks"],
      mediaType: "image",
      thumbnail: "/assets/work/Nirvana Character Illustration.png",
      imageSrc: "/assets/work/Nirvana Character Illustration.png",
      alt: "Nirvana Character Illustration",
      pos: { x: 93, y: 78, size: "small" }
    },
    {
      id: "green-landing-page",
      title: "Green Landing Page",
      category: "UI Designs",
      tags: ["designs"],
      mediaType: "image",
      thumbnail: "/assets/work/Industrial Technology Landing Page.png",
      imageSrc: "/assets/work/Industrial Technology Landing Page.png",
      alt: "Green Landing Page",
      pos: { x: 11, y: 55, size: "small" }
    },
    {
      id: "pink-car-landing-page",
      title: "Pink Car Landing Page",
      category: "UI Designs",
      tags: ["designs"],
      mediaType: "image",
      thumbnail: "/assets/work/Ayo Pink Car Landing Page.png",
      imageSrc: "/assets/work/Ayo Pink Car Landing Page.png",
      alt: "Pink Car Landing Page",
      pos: { x: 10, y: 80, size: "small" }
    },
    {
      id: "crypto-landing-page",
      title: "Crypto Landing Page",
      category: "UI Designs",
      tags: ["designs"],
      mediaType: "image",
      thumbnail: "/assets/work/Ayo Crypto Future Landing Page.png",
      imageSrc: "/assets/work/Ayo Crypto Future Landing Page.png",
      alt: "Crypto Landing Page",
      pos: { x: 18, y: 86, size: "small" }
    },
    {
      id: "music-control-slider",
      title: "Music control & Slider Widget",
      category: "Visual Effects",
      tags: ["effects"],
      mediaType: "video",
      thumbnail: "/assets/figma/bc833ee86d65f655cba770420f4cc4d1381fa7b1.png",
      videoSrc: "/assets/work/Music Control Slider Widget Interaction.mp4",
      poster: "/assets/figma/bc833ee86d65f655cba770420f4cc4d1381fa7b1.png",
      alt: "Music control and slider widget",
      pos: { x: 50, y: 82, size: "small" }
    },
    {
      id: "file-reveal",
      title: "File reveal",
      category: "User Interactions",
      tags: ["interactions"],
      mediaType: "video",
      thumbnail: "/assets/figma/d517d39e4789cebe5f1f9f4fed8c59d2ece45453.png",
      videoSrc: "/assets/work/Data Vault Success Modal Interaction.mp4",
      poster: "/assets/figma/d517d39e4789cebe5f1f9f4fed8c59d2ece45453.png",
      alt: "File reveal interaction",
      pos: { x: 34, y: 80, size: "medium" }
    }
  ];

  let currentMode = 'canvas';
  let activeFilter = 'Everything';
  let searchQuery = '';
  let activeCanvasIndex = 0;
  let lightboxIndex = -1;
  let lastFocusedCard = null;
  let isDraggingCanvas = false;
  let wallDidDrag = false;
  let wallPointerStart = null;
  let wallStart = { rx: -8, ry: 0, x: 0, y: 0 };
  let wallState = { rx: -8, ry: 0, x: 0, y: 0 };
  let helperTimer = 0;
  let previewObserver = null;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const searchInput = document.getElementById('playground-search');
  const modeTriggerBtn = document.getElementById('mode-trigger-btn');
  const modeDropdownMenu = document.getElementById('mode-dropdown-menu');
  const dropdownButtons = modeDropdownMenu ? modeDropdownMenu.querySelectorAll('button') : [];
  const filterPillsContainer = document.getElementById('filter-pills-container');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const canvasView = document.getElementById('playground-canvas-view');
  const listView = document.getElementById('playground-list-view');
  const featureMediaContainer = document.getElementById('feature-media-container');
  const featureTitle = document.getElementById('feature-title');
  const canvasCardsContainer = document.getElementById('canvas-cards-container');
  const listItemsCount = document.getElementById('list-items-count');
  const listRowsContainer = document.getElementById('list-rows-container');
  const seeAllButton = document.getElementById('play-see-all');
  const helperPill = document.getElementById('canvas-helper-pill') || createHelperPill();

  function createHelperPill() {
    if (!canvasView) return null;
    const pill = document.createElement('div');
    pill.className = 'canvas-helper-pill';
    pill.id = 'canvas-helper-pill';
    pill.setAttribute('aria-hidden', 'true');
    canvasView.appendChild(pill);
    return pill;
  }

  function isTouchViewport() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function isImageAsset(path) {
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(path || '');
  }

  function setHelperState(state) {
    if (!helperPill) return;
    if (state === 'dragging') {
      helperPill.textContent = 'Dragging canvas';
      helperPill.classList.remove('is-quiet');
      return;
    }
    helperPill.textContent = isTouchViewport() ? 'Tap item to open  |  Drag to explore' : 'Click an item to open  |  Press + drag to explore';
    if (state === 'quiet') helperPill.classList.add('is-quiet');
  }

  function settleHelper() {
    window.clearTimeout(helperTimer);
    helperTimer = window.setTimeout(() => setHelperState('quiet'), 1800);
  }

  function applyWallTransform() {
    if (!canvasCardsContainer) return;
    canvasCardsContainer.style.setProperty('--wall-rx', `${wallState.rx}deg`);
    canvasCardsContainer.style.setProperty('--wall-ry', `${wallState.ry}deg`);
    canvasCardsContainer.style.setProperty('--wall-x', `${wallState.x}px`);
    canvasCardsContainer.style.setProperty('--wall-y', `${wallState.y}px`);
  }

  function getCanvasCardTransform(index, count, item) {
    const columns = Math.ceil(Math.sqrt(count));
    const row = Math.floor(index / columns);
    const col = index % columns;
    const rowCount = Math.ceil(count / columns);
    const normalizedX = columns <= 1 ? 0 : (col / (columns - 1)) * 2 - 1;
    const normalizedY = rowCount <= 1 ? 0 : (row / (rowCount - 1)) * 2 - 1;
    const stagger = row % 2 ? 0.34 : 0;
    const curve = Math.sin((normalizedX + stagger) * Math.PI * 0.55);
    const spreadX = Math.min(470, Math.max(250, canvasView.clientWidth * 0.34));
    const spreadY = Math.min(250, Math.max(170, canvasView.clientHeight * 0.28));
    const tx = normalizedX * spreadX + (row % 2 ? spreadX * 0.17 : 0);
    const ty = normalizedY * spreadY;
    const tz = -Math.abs(curve) * 190 + (item.featured ? 170 : 0) + ((index % 3) - 1) * 36;
    const ry = -normalizedX * 24;
    const rx = normalizedY * 8;
    const rz = normalizedX * -3;
    const scale = item.featured ? 1.02 : 0.94 + (index % 4) * 0.02;
    return { tx, ty, tz, rx, ry, rz, scale };
  }

  function createStillMedia(item, className = '') {
    if (item.mediaType === 'video') {
      const video = document.createElement('video');
      video.className = className;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.dataset.previewSrc = item.videoSrc || '';
      video.setAttribute('aria-label', item.alt || item.title);
      if (item.poster) {
        video.poster = item.poster;
      } else if (isImageAsset(item.thumbnail)) {
        video.poster = item.thumbnail;
      }
      return video;
    }

    const img = document.createElement('img');
    img.src = item.imageSrc || item.thumbnail;
    img.alt = item.alt || item.title;
    img.className = className;
    img.loading = 'lazy';
    return img;
  }

  function hydratePreviewVideo(video, item) {
    if (!video || item.mediaType !== 'video' || video.currentSrc || video.src || !item.videoSrc) return;
    video.src = item.videoSrc;
    video.preload = 'metadata';
  }

  function playPreview(video, item) {
    if (reduceMotion || isDraggingCanvas || item.mediaType !== 'video') return;
    hydratePreviewVideo(video, item);
    video.play().catch(() => {});
  }

  function pausePreview(video) {
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch (error) {
      // Some browsers block seeking before metadata has loaded.
    }
  }

  function getFilteredItems() {
    const query = searchQuery.trim().toLowerCase();
    return playgroundItems.filter(item => {
      const matchesFilter = activeFilter === 'Everything' || item.category === activeFilter;
      const matchesSearch = !query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.includes(query));
      return matchesFilter && matchesSearch;
    });
  }

  function renderFeaturedItem(item) {
    if (!featureMediaContainer) return;
    if (window.getComputedStyle(featureMediaContainer.closest('.canvas-feature')).display === 'none') {
      featureMediaContainer.innerHTML = '';
      if (featureTitle) featureTitle.textContent = '';
      return;
    }
    featureMediaContainer.innerHTML = '';
    if (!item) {
      if (featureTitle) featureTitle.textContent = 'No item selected';
      return;
    }

    const mediaElement = createStillMedia(item);
    if (item.mediaType === 'video') {
      mediaElement.controls = false;
      hydratePreviewVideo(mediaElement, item);
      if (!reduceMotion) mediaElement.play().catch(() => {});
    }
    featureMediaContainer.appendChild(mediaElement);
    if (featureTitle) featureTitle.textContent = item.title;
  }

  function stopAllPreviews() {
    document.querySelectorAll('.canvas-thumb video, .canvas-feature-media video, .list-media video').forEach(video => pausePreview(video));
  }

  function observePreview(video, item) {
    if (!video || item.mediaType !== 'video') return;
    if (!previewObserver && 'IntersectionObserver' in window) {
      previewObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          entry.target.dataset.visible = entry.isIntersecting ? 'true' : 'false';
          if (!entry.isIntersecting) pausePreview(entry.target);
        });
      }, { root: canvasView || null, threshold: 0.18 });
    }
    if (previewObserver) previewObserver.observe(video);
  }

  function getFocusableElements(root) {
    return Array.from(root.querySelectorAll('button, [href], video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(element => !element.disabled && element.offsetParent !== null);
  }

  function openLightbox(index, sourceButton) {
    const items = getFilteredItems();
    if (!items.length) return;
    lightboxIndex = (index + items.length) % items.length;
    lastFocusedCard = sourceButton || document.activeElement;
    stopAllPreviews();
    renderLightbox(items);
  }

  function closeLightbox(options = {}) {
    const { restoreFocus = true } = options;
    const overlay = document.querySelector('.media-lightbox');
    if (!overlay) return;
    overlay.querySelectorAll('video').forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    overlay.remove();
    document.body.classList.remove('lightbox-open');
    if (restoreFocus && lastFocusedCard && typeof lastFocusedCard.focus === 'function') lastFocusedCard.focus();
  }

  function renderLightbox(items) {
    closeLightbox({ restoreFocus: false });
    const item = items[lightboxIndex];
    const overlay = document.createElement('div');
    overlay.className = 'media-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', item.title);
    overlay.tabIndex = -1;

    const stage = document.createElement('div');
    stage.className = 'media-lightbox-stage';

    const closeButton = document.createElement('button');
    closeButton.className = 'media-lightbox-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close media viewer');
    closeButton.textContent = 'Close';

    const previousButton = document.createElement('button');
    previousButton.className = 'media-lightbox-nav is-prev';
    previousButton.type = 'button';
    previousButton.setAttribute('aria-label', 'Previous item');
    previousButton.textContent = 'Prev';

    const nextButton = document.createElement('button');
    nextButton.className = 'media-lightbox-nav is-next';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next item');
    nextButton.textContent = 'Next';

    const frame = document.createElement('figure');
    frame.className = 'media-lightbox-frame';

    if (item.mediaType === 'video') {
      const video = document.createElement('video');
      video.src = item.videoSrc;
      if (item.poster) video.poster = item.poster;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = 'metadata';
      frame.appendChild(video);
      video.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = item.imageSrc || item.thumbnail;
      img.alt = item.alt || item.title;
      frame.appendChild(img);
    }

    const caption = document.createElement('figcaption');
    caption.textContent = item.title;
    frame.appendChild(caption);
    stage.append(closeButton, previousButton, frame, nextButton);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);
    document.body.classList.add('lightbox-open');
    overlay.focus();

    const showOffset = (offset) => {
      lightboxIndex = (lightboxIndex + offset + items.length) % items.length;
      renderLightbox(items);
    };

    overlay.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(overlay);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', () => showOffset(-1));
    nextButton.addEventListener('click', () => showOffset(1));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target === stage) closeLightbox();
    });
  }

  function renderCanvasView() {
    if (!canvasCardsContainer) return;
    canvasCardsContainer.innerHTML = '';
    const items = getFilteredItems();

    if (previewObserver) {
      previewObserver.disconnect();
      previewObserver = null;
    }

    if (!items.length) {
      renderFeaturedItem(null);
      return;
    }

    if (activeCanvasIndex >= items.length) activeCanvasIndex = 0;
    renderFeaturedItem(items[activeCanvasIndex]);

    items.forEach((item, index) => {
      const transform = getCanvasCardTransform(index, items.length, item);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'canvas-card';
      if (index === activeCanvasIndex) btn.classList.add('selected');
      btn.style.setProperty('--tx', `${transform.tx}px`);
      btn.style.setProperty('--ty', `${transform.ty}px`);
      btn.style.setProperty('--tz', `${transform.tz}px`);
      btn.style.setProperty('--rx', `${transform.rx}deg`);
      btn.style.setProperty('--ry', `${transform.ry}deg`);
      btn.style.setProperty('--rz', `${transform.rz}deg`);
      btn.style.setProperty('--scale', transform.scale);
      btn.setAttribute('aria-label', `Open ${item.title}`);

      const thumb = document.createElement('span');
      thumb.className = 'canvas-thumb';
      const thumbMedia = createStillMedia(item);
      observePreview(thumbMedia, item);
      thumb.appendChild(thumbMedia);
      btn.appendChild(thumb);

      const textSpan = document.createElement('span');
      textSpan.textContent = item.title;
      btn.appendChild(textSpan);

      let pointerStart = null;
      let didDrag = false;
      const activate = () => {
        activeCanvasIndex = index;
        canvasCardsContainer.querySelectorAll('.canvas-card').forEach(card => card.classList.remove('selected'));
        btn.classList.add('selected');
        renderFeaturedItem(item);
      };

      btn.addEventListener('pointerdown', (event) => {
        pointerStart = { x: event.clientX, y: event.clientY };
        didDrag = false;
        wallDidDrag = false;
        btn.setPointerCapture?.(event.pointerId);
      });
      btn.addEventListener('pointermove', (event) => {
        if (!pointerStart) return;
        const dx = Math.abs(event.clientX - pointerStart.x);
        const dy = Math.abs(event.clientY - pointerStart.y);
        if (dx > 7 || dy > 7) {
          didDrag = true;
          stopAllPreviews();
        }
      });
      btn.addEventListener('pointerup', (event) => {
        pointerStart = null;
        btn.releasePointerCapture?.(event.pointerId);
      });
      btn.addEventListener('pointercancel', (event) => {
        pointerStart = null;
        didDrag = false;
        btn.releasePointerCapture?.(event.pointerId);
      });
      btn.addEventListener('mouseenter', () => {
        activate();
        if (thumbMedia.tagName === 'VIDEO') playPreview(thumbMedia, item);
      });
      btn.addEventListener('focus', () => {
        activate();
        if (thumbMedia.tagName === 'VIDEO') playPreview(thumbMedia, item);
      });
      btn.addEventListener('mouseleave', () => {
        if (thumbMedia.tagName === 'VIDEO') pausePreview(thumbMedia);
      });
      btn.addEventListener('blur', () => {
        if (thumbMedia.tagName === 'VIDEO') pausePreview(thumbMedia);
      });
      btn.addEventListener('click', (event) => {
        if (didDrag || wallDidDrag) {
          event.preventDefault();
          didDrag = false;
          return;
        }
        openLightbox(index, btn);
      });

      canvasCardsContainer.appendChild(btn);
    });
    applyWallTransform();
  }

  function renderListView() {
    if (!listRowsContainer) return;
    listRowsContainer.innerHTML = '';
    const items = getFilteredItems();
    if (listItemsCount) listItemsCount.textContent = `Showing ${items.length} playground items`;

    items.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'list-row';

      const mediaDiv = document.createElement('button');
      mediaDiv.className = 'list-media';
      mediaDiv.type = 'button';
      mediaDiv.setAttribute('aria-label', `Open ${item.title}`);
      const listMedia = createStillMedia(item);
      mediaDiv.appendChild(listMedia);
      mediaDiv.addEventListener('click', () => openLightbox(index, mediaDiv));
      row.appendChild(mediaDiv);

      const infoDiv = document.createElement('div');
      const categoryH3 = document.createElement('h3');
      categoryH3.textContent = item.category;
      const titleP = document.createElement('p');
      titleP.textContent = item.title;
      infoDiv.append(categoryH3, titleP);
      row.appendChild(infoDiv);

      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.textContent = item.mediaType === 'video' ? 'Play' : 'View';
      actionBtn.addEventListener('click', () => openLightbox(index, actionBtn));
      row.appendChild(actionBtn);

      listRowsContainer.appendChild(row);
    });
  }

  function updateViews() {
    if (currentMode === 'canvas') {
      if (canvasView) canvasView.style.display = 'block';
      if (listView) listView.style.display = 'none';
      renderCanvasView();
    } else {
      if (canvasView) canvasView.style.display = 'none';
      if (listView) listView.style.display = 'block';
      renderListView();
    }
  }

  if (canvasView) {
    canvasView.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.canvas-card')) return;
      isDraggingCanvas = true;
      wallDidDrag = false;
      wallPointerStart = { x: event.clientX, y: event.clientY };
      wallStart = { ...wallState };
      canvasView.classList.add('is-dragging');
      canvasView.setPointerCapture?.(event.pointerId);
      stopAllPreviews();
      setHelperState('dragging');
    });
    canvasView.addEventListener('pointermove', (event) => {
      if (!isDraggingCanvas || !wallPointerStart) return;
      const dx = event.clientX - wallPointerStart.x;
      const dy = event.clientY - wallPointerStart.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) wallDidDrag = true;
      wallState.ry = wallStart.ry + dx * 0.12;
      wallState.rx = Math.max(-28, Math.min(18, wallStart.rx - dy * 0.08));
      wallState.x = Math.max(-180, Math.min(180, wallStart.x + dx * 0.18));
      wallState.y = Math.max(-110, Math.min(110, wallStart.y + dy * 0.12));
      applyWallTransform();
    });
    window.addEventListener('pointerup', (event) => {
      if (!isDraggingCanvas) return;
      isDraggingCanvas = false;
      wallPointerStart = null;
      canvasView.classList.remove('is-dragging');
      canvasView.releasePointerCapture?.(event.pointerId);
      setHelperState();
      settleHelper();
      window.setTimeout(() => {
        wallDidDrag = false;
      }, 120);
    });
  }

  if (modeTriggerBtn && modeDropdownMenu) {
    modeTriggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      modeDropdownMenu.classList.toggle('is-open');
    });

    dropdownButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        modeTriggerBtn.textContent = btn.textContent;
        dropdownButtons.forEach(button => button.classList.remove('active'));
        btn.classList.add('active');
        modeDropdownMenu.classList.remove('is-open');
        updateViews();
      });
    });

    document.addEventListener('click', () => modeDropdownMenu.classList.remove('is-open'));
  }

  if (filterPillsContainer) {
    filterPillsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filterPillsContainer.querySelectorAll('button').forEach(button => button.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        activeCanvasIndex = 0;
        updateViews();
      });
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (filterPillsContainer) {
        filterPillsContainer.querySelectorAll('button').forEach(button => button.classList.remove('active'));
        const allButton = filterPillsContainer.querySelector('[data-filter="Everything"]');
        if (allButton) allButton.classList.add('active');
      }
      activeFilter = 'Everything';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      activeCanvasIndex = 0;
      updateViews();
    });
  }

  if (seeAllButton) {
    seeAllButton.addEventListener('click', () => {
      if (filterPillsContainer) {
        filterPillsContainer.querySelectorAll('button').forEach(button => button.classList.remove('active'));
        const allButton = filterPillsContainer.querySelector('[data-filter="Everything"]');
        if (allButton) allButton.classList.add('active');
      }
      activeFilter = 'Everything';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      activeCanvasIndex = 0;
      updateViews();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      searchQuery = event.target.value;
      activeCanvasIndex = 0;
      updateViews();
    });
  }

  document.addEventListener('keydown', (event) => {
    const overlay = document.querySelector('.media-lightbox');
    if (!overlay) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const items = getFilteredItems();
      lightboxIndex = (lightboxIndex - 1 + items.length) % items.length;
      renderLightbox(items);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const items = getFilteredItems();
      lightboxIndex = (lightboxIndex + 1) % items.length;
      renderLightbox(items);
    }
  });

  setHelperState();
  applyWallTransform();
  updateViews();
}
