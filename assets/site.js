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

// Playground Board Interactivity
const playgroundContainer = document.querySelector('.playground-section');
if (playgroundContainer) {
  // Playground Data Array
  const playgroundItems = [
    {
      title: "Zucchini Food Carousel",
      category: "User Interactions",
      media: "/assets/work/Zucchini Food Carousel Interaction.mp4",
      pos: { x: 50, y: 50, size: "feature" },
      action: "Play"
    },
    {
      title: "Dream Buddy",
      category: "User Interactions",
      media: "/assets/work/Art Shop Product Card Hover Interaction.mp4",
      pos: { x: 23, y: 22, size: "medium" },
      action: "View"
    },
    {
      title: "Battery Charging Status",
      category: "Visual Effects",
      media: "/assets/work/Battery Charging Status Widget Interaction.mp4",
      pos: { x: 78, y: 25, size: "medium" },
      action: "Play"
    },
    {
      title: "Expressive Character Sheet",
      category: "Artworks",
      media: "/assets/work/Expressive Character Sheet.png",
      pos: { x: 86, y: 62, size: "wide" },
      action: "View"
    },
    {
      title: "Car selection gallery",
      category: "Interactive Games",
      media: "/assets/work/Car Selection Gallery Interaction.mp4",
      pos: { x: 10, y: 22, size: "small" },
      action: "Play"
    },
    {
      title: "Custom Dessert Selector",
      category: "Interactive Games",
      media: "/assets/work/Custom Dessert Box Selector Interaction.mp4",
      pos: { x: 16, y: 46, size: "small" },
      action: "Play"
    },
    {
      title: "Navigation Image reveal",
      category: "User Interactions",
      media: "/assets/work/Navigation Tabs Image Reveal Interaction.mp4",
      pos: { x: 21, y: 72, size: "medium" },
      action: "Play"
    },
    {
      title: "Book3d cover rotation",
      category: "User Interactions",
      media: "/assets/work/Book 3D Cover Rotation Interaction.mp4",
      pos: { x: 62, y: 80, size: "small" },
      action: "Play"
    },
    {
      title: "Data Insight Card Flip",
      category: "Visual Effects",
      media: "/assets/work/Data Insight Card Flip Interaction.mp4",
      pos: { x: 65, y: 60, size: "small" },
      action: "Play"
    },
    {
      title: "Landing Page Chat card",
      category: "UI Designs",
      media: "/assets/work/Ayoverse Landing Page Chat Card Interaction.mp4",
      pos: { x: 79, y: 78, size: "medium" },
      action: "Play"
    },
    {
      title: "Nirvana",
      category: "Artworks",
      media: "/assets/work/Nirvana Character Illustration.png",
      pos: { x: 93, y: 78, size: "small" },
      action: "View"
    },
    {
      title: "Green Landing Page",
      category: "UI Designs",
      media: "/assets/work/Industrial Technology Landing Page.png",
      pos: { x: 11, y: 55, size: "small" },
      action: "View"
    },
    {
      title: "Pink Car Landing Page",
      category: "UI Designs",
      media: "/assets/work/Ayo Pink Car Landing Page.png",
      pos: { x: 10, y: 80, size: "small" },
      action: "View"
    },
    {
      title: "Crypto Landing Page",
      category: "UI Designs",
      media: "/assets/work/Ayo Crypto Future Landing Page.png",
      pos: { x: 18, y: 86, size: "small" },
      action: "View"
    },
    {
      title: "Music control & Slider Widget",
      category: "Visual Effects",
      media: "/assets/work/Music Control Slider Widget Interaction.mp4",
      pos: { x: 50, y: 82, size: "small" },
      action: "Play"
    },
    {
      title: "File reveal",
      category: "User Interactions",
      media: "/assets/work/Data Vault Success Modal Interaction.mp4",
      pos: { x: 34, y: 80, size: "medium" },
      action: "Play"
    }
  ];

  // State variables
  let currentMode = 'canvas'; // 'canvas' or 'list'
  let activeFilter = 'Everything';
  let searchQuery = '';
  let activeCanvasIndex = 0; // Index in the filtered list

  // DOM Elements
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

  // Helper function to detect video file
  function isVideoFile(path) {
    return /\.(mp4|webm|mov)$/i.test(path);
  }

  // Create Media element (Image or Video)
  function createMediaElement(src, alt, className = "") {
    if (isVideoFile(src)) {
      const video = document.createElement('video');
      video.src = src;
      video.className = className;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('preload', 'auto');
      return video;
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.className = className;
      img.setAttribute('loading', 'lazy');
      return img;
    }
  }

  // Get filtered items
  function getFilteredItems() {
    const query = searchQuery.trim().toLowerCase();
    return playgroundItems.filter(item => {
      const matchesFilter = activeFilter === 'Everything' || item.category === activeFilter;
      const matchesSearch = !query || 
                            item.title.toLowerCase().includes(query) || 
                            item.category.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }

  // Render Active Featured Item in Canvas Mode
  function renderFeaturedItem(item) {
    if (!featureMediaContainer) return;
    featureMediaContainer.innerHTML = '';
    if (item) {
      const mediaElement = createMediaElement(item.media, item.title);
      featureMediaContainer.appendChild(mediaElement);
      if (featureTitle) featureTitle.textContent = item.title;
    } else {
      if (featureTitle) featureTitle.textContent = 'No item selected';
    }
  }

  // Render Canvas Cards
  function renderCanvasView() {
    if (!canvasCardsContainer) return;
    canvasCardsContainer.innerHTML = '';
    const items = getFilteredItems();

    if (items.length === 0) {
      renderFeaturedItem(null);
      return;
    }

    // Validate activeCanvasIndex bounds
    if (activeCanvasIndex >= items.length) {
      activeCanvasIndex = 0;
    }

    const activeItem = items[activeCanvasIndex];
    renderFeaturedItem(activeItem);

    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `canvas-card canvas-${item.pos.size}`;
      if (index === activeCanvasIndex) {
        btn.classList.add('selected');
      }
      btn.style.setProperty('--x', `${item.pos.x}%`);
      btn.style.setProperty('--y', `${item.pos.y}%`);

      // Thumbnail
      const thumb = document.createElement('span');
      thumb.className = 'canvas-thumb';
      const thumbMedia = createMediaElement(item.media, item.title);
      if (thumbMedia.tagName === 'VIDEO') {
        thumbMedia.autoplay = false;
        thumbMedia.removeAttribute('autoplay');
      }
      thumb.appendChild(thumbMedia);
      btn.appendChild(thumb);

      // Title text
      const textSpan = document.createElement('span');
      textSpan.textContent = item.title;
      btn.appendChild(textSpan);

      // Interaction events
      const activate = () => {
        if (activeCanvasIndex !== index) {
          activeCanvasIndex = index;
          canvasCardsContainer.querySelectorAll('.canvas-card').forEach((card, cIdx) => {
            if (cIdx === index) {
              card.classList.add('selected');
            } else {
              card.classList.remove('selected');
            }
          });
          renderFeaturedItem(item);
        }
      };

      btn.addEventListener('mouseenter', activate);
      btn.addEventListener('click', activate);

      canvasCardsContainer.appendChild(btn);
    });
  }

  // Render List View
  function renderListView() {
    if (!listRowsContainer) return;
    listRowsContainer.innerHTML = '';
    const items = getFilteredItems();
    if (listItemsCount) {
      listItemsCount.textContent = `Showing ${items.length} playground items`;
    }

    items.forEach(item => {
      const row = document.createElement('article');
      row.className = 'list-row';

      // Media container
      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'list-media';
      const mediaElement = createMediaElement(item.media, item.title);
      mediaDiv.appendChild(mediaElement);
      row.appendChild(mediaDiv);

      // Info container
      const infoDiv = document.createElement('div');
      const categoryH3 = document.createElement('h3');
      categoryH3.textContent = item.category;
      const titleP = document.createElement('p');
      titleP.textContent = item.title;
      infoDiv.appendChild(categoryH3);
      infoDiv.appendChild(titleP);
      row.appendChild(infoDiv);

      // Action link/button
      const actionBtn = document.createElement('a');
      actionBtn.href = item.media;
      actionBtn.target = '_blank';
      actionBtn.textContent = item.action || 'View';
      row.appendChild(actionBtn);

      listRowsContainer.appendChild(row);
    });
  }

  // Sync View States
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

  // Initialize Mode Switcher
  if (modeTriggerBtn && modeDropdownMenu) {
    modeTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modeDropdownMenu.classList.toggle('is-open');
    });

    dropdownButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedMode = btn.getAttribute('data-mode');
        currentMode = selectedMode;
        modeTriggerBtn.textContent = btn.textContent;
        
        dropdownButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        modeDropdownMenu.classList.remove('is-open');
        
        updateViews();
      });
    });

    document.addEventListener('click', () => {
      modeDropdownMenu.classList.remove('is-open');
    });
  }

  // Initialize Filter Pills
  if (filterPillsContainer) {
    filterPillsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filterPillsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        activeCanvasIndex = 0;
        updateViews();
      });
    });
  }

  // Reset filters action
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (filterPillsContainer) {
        filterPillsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        filterPillsContainer.querySelector('[data-filter="Everything"]').classList.add('active');
      }
      activeFilter = 'Everything';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      activeCanvasIndex = 0;
      updateViews();
    });
  }

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      activeCanvasIndex = 0;
      updateViews();
    });
  }

  // Initial Render
  updateViews();
}
