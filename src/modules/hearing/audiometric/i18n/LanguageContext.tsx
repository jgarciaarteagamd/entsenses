// Adapter: AudiometricReport components call useTranslations(); here the language comes from
// ENT Senses' language selector (es / en).
import es from './es';
import en from './en';
import { useLang } from '@/lib/i18n';

const DATA: Record<string, unknown> = { es, en };

function lookup(dict: unknown, keys: string[]): unknown {
  let r: unknown = dict;
  for (const k of keys) {
    if (r && typeof r === 'object' && k in (r as Record<string, unknown>)) r = (r as Record<string, unknown>)[k];
    else return undefined;
  }
  return r;
}

export const useTranslations = () => {
  const { lang, setLang } = useLang();
  const translations = DATA[lang] ?? DATA.en;
  const t = (key: string): string => {
    if (!key) return '';
    const keys = key.split('.');
    const v = lookup(translations, keys);
    if (typeof v === 'string') return v;
    const fb = lookup(DATA.en, keys);
    return typeof fb === 'string' ? fb : key;
  };
  const t_html = (key: string): { __html: string } => ({ __html: t(key) });
  return { t, t_html, language: lang as string, setLanguage: (l: string) => setLang(l === 'en' ? 'en' : 'es'), translations };
};
