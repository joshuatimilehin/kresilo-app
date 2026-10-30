import { useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

function subscribe(onChange: () => void) {
  const system = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onChange);
  window.addEventListener("kresilo-theme-change", onChange);
  system.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("kresilo-theme-change", onChange);
    system.removeEventListener("change", onChange);
  };
}
function snapshot() {
  const saved = localStorage.getItem("kresilo-theme");
  return saved
    ? saved === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
}
export function ThemeToggle({ inline = false }: { inline?: boolean }) {
  const dark = useSyncExternalStore(subscribe, snapshot);
  useLayoutEffect(() => {
    document.documentElement.dataset.kresiloTheme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <button
      className={inline ? "inline-theme-toggle" : "theme-toggle"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      onClick={() => {
        localStorage.setItem("kresilo-theme", dark ? "light" : "dark");
        window.dispatchEvent(new Event("kresilo-theme-change"));
      }}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
