-- =============================================================================
-- VibeClub — reference data
-- Categories are fixed vocabulary, so they live in SQL. The demo businesses and
-- dinners are seeded from the TypeScript dataset (single source of truth) via
--   POST /api/admin/seed   with header  x-seed-key: <SUPABASE_SERVICE_ROLE_KEY>
-- =============================================================================

insert into public.categories (slug, name, icon, blurb) values
  ('restaurants',   'Restaurants',     'UtensilsCrossed', 'Tables worth booking twice.'),
  ('cafes',         'Coffee & Cafés',  'Coffee',          'Where the laptops and the lingerers go.'),
  ('bars',          'Bars & Nightlife','Martini',         'Last orders, first impressions.'),
  ('home-services', 'Home Services',   'Wrench',          'Plumbers, painters, people who show up.'),
  ('beauty-spa',    'Beauty & Spa',    'Scissors',        'Cuts, colour and quiet rooms.'),
  ('fitness',       'Fitness',         'Dumbbell',        'Studios that keep you coming back.'),
  ('shopping',      'Shopping',        'ShoppingBag',     'Independents worth the detour.'),
  ('health',        'Health & Medical','Stethoscope',     'Clinics with a human touch.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, blurb = excluded.blurb;
