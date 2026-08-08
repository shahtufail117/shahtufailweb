/* ============================================================
   script.js — shared site behaviour
   Loaded by index.html, blog.html and generated article pages.
   ============================================================ */

/* ----------------------------------------------------------
   SECTION 1 — Scroll reveal (IntersectionObserver)
   ---------------------------------------------------------- */
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.1 }
  );

  document
    .querySelectorAll(".fade-up, .fade-in")
    .forEach((el) => observer.observe(el));
})();

/* ----------------------------------------------------------
   SECTION 2 — Mobile menu / drawer
   ---------------------------------------------------------- */
(function () {
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  if (!menuBtn || !navLinks) return;

  const closeMenu = () => {
    navLinks.classList.remove("open");
    menuBtn.classList.remove("open");
    document.body.classList.remove("menu-open");
  };

  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  });

  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  document.addEventListener("click", (e) => {
    if (
      navLinks.classList.contains("open") &&
      !e.target.closest("#navLinks") &&
      !e.target.closest("#menuBtn")
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
})();

/* ----------------------------------------------------------
   SECTION 3 — Scroll-spy nav + back-to-top visibility
   ---------------------------------------------------------- */
(function () {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.getElementById("navLinks");
  const backBtn = document.getElementById("backToTop");

  let sectionOffsets = [];
  let resizeTimer;

  const measureSections = () => {
    sectionOffsets = Array.from(sections, (s) => s.offsetTop - 150);
  };

  measureSections();
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureSections, 100);
  });

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    let current = "";

    for (let i = 0; i < sections.length; i++) {
      if (y >= sectionOffsets[i]) current = sections[i].getAttribute("id");
    }

    if (navLinks) {
      navLinks.querySelectorAll("a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + current);
      });
    }

    if (backBtn) backBtn.classList.toggle("show", y > 400);
  });
})();

/* ----------------------------------------------------------
   SECTION 4 — Contact form (FormSpree)
   Guarded: only binds when the form exists on the page.
   ---------------------------------------------------------- */
(function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const status = document.getElementById("formStatus");
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;

    fetch(this.action, {
      method: "POST",
      body: new FormData(this),
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        return res.text().then((text) => {
          if (!res.ok) {
            let msg = "HTTP " + res.status;
            try {
              const json = JSON.parse(text);
              if (json.error) msg += ": " + json.error;
              else if (json.errors) msg += ": " + String(json.errors).replace(/,/g, ", ");
            } catch (e) {
              /* ignore parse errors */
            }
            throw new Error(msg);
          }
          return text ? JSON.parse(text) : {};
        });
      })
      .then(() => {
        status.textContent = "Thank you! Your message has been sent.";
        status.style.color = "#22c55e";
        status.style.display = "block";
        this.reset();
      })
      .catch((err) => {
        if (err.message && err.message.indexOf("HTTP ") === 0) {
          status.textContent =
            "FormSpree: " + err.message + ". Check your form settings.";
          status.style.color = "#ef4444";
          status.style.display = "block";
          btn.disabled = false;
        } else {
          status.textContent =
            "Opening FormSpree to finish sending your message...";
          status.style.display = "block";
          setTimeout(() => this.submit(), 500);
        }
      });

    setTimeout(() => {
      status.style.display = "none";
    }, 8000);
  });
})();

/* ----------------------------------------------------------
   SECTION 5 — Portfolio filter
   ---------------------------------------------------------- */
(function () {
  const filterBtns = document.querySelectorAll(".portfolio-filter button");
  const portfolioCards = document.querySelectorAll(".portfolio-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      portfolioCards.forEach((card) => {
        card.classList.toggle("hide", card.dataset.category !== filter);
      });
    });
  });

  document.querySelector(".portfolio-filter .active")?.click();
})();

/* ----------------------------------------------------------
   SECTION 6 — Theme toggle (light/dark) synced across pages
   Persists via localStorage + cookie fallback; live-syncs open tabs.
   ---------------------------------------------------------- */
(function () {
  const themeBtn = document.getElementById("themeToggle");
  if (!themeBtn) return;

  const getStoredTheme = () => {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;

    const cookie = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
    return cookie ? cookie[1] : null;
  };

  const setStoredTheme = (value) => {
    try {
      localStorage.setItem("theme", value);
    } catch (e) {
      /* storage may be unavailable (e.g. file://) */
    }
    document.cookie = "theme=" + value + ";path=/;max-age=31536000;samesite=lax";
  };

  const applyTheme = (isLight) => {
    document.body.classList.toggle("light", isLight);
    themeBtn.textContent = isLight ? "\u2600" : "\u263E";
  };

  const syncTheme = () => {
    applyTheme(getStoredTheme() === "light");
  };

  syncTheme();
  themeBtn.addEventListener("click", () => {
    const isLight = !document.body.classList.contains("light");
    applyTheme(isLight);
    setStoredTheme(isLight ? "light" : "dark");
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "theme") syncTheme();
  });
})();

/* ----------------------------------------------------------
   SECTION 7 — Portfolio modals & back-to-top
   ---------------------------------------------------------- */
(function () {
  document.querySelectorAll(".portfolio-card").forEach((card) => {
    card.addEventListener("click", () => {
      const modalId = card.getAttribute("data-modal");
      if (modalId) document.getElementById(modalId)?.showModal();
    });
  });

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog")?.close());
  });

  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      const rect = dlg.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) dlg.close();
    });
  });

  const backBtn = document.getElementById("backToTop");
  if (backBtn) {
    backBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }
})();

/* ----------------------------------------------------------
   SECTION 8 — Smooth scroll for same-page anchors
   (closes the mobile drawer first when applicable)
   ---------------------------------------------------------- */
(function () {
  const navLinks = document.getElementById("navLinks");

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      if (!id || !document.getElementById(id)) return;

      if (document.body.classList.contains("menu-open") && navLinks) {
        e.preventDefault();
        navLinks.classList.remove("open");
        document.body.classList.remove("menu-open");
        setTimeout(() => {
          document
            .getElementById(id)
            .scrollIntoView({ behavior: "smooth", block: "start" });
        }, 320);
      }
    });
  });
})();

/* ----------------------------------------------------------
   SECTION 9 — Blog listing filter (blog.html)
   ---------------------------------------------------------- */
(function () {
  const filterBtns = document.querySelectorAll(".blog-filter button");
  const blogCards = document.querySelectorAll(".blog-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      blogCards.forEach((card) => {
        card.classList.toggle(
          "hide",
          filter !== "all" && card.dataset.category !== filter
        );
      });
    });
  });
})();

/* ----------------------------------------------------------
   SECTION 10 — GTM consent banner (auto-dismisses after 10s)
   ---------------------------------------------------------- */
(function () {
  const banner = document.createElement("div");
  banner.className = "gtm-banner";
  banner.innerHTML =
    "<span>This site uses Google Tag to improve your experience.</span>" +
    '<button class="gtm-banner-ok" type="button">OK</button>';

  const dismiss = () => {
    banner.classList.add("hide");
    setTimeout(() => banner.remove(), 500);
  };

  banner.querySelector(".gtm-banner-ok").addEventListener("click", dismiss);
  document.body.appendChild(banner);
  setTimeout(dismiss, 10000);
})();