/**
 * English is the source of truth: `Dictionary` is derived from this object, so
 * every other language must supply exactly these keys or the build fails. A
 * missing translation is a type error rather than a blank space on the page.
 */
export const en = {
  nav: {
    businesses: 'Discover places',
    dinners: 'Dinners',
    howItWorks: 'How it works',
    pricing: 'Membership',
  },
  header: {
    search: 'Search businesses',
    signIn: 'Sign in',
    join: 'Join a dinner',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    paletteLabel: 'Choose a colour theme',
    paletteHeading: 'Colour',
    languageLabel: 'Change language',
    languageHeading: 'Language',
  },
  drawer: {
    signedInAs: 'Signed in as',
    profile: 'Your profile',
    saved: 'Saved places',
    bookings: 'Your dinners',
    signOut: 'Sign out',
  },
  hero: {
    badge: 'Every Wednesday, 8:00 PM — in {count} cities',
    titleTop: 'Meet five strangers.',
    titleBottom: 'Find your city.',
    lede:
      'VibeClub does two things properly. It tells you which local places are actually worth your money — reviewed by people who went — and it seats you at a table with five strangers you would probably like.',
    primaryCta: 'Book a seat this Wednesday',
    secondaryCta: 'Explore {count} places',
    seatsFilled: '18,400+ seats',
    seatsFilledSuffix: 'filled since we started.',
  },
  heroSearch: {
    title: 'What are you looking for tonight?',
    subtitle: 'Search {count}+ reviewed places, or start with a category.',
    termPlaceholder: 'Tacos, barbers, pilates…',
    anywhere: 'Anywhere',
    submit: 'Search VibeClub',
  },
  directory: {
    title: 'The directory',
    subtitle: '{count} places reviewed by people who actually went.',
    searchPlaceholder: 'Search places, food, services…',
    filters: 'Filters',
  },
  cta: {
    title: 'Your next Wednesday is already booked.',
    body:
      'Six questions, one table, zero small talk about the weather. Or just find somewhere brilliant for dinner tonight — both are on the house to start.',
    primary: 'Create your account',
    secondary: 'Browse places first',
  },
  chat: {
    open: 'Ask the VibeClub assistant',
    close: 'Close the assistant',
    title: 'Ask VibeClub',
    subtitleLive: 'Places, dinners and how it all works',
    subtitleDemo: 'Demo mode — answers from the directory, not the AI',
    intro: 'I can search the directory, check what is open, and explain how the dinners work. Ask away.',
    placeholder: 'Ask about a place or a dinner…',
    inputLabel: 'Your question',
    send: 'Send',
    reset: 'Start a new conversation',
    opener1: 'Somewhere for dinner in London tonight',
    opener2: 'How do the Wednesday dinners work?',
    opener3: 'What does membership cost?',
    opener4: 'Best-rated coffee in Bengaluru',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  common: {
    skipToContent: 'Skip to content',
  },
  // No `as const`: with it, every value becomes its own literal type and the
  // Hindi file would have to equal the English strings to typecheck. Widened,
  // the shape is still enforced — every key, no extras — while the values are
  // free to differ.
};

export type Dictionary = typeof en;
