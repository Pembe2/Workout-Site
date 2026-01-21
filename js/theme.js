(() => {
  const select = document.getElementById("themeSelect");
  if (!select) {
    // Still want header shrink behavior even if theme selector is missing.
  }

  const root = document.documentElement;
  const storage = (() => {
    try {
      const key = "__theme_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return localStorage;
    } catch (err) {
      return null;
    }
  })();

  let saved = null;
  if (storage) {
    try {
      saved = storage.getItem("theme");
    } catch (err) {
      saved = null;
    }
  }

  const initial = saved || root.dataset.theme || "sunlit";

  const applyTheme = (value) => {
    root.dataset.theme = value;
    if (storage) {
      try {
        storage.setItem("theme", value);
      } catch (err) {
        // Ignore storage errors (private mode / file:// restrictions).
      }
    }
  };

  if (select) {
    applyTheme(initial);
    select.value = initial;
  }

  if (select) {
    select.addEventListener("change", () => {
      applyTheme(select.value);
    });
  }

  const topbar = document.querySelector(".topbar");
  let isCompact = false;
  const onScroll = () => {
    if (!topbar) return;
    const y = window.scrollY;
    if (!isCompact && y > 140) {
      isCompact = true;
      topbar.classList.add("compact");
      return;
    }
    if (isCompact && y < 60) {
      isCompact = false;
      topbar.classList.remove("compact");
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
