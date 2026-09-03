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
  ('skills',          'Skills & hobbies',  'Palette',         'Practise together', 'Sketching, open mics, chess, language practice.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, verb = excluded.verb, blurb = excluded.blurb;
