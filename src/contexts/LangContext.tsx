import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import en from "@/component/i189/en.json";
import hi from "@/component/i189/hi.json";
import mr from "@/component/i189/mr.json";

export type Language = "en" | "hi" | "mr";

const translations: Record<Language, typeof en> = { en, hi, mr };

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof en;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("agri_lang") as Language;
    return stored && ["en", "hi", "mr"].includes(stored) ? stored : "mr";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("agri_lang", l);
  }, []);

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

