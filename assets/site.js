const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const header = document.querySelector(".site-header");

if (menuToggle && mainNav) {
  const closeMenu = () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (e) => {
    if (mainNav.classList.contains("is-open") && !mainNav.contains(e.target) && e.target !== menuToggle) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
      closeMenu();
      menuToggle.focus();
    }
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

const portfolioFaqs = [
  {
    question: "What kind of projects do you take on?",
    answer: "I work on product design, mobile apps, SaaS dashboards, websites, landing pages, no-code builds, AI prototypes, and custom product visuals."
  },
  {
    question: "Can you redesign an existing website or product?",
    answer: "Yes. I can audit what exists, identify weak points, clean up the user flow, and redesign the interface so it feels clearer and more premium."
  },
  {
    question: "Do you only design, or can you also build?",
    answer: "I can support both. Depending on the project, I can deliver Figma designs, no-code builds, frontend-ready sections, design systems, and launch support."
  },
  {
    question: "What do you need before starting?",
    answer: "A clear goal, any existing brand assets, product notes, reference links, and a quick call to understand the audience, scope, and timeline."
  },
  {
    question: "How long does a project usually take?",
    answer: "Small landing pages can move quickly, while full apps or dashboards need more time for flows, screens, review, and refinement. I scope each timeline before we begin."
  },
  {
    question: "Can you work with founders and small teams?",
    answer: "Yes. Most of my process is built for founders, startups, creators, and lean teams that need thoughtful design without unnecessary complexity."
  }
];

document.querySelectorAll(".portfolio-faq-list").forEach((list) => {
  list.replaceChildren(...portfolioFaqs.map((item, index) => {
    const details = document.createElement("details");
    details.className = "faq-item";
    if (index === 0) details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = item.question;

    const answer = document.createElement("div");
    answer.className = "faq-answer";
    const paragraph = document.createElement("p");
    paragraph.textContent = item.answer;
    answer.appendChild(paragraph);

    details.append(summary, answer);
    return details;
  }));
});

const services = {
  product: {
    number: "01",
    title: "Product Design & UI UX Design",
    body: "I design clear, usable digital products across web and mobile, from early flows to polished Figma interfaces.",
    list: ["Product flows", "Wireframes", "High-fidelity UI"]
  },
  mobile: {
    number: "02",
    title: "Mobile App Design",
    body: "I design mobile app screens, user flows, onboarding, dashboards, profiles, forms, and interaction states for iOS and Android products.",
    list: ["Onboarding flows", "App screens", "Mobile prototypes"]
  },
  saas: {
    number: "03",
    title: "SaaS Dashboard & Web App Design",
    body: "I design dashboards, admin panels, portals, CRMs, analytics pages, internal tools, and complex web app interfaces.",
    list: ["Dashboards", "Admin panels", "Data-heavy UI"]
  },
  audit: {
    number: "04",
    title: "UX Audit & Product Redesign",
    body: "I review existing products, identify friction, improve weak flows, and redesign screens for better usability and clarity.",
    list: ["UX reviews", "Flow cleanup", "Screen redesigns"]
  },
  websites: {
    number: "05",
    title: "Landing Page & Website Design",
    body: "I design clean, responsive websites and landing pages for startups, SaaS products, portfolios, campaigns, and digital services.",
    list: ["Landing pages", "Portfolio sites", "Responsive design"]
  },
  nocode: {
    number: "06",
    title: "No Code Website Development",
    body: "I build clean no-code websites and lightweight production pages that preserve the design details and stay easy to update.",
    list: ["Framer builds", "No-code websites", "Launch-ready pages"]
  },
  ai: {
    number: "07",
    title: "AI Product Design & Prototyping",
    body: "I design AI-powered product experiences, AI assistants, prompt-based flows, chatbot interfaces, agent workflows, and AI-assisted prototypes.",
    list: ["AI assistants", "Prompt flows", "Agent workflows"]
  },
  illustration: {
    number: "08",
    title: "Custom Vector Illustration & Brand Assets",
    body: "I create custom vector illustrations, icons, empty states, onboarding visuals, hero graphics, and product visuals for apps and websites.",
    list: ["Custom icons", "Empty states", "Hero graphics"]
  }
};

document.querySelectorAll(".services-layout").forEach((serviceLayout) => {
  const serviceCards = [...serviceLayout.querySelectorAll(".service-card")];
  const rail = serviceLayout.querySelector(".service-rail");
  const serviceSection = serviceLayout.closest("section") || serviceLayout.parentElement;
  const detailNumber = serviceLayout.querySelector(".detail-number");
  const detailTitle = serviceLayout.querySelector("[data-service-title]");
  const detailBody = serviceLayout.querySelector("[data-service-body]") || serviceSection?.querySelector("[data-service-body]");
  const detailList = serviceLayout.querySelector("[data-service-list]");
  const prevButton = serviceLayout.querySelector("[data-service-prev]");
  const nextButton = serviceLayout.querySelector("[data-service-next]");
  const serviceCount = serviceLayout.querySelector("[data-service-count]");

  function scrollCardIntoView(card, behavior = "smooth") {
    if (!rail || !card) return;
    const targetLeft = Math.max(0, card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2);
    rail.scrollTo({ left: targetLeft, behavior });
  }

  function getSelectedIndex() {
    return Math.max(0, serviceCards.findIndex((card) => card.classList.contains("is-selected")));
  }

  function syncArrowState() {
    const selectedIndex = getSelectedIndex();
    if (prevButton) prevButton.disabled = selectedIndex <= 0;
    if (nextButton) nextButton.disabled = selectedIndex >= serviceCards.length - 1;
    if (serviceCount) serviceCount.textContent = `${selectedIndex + 1} of ${serviceCards.length}`;
  }

  function selectService(key, shouldScroll = true) {
    const data = services[key];
    if (!data) return;

    serviceCards.forEach((card) => {
      const selected = card.dataset.service === key;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
      if (selected && shouldScroll) {
        scrollCardIntoView(card);
      }
    });

    if (detailNumber) detailNumber.textContent = data.number;
    if (detailTitle) detailTitle.textContent = data.title;
    if (detailBody) detailBody.textContent = data.body;
    if (detailList) {
      detailList.replaceChildren(...data.list.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
    }
    syncArrowState();
  }

  function selectByOffset(offset) {
    const nextIndex = Math.max(0, Math.min(serviceCards.length - 1, getSelectedIndex() + offset));
    const nextCard = serviceCards[nextIndex];
    if (nextCard) selectService(nextCard.dataset.service);
  }

  serviceCards.forEach((card) => {
    card.addEventListener("focus", () => selectService(card.dataset.service, false));
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
  let dragTimer = 0;

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
    const railRect = rail.getBoundingClientRect();
    const cardHalfWidth = (serviceCards[0]?.getBoundingClientRect().width || 0) / 2;
    const selectionLine = railRect.left + Math.min(cardHalfWidth, rail.clientWidth / 2);
    const nearest = serviceCards.reduce((best, card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - selectionLine);
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
      window.clearTimeout(dragTimer);
      dragTimer = window.setTimeout(syncToNearestCard, 280);
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

document.querySelectorAll("[data-service-stack]").forEach((section) => {
  const cards = Array.from(section.querySelectorAll(".srv-row[data-step]"));
  const activeStep = section.querySelector("[data-srv-active-step]");
  const progressLine = section.querySelector(".srv-stack-line span");
  if (!cards.length || !activeStep || !progressLine) return;

  let ticking = false;

  function syncServiceStack() {
    ticking = false;

    const viewportAnchor = window.innerHeight * 0.42;
    const sectionRect = section.getBoundingClientRect();
    const scrollRange = Math.max(1, sectionRect.height - window.innerHeight);
    const progress = Math.max(0, Math.min(1, (viewportAnchor - sectionRect.top) / scrollRange));

    section.style.setProperty("--srv-progress", `${Math.round(progress * 100)}%`);

    const activeCard = cards.reduce((best, card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.top - viewportAnchor);
      return distance < best.distance ? { card, distance } : best;
    }, { card: cards[0], distance: Infinity }).card;

    cards.forEach((card) => {
      card.classList.toggle("is-active", card === activeCard);
    });

    activeStep.textContent = activeCard.dataset.step || "01";
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncServiceStack);
  }

  syncServiceStack();
  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
});

const testimonialEntries = [
  {
    rating: 5,
    quote: "Ayo took a rough product idea and turned it into a flow our team could understand and build. The screens were clear, and every decision had a reason.",
    name: "Anonymous product founder",
    role: "Lagos, Nigeria",
  },
  {
    rating: 5,
    quote: "Working with Ayo was a great experience. He pays attention to details, listens well, works fast, and the quality of his work has a very classy vibe.",
    name: "Hay_artz stores",
    role: "Founder",
  },
  {
    rating: 4,
    quote: "The redesign made our offer easier to understand and gave the team a much clearer direction. Review rounds were focused and the handoff was organized.",
    name: "Anonymous startup operator",
    role: "Toronto, Canada",
  },
  {
    rating: 5,
    quote: "I hired Ayo to handle the UI revamp for the Orca Securities website and he delivered exactly what we needed. His work is neat, detailed, and communication was smooth.",
    name: "Olumide Adepoju",
    role: "CEO, Orca Securities Ltd",
  },
  {
    rating: 4,
    quote: "I needed a website for Bitzsznn that captures the energy and lets me collect payments directly. The site looks premium and the ticketing flow feels smooth.",
    name: "Yungbitz",
    role: "CEO, Bitzsznn Entertainment",
  },
  {
    rating: 5,
    quote: "Ayo brought structure to a complicated dashboard without making it feel heavy. Our core actions are easier to find and the product finally feels consistent.",
    name: "Anonymous SaaS lead",
    role: "Austin, United States",
  },
  {
    rating: 4,
    quote: "The visual direction felt considered from the first presentation. He responded well to feedback and kept the final system flexible for our internal team.",
    name: "Anonymous creative director",
    role: "Berlin, Germany",
  },
  {
    rating: 3,
    quote: "The first direction needed another pass, but the feedback was handled thoughtfully. The final storefront is cleaner, faster to scan, and easier to maintain.",
    name: "Anonymous e-commerce founder",
    role: "Accra, Ghana",
  },
];

document.querySelectorAll("[data-ticker]").forEach((ticker) => {
  const track = ticker.querySelector(".testimonial-track");
  if (!track) return;

  const allCards = Array.from(track.querySelectorAll(".testimonial-card"));
  const cards = allCards.slice(0, testimonialEntries.length);
  if (!cards.length) return;

  cards.forEach((card, index) => {
    const entry = testimonialEntries[index];
    if (!entry) return;
    const ratingLabel = card.querySelector(".rating span");
    const ratingStars = card.querySelector(".rating strong");
    const quote = card.querySelector(":scope > p");
    const author = card.querySelector("footer strong");
    const role = card.querySelector("footer span");
    if (ratingLabel) ratingLabel.textContent = `${entry.rating}/5`;
    if (ratingStars) {
      ratingStars.textContent = `${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}`;
      ratingStars.setAttribute("aria-label", `${entry.rating} out of 5 stars`);
    }
    if (quote) quote.textContent = entry.quote;
    if (author) author.textContent = entry.name;
    if (role) role.textContent = entry.role;
  });

  allCards.slice(cards.length).forEach((card) => card.remove());

  ticker.setAttribute("role", "region");
  ticker.setAttribute("aria-roledescription", "carousel");
  ticker.setAttribute("aria-label", "Client testimonials");

  const dots = document.createElement("div");
  dots.className = "testimonial-dots";
  dots.setAttribute("role", "group");
  dots.setAttribute("aria-label", "Choose a testimonial");
  ticker.insertAdjacentElement("afterend", dots);

  let activeIndex = 0;
  let rotationTimer = null;
  let swipeState = null;
  let suppressCardClick = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dotButtons = cards.map((card, index) => {
    const button = document.createElement("button");
    button.className = "testimonial-dot";
    button.type = "button";
    button.setAttribute("aria-label", `Show testimonial ${index + 1} of ${cards.length}`);
    button.addEventListener("click", () => {
      activeIndex = index;
      render();
      restartRotation();
    });
    dots.appendChild(button);
    return button;
  });

  function positionFor(index) {
    let position = index - activeIndex;
    const midpoint = Math.floor(cards.length / 2);
    if (position > midpoint) position -= cards.length;
    if (position < -midpoint) position += cards.length;
    return position;
  }

  function render() {
    cards.forEach((card, index) => {
      const position = positionFor(index);
      const isActive = position === 0;
      card.dataset.position = String(position);
      card.setAttribute("aria-hidden", String(!isActive));
      card.tabIndex = isActive ? 0 : -1;
    });

    dotButtons.forEach((button, index) => {
      button.setAttribute("aria-current", String(index === activeIndex));
    });
  }

  function stopRotation() {
    if (rotationTimer) window.clearInterval(rotationTimer);
    rotationTimer = null;
  }

  function startRotation() {
    stopRotation();
    if (reduceMotion) return;
    rotationTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % cards.length;
      render();
    }, 4600);
  }

  function restartRotation() {
    startRotation();
  }

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (suppressCardClick) return;
      if (index === activeIndex) return;
      activeIndex = index;
      render();
      restartRotation();
    });
  });

  function beginSwipe(pointerId, clientX, clientY) {
    if (swipeState) return false;

    swipeState = {
      pointerId,
      startX: clientX,
      startY: clientY,
      deltaX: 0,
      axis: null,
      startedAt: performance.now(),
    };
    stopRotation();
    return true;
  }

  function moveSwipe(pointerId, clientX, clientY, preventDefault) {
    if (!swipeState || pointerId !== swipeState.pointerId) return;

    const deltaX = clientX - swipeState.startX;
    const deltaY = clientY - swipeState.startY;
    swipeState.deltaX = deltaX;

    if (!swipeState.axis && Math.hypot(deltaX, deltaY) >= 8) {
      swipeState.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? "x" : "y";
      if (swipeState.axis === "x") ticker.classList.add("is-swiping");
    }

    if (swipeState.axis !== "x") return;
    preventDefault?.();
    const resistance = Math.max(-120, Math.min(120, deltaX * 0.72));
    track.style.setProperty("--testimonial-drag-x", `${resistance}px`);
  }

  function finishSwipe(pointerId, cancelled = false) {
    if (!swipeState || pointerId !== swipeState.pointerId) return;

    const elapsed = Math.max(1, performance.now() - swipeState.startedAt);
    const velocity = swipeState.deltaX / elapsed;
    const isHorizontalSwipe = swipeState.axis === "x"
      && (Math.abs(swipeState.deltaX) >= 48 || (Math.abs(swipeState.deltaX) >= 24 && Math.abs(velocity) >= 0.35));

    ticker.classList.remove("is-swiping");
    track.style.removeProperty("--testimonial-drag-x");

    if (!cancelled && isHorizontalSwipe) {
      const direction = swipeState.deltaX < 0 ? 1 : -1;
      activeIndex = (activeIndex + direction + cards.length) % cards.length;
      render();
      suppressCardClick = true;
      window.setTimeout(() => {
        suppressCardClick = false;
      }, 360);
    }

    swipeState = null;
    restartRotation();
  }

  ticker.addEventListener("pointerdown", (event) => {
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!beginSwipe(event.pointerId, event.clientX, event.clientY)) return;
    try {
      ticker.setPointerCapture?.(event.pointerId);
    } catch (_error) {
      // Synthetic pointer events used by QA do not own pointer capture.
    }
  });

  ticker.addEventListener("pointermove", (event) => {
    moveSwipe(event.pointerId, event.clientX, event.clientY, () => event.preventDefault());
  });

  ticker.addEventListener("pointerup", (event) => {
    finishSwipe(event.pointerId);
    try {
      ticker.releasePointerCapture?.(event.pointerId);
    } catch (_error) {
      // Pointer capture can already be released when a browser cancels a gesture.
    }
  });
  ticker.addEventListener("pointercancel", (event) => finishSwipe(event.pointerId, true));

  ticker.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    beginSwipe(`touch-${touch.identifier}`, touch.clientX, touch.clientY);
  }, { passive: true });

  ticker.addEventListener("touchmove", (event) => {
    if (!swipeState || typeof swipeState.pointerId !== "string") return;
    const identifier = Number(swipeState.pointerId.replace("touch-", ""));
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === identifier);
    if (!touch) return;
    moveSwipe(swipeState.pointerId, touch.clientX, touch.clientY, () => event.preventDefault());
  }, { passive: false });

  ticker.addEventListener("touchend", (event) => {
    if (!swipeState || typeof swipeState.pointerId !== "string") return;
    const identifier = Number(swipeState.pointerId.replace("touch-", ""));
    if (!Array.from(event.changedTouches).some((item) => item.identifier === identifier)) return;
    finishSwipe(swipeState.pointerId);
  }, { passive: true });

  ticker.addEventListener("touchcancel", () => {
    if (swipeState && typeof swipeState.pointerId === "string") finishSwipe(swipeState.pointerId, true);
  }, { passive: true });

  ticker.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    beginSwipe("mouse", event.clientX, event.clientY);
  });

  window.addEventListener("mousemove", (event) => {
    moveSwipe("mouse", event.clientX, event.clientY, () => event.preventDefault());
  });

  window.addEventListener("mouseup", () => finishSwipe("mouse"));

  ticker.addEventListener("mouseenter", stopRotation);
  ticker.addEventListener("mouseleave", startRotation);
  ticker.addEventListener("focusin", stopRotation);
  ticker.addEventListener("focusout", startRotation);
  ticker.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    activeIndex = (activeIndex + direction + cards.length) % cards.length;
    render();
    restartRotation();
  });

  render();
  startRotation();

  const swipeHint = document.createElement("p");
  swipeHint.className = "testimonial-swipe-hint";
  swipeHint.textContent = "Swipe or drag testimonials · Auto-plays";
  dots.insertAdjacentElement("afterend", swipeHint);
});

const proofCounters = Array.from(document.querySelectorAll("[data-count-target]"));
if (proofCounters.length) {
  const reduceCounterMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showCounterValue(counter, value) {
    const suffix = counter.dataset.countSuffix || "";
    counter.textContent = `${value}${suffix}`;
  }

  function animateCounter(counter) {
    if (counter.dataset.counted === "true") return;
    counter.dataset.counted = "true";
    const target = Number(counter.dataset.countTarget || 0);
    if (reduceCounterMotion || !Number.isFinite(target)) {
      showCounterValue(counter, target);
      return;
    }

    const startedAt = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      showCounterValue(counter, Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    showCounterValue(counter, 0);
    window.requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    proofCounters.forEach((counter) => counterObserver.observe(counter));
  } else {
    proofCounters.forEach(animateCounter);
  }
}

document.querySelectorAll("[data-process-set]").forEach((processSet) => {
  const cards = Array.from(processSet.querySelectorAll(".process-step, .process-col"));
  cards.forEach((card, index) => {
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", `Step ${index + 1}: ${card.querySelector("h3, h4")?.textContent?.trim() || "Process step"}`);
  });

  function selectCard(selectedCard) {
    cards.forEach((item) => {
      const isSelected = item === selectedCard;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      selectCard(card);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      selectCard(card);
    });
  });
});

document.querySelectorAll("[data-swipe-stack]").forEach((stack) => {
  let cards = Array.from(stack.querySelectorAll("[data-stack-card]"));
  const positions = ["is-front", "is-middle", "is-back"];

  function syncStack() {
    cards.forEach((card, index) => {
      card.classList.remove(...positions);
      card.classList.add(positions[Math.min(index, positions.length - 1)]);
      card.tabIndex = index === 0 ? 0 : -1;
      card.setAttribute("aria-pressed", String(index === 0));
    });
  }

  function bringToFront(card) {
    cards = [card, ...cards.filter((item) => item !== card)];
    syncStack();
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => bringToFront(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      bringToFront(card);
    });
  });

  syncStack();
});

document.querySelectorAll(".about-photo-stack").forEach((stack) => {
  let cards = Array.from(stack.querySelectorAll("[data-about-photo-card]"));
  const positions = ["front", "middle", "back"];
  cards.sort((a, b) => positions.indexOf(a.dataset.stackPosition) - positions.indexOf(b.dataset.stackPosition));

  function syncPhotoStack() {
    cards.forEach((card, index) => {
      card.dataset.stackPosition = positions[Math.min(index, positions.length - 1)];
      card.setAttribute("aria-pressed", String(index === 0));
    });
  }

  function bringPhotoToFront(card) {
    cards = [card, ...cards.filter((item) => item !== card)];
    syncPhotoStack();
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => bringPhotoToFront(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      bringPhotoToFront(card);
    });
  });

  syncPhotoStack();
});

// Playground Board Interactivity
document.querySelectorAll('.playground-section').forEach((playgroundContainer) => {
  const titleCase = (slug) => slug.split('-').map((word) => {
    if (['ui', 'ux', 'ai', 'spnd', '3d'].includes(word)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  const makeItems = (files, category, mediaType, basePath, tags) => files.map((file) => {
    const id = file.replace(/\.[^.]+$/, '');
    const mediaSrc = `${basePath}/${id}${mediaType === 'video' ? '.mp4' : '.webp'}`;
    const thumbSrc = `${basePath}/${id}${mediaType === 'video' ? '-poster.webp' : '-thumb.webp'}`;
    return {
      id,
      title: titleCase(id),
      category,
      tags,
      mediaType,
      alt: titleCase(id),
      thumbnail: thumbSrc,
      ...(mediaType === 'video' ? { videoSrc: mediaSrc } : { imageSrc: mediaSrc })
    };
  });

  const playgroundItems = [
    ...makeItems([
      'art-shop-product-card-hover-interaction.mp4',
      'ayoverse-landing-page-chat-card-interaction.mp4',
      'bank-cards-onboarding-card-stack-interaction.mp4',
      'battery-charging-status-widget-interaction.mp4',
      'book-3d-cover-rotation-interaction.mp4',
      'car-selection-gallery-interaction.mp4',
      'community-calendar-feature-interaction.mp4',
      'custom-dessert-box-selector-interaction.mp4',
      'data-insight-card-flip-interaction.mp4',
      'data-vault-success-modal-interaction.mp4',
      'music-control-slider-widget-interaction.mp4',
      'navigation-tabs-image-reveal-interaction.mp4',
      'online-alarm-form-interaction.mp4',
      'project-brief-card-expand-interaction.mp4',
      'project-chaos-order-form-interaction.mp4',
      'space-project-landing-page-interaction.mp4',
      'spnd-mobile-prototype-splash-interaction.mp4',
      'zucchini-food-carousel-interaction.mp4'
    ], 'User Interactions', 'video', '/assets/playground/interactions', ['interactions']),
    ...makeItems([
      'ayo-community-landing-footer.jpg',
      'ayo-crypto-future-landing-page.png',
      'ayo-design-portfolio-footer.png',
      'ayo-pink-car-landing-page.png',
      'ayo-red-car-landing-page.png',
      'child-portrait-reference.jpg',
      'creative-collaboration-landing-page.png',
      'crypto-market-landing-page.png',
      'crypto-trading-landing-page.png',
      'daily-loop-task-app-ui.png',
      'health-tracker-widgets-ui.png',
      'healthcare-feature-cards-ui.png',
      'industrial-technology-landing-page.png',
      'legal-services-landing-page.png',
      'mobile-finance-app-screens.png',
      'music-player-widget-ui.png',
      'orca-newsletter-footer-ui.png',
      'pricing-plan-cards-ui.png',
      'security-landing-page-ui.jpg',
      'smart-home-tab-controls-ui.png',
      'spnd-card-success-screens.jpg',
      'spnd-onboarding-flow-screens.jpg',
      'spnd-sleep-tracking-app-screens.jpg',
      'video-upload-modal-ui.jpg'
    ], 'UI Designs', 'image', '/assets/playground/ui', ['designs']),
    ...makeItems([
      'appointment-booking-dashboard-ui.png',
      'prop-firm-challenge-dashboard.png',
      'sales-analytics-dashboard-ui.png'
    ], 'Dashboard', 'image', '/assets/playground/ui', ['dashboard', 'dashboards', 'designs']),
    ...makeItems([
      'avo-buddy-character-set.png',
      'ayo-football-jersey-character.png',
      'ayo-mascot-face-header.png',
      'capri-sun-hand-illustration.png',
      'child-drinking-capri-sun-poster.png',
      'crying-character-illustration.png',
      'emotions-loading-character-sheet.png',
      'expressive-character-sheet.png',
      'hello-friday-weekend-poster.png',
      'home-building-poster.png',
      'keep-chasing-joy-runner-poster.png',
      'keke-tricycle-illustration.png',
      'lock-in-character-quote.png',
      'nirvana-character-illustration.png',
      'orange-figure-city-perspective-illustration.png',
      'policy-from-my-bed-podcast-cover.png',
      'policy-from-my-bed-portrait-poster.png',
      'purple-car-illustration.png',
      'scarf-character-illustration.png',
      'spongebob-balloon-illustration.png',
      'stargirl-desert-illustration.png',
      'waiting-by-the-phone-illustration.png',
      'woman-in-yellow-hat-illustration.png'
    ], 'Illustrations', 'image', '/assets/playground/artworks', ['illustrations'])
  ];

  let currentMode = 'canvas';
  let activeFilter = 'Everything';
  let searchQuery = '';
  let lightboxIndex = -1;
  let lastFocusedCard = null;
  let animationFrame = 0;
  let lastFrameTime = performance.now();
  let filteredItems = [];
  let activeStates = [];
  let activeStateById = new Map();
  let dragState = null;
  let panState = null;
  let pinchState = null;
  const activePointers = new Map();
  const camera = { x: 0, y: 0, zoom: 1 };
  const world = { width: 2600, height: 1800 };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHomePreview = document.body.classList.contains('home');

  const searchInput = playgroundContainer.querySelector('#playground-search');
  const modeTriggerBtn = playgroundContainer.querySelector('#mode-trigger-btn');
  const modeDropdownMenu = playgroundContainer.querySelector('#mode-dropdown-menu');
  const dropdownButtons = modeDropdownMenu ? modeDropdownMenu.querySelectorAll('button') : [];
  const filterPillsContainer = playgroundContainer.querySelector('#filter-pills-container');
  const resetFiltersBtn = playgroundContainer.querySelector('#reset-filters-btn');
  const canvasView = playgroundContainer.querySelector('#playground-canvas-view');
  const listView = playgroundContainer.querySelector('#playground-list-view');
  const featureMediaContainer = playgroundContainer.querySelector('#feature-media-container');
  const featureTitle = playgroundContainer.querySelector('#feature-title');
  const canvasCardsContainer = playgroundContainer.querySelector('#canvas-cards-container');
  const listItemsCount = playgroundContainer.querySelector('#list-items-count');
  const listRowsContainer = playgroundContainer.querySelector('#list-rows-container');
  const seeAllButton = playgroundContainer.querySelector('#play-see-all');
  const helperPill = playgroundContainer.querySelector('#canvas-helper-pill') || createHelperPill();

  function createHelperPill() {
    if (!canvasView) return null;
    const pill = document.createElement('div');
    pill.className = 'canvas-helper-pill';
    pill.id = 'canvas-helper-pill';
    pill.setAttribute('aria-hidden', 'true');
    canvasView.appendChild(pill);
    return pill;
  }

  function setHelperState(text) {
    if (!helperPill) return;
    helperPill.textContent = text || 'Drag cards  |  Pan canvas  |  Wheel or pinch to zoom';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getViewportCenter() {
    if (!canvasView) return { x: 0, y: 0 };
    return { x: canvasView.clientWidth / 2, y: canvasView.clientHeight / 2 };
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvasView.getBoundingClientRect();
    const center = getViewportCenter();
    return {
      x: (clientX - rect.left - center.x) / camera.zoom + camera.x,
      y: (clientY - rect.top - center.y) / camera.zoom + camera.y
    };
  }

  function clampCamera() {
    const rect = canvasView.getBoundingClientRect();
    const halfW = rect.width / 2 / camera.zoom;
    const halfH = rect.height / 2 / camera.zoom;
    if (!activeStates.length) {
      camera.x = clamp(camera.x, halfW, Math.max(halfW, world.width - halfW));
      camera.y = clamp(camera.y, halfH, Math.max(halfH, world.height - halfH));
      return;
    }

    const edgePaddingX = Math.min(180, Math.max(96, halfW * 0.16));
    const edgePaddingY = Math.min(150, Math.max(84, halfH * 0.18));
    const contentMinX = Math.min(...activeStates.map((state) => state.x - state.width / 2)) - edgePaddingX;
    const contentMaxX = Math.max(...activeStates.map((state) => state.x + state.width / 2)) + edgePaddingX;
    const contentMinY = Math.min(...activeStates.map((state) => state.y - state.height / 2)) - edgePaddingY;
    const contentMaxY = Math.max(...activeStates.map((state) => state.y + state.height / 2)) + edgePaddingY;

    const minCameraX = contentMinX + halfW;
    const maxCameraX = contentMaxX - halfW;
    const minCameraY = contentMinY + halfH;
    const maxCameraY = contentMaxY - halfH;

    camera.x = minCameraX > maxCameraX
      ? (contentMinX + contentMaxX) / 2
      : clamp(camera.x, minCameraX, maxCameraX);
    camera.y = minCameraY > maxCameraY
      ? (contentMinY + contentMaxY) / 2
      : clamp(camera.y, minCameraY, maxCameraY);
  }

  function applyCamera() {
    if (!canvasCardsContainer) return;
    const center = getViewportCenter();
    canvasCardsContainer.style.transform = `translate(${center.x}px, ${center.y}px) scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`;
  }

  function resetCamera() {
    camera.x = world.width / 2;
    camera.y = world.height / 2;
    const fitWidth = isHomePreview ? 1800 : 1500;
    camera.zoom = Math.min(1, canvasView ? Math.max(0.62, canvasView.clientWidth / fitWidth) : 1);
    clampCamera();
    applyCamera();
  }

  function createMedia(item, className = '') {
    if (item.mediaType === 'video') {
      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = item.alt || item.title;
      img.className = className;
      img.loading = 'lazy';
      return img;
    }
    const img = document.createElement('img');
    img.src = item.imageSrc || item.thumbnail;
    img.alt = item.alt || item.title;
    img.className = className;
    img.loading = 'lazy';
    return img;
  }

  function hydrateVideo(video) {
    if (!video || video.tagName !== 'VIDEO' || video.currentSrc || !video.dataset.src) return;
    video.src = video.dataset.src;
  }

  function playPreview(video) {
    if (reduceMotion || !video || video.tagName !== 'VIDEO') return;
    hydrateVideo(video);
    video.play().catch(() => {});
  }

  function pausePreview(video) {
    if (!video || video.tagName !== 'VIDEO') return;
    video.pause();
  }

  function stopAllPreviews() {
    playgroundContainer.querySelectorAll('video').forEach((video) => pausePreview(video));
  }

  function getFilteredItems() {
    const query = searchQuery.trim().toLowerCase();
    return playgroundItems.filter((item) => {
      const matchesFilter = activeFilter === 'Everything' || item.category === activeFilter;
      const haystack = `${item.title} ${item.category} ${item.tags.join(' ')}`.toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }

  function createState(item, index, total) {
    const isSmallSet = total <= 6;
    const columns = isSmallSet ? Math.max(1, Math.min(3, total)) : (isHomePreview ? Math.min(10, Math.max(6, Math.ceil(Math.sqrt(total * 1.45)))) : Math.ceil(Math.sqrt(total * 1.25)));
    const gapX = isHomePreview ? 220 : 260;
    const gapY = isHomePreview ? 180 : 218;
    const startX = Math.max(180, (world.width - (columns - 1) * gapX) / 2);
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = startX + col * gapX + (!isSmallSet && row % 2 ? 80 : 0);
    const rows = Math.ceil(total / columns);
    const y = isSmallSet ? (world.height - (rows - 1) * gapY) / 2 + row * gapY : (isHomePreview ? 150 : 180) + row * gapY;
    return {
      item,
      x: clamp(x, 130, world.width - 130),
      y: clamp(y, 120, world.height - 120),
      vx: ((index % 5) - 2) * 0.05,
      vy: (((index + 2) % 5) - 2) * 0.04,
      width: 206,
      height: 162,
      mass: 1,
      element: null
    };
  }

  function syncStates(items) {
    if (isHomePreview) {
      const columns = Math.min(10, Math.max(6, Math.ceil(Math.sqrt(Math.max(items.length, 1) * 1.45))));
      const rows = Math.ceil(Math.max(items.length, 1) / columns);
      world.width = Math.max(2240, (columns - 1) * 220 + 440);
      world.height = Math.max(1320, (rows - 1) * 180 + 420);
    } else {
      world.width = Math.max(1800, Math.ceil(Math.sqrt(Math.max(items.length, 1))) * 410);
      world.height = Math.max(1180, Math.ceil(items.length / Math.ceil(Math.sqrt(Math.max(items.length, 1)))) * 310 + 320);
    }
    const previous = activeStateById;
    const preserveLayout = previous.size === items.length && items.every((item) => previous.has(item.id));
    activeStates = items.map((item, index) => {
      const existing = previous.get(item.id);
      return preserveLayout && existing ? existing : createState(item, index, items.length);
    });
    activeStateById = new Map(activeStates.map((state) => [state.item.id, state]));
    if (!preserveLayout && activeStates.length) {
      const contentMinX = Math.min(...activeStates.map((state) => state.x - state.width / 2));
      const contentMaxX = Math.max(...activeStates.map((state) => state.x + state.width / 2));
      const contentMinY = Math.min(...activeStates.map((state) => state.y - state.height / 2));
      const contentMaxY = Math.max(...activeStates.map((state) => state.y + state.height / 2));
      camera.x = (contentMinX + contentMaxX) / 2;
      camera.y = (contentMinY + contentMaxY) / 2;
    }
    clampCamera();
  }

  function renderFeaturedItem(item) {
    if (!featureMediaContainer || !featureTitle) return;
    featureMediaContainer.innerHTML = '';
    featureTitle.textContent = item ? item.title : 'No item selected';
  }

  function renderCanvasView() {
    if (!canvasCardsContainer) return;
    filteredItems = getFilteredItems();
    syncStates(filteredItems);
    canvasCardsContainer.innerHTML = '';
    renderFeaturedItem(filteredItems[0]);

    activeStates.forEach((state, index) => {
      const item = state.item;
      let suppressOpen = false;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'canvas-card';
      button.setAttribute('aria-label', `${item.mediaType === 'video' ? 'Play' : 'View'} ${item.title}`);
      button.dataset.id = item.id;

      const thumb = document.createElement('span');
      thumb.className = 'canvas-thumb';
      const media = createMedia(item);
      thumb.appendChild(media);

      const meta = document.createElement('span');
      meta.className = 'canvas-card-meta';
      meta.innerHTML = `<span>${item.category}</span><strong>${item.title}</strong><em>${item.mediaType === 'video' ? 'Play' : 'View'}</em>`;

      button.append(thumb, meta);
      canvasCardsContainer.appendChild(button);
      state.element = button;
      positionCard(state);

      button.addEventListener('mouseenter', () => {
        renderFeaturedItem(item);
        playPreview(media);
      });
      button.addEventListener('mouseleave', () => pausePreview(media));
      button.addEventListener('focus', () => {
        renderFeaturedItem(item);
        playPreview(media);
      });
      button.addEventListener('blur', () => pausePreview(media));
      button.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        const worldPoint = screenToWorld(event.clientX, event.clientY);
        dragState = {
          state,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startTime: performance.now(),
          moved: false,
          offsetX: worldPoint.x - state.x,
          offsetY: worldPoint.y - state.y,
          lastX: worldPoint.x,
          lastY: worldPoint.y,
          lastTime: performance.now()
        };
        state.vx = 0;
        state.vy = 0;
        button.classList.add('is-dragging');
        button.setPointerCapture?.(event.pointerId);
        stopAllPreviews();
      });
      button.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId || dragState.state !== state) return;
        const worldPoint = screenToWorld(event.clientX, event.clientY);
        const now = performance.now();
        const dt = Math.max(16, now - dragState.lastTime);
        dragState.moved = dragState.moved || Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 8;
        state.x = clamp(worldPoint.x - dragState.offsetX, state.width / 2, world.width - state.width / 2);
        state.y = clamp(worldPoint.y - dragState.offsetY, state.height / 2, world.height - state.height / 2);
        state.vx = ((worldPoint.x - dragState.lastX) / dt) * 16;
        state.vy = ((worldPoint.y - dragState.lastY) / dt) * 16;
        dragState.lastX = worldPoint.x;
        dragState.lastY = worldPoint.y;
        dragState.lastTime = now;
        positionCard(state);
      });
      button.addEventListener('pointerup', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId || dragState.state !== state) return;
        suppressOpen = dragState.moved;
        dragState = null;
        button.classList.remove('is-dragging');
        button.releasePointerCapture?.(event.pointerId);
        if (suppressOpen) window.setTimeout(() => { suppressOpen = false; }, 360);
      });
      button.addEventListener('pointercancel', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId || dragState.state !== state) return;
        dragState = null;
        button.classList.remove('is-dragging');
        button.releasePointerCapture?.(event.pointerId);
      });
      button.addEventListener('click', (event) => {
        if (!suppressOpen) openLightbox(index, button);
      });
    });
    applyCamera();
  }

  function positionCard(state) {
    if (!state.element) return;
    state.element.style.transform = `translate(${state.x}px, ${state.y}px) translate(-50%, -50%)`;
  }

  function stepPhysics(delta) {
    if (currentMode !== 'canvas') return;
    const damping = reduceMotion ? 0.86 : 0.992;
    activeStates.forEach((state, index) => {
      if (dragState?.state === state) return;
      if (!reduceMotion) {
        state.vx += Math.sin((performance.now() * 0.0003) + index) * 0.004;
        state.vy += Math.cos((performance.now() * 0.00025) + index) * 0.003;
      }
      state.x += state.vx * delta;
      state.y += state.vy * delta;
      state.vx *= damping;
      state.vy *= damping;
      const halfW = state.width / 2;
      const halfH = state.height / 2;
      if (state.x < halfW || state.x > world.width - halfW) {
        state.x = clamp(state.x, halfW, world.width - halfW);
        state.vx *= -0.72;
      }
      if (state.y < halfH || state.y > world.height - halfH) {
        state.y = clamp(state.y, halfH, world.height - halfH);
        state.vy *= -0.72;
      }
    });

    for (let i = 0; i < activeStates.length; i += 1) {
      for (let j = i + 1; j < activeStates.length; j += 1) {
        const a = activeStates[i];
        const b = activeStates[j];
        if (dragState?.state === a || dragState?.state === b) continue;
        const minX = (a.width + b.width) * 0.44;
        const minY = (a.height + b.height) * 0.44;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) >= minX || Math.abs(dy) >= minY) continue;
        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);
        if (overlapX < overlapY) {
          const push = (overlapX / 2) * Math.sign(dx || 1);
          a.x -= push;
          b.x += push;
          const av = a.vx;
          a.vx = b.vx * 0.74;
          b.vx = av * 0.74;
        } else {
          const push = (overlapY / 2) * Math.sign(dy || 1);
          a.y -= push;
          b.y += push;
          const av = a.vy;
          a.vy = b.vy * 0.74;
          b.vy = av * 0.74;
        }
      }
    }
    activeStates.forEach(positionCard);
  }

  function animate(now) {
    const delta = Math.min(2, (now - lastFrameTime) / 16);
    lastFrameTime = now;
    stepPhysics(delta);
    animationFrame = window.requestAnimationFrame(animate);
  }

  function renderListView() {
    if (!listRowsContainer) return;
    const items = getFilteredItems();
    listRowsContainer.innerHTML = '';
    if (listItemsCount) listItemsCount.textContent = `Showing ${items.length} playground items`;
    items.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'list-row';
      const mediaButton = document.createElement('button');
      mediaButton.className = 'list-media';
      mediaButton.type = 'button';
      mediaButton.setAttribute('aria-label', `${item.mediaType === 'video' ? 'Play' : 'View'} ${item.title}`);
      mediaButton.appendChild(createMedia(item));
      mediaButton.addEventListener('click', () => openLightbox(index, mediaButton));
      const info = document.createElement('div');
      info.innerHTML = `<h3>${item.title}</h3><p>${item.category} / ${item.mediaType === 'video' ? 'Video' : 'Image'}</p>`;
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = item.mediaType === 'video' ? 'Play' : 'View';
      action.addEventListener('click', () => openLightbox(index, action));
      row.append(mediaButton, info, action);
      listRowsContainer.appendChild(row);
    });
  }

  function updateViews() {
    stopAllPreviews();
    if (currentMode === 'canvas') {
      if (canvasView) canvasView.style.display = 'block';
      if (listView) listView.style.display = 'none';
      renderCanvasView();
      if (!animationFrame) {
        lastFrameTime = performance.now();
        animationFrame = window.requestAnimationFrame(animate);
      }
    } else {
      if (canvasView) canvasView.style.display = 'none';
      if (listView) listView.style.display = 'block';
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      renderListView();
    }
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
    overlay.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    overlay.remove();
    document.body.classList.remove('lightbox-open');
    if (restoreFocus && lastFocusedCard && typeof lastFocusedCard.focus === 'function') lastFocusedCard.focus();
  }

  function getFocusableElements(root) {
    return Array.from(root.querySelectorAll('button, [href], video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.disabled && element.offsetParent !== null);
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
    closeButton.textContent = 'Close';
    closeButton.setAttribute('aria-label', 'Close media viewer');
    const previousButton = document.createElement('button');
    previousButton.className = 'media-lightbox-nav is-prev';
    previousButton.type = 'button';
    previousButton.textContent = 'Previous';
    previousButton.setAttribute('aria-label', 'View previous playground item');
    const nextButton = document.createElement('button');
    nextButton.className = 'media-lightbox-nav is-next';
    nextButton.type = 'button';
    nextButton.textContent = 'Next';
    nextButton.setAttribute('aria-label', 'View next playground item');
    const frame = document.createElement('figure');
    frame.className = 'media-lightbox-frame';
    if (item.mediaType === 'video') {
      const video = document.createElement('video');
      video.src = item.videoSrc;
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
    caption.innerHTML = `<strong>${item.title}</strong><span>${lightboxIndex + 1} of ${items.length}</span>`;
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

  if (canvasView) {
    canvasView.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.canvas-card')) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 2) {
        const points = Array.from(activePointers.values());
        pinchState = {
          distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
          zoom: camera.zoom,
          x: camera.x,
          y: camera.y
        };
      } else {
        panState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
        canvasView.classList.add('is-dragging');
      }
      canvasView.setPointerCapture?.(event.pointerId);
      setHelperState(activePointers.size === 2 ? 'Pinching canvas' : 'Panning canvas');
    });
    canvasView.addEventListener('pointermove', (event) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinchState && activePointers.size >= 2) {
        const points = Array.from(activePointers.values()).slice(0, 2);
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        camera.zoom = clamp(pinchState.zoom * (distance / Math.max(1, pinchState.distance)), 0.48, 1.8);
      } else if (panState && panState.pointerId === event.pointerId) {
        camera.x = panState.cameraX - (event.clientX - panState.x) / camera.zoom;
        camera.y = panState.cameraY - (event.clientY - panState.y) / camera.zoom;
      }
      clampCamera();
      applyCamera();
    });
    const endCanvasPointer = (event) => {
      activePointers.delete(event.pointerId);
      if (panState?.pointerId === event.pointerId) panState = null;
      if (activePointers.size < 2) pinchState = null;
      if (!activePointers.size) {
        canvasView.classList.remove('is-dragging');
        setHelperState();
      }
      canvasView.releasePointerCapture?.(event.pointerId);
    };
    canvasView.addEventListener('pointerup', endCanvasPointer);
    canvasView.addEventListener('pointercancel', endCanvasPointer);
    canvasView.addEventListener('wheel', (event) => {
      event.preventDefault();
      const before = screenToWorld(event.clientX, event.clientY);
      const nextZoom = clamp(camera.zoom * (event.deltaY > 0 ? 0.92 : 1.08), 0.48, 1.8);
      camera.zoom = nextZoom;
      const after = screenToWorld(event.clientX, event.clientY);
      camera.x += before.x - after.x;
      camera.y += before.y - after.y;
      clampCamera();
      applyCamera();
    }, { passive: false });
  }

  if (modeTriggerBtn && modeDropdownMenu) {
    modeTriggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      modeDropdownMenu.classList.toggle('is-open');
    });
    dropdownButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        modeTriggerBtn.textContent = btn.textContent;
        dropdownButtons.forEach((button) => button.classList.remove('active'));
        btn.classList.add('active');
        modeDropdownMenu.classList.remove('is-open');
        updateViews();
      });
    });
    document.addEventListener('click', () => modeDropdownMenu.classList.remove('is-open'));
  }

  function resetFilters() {
    filterPillsContainer?.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
    filterPillsContainer?.querySelector('[data-filter="Everything"]')?.classList.add('active');
    activeFilter = 'Everything';
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    updateViews();
  }

  filterPillsContainer?.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterPillsContainer.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      updateViews();
    });
  });
  resetFiltersBtn?.addEventListener('click', resetFilters);
  seeAllButton?.addEventListener('click', resetFilters);
  searchInput?.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    updateViews();
  });

  document.addEventListener('keydown', (event) => {
    const overlay = document.querySelector('.media-lightbox');
    if (!overlay) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const items = getFilteredItems();
      lightboxIndex = (lightboxIndex + (event.key === 'ArrowLeft' ? -1 : 1) + items.length) % items.length;
      renderLightbox(items);
    }
  });

  window.addEventListener('resize', () => {
    clampCamera();
    applyCamera();
  });

  setHelperState();
  resetCamera();
  updateViews();

  document.querySelectorAll('[data-case-back]').forEach((link) => {
    let referrer;
    try {
      referrer = document.referrer ? new URL(document.referrer) : null;
    } catch {
      referrer = null;
    }

    if (referrer?.origin === window.location.origin && referrer.pathname === '/projects/') {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.history.back();
      });
    }
  });
});

/* ── Article Page Reading Progress & Active TOC Section Observer ── */
document.addEventListener("DOMContentLoaded", () => {
  const articleBody = document.querySelector(".article-body");
  const tocLinks = document.querySelectorAll(".article-toc a");
  const progressPercentEl = document.querySelector("[data-read-percentage]");
  const progressBarEl = document.querySelector("[data-read-progress-bar]");

  if (articleBody) {
    const updateReadingProgress = () => {
      const rect = articleBody.getBoundingClientRect();
      const totalHeight = articleBody.clientHeight;
      const windowHeight = window.innerHeight;

      const scrollableDistance = totalHeight - windowHeight + 120;
      const currentScroll = Math.max(0, -rect.top + 100);

      let percentage = 0;
      if (scrollableDistance > 0) {
        percentage = Math.min(100, Math.max(0, Math.round((currentScroll / scrollableDistance) * 100)));
      } else if (rect.top <= 100) {
        percentage = 100;
      }

      if (progressPercentEl) {
        progressPercentEl.textContent = `${percentage}% read`;
      }
      if (progressBarEl) {
        progressBarEl.style.width = `${percentage}%`;
      }
    };

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    updateReadingProgress();
  }

  const articleHeadings = [...document.querySelectorAll(".article-body h2[id]")];
  if (articleHeadings.length > 0 && tocLinks.length > 0) {
    const updateActiveToc = () => {
      const scrollPosition = window.scrollY + 180;
      let currentHeadingId = "";

      for (let i = 0; i < articleHeadings.length; i++) {
        const heading = articleHeadings[i];
        if (heading.offsetTop <= scrollPosition) {
          currentHeadingId = heading.getAttribute("id");
        } else {
          break;
        }
      }

      if (!currentHeadingId && articleHeadings[0]) {
        currentHeadingId = articleHeadings[0].getAttribute("id");
      }

      tocLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const isMatch = href === `#${currentHeadingId}`;
        link.classList.toggle("is-active", isMatch);
      });
    };

    window.addEventListener("scroll", updateActiveToc, { passive: true });
    updateActiveToc();
  }
});
