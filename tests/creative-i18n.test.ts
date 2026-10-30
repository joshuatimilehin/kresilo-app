import { describe, expect, it } from "vitest";
import {
  dirOf,
  formatDate,
  formatNumber,
  isLocale,
  locales,
  messages,
  pickLocale,
  translate,
  type MessageKey,
} from "../src/creative/i18n";

const keys = Object.keys(messages.en) as MessageKey[];
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("languages", () => {
  it("offers English, one other left-to-right language and one right-to-left language", () => {
    expect(locales.map((l) => l.code)).toEqual(["en", "es", "ar"]);
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("es")).toBe("ltr");
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("picks the best browser language and falls back to English", () => {
    expect(pickLocale(["ar-EG", "en"])).toBe("ar");
    expect(pickLocale(["fr-FR", "es-MX"])).toBe("es");
    expect(pickLocale(["de", "fr"])).toBe("en");
    expect(pickLocale([])).toBe("en");
  });
});

describe("messages", () => {
  it("has every message in every language, none empty, with the same placeholders", () => {
    for (const locale of locales.map((l) => l.code)) {
      for (const key of keys) {
        const text = messages[locale][key];
        expect(text, `${locale}.${key}`).toBeTruthy();
        expect(placeholders(text), `${locale}.${key}`).toEqual(placeholders(messages.en[key]));
      }
      expect(Object.keys(messages[locale]).sort()).toEqual([...keys].sort());
    }
  });

  it("actually translates: no non-English message equals its English one, apart from shared words", () => {
    const same = keys.filter((k) => messages.es[k] === messages.en[k]);
    expect(same).toEqual([]);
    expect(keys.filter((k) => messages.ar[k] === messages.en[k])).toEqual([]);
    expect(messages.ar["nav.explore"]).toMatch(/[؀-ۿ]/);
  });

  it("says in every language that the translation is machine-assisted", () => {
    expect(messages.en["lang.note"]).toMatch(/machine-assisted/);
    expect(messages.es["lang.note"]).toMatch(/máquina/);
    expect(messages.ar["lang.note"]).toMatch(/الآلة/);
  });

  it("translates, fills placeholders and falls back to English for an unknown locale", () => {
    expect(translate("es", "nav.explore")).toBe("Explorar");
    expect(translate("xx" as never, "nav.explore")).toBe("Explore");
    expect(translate("en", "nav.explore", { unused: 1 })).toBe("Explore");
  });
});

describe("locale formatting", () => {
  it("formats dates and numbers per locale", () => {
    expect(formatDate("en", "2026-10-22T20:21:00Z")).not.toBe(formatDate("ar", "2026-10-22T20:21:00Z"));
    expect(formatNumber("en", 1234.5)).toBe("1,234.5");
    expect(formatNumber("ar", 12)).toMatch(/[٠-٩]|12/);
  });
});
