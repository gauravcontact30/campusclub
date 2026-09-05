/**
 * English is the source of truth: `Dictionary` is derived from this object, so
 * every other language must supply exactly these keys or the build fails. A
 * missing translation is a type error rather than a blank space on the page.
 */
export const en = {
  nav: {
    meetups: 'Find a meetup',
    cities: 'Cities',
    passes: 'Passes',
    host: 'Host one',
    howItWorks: 'How it works',
  },
  header: {
    signIn: 'Sign in',
    join: 'Join CampusClub',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    paletteLabel: 'Choose a colour theme',
    paletteHeading: 'Colour',
    languageLabel: 'Change language',
    languageHeading: 'Language',
    appearanceHeading: 'Appearance',
    preferencesLabel: 'Language, theme and colour',
  },
  menu: {
    myMeetups: 'Your meetups',
    saved: 'Saved meetups',
    host: 'Host a meetup',
    pass: 'Your pass',
    profile: 'Profile & settings',
    superAdmin: 'Super Admin',
    signOut: 'Sign out',
  },
  drawer: {
    signedInAs: 'Signed in as',
    profile: 'Your profile',
    saved: 'Saved meetups',
    myMeetups: 'Your meetups',
    signOut: 'Sign out',
  },
  hero: {
    badge: '{count} meetups happening across {cities} cities',
    titleTop: 'Nobody does it',
    titleBottom: 'alone.',
    lede:
      'Study, train, eat, play — with people who live twenty minutes away. Browse what is on near you, pay that meetup’s join fee, turn up. No membership required to start.',
    primaryCta: 'Find a meetup near you',
    secondaryCta: 'Host your own',
    statJoins: '41,200 joins',
    statJoinsSuffix: 'paid for since we started.',
    categoriesHeading: 'Or just pick what you’re into.',
  },
  heroSearch: {
    title: 'What do you want to do this week?',
    subtitle: 'Search {count} upcoming meetups, or start with a category.',
    termPlaceholder: 'Study, badminton, 6am run…',
    anywhere: 'Any city',
    submit: 'Search',
  },
  browse: {
    title: 'What’s on',
    subtitle: '{count} meetups you can join right now.',
    searchPlaceholder: 'Search meetups, venues, areas…',
    filters: 'Filters',
    clear: 'Clear all',
    noResults: 'Nothing matches those filters',
    noResultsBody: 'Try widening the time window, or clearing the category — the board changes every day.',
  },
  meetup: {
    spotsLeft: '{count} spots left',
    oneSpotLeft: '1 spot left',
    full: 'Full',
    joinFor: 'Join for {fee}',
    joinFree: 'Join — free',
    joinWaitlist: 'Join the waitlist',
    joined: 'You’re going',
    waitlisted: 'You’re on the waitlist',
    hosting: 'You’re hosting this',
    signInToJoin: 'Sign in to join',
    hostedBy: 'Hosted by {name}',
    whatHappens: 'What happens',
    bring: 'Bring',
    where: 'Where',
    feedback: 'How it went',
    cancelFree: 'Free cancellation until {hours} hours before.',
  },
  cta: {
    title: 'The hardest part is going the first time.',
    body: 'Pick one thing this week. Pay for that one thing. If it is not for you, you are out ₹149 and an evening — and if it is, you have found your people.',
    primary: 'Create your account',
    secondary: 'Look at what’s on first',
  },
  chat: {
    open: 'Ask the CampusClub assistant',
    close: 'Close the assistant',
    title: 'Ask CampusClub',
    subtitleLive: 'Meetups, join fees and how it all works',
    subtitleDemo: 'Demo mode — answers from the board, not the AI',
    intro: 'I can search what is on near you, check join fees and spots left, and explain how passes work. Ask away.',
    placeholder: 'Ask about a meetup or a fee…',
    inputLabel: 'Your question',
    send: 'Send',
    reset: 'Start a new conversation',
    opener1: 'Study meetups in Bengaluru this week',
    opener2: 'How much does it cost to join?',
    opener3: 'Something to do tomorrow morning',
    opener4: 'How do the passes work?',
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
