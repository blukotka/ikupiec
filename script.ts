type StyleEntry = {
  name: string;
  file: string;
};
const styles: StyleEntry[] = [
  { name: "Styl domyślny - niebieski", file: "/style-1.css" },
  { name: "Styl różowy", file: "/style-2.css" },
 { name: "Styl pomarańczowy", file: "/style-3.css" }
];

const STYLE_LINK_ID = "dynamic-style-link";
let currentLinkElement: HTMLLinkElement | null = null;

function createOrReplaceStyle(file: string) {
  const oldLink = document.getElementById(STYLE_LINK_ID);
  if (oldLink) oldLink.remove();

  const link = document.createElement("link");
  link.id = STYLE_LINK_ID;
  link.rel = "stylesheet";
  link.href = file;

  document.head.appendChild(link);
  currentLinkElement = link;
}
function renderStyleLinks(containerId = "style-links") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ""; 

  styles.forEach((style, index) => {
    const btn = document.createElement("button");
    btn.textContent = style.name;
    btn.dataset.index = String(index);
    btn.style.padding = "10px 15px";
    btn.style.borderRadius = "10px";
    btn.style.margin = "5px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => changeStyle(index));

    container.appendChild(btn);
  });
}
function changeStyle(index: number) {
  const style = styles[index];
  if (!style) return;

  createOrReplaceStyle(style.file);
  localStorage.setItem("selected-style", style.file);
}
function loadInitialStyle() {
  const saved = localStorage.getItem("selected-style");
  const selected = styles.find(s => s.file === saved) ?? styles[0];
  createOrReplaceStyle(selected.file);
}
document.addEventListener("DOMContentLoaded", () => {
  loadInitialStyle();
  renderStyleLinks("style-links");
});
