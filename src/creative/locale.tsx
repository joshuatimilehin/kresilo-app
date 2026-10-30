import { toast } from "sonner";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  dirOf,
  formatDate,
  isLocale,
  locales,
  pickLocale,
  translate,
  type Locale,
  type MessageKey,
} from "./i18n";

const KEY = "kresilo-locale";

function initial(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage can be blocked; fall through to the browser's languages */
  }
  return typeof navigator === "undefined" ? DEFAULT_LOCALE : pickLocale(navigator.languages ?? [navigator.language]);
}

type Value = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  date: (iso: string) => string;
};
const Context = createContext<Value>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
  date: (iso) => formatDate(DEFAULT_LOCALE, iso),
});

/** Holds the interface language and sets `lang` and `dir` on the page so reading order and mirroring follow it. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* the choice still applies for this visit */
    }
  }, []);
  const value = useMemo<Value>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      date: (iso) => formatDate(locale, iso),
    }),
    [locale, setLocale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useContext(Context);

/** A small language picker. It says plainly that translations are machine-assisted. */
export function LanguageSwitch() {
  const { locale, setLocale, t } = useT();
  return (
    <div className="language-switch">
      <label>
        <span className="visually-hidden">{t("lang.label")}</span>
        <select
          value={locale}
          aria-label={t("lang.label")}
          aria-describedby="language-note"
          onChange={(e) => {
            const next = e.target.value;
            if (!isLocale(next)) return;
            setLocale(next);
            if (next !== "en") toast.message(translate(next, "lang.note"), { duration: 8000 });
          }}
        >
          {locales.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <small id="language-note" hidden={locale === "en"}>
        {t("lang.note")}
      </small>
    </div>
  );
}
