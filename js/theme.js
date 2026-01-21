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

  const trigger = document.getElementById("themeTrigger");
  if (select && trigger) {
    const sheet = document.createElement("div");
    sheet.className = "theme-sheet";
    sheet.setAttribute("aria-hidden", "true");
    sheet.innerHTML = `
      <div class="theme-sheet-backdrop" data-action="closeTheme"></div>
      <div class="theme-sheet-panel" role="dialog" aria-modal="true" aria-label="Choose theme">
        <div class="theme-sheet-head">
          <div class="runner-title">Choose theme</div>
          <button class="btn secondary" type="button" data-action="closeTheme">Close</button>
        </div>
        <div class="theme-sheet-list" id="themeSheetList"></div>
      </div>
    `;
    document.body.appendChild(sheet);

    const openSheet = () => {
      sheet.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      renderOptions();
    };
    const closeSheet = () => {
      sheet.classList.remove("is-open");
      sheet.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    };

    const renderOptions = () => {
      const list = sheet.querySelector("#themeSheetList");
      const options = Array.from(select.options).map((opt) => ({
        value: opt.value,
        label: opt.textContent || opt.value,
      }));
      list.innerHTML = options.map((opt) => `
        <button class="theme-option ${opt.value === select.value ? "is-active" : ""}" type="button" data-value="${opt.value}">
          ${opt.label}
        </button>
      `).join("");
    };

    trigger.addEventListener("click", openSheet);
    sheet.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("[data-action=\"closeTheme\"]");
      if (closeBtn) {
        closeSheet();
        return;
      }
      const optionBtn = e.target.closest("[data-value]");
      if (optionBtn) {
        const value = optionBtn.getAttribute("data-value");
        select.value = value;
        applyTheme(value);
        renderOptions();
      }
    });
  }

  // Header sizing is handled by CSS for mobile; no scroll collapse.
})();
