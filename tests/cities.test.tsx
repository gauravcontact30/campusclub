import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CITIES, cityBySlug } from '@/lib/constants';
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

  it('covers smaller district towns, not only the metros', () => {
    const names = CITIES.map((c) => c.name);
    for (const town of ['Mainpuri', 'Etah', 'Kannauj']) {
      expect(names).toContain(town);
    }
  });
});

describe('CityExplorer', () => {
  const counts = { Bengaluru: 9, Mumbai: 6, Mainpuri: 0 };
  const setup = () => render(<CityExplorer cities={CITIES} counts={counts} />);

  it('shows six cities on the first page and paginates the rest', () => {
    setup();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText(/^Page 1 of/)).toBeInTheDocument();
  });

  it('moves through pages and shows a different six', async () => {
    const user = userEvent.setup();
    setup();
    const first = screen.getAllByRole('listitem')[0].textContent;

    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(screen.getByText(/^Page 2 of/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0].textContent).not.toBe(first);
  });

  it('searches by city name', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mainpuri');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('Mainpuri')).toBeInTheDocument();
  });

  it('searches by state and by what happens there', async () => {
    const user = userEvent.setup();
    setup();
    const box = screen.getByRole('searchbox', { name: 'Search cities' });

    await user.type(box, 'Kerala');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);

    await user.clear(box);
    await user.type(box, 'wrestling');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('clears the search from inside the field', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mainpuri');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });

  it('clears every filter at once, not just the text', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Live boards only' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mumbai');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Live boards only' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('says so rather than showing an empty grid when nothing matches', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'zzzznowhere');

    expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('drops back to page one when a filter shrinks the list under the current page', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText(/^Page 2 of/)).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Mainpuri');

    // Without the clamp this would render an empty page 2 with no way back.
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('can narrow to cities that actually have a board', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Live boards only' }));

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining('Bengaluru'),
      expect.stringContaining('Mumbai'),
    ]);
  });
});
