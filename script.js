const root = document.documentElement;
const header = document.getElementById("siteHeader");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const yearEl = document.getElementById("year");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");

const navLinks = navMenu
  ? Array.from(navMenu.querySelectorAll("a")).filter((link) => link.hash)
  : [];

/* ---------- Mobile navigation ---------- */

function closeMenu() {
  if (!navMenu || !navToggle) return;
  navMenu.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("open")) return;
    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

/* ---------- Scroll state (single throttled listener) ---------- */

const sections = Array.from(document.querySelectorAll("main section[id]"));
let lastScrollY = window.scrollY;
let ticking = false;

function updateHeader(y) {
  header.classList.toggle("scrolled", y > 8);
}

function updateActiveSection() {
  const marker = window.innerHeight * 0.35;
  let currentId = "";

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) currentId = section.id;
  });

  navLinks.forEach((link) => {
    const isActive = link.hash === `#${currentId}`;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function onScroll() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const y = window.scrollY;

    if (y !== lastScrollY) {
      root.dataset.scrollDirection = y > lastScrollY ? "down" : "up";
      lastScrollY = y;
    }

    updateHeader(y);
    updateActiveSection();
    ticking = false;
  });
}

updateHeader(lastScrollY);
updateActiveSection();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

/* ---------- Reveal on scroll (replays in both directions) ---------- */

const revealEls = Array.from(document.querySelectorAll(".reveal"));

document.querySelectorAll("[data-stagger]").forEach((group) => {
  Array.from(group.children).forEach((child, index) => {
    if (child.classList.contains("reveal")) {
      child.style.setProperty("--reveal-delay", `${index * 90}ms`);
    }
  });
});

let hasRevealed = false;

function showAllReveals() {
  revealEls.forEach((el) => el.classList.add("visible"));
  hasRevealed = true;
}

root.classList.add("reveal-active");

if (reduceMotion.matches || !("IntersectionObserver" in window)) {
  showAllReveals();
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          hasRevealed = true;
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    { threshold: 0 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  function revealInView() {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        el.classList.add("visible");
        hasRevealed = true;
      }
    });
  }

  window.addEventListener("load", revealInView);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) revealInView();
  });

  window.setTimeout(() => {
    if (!hasRevealed) showAllReveals();
  }, 2200);

  reduceMotion.addEventListener("change", (event) => {
    if (event.matches) showAllReveals();
  });
}

/* ---------- Hero parallax glow ---------- */

const hero = document.querySelector(".hero");
const panel = document.getElementById("heroPanel");

if (hero && panel) {
  let frame = null;
  let targetX = 0;
  let targetY = 0;

  hero.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reduceMotion.matches) return;

    const rect = hero.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 30;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 30;

    if (!frame) {
      frame = requestAnimationFrame(() => {
        panel.style.setProperty("--gx", `${targetX.toFixed(1)}px`);
        panel.style.setProperty("--gy", `${targetY.toFixed(1)}px`);
        frame = null;
      });
    }
  });

  hero.addEventListener("pointerleave", () => {
    panel.style.setProperty("--gx", "0px");
    panel.style.setProperty("--gy", "0px");
  });
}

if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Email dialog ---------- */

const mailDialog = document.getElementById("mailDialog");

if (mailDialog) {
  const emailAddress = "karthickanandan224@gmail.com";
  const mailSubject = "Portfolio enquiry";
  const mailBody =
    "Hi Karthick,\n\nI came across your portfolio and would like to get in touch.\n\n";
  const gmailLink = document.getElementById("mailGmail");
  const mailAppLink = document.getElementById("mailApp");
  const copyButton = document.getElementById("mailCopy");
  const statusEl = document.getElementById("mailStatus");
  const closeButtons = mailDialog.querySelectorAll("[data-mail-close]");
  const focusableSelector = "a[href], button:not([disabled])";
  let lastFocused = null;
  let copyTimer = null;

  gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    emailAddress
  )}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
  mailAppLink.href = `mailto:${emailAddress}?subject=${encodeURIComponent(
    mailSubject
  )}&body=${encodeURIComponent(mailBody)}`;

  function lockScroll() {
    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    root.classList.add("mail-open");
  }

  function unlockScroll() {
    root.classList.remove("mail-open");
    document.body.style.paddingRight = "";
  }

  function openMailDialog(trigger) {
    lastFocused = trigger || document.activeElement;
    statusEl.textContent = "";
    copyButton.textContent = "Copy email address";
    mailDialog.hidden = false;
    lockScroll();
    gmailLink.focus();
  }

  function closeMailDialog() {
    mailDialog.hidden = true;
    unlockScroll();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    lastFocused = null;
  }

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    if (mailDialog.contains(link)) return;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openMailDialog(link);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeMailDialog);
  });

  mailDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMailDialog();
      return;
    }

    if (event.key !== "Tab") return;

    const focusables = Array.from(
      mailDialog.querySelectorAll(focusableSelector)
    ).filter((el) => el.offsetParent !== null);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(emailAddress);
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = emailAddress;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    statusEl.textContent = "Email address copied to clipboard.";
    copyButton.textContent = "Copied!";
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      copyButton.textContent = "Copy email address";
    }, 2200);
  }

  copyButton.addEventListener("click", copyEmail);
}
