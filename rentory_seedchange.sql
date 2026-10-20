BEGIN;
CREATE FUNCTION pg_temp.ist(day_off int, hr int) RETURNS timestamptz LANGUAGE sql AS $$
  SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + day_off * interval '1 day' + hr * interval '1 hour')
         AT TIME ZONE 'Asia/Kolkata' $$;

INSERT INTO warehouses (code, name, city) VALUES ('MAIN', 'Rentory Main Warehouse', 'Bengaluru');

INSERT INTO users (email, password_hash, first_name, last_name, role, warehouse_id, terminal)
SELECT v.email, crypt('ChangeMe!123', gen_salt('bf', 10)), v.fn, v.ln, v.role, w.id, v.term
  FROM warehouses w, (VALUES
    ('admin@rentory.supply',   'Asha',   'Rao',    'admin',      NULL),
    ('manager@rentory.supply', 'Vikram', 'Nair',   'manager',    NULL),
    ('sarah@rentory.supply',   'Sarah',  'Thomas', 'operator',   'Terminal 07'),
    ('driver@rentory.supply',  'Ravi',   'Kumar',  'driver',     NULL),
    ('tech@rentory.supply',    'Imran',  'Khan',   'technician', NULL)) v(email, fn, ln, role, term);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Audio', 'audio', 'volume-high', 1), ('Lighting', 'lighting', 'bulb', 2), ('FX & Stage', 'fx-stage', 'sparkles', 3);

INSERT INTO items (category_id, sku, name, short_name, brand, model, image_url, icon, daily_rate, deposit, reorder_level)
SELECT c.id, v.sku, v.name, v.short, v.brand, v.model, v.img, v.icon, v.rate, v.dep, v.reorder
  FROM categories c JOIN (VALUES
    ('audio',    'SPK-JBL-EON15', 'JBL EON 15" Speakers',        'Speakers',     'JBL',        'EON715',     'speaker.png',    'volume-high', 1500, 2000, 4),
    ('audio',    'MIC-SHURE-WL',  'Wireless Microphones (Shure)', 'Microphones',  'Shure',      'BLX24/PG58', 'microphone.png', 'mic',          500, 1000, 3),
    ('lighting', 'LGT-RGBW-DMX',  'Stage Lights (RGBW DMX)',      'Stage Lights', 'Chauvet DJ', 'SlimPAR 56', 'lights.png',     'bulb',         400,  500, 6),
    ('fx-stage', 'FX-FOG',        'Fog & FX Machines',            'Fog Machines', 'Antari',     'Z-1500 II',  'fog.png',        'cloud',       1000, 3000, 2)
  ) v(cat, sku, name, short, brand, model, img, icon, rate, dep, reorder) ON v.cat = c.slug;

-- 20 speakers, 15 mics, 30 lights, 8 fog machines
INSERT INTO units (item_id, asset_tag, serial_number, warehouse_id, location, purchase_date)
SELECT i.id, v.pre || '-' || lpad(g::text, 4, '0'), 'SN' || v.pre || lpad((g * 137 % 10000)::text, 5, '0'),
       w.id, v.loc, current_date - (g * 17 + 120)
  FROM (VALUES ('SPK-JBL-EON15','SPK',20,'A-01'), ('MIC-SHURE-WL','MIC',15,'A-02'),
               ('LGT-RGBW-DMX','LGT',30,'B-01'),  ('FX-FOG','FOG',8,'C-01')) v(sku, pre, n, loc)
  JOIN items i ON i.sku = v.sku CROSS JOIN warehouses w
  CROSS JOIN LATERAL generate_series(1, v.n) g;

INSERT INTO customers (name, company, email, phone, tax_id, city) VALUES
  ('Rajesh Sharma', NULL, 'rajesh.sharma@example.com', '+91 91111 00001', NULL, 'Bengaluru'),
  ('Anita Verma', 'Verma Industries Pvt Ltd', 'events@verma.example', '+91 91111 00002', '29ABCDE1234F1Z5', 'Bengaluru');

INSERT INTO bookings (customer_id, warehouse_id, event_name, venue, rental_start, rental_end, deposit, created_by)
SELECT c.id, w.id, v.ev, v.venue, v.s, v.e, v.dep, u.id
  FROM customers c, warehouses w, users u, (VALUES
    ('Rajesh Sharma', 'Sharma Wedding',               'Lakeview Banquets, MG Road',  pg_temp.ist(-2, 10), pg_temp.ist(0, 18),  8000),
    ('Anita Verma',   'Verma Industries Annual Gala', 'Orion Convention Centre',     pg_temp.ist(-1,  9), pg_temp.ist(3, 18), 25000)) v(cust, ev, venue, s, e, dep)
 WHERE c.name = v.cust AND u.email = 'manager@rentory.supply';

INSERT INTO booking_items (booking_id, item_id, quantity, unit_rate, periods)
SELECT b.id, i.id, v.qty, i.daily_rate, v.days
  FROM (VALUES ('Sharma Wedding','SPK-JBL-EON15',4,3), ('Verma Industries Annual Gala','SPK-JBL-EON15',6,4),
               ('Verma Industries Annual Gala','MIC-SHURE-WL',3,4), ('Verma Industries Annual Gala','LGT-RGBW-DMX',10,4),
               ('Verma Industries Annual Gala','FX-FOG',3,4)) v(ev, sku, qty, days)
  JOIN bookings b ON b.event_name = v.ev JOIN items i ON i.sku = v.sku;

UPDATE bookings SET tax = round(subtotal * 0.18, 2);                    -- 18% GST
SELECT fn_confirm_booking(id) FROM bookings;

-- Sarah scans units out (one statement per booking so each picks different units)
DO $$ DECLARE b record; BEGIN
  FOR b IN SELECT id, rental_start FROM bookings ORDER BY number LOOP
    INSERT INTO booking_units (booking_item_id, unit_id, out_at, out_by)
    SELECT bi.id, ru.id, b.rental_start, (SELECT id FROM users WHERE email = 'sarah@rentory.supply')
      FROM booking_items bi
      JOIN (SELECT id, item_id, row_number() OVER (PARTITION BY item_id ORDER BY asset_tag) rn
              FROM units WHERE status = 'available') ru ON ru.item_id = bi.item_id AND ru.rn <= bi.quantity
     WHERE bi.booking_id = b.id;
  END LOOP;
END $$;

INSERT INTO payments (booking_id, kind, method, amount, reference, received_by)
SELECT b.id, v.kind, v.method, v.amt, v.ref, u.id
  FROM bookings b, users u, (VALUES ('deposit','upi',8000,'UPI-7781230001'), ('rental','cash',10000,NULL)) v(kind, method, amt, ref)
 WHERE b.event_name = 'Sharma Wedding' AND u.email = 'sarah@rentory.supply';

INSERT INTO deliveries (booking_id, direction, status, driver_id, vehicle, scheduled_at, completed_at, address)
SELECT b.id, v.dir, v.st, u.id, 'KA-01-AB-1234', v.at, v.done, b.venue
  FROM bookings b, users u, (VALUES ('Sharma Wedding','outbound','delivered', pg_temp.ist(-2,10), pg_temp.ist(-2,11)),
                                    ('Sharma Wedding','pickup','scheduled',   pg_temp.ist(0,16),  NULL::timestamptz)) v(ev, dir, st, at, done)
 WHERE b.event_name = v.ev AND u.email = 'driver@rentory.supply';

INSERT INTO work_orders (unit_id, type, status, priority, title, assigned_to, scheduled_for)
SELECT un.id, 'calibration', 'scheduled', 'low', 'Scheduled DMX recalibration', u.id, pg_temp.ist(7, 10)
  FROM units un, users u WHERE un.asset_tag = 'LGT-0030' AND u.email = 'tech@rentory.supply';

INSERT INTO notifications (user_id, type, title, body, sent_at)
SELECT id, 'return_due', 'Return due today', 'Sharma Wedding - 4 Speakers - Due 6:00 PM today', now()
  FROM users WHERE email IN ('sarah@rentory.supply', 'manager@rentory.supply');
COMMIT;
