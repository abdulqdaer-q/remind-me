import FastGlob from "fast-glob";
import path from "path";

export interface Translations {
    'welcome-please-send-your-location': string
    'salah': string
    'fajr' :string
    'sunrise': string
    'duhur': string
    'asr': string
    'maghrib': string
    'isha': string
}
export const translate = async (key: keyof Translations, lang: string = 'en') => {
    
    const availableLangs = FastGlob.sync(path.join(__dirname, './*.ts')).reduce<{[key: string]: string | undefined}>((p, v) => ({
        ...p,
        [v.split('/').at(-1)?.split('.').at(0) || 'index']: v,
        
    }), {index: undefined, en: ''});
    delete availableLangs.index;
    
    if (!(lang in availableLangs)) {
        lang = 'en';
    }
    const pt = availableLangs[lang]!
    
    const languageSelector: Translations = new (await import(pt)).default()
    
    return languageSelector?.[key] ?? `key ${key} not exist`
    
}