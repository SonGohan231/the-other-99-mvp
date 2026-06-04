import { createContext, useContext, useState, type ReactNode } from 'react';
import { Lang, getLang, setLangStorage, translations, Translations } from '../i18n';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang);
  function setLang(l: Lang) { setLangState(l); setLangStorage(l); }
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT(): Translations { return useContext(LangContext).t; }
export function useLang(): [Lang, (l: Lang) => void] {
  const { lang, setLang } = useContext(LangContext);
  return [lang, setLang];
}
