import type { Dictionary } from './en';

/**
 * Typed as `Dictionary`, so a key missing here — or a key removed from English
 * and left behind here — fails the build rather than rendering an empty span.
 *
 * Product nouns stay in Latin script on purpose: "SitNext" is a name, and
 * transliterating a brand is how brands stop being recognisable. Devanagari
 * numerals are not used either, because the site shows prices and counts from
 * the same data in both languages.
 */
export const hi: Dictionary = {
  nav: {
    businesses: 'जगहें खोजें',
    dinners: 'डिनर',
    howItWorks: 'यह कैसे काम करता है',
    pricing: 'सदस्यता',
  },
  header: {
    search: 'व्यवसाय खोजें',
    signIn: 'साइन इन',
    join: 'डिनर में शामिल हों',
    openMenu: 'मेन्यू खोलें',
    closeMenu: 'मेन्यू बंद करें',
    themeToLight: 'लाइट थीम पर जाएँ',
    themeToDark: 'डार्क थीम पर जाएँ',
    paletteLabel: 'रंग थीम चुनें',
    paletteHeading: 'रंग',
    languageLabel: 'भाषा बदलें',
    languageHeading: 'भाषा',
  },
  drawer: {
    signedInAs: 'इस रूप में साइन इन',
    profile: 'आपकी प्रोफ़ाइल',
    saved: 'सहेजी गई जगहें',
    bookings: 'आपके डिनर',
    signOut: 'साइन आउट',
  },
  hero: {
    badge: 'हर बुधवार, रात 8:00 बजे — {count} शहरों में',
    titleTop: 'पाँच अजनबियों से मिलिए।',
    titleBottom: 'अपना शहर खोजिए।',
    lede:
      'SitNext दो काम ढंग से करता है। यह बताता है कि आस-पास की कौन-सी जगहें वाकई आपके पैसे के लायक हैं — समीक्षाएँ उन्हीं की जो वहाँ गए — और यह आपको पाँच ऐसे अजनबियों के साथ एक मेज़ पर बिठाता है जो शायद आपको पसंद आएँ।',
    primaryCta: 'इस बुधवार की सीट बुक करें',
    secondaryCta: '{count} जगहें देखें',
    seatsFilled: '18,400+ सीटें',
    seatsFilledSuffix: 'अब तक भरी जा चुकी हैं।',
  },
  heroSearch: {
    title: 'आज रात आप क्या ढूँढ़ रहे हैं?',
    subtitle: '{count}+ समीक्षित जगहें खोजें, या किसी श्रेणी से शुरू करें।',
    termPlaceholder: 'टाकोस, नाई, पिलाटे…',
    anywhere: 'कहीं भी',
    submit: 'SitNext पर खोजें',
    },
  directory: {
    title: 'डायरेक्टरी',
    subtitle: '{count} जगहें, उन लोगों की समीक्षाओं के साथ जो सचमुच वहाँ गए।',
    searchPlaceholder: 'जगहें, खाना, सेवाएँ खोजें…',
    filters: 'फ़िल्टर',
  },
  cta: {
    title: 'आपका अगला बुधवार पहले से तय है।',
    body:
      'छह सवाल, एक मेज़, और मौसम पर कोई बेमतलब बातचीत नहीं। या आज रात के खाने के लिए बस कोई बढ़िया जगह ढूँढ़ लीजिए — शुरुआत में दोनों मुफ़्त हैं।',
    primary: 'अपना खाता बनाएँ',
    secondary: 'पहले जगहें देखें',
  },
  chat: {
    open: 'SitNext सहायक से पूछें',
    close: 'सहायक बंद करें',
    title: 'SitNext से पूछें',
    subtitleLive: 'जगहें, डिनर, और यह सब कैसे चलता है',
    subtitleDemo: 'डेमो मोड — उत्तर डायरेक्टरी से, AI से नहीं',
    intro: 'मैं डायरेक्टरी खोज सकता हूँ, बता सकता हूँ कि क्या खुला है, और समझा सकता हूँ कि डिनर कैसे होते हैं। पूछिए।',
    placeholder: 'किसी जगह या डिनर के बारे में पूछें…',
    inputLabel: 'आपका सवाल',
    send: 'भेजें',
    reset: 'नई बातचीत शुरू करें',
    opener1: 'आज रात लंदन में खाने की कोई जगह',
    opener2: 'बुधवार के डिनर कैसे होते हैं?',
    opener3: 'सदस्यता का खर्च कितना है?',
    opener4: 'बेंगलुरु की सबसे बढ़िया कॉफ़ी',
  },
  footer: {
    rights: 'सर्वाधिकार सुरक्षित।',
  },
  common: {
    skipToContent: 'सामग्री पर जाएँ',
  },
};
