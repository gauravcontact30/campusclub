import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingBlocks, RatingInput } from '@/components/ui/rating-blocks';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/category-icon';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { VouchSummary } from '@/components/meetups/vouch-list';
import type { MeetupWithHost, Vouch } from '@/types';

function meetup(overrides: Partial<MeetupWithHost> = {}): MeetupWithHost {
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  return {
    id: 'm1',
    slug: 'a-test-meetup-bengaluru',
    title: 'Deep work table',
    categorySlug: 'group-study',
    hostId: 'u1',
    description: 'Three silent blocks.',
    agenda: [],
    bring: [],
    venueName: 'Third Wave',
    address: '12 100 Feet Road',
    area: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.97,
    lng: 77.64,
    startsAt,
    endsAt: new Date(+new Date(startsAt) + 5_400_000).toISOString(),
    spotsTotal: 8,
    spotsTaken: 6,
    joinFeeCents: 14900,
    level: 'serious',
    audience: 'everyone',
    language: 'English',
    cadence: 'once',
    coverImage: null,
    tags: ['Silent'],
    createdAt: new Date().toISOString(),
    rating: 4.8,
    vouchCount: 12,
    host: {
      id: 'u1',
      name: 'Kabir Shah',
      avatarUrl: null,
      city: 'Bengaluru',
      bio: '',
      hostedCount: 46,
      rating: 5,
      verified: true,
      memberSince: new Date().toISOString(),
    },
    ...overrides,
  };
}

describe('RatingBlocks', () => {
  it('exposes the score to assistive tech', () => {
    render(<RatingBlocks value={4.3} />);
    expect(screen.getByLabelText('4.3 out of 5')).toBeInTheDocument();
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
  it('renders its children with a tone', () => {
    render(<Badge tone="signal">Waitlisted</Badge>);
    expect(screen.getByText('Waitlisted')).toBeInTheDocument();
  });
});

describe('CategoryIcon', () => {
  it('falls back rather than rendering nothing for an unknown category', () => {
    const { container } = render(<CategoryIcon slug="not-a-category" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('MeetupCard', () => {
  it('shows the two facts the decision turns on: the fee and the spots left', () => {
    render(<MeetupCard meetup={meetup()} showSave={false} />);

    expect(screen.getByText('₹149')).toBeInTheDocument();
    expect(screen.getByText('2 spots left')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deep work table' })).toHaveAttribute(
      'href',
      '/meetups/a-test-meetup-bengaluru',
    );
  });

  it('says "Free" rather than ₹0', () => {
    render(<MeetupCard meetup={meetup({ joinFeeCents: 0 })} showSave={false} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('offers the waitlist instead of a spot count when full', () => {
    render(<MeetupCard meetup={meetup({ spotsTaken: 8 })} showSave={false} />);
    expect(screen.getByText('Full — waitlist open')).toBeInTheDocument();
  });

  it('shows a distance only when the search supplied one', () => {
    const { rerender } = render(<MeetupCard meetup={meetup()} showSave={false} />);
    expect(screen.queryByText(/away/)).not.toBeInTheDocument();

    rerender(<MeetupCard meetup={meetup({ distanceKm: 2.4 })} showSave={false} />);
    expect(screen.getByText(/2\.4 km away/)).toBeInTheDocument();
  });
});

describe('VouchSummary', () => {
  const vouch = (rating: number, i: number): Vouch => ({
    id: `v${i}`,
    meetupId: 'm1',
    userId: `u${i}`,
    authorName: 'A Member',
    authorAvatar: null,
    rating,
    body: 'It was good.',
    highlights: ['Started on time'],
    createdAt: new Date().toISOString(),
    hostReply: null,
    hostReplyAt: null,
  });

  it('shows the average and the shape behind it', () => {
    render(<VouchSummary vouches={[vouch(5, 1), vouch(5, 2), vouch(3, 3)]} />);

    expect(screen.getByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('3 people who went')).toBeInTheDocument();
    // The highlight tally is what makes the average readable.
    expect(screen.getByText('Started on time · 3')).toBeInTheDocument();
  });

  it('renders nothing at all when nobody has been yet', () => {
    const { container } = render(<VouchSummary vouches={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
