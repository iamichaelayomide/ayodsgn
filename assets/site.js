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
  strategy: {
    number: "01",
    title: "Strategy",
    body: "I help teams, businesses and companies shape websites and mobile apps around clear business strategy, audience needs, and launch goals.",
    list: ["Offer positioning", "Page architecture", "Conversion paths"]
  },
  design: {
    number: "02",
    title: "Design",
    body: "I turn direction into clean, responsive interfaces with strong hierarchy, brand character, and polished interaction states.",
    list: ["Visual systems", "Responsive layouts", "Prototype direction"]
  },
  development: {
    number: "03",
    title: "Development",
    body: "I build lightweight, production-ready pages that preserve the design details and stay easy to maintain after launch.",
    list: ["Static websites", "Frontend components", "CMS-ready structure"]
  },
  testing: {
    number: "04",
    title: "Testing",
    body: "I review the site across devices, browsers, content states, and interaction paths before it goes live.",
    list: ["Responsive QA", "Interaction checks", "Performance pass"]
  },
  launch: {
    number: "05",
    title: "Launch",
    body: "I prepare the final pages, deployment setup, and launch details so the site can go live without loose ends.",
    list: ["Vercel deployment", "Domain setup", "Launch checklist"]
  },
  support: {
    number: "06",
    title: "Support",
    body: "I keep the system useful after launch with focused updates, new sections, and improvements based on real use.",
    list: ["Content updates", "New sections", "Iteration support"]
  }
};

const serviceCards = [...document.querySelectorAll(".service-card")];
const detailNumber = document.querySelector(".detail-number");
const detailTitle = document.querySelector("[data-service-title]");
const detailBody = document.querySelector("[data-service-body]");
const detailList = document.querySelector("[data-service-list]");

function selectService(key) {
  const data = services[key];
  if (!data || !detailNumber || !detailTitle || !detailBody || !detailList) return;

  serviceCards.forEach((card) => {
    const selected = card.dataset.service === key;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  detailNumber.textContent = data.number;
  detailTitle.textContent = data.title;
  detailBody.textContent = data.body;
  detailList.replaceChildren(...data.list.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectService(card.dataset.service);
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });
});

const rail = document.querySelector(".service-rail");

if (rail) {
  let isDown = false;
  let startX = 0;
  let startScroll = 0;

  rail.addEventListener("pointerdown", (event) => {
    isDown = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("is-dragging");
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!isDown) return;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });

  const stopDrag = () => {
    isDown = false;
    rail.classList.remove("is-dragging");
  };

  rail.addEventListener("pointerup", stopDrag);
  rail.addEventListener("pointercancel", stopDrag);
}

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
      thumbnail: "/assets/work/Car Selection Gallery Interaction.mp4",
      videoSrc: "/assets/work/Car Selection Gallery Interaction.mp4",
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
      thumbnail: "/assets/work/Data Insight Card Flip Interaction.mp4",
      videoSrc: "/assets/work/Data Insight Card Flip Interaction.mp4",
      alt: "Data Insight Card Flip interaction",
      pos: { x: 65, y: 60, size: "small" }
    },
    {
      id: "landing-page-chat-card",
      title: "Landing Page Chat card",
      category: "UI Designs",
      tags: ["designs"],
      mediaType: "video",
      thumbnail: "/assets/work/Ayoverse Landing Page Chat Card Interaction.mp4",
      videoSrc: "/assets/work/Ayoverse Landing Page Chat Card Interaction.mp4",
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
      thumbnail: "/assets/work/Music Control Slider Widget Interaction.mp4",
      videoSrc: "/assets/work/Music Control Slider Widget Interaction.mp4",
      alt: "Music control and slider widget",
      pos: { x: 50, y: 82, size: "small" }
    },
    {
      id: "file-reveal",
      title: "File reveal",
      category: "User Interactions",
      tags: ["interactions"],
      mediaType: "video",
      thumbnail: "/assets/work/Data Vault Success Modal Interaction.mp4",
      videoSrc: "/assets/work/Data Vault Success Modal Interaction.mp4",
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
  let helperTimer = 0;

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

  function createStillMedia(item, className = '') {
    if (item.mediaType === 'video') {
      const video = document.createElement('video');
      video.className = className;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-label', item.alt || item.title);
      if (item.poster) {
        video.poster = item.poster;
      } else if (isImageAsset(item.thumbnail)) {
        video.poster = item.thumbnail;
      } else if (item.videoSrc) {
        video.src = item.videoSrc;
        video.preload = 'metadata';
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
    if (!video || item.mediaType !== 'video' || video.src) return;
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

  function openLightbox(index, sourceButton) {
    const items = getFilteredItems();
    if (!items.length) return;
    lightboxIndex = (index + items.length) % items.length;
    lastFocusedCard = sourceButton || document.activeElement;
    stopAllPreviews();
    renderLightbox(items);
  }

  function closeLightbox() {
    const overlay = document.querySelector('.media-lightbox');
    if (!overlay) return;
    overlay.querySelectorAll('video').forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    overlay.remove();
    document.body.classList.remove('lightbox-open');
    if (lastFocusedCard && typeof lastFocusedCard.focus === 'function') lastFocusedCard.focus();
  }

  function renderLightbox(items) {
    closeLightbox();
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

    if (!items.length) {
      renderFeaturedItem(null);
      return;
    }

    if (activeCanvasIndex >= items.length) activeCanvasIndex = 0;
    renderFeaturedItem(items[activeCanvasIndex]);

    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `canvas-card canvas-${item.pos.size}`;
      if (index === activeCanvasIndex) btn.classList.add('selected');
      btn.style.setProperty('--x', `${item.pos.x}%`);
      btn.style.setProperty('--y', `${item.pos.y}%`);
      btn.setAttribute('aria-label', `Open ${item.title}`);

      const thumb = document.createElement('span');
      thumb.className = 'canvas-thumb';
      const thumbMedia = createStillMedia(item);
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
      });
      btn.addEventListener('pointermove', (event) => {
        if (!pointerStart) return;
        const dx = Math.abs(event.clientX - pointerStart.x);
        const dy = Math.abs(event.clientY - pointerStart.y);
        if (dx > 7 || dy > 7) didDrag = true;
      });
      btn.addEventListener('pointerup', () => {
        pointerStart = null;
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
        if (didDrag) {
          event.preventDefault();
          didDrag = false;
          return;
        }
        openLightbox(index, btn);
      });

      canvasCardsContainer.appendChild(btn);
    });
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
      mediaDiv.appendChild(createStillMedia(item));
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
    canvasView.addEventListener('pointerdown', () => {
      isDraggingCanvas = true;
      setHelperState('dragging');
    });
    window.addEventListener('pointerup', () => {
      if (!isDraggingCanvas) return;
      isDraggingCanvas = false;
      setHelperState();
      settleHelper();
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
  updateViews();
}
