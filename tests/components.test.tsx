import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingInput, RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { FilterPanel } from '@/components/business/filter-panel';
import { OpenNowBadge } from '@/components/business/open-now-badge';
import type { WeekHours } from '@/types';

describe('RatingStars', () => {
  it('exposes the score to assistive tech', () => {
    render(<RatingStars value={4.3} />);
    expect(screen.getByLabelText('4.3 out of 5 stars')).toBeInTheDocument();
  });
});

describe('RatingInput', () => {
  it('records the chosen rating in the hidden field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<RatingInput name="rating" onChange={onChange} />);

    await user.click(screen.getByLabelText('Rate 4 out of 5'));

    expect(onChange).toHaveBeenCalledWith(4);
    expect(container.querySelector('input[name="rating"]')).toHaveValue('4');
    expect(screen.getByText('Really good')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge tone="ember">2 seats left</Badge>);
    expect(screen.getByText('2 seats left')).toBeInTheDocument();
  });
});

describe('FilterPanel', () => {
  const baseQuery = { term: '', city: '', category: '', price: [] as never[], minRating: 0, openNow: false, sort: 'recommended' as const, page: 1 };

  it('reports the result count and raises filter changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onTogglePrice = vi.fn();

    render(
      <FilterPanel query={baseQuery} total={24} onChange={onChange} onTogglePrice={onTogglePrice} onReset={vi.fn()} onUseMyLocation={vi.fn()} />,
    );

    expect(screen.getByText('24 places match')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restaurants' }));
    expect(onChange).toHaveBeenCalledWith('category', 'restaurants');

    await user.click(screen.getByRole('button', { name: '₹₹' }));
    expect(onTogglePrice).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith('openNow', true);
  });

  it('offers a clear control only when filters are active', () => {
    const { rerender } = render(
      <FilterPanel query={baseQuery} total={24} onChange={vi.fn()} onTogglePrice={vi.fn()} onReset={vi.fn()} onUseMyLocation={vi.fn()} />,
    );
    expect(screen.queryByText(/Clear/)).not.toBeInTheDocument();

    rerender(
      <FilterPanel
        query={{ ...baseQuery, category: 'cafes', openNow: true }}
        total={4}
        onChange={vi.fn()}
        onTogglePrice={vi.fn()}
        onReset={vi.fn()}
        onUseMyLocation={vi.fn()}
      />,
    );
    expect(screen.getByText('Clear (2)')).toBeInTheDocument();
  });

  it('switches price symbols to the filtered city currency', () => {
    render(
      <FilterPanel
        query={{ ...baseQuery, city: 'new-york' }}
        total={4}
        onChange={vi.fn()}
        onTogglePrice={vi.fn()}
        onReset={vi.fn()}
        onUseMyLocation={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '$$$' })).toBeInTheDocument();
  });
});

describe('OpenNowBadge', () => {
  const alwaysOpen: WeekHours = Array.from({ length: 7 }, () => ({ open: '00:00', close: '23:59' })) as WeekHours;

  it('resolves the open state on the client', async () => {
    render(<OpenNowBadge hours={alwaysOpen} />);
    expect(await screen.findByText('Open now', { exact: false })).toBeInTheDocument();
  });
});
