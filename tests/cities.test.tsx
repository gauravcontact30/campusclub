import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CITIES, CITY_TIERS, citiesInTier, cityBySlug, tierInfo } from '@/lib/constants';
import { cityGuide, hasGuide } from '@/lib/data/city-guide';
import { cityPhoto } from '@/lib/media/city-photos';
import { CityExplorer } from '@/components/cities/city-explorer';

describe('the city catalogue', () => {
  it('has no duplicate slugs or names', () => {
    const slugs = CITIES.map((c) => c.slug);
    const names = CITIES.map((c) => c.name);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('derives every slug from its name, so /cities/<slug> is guessable', () => {
    for (const city of CITIES) {
      expect(city.slug).toBe(city.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      // The slug is the route segment, so a lookup miss is a 404 on a page we
      // link to ourselves.
      expect(cityBySlug(city.slug)).toBeDefined();
    }
  });

  it('places every city inside India', () => {
    // A transposed or mistyped coordinate would put a "nearest" search in the
    // wrong hemisphere, and nothing else in the app would notice.
    for (const city of CITIES) {
      expect(city.lat, `${city.name} latitude`).toBeGreaterThan(6);
      expect(city.lat, `${city.name} latitude`).toBeLessThan(37);
      expect(city.lng, `${city.name} longitude`).toBeGreaterThan(68);
      expect(city.lng, `${city.name} longitude`).toBeLessThan(98);
    }
  });

  it('gives every city a state and a blurb', () => {
    for (const city of CITIES) {
      expect(city.state.length, `${city.name} state`).toBeGreaterThan(0);
      expect(city.blurb.length, `${city.name} blurb`).toBeGreaterThan(0);
    }
  });

  it('is the eight metros, and they are exactly these eight', () => {
    // The catalogue is the product's coverage claim, so the metro tranche is
    // worth asserting outright rather than inferring: a city promoted to tier 1
    // is a claim that a board there already fills on the day it is posted.
    expect(citiesInTier(1).map((c) => c.name).sort()).toEqual([
      'Ahmedabad',
      'Bengaluru',
      'Chennai',
      'Delhi',
      'Hyderabad',
      'Kolkata',
      'Mumbai',
      'Pune',
    ]);
  });

  it('keeps the two non-metro towns, which are the point', () => {
    expect(citiesInTier(3).map((c) => c.name).sort()).toEqual(['Etawah', 'Mainpuri']);
  });

  it('puts every city on exactly one of the three tiers', () => {
    const tiers = CITY_TIERS.map((t) => t.tier);
    for (const city of CITIES) {
      expect(tiers, `${city.name} tier`).toContain(city.tier);
    }
    // No city may be missed by the filter chips, which partition the catalogue
    // between them — a fourth tier value would silently disappear from /cities.
    const covered = tiers.reduce((sum, tier) => sum + citiesInTier(tier).length, 0);
    expect(covered).toBe(CITIES.length);
  });

  it('is mostly Tier-2, which is the claim the tier field exists to make', () => {
    // The landing page, the directory header and the press kit all count this
    // rather than asserting it in prose. If the Tier-2 tranche ever stops being
    // the largest, those sentences stop being true and this is what says so.
    const tierTwo = citiesInTier(2);
    expect(tierTwo.length).toBeGreaterThan(citiesInTier(1).length);
    expect(tierTwo.length).toBeGreaterThan(citiesInTier(3).length);
  });

  it('names every tier, so a chip is never blank', () => {
    for (const city of CITIES) {
      expect(tierInfo(city.tier).label.length, `${city.name} tier label`).toBeGreaterThan(0);
    }
  });

  it('spreads Tier-2 across the country rather than one region', () => {
    // Twenty-eight cities out of three states would be a regional pilot wearing
    // a national claim.
    const states = new Set(citiesInTier(2).map((c) => c.state));
    expect(states.size).toBeGreaterThanOrEqual(15);
  });

  it('gives every metro and Tier-2 city a photograph and a guide', () => {
    // The card is built around the photograph — without one it draws a grey
    // rectangle with a name on it, which is worse than not listing the city.
    for (const city of [...citiesInTier(1), ...citiesInTier(2)]) {
      expect(cityPhoto(city.slug), `${city.name} photo`).not.toBeNull();
      expect(hasGuide(city.slug), `${city.name} guide`).toBe(true);
    }
  });

  it('credits every photograph it uses', () => {
    // These are freely licensed pictures and attribution is the condition of
    // showing them at all, so a missing credit is a licence breach, not a
    // cosmetic gap.
    for (const city of CITIES) {
      const photo = cityPhoto(city.slug);
      if (!photo) continue;
      expect(photo.artist, `${city.name} artist`).toBeTruthy();
      expect(photo.licence, `${city.name} licence`).toBeTruthy();
      expect(photo.src, `${city.name} file`).toBe(`/cities/${city.slug}.jpg`);
    }
  });

  it('writes guides about real, named things rather than filler', () => {
    for (const city of CITIES) {
      const guide = cityGuide(city.slug);
      for (const [section, items] of Object.entries(guide)) {
        // An empty section is the documented way to say "not written up yet";
        // a *present but empty* one is a half-finished edit.
        expect(items?.length, `${city.name} ${section}`).toBeGreaterThan(0);
        for (const item of items ?? []) {
          expect(item.trim().length, `${city.name} ${section} entry`).toBeGreaterThan(2);
        }
      }
    }
  });
});


describe('CityExplorer', () => {
  const counts = { Bengaluru: 9, Mumbai: 6, Mainpuri: 0 };
  const setup = () => render(<CityExplorer cities={CITIES} counts={counts} />);

  /** One card per city on the current page. */
  const cards = () => screen.queryAllByRole('article');

  /** The state field is the only way in — there is no list of states on the page. */
  const pickState = async (user: ReturnType<typeof userEvent.setup>, state: string) => {
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: new RegExp(`^${state}`) }));
  };

  it('lists nothing at all until a state is chosen', () => {
    setup();
    // The page opens on a question, not on a hundred and nineteen towns.
    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Pick a state to see its cities' })).toBeInTheDocument();
  });

  it('lists no states either — the field is the only way in', () => {
    setup();
    // Every state name on the page would be the same wall in miniature, and a
    // second copy of the control directly above it.
    for (const state of new Set(CITIES.map((c) => c.state))) {
      expect(screen.queryByRole('button', { name: new RegExp(`^${state}`) })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('offers every state inside the field, with its city count', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('combobox'));

    for (const state of new Set(CITIES.map((c) => c.state))) {
      expect(screen.getByRole('option', { name: new RegExp(`^${state}`) })).toBeInTheDocument();
    }
  });

  it('renders that state’s cities as cards once one is picked', async () => {
    const user = userEvent.setup();
    setup();
    await pickState(user, 'Karnataka');

    const karnataka = CITIES.filter((c) => c.state === 'Karnataka');
    expect(cards()).toHaveLength(karnataka.length);
    expect(screen.getByRole('heading', { name: 'Bengaluru' })).toBeInTheDocument();
    expect(cards()).not.toHaveLength(CITIES.length);
    // And nobody else's: a Karnataka page showing Mumbai is the bug this
    // whole flow exists to prevent.
    expect(screen.queryByRole('heading', { name: 'Mumbai' })).not.toBeInTheDocument();
  });

  it('puts six cities on a page and pages through the rest', async () => {
    const user = userEvent.setup();
    setup();
    // Every state holds one or two cities now, so a state never pages. A search
    // across all of them still does, and that is the path worth covering.
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'a');

    const matching = CITIES.filter((c) =>
      [c.name, c.state, c.blurb].some((field) => field.toLowerCase().includes('a')),
    );
    expect(matching.length).toBeGreaterThan(6);

    expect(cards()).toHaveLength(6);
    const firstPage = cards().map((card) => card.textContent);

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(cards().length).toBeGreaterThan(0);
    expect(cards().map((card) => card.textContent)).not.toEqual(firstPage);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('carries each city’s own detail on its own card', async () => {
    const user = userEvent.setup();
    setup();
    await pickState(user, 'Karnataka');

    // Bengaluru's landmarks belong to Bengaluru's card and nowhere else.
    const bengaluru = cards().find((card) => card.textContent?.includes('Bengaluru'))!;
    expect(within(bengaluru).getByText(/Lalbagh Botanical Garden/)).toBeInTheDocument();
    expect(within(bengaluru).getByText(/Kanteerava/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await pickState(user, 'Maharashtra');

    const mumbai = cards().find((card) => card.textContent?.includes('Mumbai'))!;
    expect(mumbai.textContent).not.toMatch(/Lalbagh/);
    expect(within(mumbai).getByText(/Gateway of India/)).toBeInTheDocument();
  });

  it('does not page a state that fits on one page', async () => {
    const user = userEvent.setup();
    setup();
    await pickState(user, 'Karnataka');

    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('searches across every state without picking one first', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mainpuri');

    expect(cards()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Mainpuri' })).toBeInTheDocument();
  });

  it('searches by state and by what happens there', async () => {
    const user = userEvent.setup();
    setup();
    const box = screen.getByRole('searchbox', { name: 'Search cities' });

    await user.type(box, 'Karnataka');
    expect(cards()).toHaveLength(CITIES.filter((c) => c.state === 'Karnataka').length);
    expect(screen.getByRole('heading', { name: 'Bengaluru' })).toBeInTheDocument();

    await user.clear(box);
    await user.type(box, 'badminton');
    // A blurb match has to show the blurb, or the result looks arbitrary.
    expect(cards()[0]).toHaveTextContent(/badminton/i);
  });

  it('goes back to the state picker when the search is cleared', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mainpuri');
    expect(cards()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Pick a state to see its cities' })).toBeInTheDocument();
  });

  it('clears every filter at once, not just the text', async () => {
    const user = userEvent.setup();
    setup();
    await pickState(user, 'Maharashtra');
    await user.click(screen.getByRole('button', { name: 'Live boards only' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mumbai');
    expect(cards()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Pick a state to see its cities' })).toBeInTheDocument();
  });

  it('can narrow a state to the cities that actually have a board', async () => {
    const user = userEvent.setup();
    setup();
    await pickState(user, 'Karnataka');
    await user.click(screen.getByRole('button', { name: 'Live boards only' }));

    expect(cards()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Bengaluru' })).toBeInTheDocument();
  });

  it('says so rather than showing an empty grid when nothing matches', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'zzzznowhere');

    expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument();
    expect(cards()).toHaveLength(0);
  });

  it('offers the live-boards filter only once there is something to filter', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Live boards only' })).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /* Tiers                                                               */
  /* ------------------------------------------------------------------ */

  /** The chips carry their count, so the name alone will not match. */
  const tierChip = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });

  it('offers a tier before anything has been asked for', () => {
    setup();
    // Unlike the live-boards toggle, the tier chips are a way *in* — somebody
    // who came to find out whether this is a metro-only product should not
    // have to know a state name first.
    for (const info of CITY_TIERS) {
      expect(tierChip(info.label)).toBeInTheDocument();
    }
    expect(cards()).toHaveLength(0);
  });

  it('lists a whole tier when one is picked, without a state', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(tierChip('Metros'));

    // Six to a page, and the metros are eight.
    expect(cards()).toHaveLength(6);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    // A metro page must not be showing a district town.
    expect(screen.queryByRole('heading', { name: 'Mainpuri' })).not.toBeInTheDocument();
  });

  it('shows the Tier-2 tranche, which is the largest of the three', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(tierChip('Tier-2'));

    const names = cards().map((card) => card.textContent ?? '');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).not.toMatch(/Bengaluru|Mainpuri/);
    }
  });

  it('crosses a tier with a state', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(tierChip('Towns'));
    await pickState(user, 'Uttar Pradesh');

    // Uttar Pradesh holds Lucknow, Kanpur, Varanasi and Agra as well, and none
    // of them is a district town.
    expect(cards()).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Mainpuri' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lucknow' })).not.toBeInTheDocument();
  });

  it('clicking the chip you are on clears it and closes the listing', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(tierChip('Metros'));
    expect(cards().length).toBeGreaterThan(0);

    await user.click(tierChip('Metros'));

    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Pick a state to see its cities' })).toBeInTheDocument();
  });

  it('drops the tier along with everything else on Clear all', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(tierChip('Tier-2'));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(cards()).toHaveLength(0);
    expect(tierChip('Tier-2')).toHaveAttribute('aria-pressed', 'false');
  });
});
