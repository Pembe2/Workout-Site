(() => {
  const select = document.getElementById("themeSelect");
  if (!select) {
    return;
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

  applyTheme(initial);
  select.value = initial;

  select.addEventListener("change", () => {
    applyTheme(select.value);
  });
})();
