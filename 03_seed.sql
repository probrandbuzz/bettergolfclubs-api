-- ============================================================
-- GOLFROOTS — SEED DATA
-- All pricing extracted from the live calculator DB object
-- Run after 01_schema.sql and 02_rls.sql
-- ============================================================

-- ─── MEMBER CODES ────────────────────────────────────────────
INSERT INTO member_codes (code, label, bonus, active) VALUES
  ('MEMBER10', 'Member 10% bonus',       0.10, true),
  ('MEMBER15', 'Member 15% bonus',       0.15, true),
  ('MEMBER20', 'Member 20% bonus',       0.20, true),
  ('VIP25',    'VIP 25% bonus',          0.25, true),
  ('GOLD10',   'Gold member 10% bonus',  0.10, true),
  ('ELITE30',  'Elite member 30% bonus', 0.30, true)
ON CONFLICT (code) DO NOTHING;


-- ─── PRICING — DRIVERS ───────────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  -- TaylorMade
  ('Driver','TaylorMade','Qi10 Max',        270, 210, 150,  90),
  ('Driver','TaylorMade','Qi10',            250, 195, 140,  85),
  ('Driver','TaylorMade','Stealth 2 Plus',  220, 170, 120,  70),
  ('Driver','TaylorMade','Stealth 2',       195, 150, 105,  60),
  ('Driver','TaylorMade','Stealth 2 HD',    200, 155, 110,  65),
  ('Driver','TaylorMade','SIM2 Max',        145, 112,  79,  46),
  ('Driver','TaylorMade','SIM2',            135, 105,  74,  42),
  ('Driver','TaylorMade','SIM Max',         115,  89,  63,  36),
  ('Driver','TaylorMade','M6',               85,  66,  46,  26),
  ('Driver','TaylorMade','M5',               80,  62,  44,  25),
  ('Driver','TaylorMade','M4',               65,  50,  35,  20),
  ('Driver','TaylorMade','M2 (2017)',         50,  39,  27,  15),
  -- Callaway
  ('Driver','Callaway','Paradym Ai Smoke Max D',  295, 229, 163, 97),
  ('Driver','Callaway','Paradym Ai Smoke Max',    285, 221, 158, 94),
  ('Driver','Callaway','Paradym Ai Smoke',        270, 209, 149, 89),
  ('Driver','Callaway','Paradym Triple Diamond',  250, 194, 138, 82),
  ('Driver','Callaway','Paradym Max',             230, 178, 127, 76),
  ('Driver','Callaway','Rogue ST Max',            180, 140,  99, 59),
  ('Driver','Callaway','Rogue ST Triple Diamond', 195, 151, 107, 64),
  ('Driver','Callaway','Epic Max',                140, 108,  77, 46),
  ('Driver','Callaway','Mavrik Max',              115,  89,  63, 38),
  ('Driver','Callaway','Epic Flash',               90,  70,  49, 29),
  ('Driver','Callaway','Big Bertha B21',            75,  58,  41, 24),
  -- Titleist
  ('Driver','Titleist','TSR4',   280, 217, 154, 92),
  ('Driver','Titleist','TSR3',   265, 205, 146, 87),
  ('Driver','Titleist','TSR2',   255, 198, 141, 84),
  ('Driver','Titleist','TSi3',   200, 155, 110, 66),
  ('Driver','Titleist','TSi2',   190, 147, 105, 62),
  ('Driver','Titleist','TS3',    135, 105,  74, 44),
  ('Driver','Titleist','TS2',    125,  97,  69, 41),
  ('Driver','Titleist','917 D3',  80,  62,  44, 26),
  ('Driver','Titleist','917 D2',  75,  58,  41, 24),
  -- Ping
  ('Driver','Ping','G440 Max',     275, 213, 152, 90),
  ('Driver','Ping','G440 LST',     265, 205, 146, 87),
  ('Driver','Ping','G430 Max 10K', 245, 190, 135, 80),
  ('Driver','Ping','G430 Max',     235, 182, 130, 77),
  ('Driver','Ping','G430 LST',     230, 178, 127, 76),
  ('Driver','Ping','G425 Max',     185, 143, 102, 61),
  ('Driver','Ping','G410 Plus',    150, 116,  83, 49),
  ('Driver','Ping','G400 Max',     110,  85,  61, 36),
  -- Cobra
  ('Driver','Cobra','Darkspeed LS',  240, 186, 132, 79),
  ('Driver','Cobra','Darkspeed Max', 235, 182, 130, 77),
  ('Driver','Cobra','Aerojet Max',   190, 147, 105, 62),
  ('Driver','Cobra','Aerojet LS',    195, 151, 107, 64),
  ('Driver','Cobra','LTDx Max',      160, 124,  88, 52),
  ('Driver','Cobra','Radspeed XB',   115,  89,  63, 38),
  -- PXG
  ('Driver','PXG','0811 XF GEN6', 280, 217, 154, 92),
  ('Driver','PXG','0811 X GEN6',  270, 209, 149, 89),
  ('Driver','PXG','0811 GEN6',    260, 201, 143, 85),
  ('Driver','PXG','0811 GEN5',    200, 155, 110, 66),
  ('Driver','PXG','0811 GEN4',    145, 112,  80, 47),
  -- XXIO
  ('Driver','XXIO','XXIO 13', 280, 217, 154, 92),
  ('Driver','XXIO','XXIO 12', 240, 186, 132, 79),
  ('Driver','XXIO','XXIO 11', 200, 155, 110, 66),
  -- Mizuno
  ('Driver','Mizuno','ST-Z 220', 220, 170, 121, 71),
  ('Driver','Mizuno','ST-X 220', 210, 163, 116, 68),
  -- Cleveland
  ('Driver','Cleveland','Launcher XL 2', 130, 101, 71, 42),
  -- Srixon
  ('Driver','Srixon','ZX7 Mk II', 145, 112, 80, 47),
  ('Driver','Srixon','ZX5 Mk II', 140, 108, 77, 45),
  -- Wilson
  ('Driver','Wilson','Dynapower', 100, 77, 55, 32)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new       = EXCLUDED.price_new,
  price_above_avg = EXCLUDED.price_above_avg,
  price_avg       = EXCLUDED.price_avg,
  price_below_avg = EXCLUDED.price_below_avg,
  updated_at      = now();


-- ─── PRICING — FAIRWAY WOODS ─────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Fairway Wood','TaylorMade','Qi10 Max Fairway',     175, 136, 96, 57),
  ('Fairway Wood','TaylorMade','Qi10 Fairway',         165, 128, 91, 54),
  ('Fairway Wood','TaylorMade','Stealth 2 HD Fairway', 150, 116, 83, 49),
  ('Fairway Wood','TaylorMade','Stealth 2 Fairway',    140, 108, 77, 46),
  ('Fairway Wood','TaylorMade','SIM2 Max Fairway',     120,  93, 66, 39),
  ('Fairway Wood','TaylorMade','M6 Fairway',            80,  62, 44, 26),
  ('Fairway Wood','Callaway','Paradym Ai Smoke Fairway', 170, 132, 94, 56),
  ('Fairway Wood','Callaway','Rogue ST Max Fairway',     135, 105, 74, 44),
  ('Fairway Wood','Callaway','Epic Max Fairway',         115,  89, 63, 38),
  ('Fairway Wood','Titleist','TSR3 Fairway', 180, 140, 99, 59),
  ('Fairway Wood','Titleist','TSR2 Fairway', 170, 132, 94, 56),
  ('Fairway Wood','Ping','G440 Max Fairway', 185, 143, 102, 61),
  ('Fairway Wood','Ping','G430 Max Fairway', 165, 128,  91, 54),
  ('Fairway Wood','Ping','G425 Max Fairway', 140, 108,  77, 46),
  ('Fairway Wood','Cobra','Darkspeed Max Fairway', 160, 124, 88, 52),
  ('Fairway Wood','Cobra','Aerojet Max Fairway',   140, 108, 77, 46),
  ('Fairway Wood','XXIO','XXIO 13 Fairway', 200, 155, 110, 65)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── PRICING — HYBRIDS ───────────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Hybrid','TaylorMade','Qi10 Rescue',      140, 108, 77, 46),
  ('Hybrid','TaylorMade','Stealth 2 Rescue', 120,  93, 66, 39),
  ('Hybrid','TaylorMade','SIM2 Max Rescue',  100,  77, 55, 33),
  ('Hybrid','Callaway','Paradym Ai Smoke Max Hybrid', 135, 105, 74, 44),
  ('Hybrid','Callaway','Rogue ST Max Hybrid',          110,  85, 61, 36),
  ('Hybrid','Callaway','Epic Max Hybrid',               90,  70, 49, 29),
  ('Hybrid','Titleist','TSR2 Hybrid', 145, 112, 80, 47),
  ('Hybrid','Titleist','TSi2 Hybrid', 120,  93, 66, 39),
  ('Hybrid','Ping','G440 Hybrid', 150, 116, 83, 49),
  ('Hybrid','Ping','G430 Hybrid', 135, 105, 74, 44),
  ('Hybrid','Ping','G425 Hybrid', 115,  89, 63, 38),
  ('Hybrid','Ping','G410 Hybrid',  95,  74, 52, 31),
  ('Hybrid','Cobra','Darkspeed Hybrid', 130, 101, 71, 43),
  ('Hybrid','Cobra','Aerojet Hybrid',   115,  89, 63, 38),
  ('Hybrid','XXIO','XXIO 13 Hybrid', 175, 136, 96, 57)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── PRICING — IRON SETS ─────────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Iron Set','TaylorMade','Qi35 Irons',        550, 426, 303, 179),
  ('Iron Set','TaylorMade','P790 (2023)',        540, 419, 297, 176),
  ('Iron Set','TaylorMade','P770 (2023)',        520, 403, 286, 169),
  ('Iron Set','TaylorMade','P7MC',               490, 380, 270, 159),
  ('Iron Set','TaylorMade','P7MB',               470, 364, 259, 153),
  ('Iron Set','TaylorMade','Stealth2 HD Irons',  380, 295, 209, 124),
  ('Iron Set','TaylorMade','Stealth2 Irons',     360, 279, 198, 117),
  ('Iron Set','TaylorMade','SIM2 Max OS Irons',  290, 225, 160,  94),
  ('Iron Set','TaylorMade','M6 Irons',           220, 171, 121,  72),
  ('Iron Set','TaylorMade','M4 Irons',           190, 147, 105,  62),
  ('Iron Set','TaylorMade','M2 Irons (2016)',    130, 101,  71,  43),
  ('Iron Set','Callaway','Apex Pro 24 Irons',      580, 450, 319, 189),
  ('Iron Set','Callaway','Apex 24 Irons',          540, 419, 297, 176),
  ('Iron Set','Callaway','Paradym Ai Smoke Irons', 510, 395, 281, 166),
  ('Iron Set','Callaway','Rogue ST Max OS Irons',  330, 256, 182, 107),
  ('Iron Set','Callaway','Mavrik Max Irons',        240, 186, 132,  78),
  ('Iron Set','Callaway','Big Bertha B21 Irons',    200, 155, 110,  65),
  ('Iron Set','Titleist','T350 Irons',        510, 395, 281, 166),
  ('Iron Set','Titleist','T300 Irons (2023)', 530, 411, 292, 172),
  ('Iron Set','Titleist','T200 Irons (2023)', 560, 434, 308, 182),
  ('Iron Set','Titleist','T150 Irons',        520, 403, 286, 169),
  ('Iron Set','Titleist','T100 Irons (2023)', 540, 419, 297, 176),
  ('Iron Set','Titleist','AP2 (718)',          300, 233, 165,  98),
  ('Iron Set','Titleist','AP1 (718)',          240, 186, 132,  78),
  ('Iron Set','Ping','G730 Irons', 540, 419, 297, 176),
  ('Iron Set','Ping','G430 Irons', 480, 372, 264, 156),
  ('Iron Set','Ping','G425 Irons', 380, 295, 209, 124),
  ('Iron Set','Ping','G410 Irons', 300, 233, 165,  98),
  ('Iron Set','Ping','G400 Irons', 240, 186, 132,  78),
  ('Iron Set','Mizuno','JPX925 Hot Metal Pro', 480, 372, 264, 156),
  ('Iron Set','Mizuno','JPX925 Hot Metal',     460, 357, 253, 150),
  ('Iron Set','Mizuno','JPX923 Hot Metal Pro', 420, 326, 231, 137),
  ('Iron Set','Mizuno','JPX923 Hot Metal',     400, 310, 220, 130),
  ('Iron Set','Mizuno','MP-20 HMB',            380, 295, 209, 124),
  ('Iron Set','Cleveland','ZXi MAX Irons',     360, 279, 198, 117),
  ('Iron Set','Cleveland','Launcher XL Irons', 280, 217, 154,  91),
  ('Iron Set','PXG','0311 XP GEN6 Irons',  580, 450, 319, 189),
  ('Iron Set','PXG','0311 P GEN6 Irons',   600, 465, 330, 195),
  ('Iron Set','PXG','0211 XCOR2 Irons',    440, 341, 242, 143),
  ('Iron Set','PXG','0311 GEN4 Irons',     350, 271, 193, 114),
  ('Iron Set','Srixon','ZX7 Mk II Irons', 460, 357, 253, 150),
  ('Iron Set','Srixon','ZX5 Mk II Irons', 400, 310, 220, 130),
  ('Iron Set','Wilson','D9 Forged Irons', 320, 248, 176, 104),
  ('Iron Set','Wilson','D9 Irons',        250, 194, 138,  81)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── PRICING — SINGLE IRONS ──────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Single Iron','TaylorMade','P790 Single Iron',  65, 50, 36, 21),
  ('Single Iron','TaylorMade','P770 Single Iron',  60, 46, 33, 19),
  ('Single Iron','TaylorMade','Stealth2 Iron',     50, 39, 27, 16),
  ('Single Iron','Callaway','Apex 24 Single Iron',          70, 54, 39, 23),
  ('Single Iron','Callaway','Paradym Ai Smoke Single Iron', 65, 50, 36, 21),
  ('Single Iron','Titleist','T350 Single Iron', 65, 50, 36, 21),
  ('Single Iron','Titleist','T200 Single Iron', 70, 54, 39, 23),
  ('Single Iron','Ping','G730 Single Iron', 68, 53, 37, 22),
  ('Single Iron','Ping','G430 Single Iron', 58, 45, 32, 19),
  ('Single Iron','Mizuno','JPX925 Hot Metal Single', 60, 46, 33, 19),
  ('Single Iron','PXG','0311 XP GEN6 Single',       72, 56, 40, 23),
  ('Single Iron','Cobra','King Utility Iron',        55, 43, 30, 18),
  ('Single Iron','Cleveland','Launcher XL Single',   42, 33, 23, 14),
  ('Single Iron','Srixon','ZX Utility Iron', 58, 45, 32, 19),
  ('Single Iron','Wilson','D9 Single Iron',  38, 30, 21, 12)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── PRICING — WEDGES ────────────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Wedge','Titleist','Vokey SM10', 95, 74, 52, 31),
  ('Wedge','Titleist','Vokey SM9',  78, 60, 43, 25),
  ('Wedge','Titleist','Vokey SM8',  62, 48, 34, 20),
  ('Wedge','Titleist','Vokey SM7',  50, 39, 27, 16),
  ('Wedge','Cleveland','RTX 6 ZipCore',   82, 64, 45, 27),
  ('Wedge','Cleveland','RTX 6 Full Face', 88, 68, 48, 29),
  ('Wedge','Cleveland','RTX ZipCore',     65, 50, 36, 21),
  ('Wedge','Cleveland','CBX 4',           72, 56, 40, 23),
  ('Wedge','TaylorMade','MG4',        92, 71, 51, 30),
  ('Wedge','TaylorMade','MG3',        75, 58, 41, 24),
  ('Wedge','TaylorMade','Hi-Toe 4',   95, 74, 52, 31),
  ('Wedge','TaylorMade','Hi-Toe RAW', 85, 66, 47, 28),
  ('Wedge','Callaway','Jaws Raw Full Face', 88, 68, 48, 29),
  ('Wedge','Callaway','Jaws Raw',          82, 64, 45, 27),
  ('Wedge','Callaway','Jaws MD5',          68, 53, 37, 22),
  ('Wedge','Ping','S159 Wedge', 88, 68, 48, 29),
  ('Wedge','Ping','Glide 4.0',  72, 56, 40, 23),
  ('Wedge','Ping','Glide 3.0',  58, 45, 32, 19),
  ('Wedge','Mizuno','T24 Wedge', 92, 71, 51, 30),
  ('Wedge','Mizuno','T22 Wedge', 78, 60, 43, 25),
  ('Wedge','PXG','0311 Sugar Daddy III', 100, 77, 55, 33),
  ('Wedge','Cobra','King Cobra Wedge',    68, 53, 37, 22),
  ('Wedge','Srixon','ZX Wedge',           72, 56, 40, 23),
  ('Wedge','Wilson','Staff Model Wedge',  62, 48, 34, 20)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── PRICING — PUTTERS ───────────────────────────────────────
INSERT INTO trade_in_pricing (club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg) VALUES
  ('Putter','Scotty Cameron','Phantom 11.5',             310, 240, 171, 101),
  ('Putter','Scotty Cameron','Phantom 11',               295, 229, 162,  96),
  ('Putter','Scotty Cameron','Phantom X 11',             275, 213, 151,  90),
  ('Putter','Scotty Cameron','Special Select Newport 2', 250, 194, 138,  81),
  ('Putter','Scotty Cameron','Special Select Fastback',  240, 186, 132,  78),
  ('Putter','Scotty Cameron','Futura X7M',               185, 143, 102,  60),
  ('Putter','Scotty Cameron','GoLo 5',                   100,  77,  55,  33),
  ('Putter','Odyssey','Ai-ONE #7 CH',       175, 136, 96, 57),
  ('Putter','Odyssey','Ai-ONE Rossie',      168, 130, 92, 55),
  ('Putter','Odyssey','Stroke Lab Black #7',140, 108, 77, 46),
  ('Putter','Odyssey','White Hot OG #1',    110,  85, 61, 36),
  ('Putter','Odyssey','2-Ball Ten',         105,  81, 58, 34),
  ('Putter','TaylorMade','Spider GT Max',              175, 136, 96, 57),
  ('Putter','TaylorMade','Spider EX Red',              145, 112, 80, 47),
  ('Putter','TaylorMade','TP Hydro Blast Del Monte',   165, 128, 91, 54),
  ('Putter','TaylorMade','Truss TB2',                  115,  89, 63, 38),
  ('Putter','Ping','PLD Milled DS72',  320, 248, 176, 104),
  ('Putter','Ping','PLD Milled Anser', 300, 233, 165,  98),
  ('Putter','Ping','G Le3 Fetch',      135, 105,  74,  44),
  ('Putter','Ping','Sigma2 Anser',     115,  89,  63,  38),
  ('Putter','Bettinardi','2023 Studio Stock 35', 380, 295, 209, 124),
  ('Putter','Bettinardi','Studio Stock 9',       310, 240, 171, 101),
  ('Putter','Cleveland','HB Soft Premier Milled', 130, 101, 71, 43),
  ('Putter','Cleveland','HB Soft Milled #10',     120,  93, 66, 39),
  ('Putter','PXG','0311 Milled Gen2',            290, 225, 160, 94),
  ('Putter','PXG','Battle Ready II Bat Attack',  250, 194, 138, 81),
  ('Putter','Wilson','Staff Model Putter',        120,  93, 66, 39),
  ('Putter','Callaway','Odyssey Ai-ONE Milled One', 175, 136, 96, 57)
ON CONFLICT (club_type, brand, model) DO UPDATE SET
  price_new = EXCLUDED.price_new, price_above_avg = EXCLUDED.price_above_avg,
  price_avg = EXCLUDED.price_avg, price_below_avg = EXCLUDED.price_below_avg, updated_at = now();


-- ─── DEFAULT ADMIN USER ───────────────────────────────────────
-- Password: GolfRoots2025! (CHANGE THIS IMMEDIATELY AFTER SETUP)
-- Hash generated with: SELECT crypt('GolfRoots2025!', gen_salt('bf', 12));
INSERT INTO admin_users (email, name, password_hash, role) VALUES
  ('admin@bettergolfclubs.shop', 'GolfRoots Admin',
   crypt('GolfRoots2025!', gen_salt('bf', 12)),
   'superadmin')
ON CONFLICT (email) DO NOTHING;

-- ─── VERIFY SEED ─────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM trade_in_pricing)  AS pricing_rows,
  (SELECT count(*) FROM member_codes)      AS code_rows,
  (SELECT count(*) FROM admin_users)       AS admin_rows;
