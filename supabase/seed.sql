-- =============================================================================
-- CampusClub — reference data
-- Categories are fixed vocabulary, so they live in SQL. The demo meetups are
-- seeded from the TypeScript dataset (single source of truth) via
--   POST /api/admin/seed   with header  x-seed-key: <SUPABASE_SERVICE_ROLE_KEY>
-- =============================================================================

insert into public.categories (slug, name, icon, verb, blurb) values
  ('group-study',     'Group study',       'BookOpen',        'Study together',    'Three hours, phones face down, one table.'),
  ('exam-prep',       'Exam prep',         'GraduationCap',   'Prep together',     'Mock tests and doubt-clearing for CAT, GATE, UPSC, NEET.'),
  ('dinner',          'Dinner',            'UtensilsCrossed', 'Eat together',      'A long table, six people, no phones out.'),
  ('breakfast-lunch', 'Breakfast & lunch', 'Croissant',       'Eat together',      'Idli runs at seven, thali at one.'),
  ('gym',             'Gym',               'Dumbbell',        'Train together',    'A spotter, a schedule, and someone who notices you skipped.'),
  ('sports',          'Sports',            'Volleyball',      'Play together',     'Badminton, football, box cricket — teams made on the spot.'),
  ('outdoors',        'Runs & outdoors',   'Footprints',      'Move together',     'Sunrise runs, lake loops, weekend treks.'),
  ('skills',          'Skills & hobbies',  'Palette',         'Practise together', 'Sketching, open mics, chess, language practice.'),
  ('movies-shows',    'Movies & shows',    'Clapperboard',    'Watch together',    'One screen, one pick everybody agreed on, popcorn split four ways.'),
  ('gaming',          'Gaming',            'Gamepad2',        'Play together',     'Couch co-op and LAN nights — bring your own controller.'),
  ('board-games',     'Board games',       'Dices',           'Play together',     'Catan at nine, Codenames after, nobody keeps score past midnight.'),
  ('music-jam',       'Music & jamming',   'Guitar',          'Jam together',      'Bring an instrument or just your voice — nobody is auditioning.'),
  ('open-mic',        'Open mic & karaoke','Mic2',            'Perform together',  'Five minutes on stage, or just cheer from the second row.'),
  ('book-club',       'Book club',         'Library',         'Read together',     'One book a month, opinions stronger than the coffee.'),
  ('coffee-chat',     'Coffee & hangouts', 'Coffee',          'Talk together',     'No agenda, one table, the good kind of small talk.'),
  ('weekend-trips',   'Weekend trips',     'Plane',           'Explore together',  'A short trip, split costs, someone else planned the itinerary.'),
  ('photography',     'Photography',       'Camera',          'Shoot together',    'Golden-hour walks with people who also stop for the light.'),
  ('cycling',         'Cycling',           'Bike',            'Ride together',     'Sunrise pace lines before the traffic wakes up.'),
  ('hiking-treks',    'Hiking & treks',    'Mountain',        'Climb together',    'Weekend trails — one person always over-packs the snacks.'),
  ('cooking',         'Cooking & baking',  'ChefHat',         'Cook together',     'One kitchen, one recipe, dinner is whatever comes out of it.'),
  ('arts-crafts',     'Art & craft',       'Brush',           'Create together',   'Paint, pottery, whatever is half-finished in your cupboard.'),
  ('volunteering',    'Volunteering',      'HeartHandshake',  'Give back together','A few hours that matter more than another scroll session.'),
  ('networking',      'Networking',        'Briefcase',       'Connect together',  'Career talk over coffee, no pitch decks required.'),
  ('pet-meetups',     'Pet meetups',       'PawPrint',        'Walk together',     'Dogs do the introductions so you do not have to.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, verb = excluded.verb, blurb = excluded.blurb;
