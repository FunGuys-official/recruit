(function () {
  "use strict";

  const runtimeConfig = window.FUNGUYS_LP_CONFIG || {};
  const CONFIG = {
    googleFormEmbedUrl: runtimeConfig.googleFormEmbedUrl || "",
    lineEntryUrl: runtimeConfig.lineEntryUrl || "",
    lineQrImage: runtimeConfig.lineQrImage || "",
    lineDisplayName: runtimeConfig.lineDisplayName || "FunGuys採用公式LINE",
    lineId: runtimeConfig.lineId || "準備中",
    metaPixelId: runtimeConfig.metaPixelId || ""
  };

  const menuButton = document.querySelector("[data-menu-toggle]");
  const siteMenu = document.getElementById("site-menu");
  const googleFormFrame = document.getElementById("google-form-frame");
  const googleFormOpen = document.getElementById("google-form-open");
  const googleFormFallback = document.getElementById("google-form-fallback");
  const googleFormCard = document.getElementById("google-form-card");
  const lineButtons = document.querySelectorAll(".line-entry-button");
  const lineDisplayName = document.getElementById("line-display-name");
  const lineId = document.getElementById("line-id");
  const lineQrImage = document.getElementById("line-qr-image");
  const lineQrPlaceholder = document.getElementById("line-qr-placeholder");

  function isConfiguredUrl(url) {
    return Boolean(
      url &&
      /^https:\/\/docs\.google\.com\/forms\//.test(url) &&
      url.indexOf("GOOGLE_FORM_ID") === -1
    );
  }

  function initGoogleForm() {
    if (!googleFormFrame) return;

    if (!isConfiguredUrl(CONFIG.googleFormEmbedUrl)) {
      googleFormFrame.hidden = true;
      if (googleFormFallback) googleFormFallback.hidden = false;
      if (googleFormCard) googleFormCard.classList.add("is-missing");
      if (googleFormOpen) googleFormOpen.hidden = true;
      return;
    }

    let ignoreInitialLoad = true;
    googleFormFrame.addEventListener("load", function () {
      if (ignoreInitialLoad) {
        ignoreInitialLoad = false;
        return;
      }
      if (!googleFormCard) return;

      window.setTimeout(function () {
        const headerOffset = 84;
        const formTop = googleFormCard.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({
          top: Math.max(0, formTop),
          behavior: "smooth"
        });
      }, 120);
    });

    googleFormFrame.src = CONFIG.googleFormEmbedUrl;
    if (googleFormOpen) {
      googleFormOpen.href = CONFIG.googleFormEmbedUrl.replace("?embedded=true", "");
    }
  }

  function initLineEntry() {
    if (lineDisplayName) {
      lineDisplayName.textContent = CONFIG.lineDisplayName;
    }
    if (lineId) {
      lineId.textContent = CONFIG.lineId;
    }

    if (CONFIG.lineQrImage && lineQrImage) {
      lineQrImage.src = CONFIG.lineQrImage;
      lineQrImage.hidden = false;
      if (lineQrPlaceholder) lineQrPlaceholder.hidden = true;
    }

    lineButtons.forEach(function (button) {
      if (!CONFIG.lineEntryUrl) {
        button.href = "#line-entry-guide";
        button.setAttribute("aria-disabled", "true");
        button.classList.add("is-disabled");
        return;
      }
      button.href = CONFIG.lineEntryUrl;
      button.target = "_blank";
      button.rel = "noopener";
      button.removeAttribute("aria-disabled");
      button.classList.remove("is-disabled");
    });
  }

  function initMetaPixel() {
    if (!CONFIG.metaPixelId) return;

    window.fbq = window.fbq || function () {
      window.fbq.callMethod
        ? window.fbq.callMethod.apply(window.fbq, arguments)
        : window.fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = window.fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = "2.0";
    window.fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    window.fbq("init", CONFIG.metaPixelId);
    window.fbq("track", "PageView");
  }

  function track(eventName, detail) {
    if (CONFIG.metaPixelId && typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, detail || {});
    }
  }

  function bindClickTracking() {
    document.querySelectorAll("[data-track]").forEach(function (element) {
      element.addEventListener("click", function () {
        track("lp_click", {
          label: element.getAttribute("data-track") || "",
          href: element.getAttribute("href") || ""
        });
      });
    });
  }

  function bindFaqTracking() {
    document.querySelectorAll("details[data-faq]").forEach(function (detailEl) {
      detailEl.addEventListener("toggle", function () {
        track("faq_toggle", {
          label: detailEl.getAttribute("data-faq") || "",
          open: detailEl.open
        });
      });
    });
  }

  function bindHeaderBehavior() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(function () {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (currentY > 120 && delta > 6) {
          header.classList.add("is-hidden");
        } else if (delta < -6 || currentY < 80) {
          header.classList.remove("is-hidden");
        }

        lastY = currentY;
        ticking = false;
      });
    }, { passive: true });
  }

  function bindMobileApplyVisibility() {
    const applySection = document.getElementById("apply");
    const mobileApply = document.querySelector(".mobile-apply");
    if (!applySection || !mobileApply) return;

    let ticking = false;

    function updateVisibility() {
      const applyTop = applySection.getBoundingClientRect().top;
      document.body.classList.toggle("is-apply-section-active", applyTop <= 96);
      ticking = false;
    }

    updateVisibility();

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    }, { passive: true });

    window.addEventListener("resize", updateVisibility);
  }

  function closeMenu() {
    if (!menuButton || !siteMenu) return;
    menuButton.setAttribute("aria-expanded", "false");
    siteMenu.hidden = true;
  }

  function bindMenu() {
    if (!menuButton || !siteMenu) return;

    menuButton.addEventListener("click", function () {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      siteMenu.hidden = isOpen;
    });

    siteMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGoogleForm();
    initLineEntry();
    initMetaPixel();
    bindHeaderBehavior();
    bindMobileApplyVisibility();
    bindMenu();
    bindClickTracking();
    bindFaqTracking();
  });
})();
