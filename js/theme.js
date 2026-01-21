(() => {
  const select = document.getElementById("themeSelect");
  if (!select) {
    return;
  }

  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const initial = saved || root.dataset.theme || "sunlit";

  const applyTheme = (value) => {
    root.dataset.theme = value;
    localStorage.setItem("theme", value);
  };

  applyTheme(initial);
  select.value = initial;

  select.addEventListener("change", () => {
    applyTheme(select.value);
  });
})();
