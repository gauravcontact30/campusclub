-- =============================================================================
-- CampusClub — a wider catalogue
--
-- Purely additive: the eight categories `0007` seeded stay exactly as they
-- were (existing meetups reference them by slug), and sixteen more join them
-- so the board covers more of what "hobbies, interests and outings" actually
-- means. Nothing is deleted here, unlike `0007`'s own category block.
-- =============================================================================

insert into public.categories (slug, name, icon, verb, blurb) values
  ('movies-shows',  'Movies & shows',       'Clapperboard',  'Watch together',     'One screen, one pick everybody agreed on, popcorn split four ways.'),
  ('gaming',        'Gaming',               'Gamepad2',      'Play together',      'Couch co-op and LAN nights — bring your own controller.'),
  ('board-games',   'Board games',          'Dices',         'Play together',      'Catan at nine, Codenames after, nobody keeps score past midnight.'),
  ('music-jam',     'Music & jamming',      'Guitar',        'Jam together',       'Bring an instrument or just your voice — nobody is auditioning.'),
  ('open-mic',      'Open mic & karaoke',   'Mic2',          'Perform together',   'Five minutes on stage, or just cheer from the second row.'),
  ('book-club',     'Book club',            'Library',       'Read together',      'One book a month, opinions stronger than the coffee.'),
  ('coffee-chat',   'Coffee & hangouts',    'Coffee',        'Talk together',      'No agenda, one table, the good kind of small talk.'),
  ('weekend-trips', 'Weekend trips',        'Plane',         'Explore together',   'A short trip, split costs, someone else planned the itinerary.'),
  ('photography',   'Photography',          'Camera',        'Shoot together',     'Golden-hour walks with people who also stop for the light.'),
  ('cycling',       'Cycling',              'Bike',          'Ride together',      'Sunrise pace lines before the traffic wakes up.'),
  ('hiking-treks',  'Hiking & treks',       'Mountain',      'Climb together',     'Weekend trails — one person always over-packs the snacks.'),
  ('cooking',       'Cooking & baking',     'ChefHat',       'Cook together',      'One kitchen, one recipe, dinner is whatever comes out of it.'),
  ('arts-crafts',   'Art & craft',          'Brush',         'Create together',    'Paint, pottery, whatever is half-finished in your cupboard.'),
  ('volunteering',  'Volunteering',         'HeartHandshake','Give back together', 'A few hours that matter more than another scroll session.'),
  ('networking',    'Networking',           'Briefcase',     'Connect together',   'Career talk over coffee, no pitch decks required.'),
  ('pet-meetups',   'Pet meetups',          'PawPrint',      'Walk together',      'Dogs do the introductions so you do not have to.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, verb = excluded.verb, blurb = excluded.blurb;
