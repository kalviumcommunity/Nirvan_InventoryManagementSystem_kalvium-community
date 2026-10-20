-- Rentory: compact PostgreSQL 14+ schema (16 tables, 3 views).
-- Per request (for audit actor):  SET LOCAL app.current_user_id = '<uuid>';
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS citext;      -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- fast search
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- (item_id, period) index
CREATE SEQUENCE booking_no_seq;

-- ---------- people & places ----------
CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, name text NOT NULL, city text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  password_hash text NOT NULL,
  first_name text NOT NULL, last_name text, phone text,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','manager','operator','driver','technician')),
  warehouse_id uuid REFERENCES warehouses ON DELETE SET NULL,
  terminal text,                                   -- 'Terminal 07'
  is_active boolean NOT NULL DEFAULT true, last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE auth_sessions (                       -- refresh tokens
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, device text,
  expires_at timestamptz NOT NULL, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON auth_sessions (user_id) WHERE revoked_at IS NULL;

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, company text, email citext, phone text, tax_id text,
  address text, city text,
  is_blacklisted boolean NOT NULL DEFAULT false, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON customers USING gin (lower(name || ' ' || coalesce(company, '')) gin_trgm_ops);

-- ---------- inventory ----------
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories ON DELETE SET NULL,
  name text NOT NULL, slug text NOT NULL UNIQUE, icon text, sort_order int NOT NULL DEFAULT 0);

CREATE TABLE items (                               -- catalog: what customers rent
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories,
  sku text NOT NULL UNIQUE, name text NOT NULL, short_name text,
  brand text, model text, image_url text, icon text,
  daily_rate numeric(12,2) NOT NULL DEFAULT 0 CHECK (daily_rate >= 0),
  deposit numeric(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  reorder_level int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON items (category_id);
CREATE INDEX ON items USING gin (lower(name || ' ' || coalesce(brand, '') || ' ' || coalesce(model, '')) gin_trgm_ops);

CREATE TABLE units (                               -- physical assets; asset_tag is the QR/barcode payload
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items,
  asset_tag text NOT NULL UNIQUE, serial_number text,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','rented','maintenance','damaged','lost','retired')),
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('new','good','fair','damaged')),
  warehouse_id uuid REFERENCES warehouses ON DELETE SET NULL, location text,   -- shelf, e.g. 'A-01'
  purchase_date date, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, serial_number));
CREATE INDEX ON units (item_id, status);

-- ---------- bookings ----------
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT 'RNT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_no_seq')::text, 5, '0'),
  customer_id uuid NOT NULL REFERENCES customers,
  warehouse_id uuid NOT NULL REFERENCES warehouses,
  event_name text, venue text,                     -- 'Sharma Wedding'
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','confirmed','active','partially_returned','completed','cancelled')),
  rental_start timestamptz NOT NULL, rental_end timestamptz NOT NULL,   -- rental_end = due back
  subtotal numeric(12,2) NOT NULL DEFAULT 0,       -- kept in sync from booking_items
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total numeric(12,2) GENERATED ALWAYS AS (greatest(subtotal - discount + tax, 0)) STORED,
  deposit numeric(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  notes text, created_by uuid REFERENCES users ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (rental_end > rental_start));
CREATE INDEX ON bookings (customer_id);
CREATE INDEX ON bookings (rental_end) WHERE status IN ('active','partially_returned');

CREATE TABLE booking_items (                       -- what was requested
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_rate numeric(12,2) NOT NULL CHECK (unit_rate >= 0),
  periods numeric(8,2) NOT NULL DEFAULT 1 CHECK (periods > 0),          -- billable days
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total numeric(12,2) GENERATED ALWAYS AS (round(quantity * unit_rate * periods - discount, 2)) STORED,
  UNIQUE (booking_id, item_id));
CREATE INDEX ON booking_items (item_id);

CREATE TABLE booking_units (                       -- what actually left (out_*) and came back (in_*)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_item_id uuid NOT NULL REFERENCES booking_items ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES units,
  out_at timestamptz NOT NULL DEFAULT now(), out_by uuid REFERENCES users ON DELETE SET NULL,
  condition_out text NOT NULL DEFAULT 'good' CHECK (condition_out IN ('new','good','fair','damaged')),
  in_at timestamptz, in_by uuid REFERENCES users ON DELETE SET NULL,
  condition_in text CHECK (condition_in IN ('new','good','fair','damaged')),
  damage_notes text, damage_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (damage_charge >= 0),
  CHECK ((in_at IS NULL) = (condition_in IS NULL)));
CREATE UNIQUE INDEX ON booking_units (unit_id) WHERE in_at IS NULL;      -- a unit can be out only once
CREATE INDEX ON booking_units (booking_item_id);

CREATE TABLE reservations (                        -- quantity holds per item over a time window
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items,
  booking_id uuid REFERENCES bookings ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'booking' CHECK (kind IN ('booking','maintenance','hold')),
  quantity int NOT NULL CHECK (quantity > 0),
  period tstzrange NOT NULL CHECK (NOT isempty(period) AND NOT lower_inf(period) AND NOT upper_inf(period)),
  active boolean NOT NULL DEFAULT true,
  CHECK (kind <> 'booking' OR booking_id IS NOT NULL));
CREATE INDEX ON reservations USING gist (item_id, period) WHERE active;
CREATE INDEX ON reservations (booking_id);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings,
  kind text NOT NULL DEFAULT 'rental' CHECK (kind IN ('rental','deposit','deposit_refund','fee','refund')),
  method text NOT NULL DEFAULT 'upi' CHECK (method IN ('cash','card','upi','bank_transfer','cheque')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),                      -- always positive; kind sets direction
  reference text, paid_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES users ON DELETE SET NULL);
CREATE INDEX ON payments (booking_id);

CREATE TABLE deliveries (                          -- transport to / from the venue
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','pickup')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_transit','delivered','failed','cancelled')),
  driver_id uuid REFERENCES users ON DELETE SET NULL, vehicle text,
  scheduled_at timestamptz, completed_at timestamptz,
  address text NOT NULL, contact_name text, contact_phone text,
  proof_url text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON deliveries (booking_id);
CREATE INDEX ON deliveries (driver_id, status);

-- ---------- maintenance, notifications, audit ----------
CREATE TABLE work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units,
  type text NOT NULL DEFAULT 'repair' CHECK (type IN ('preventive','repair','inspection','calibration')),
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','scheduled','in_progress','completed','cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  title text NOT NULL, description text,
  reported_by uuid REFERENCES users ON DELETE SET NULL, assigned_to uuid REFERENCES users ON DELETE SET NULL,
  scheduled_for timestamptz, started_at timestamptz, completed_at timestamptz,
  cost numeric(12,2) CHECK (cost >= 0), condition_after text CHECK (condition_after IN ('new','good','fair')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON work_orders (unit_id);
CREATE INDEX ON work_orders (status, priority) WHERE status IN ('reported','scheduled','in_progress');

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('return_due','return_overdue','low_stock','maintenance_due','booking','delivery','system')),
  title text NOT NULL, body text, payload jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON notifications (user_id, created_at DESC);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES users ON DELETE SET NULL,
  action text NOT NULL, entity text NOT NULL, entity_id text,
  old_values jsonb, new_values jsonb, changed text[]);
CREATE INDEX ON audit_logs (entity, entity_id, at DESC);
CREATE INDEX ON audit_logs USING brin (at);

-- ---------- business rules ----------
-- Free units of an item in a window (retired/lost never count; maintenance uses reservations)
CREATE FUNCTION fn_available(p_item uuid, p_from timestamptz, p_to timestamptz) RETURNS int
LANGUAGE sql STABLE AS $$
  SELECT greatest((SELECT count(*) FROM units WHERE item_id = p_item AND status NOT IN ('retired','lost'))
       - coalesce((SELECT sum(quantity) FROM reservations
                    WHERE item_id = p_item AND active AND period && tstzrange(p_from, p_to)), 0), 0)::int $$;

-- Hard stop on over-booking (serialised per item)
CREATE FUNCTION fn_reservation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE free int;
BEGIN
  IF NOT NEW.active THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.item_id::text, 0));
  SELECT (SELECT count(*) FROM units WHERE item_id = NEW.item_id AND status NOT IN ('retired','lost'))
       - coalesce(sum(quantity), 0) INTO free
    FROM reservations WHERE item_id = NEW.item_id AND active AND id <> NEW.id AND period && NEW.period;
  IF NEW.quantity > free THEN
    RAISE EXCEPTION 'Only % unit(s) free for item % in that period (requested %)', greatest(free,0), NEW.item_id, NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_reservation_guard BEFORE INSERT OR UPDATE OF quantity, period, active, item_id
  ON reservations FOR EACH ROW EXECUTE FUNCTION fn_reservation_guard();

-- bookings.subtotal follows booking_items
CREATE FUNCTION fn_sync_subtotal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b uuid := coalesce(NEW.booking_id, OLD.booking_id);
BEGIN
  UPDATE bookings SET subtotal = (SELECT coalesce(sum(line_total), 0) FROM booking_items WHERE booking_id = b) WHERE id = b;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_sync_subtotal AFTER INSERT OR UPDATE OR DELETE ON booking_items
  FOR EACH ROW EXECUTE FUNCTION fn_sync_subtotal();

-- draft -> confirmed (reserves stock) / cancel (releases it)
CREATE FUNCTION fn_confirm_booking(p_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE b bookings;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_id AND status = 'draft' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking % not found or not a draft', p_id; END IF;
  INSERT INTO reservations (item_id, booking_id, quantity, period)
    SELECT item_id, p_id, quantity, tstzrange(b.rental_start, b.rental_end) FROM booking_items WHERE booking_id = p_id;
  UPDATE bookings SET status = 'confirmed' WHERE id = p_id;
END $$;

CREATE FUNCTION fn_cancel_booking(p_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bookings SET status = 'cancelled' WHERE id = p_id AND status IN ('draft','confirmed');
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking % cannot be cancelled (missing, active or finished)', p_id; END IF;
  UPDATE reservations SET active = false WHERE booking_id = p_id;
END $$;

-- Check-out: scanning a unit onto a booking line
CREATE FUNCTION fn_check_out() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE st text; it uuid; b uuid;
BEGIN
  SELECT status, item_id INTO st, it FROM units WHERE id = NEW.unit_id FOR UPDATE;
  IF st IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'Unit % is not available (status: %)', NEW.unit_id, coalesce(st, 'unknown') USING ERRCODE = 'check_violation'; END IF;
  SELECT booking_id INTO b FROM booking_items WHERE id = NEW.booking_item_id AND item_id = it;
  IF b IS NULL THEN RAISE EXCEPTION 'Unit % does not match booking line %', NEW.unit_id, NEW.booking_item_id USING ERRCODE = 'check_violation'; END IF;
  UPDATE units SET status = 'rented', location = NULL WHERE id = NEW.unit_id;
  UPDATE bookings SET status = 'active' WHERE id = b AND status = 'confirmed';
  RETURN NEW;
END $$;
CREATE TRIGGER trg_check_out BEFORE INSERT ON booking_units FOR EACH ROW EXECUTE FUNCTION fn_check_out();

-- Check-in: setting in_at/condition_in frees (or flags) the unit and advances the booking
CREATE FUNCTION fn_check_in() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b uuid; done boolean;
BEGIN
  IF OLD.in_at IS NOT NULL OR NEW.in_at IS NULL THEN RETURN NULL; END IF;
  UPDATE units SET status = CASE WHEN NEW.condition_in = 'damaged' THEN 'damaged' ELSE 'available' END,
                   condition = NEW.condition_in WHERE id = NEW.unit_id;
  SELECT booking_id INTO b FROM booking_items WHERE id = NEW.booking_item_id;
  SELECT NOT EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b AND bi.quantity >
           (SELECT count(*) FROM booking_units bu WHERE bu.booking_item_id = bi.id AND bu.in_at IS NOT NULL)) INTO done;
  UPDATE bookings SET status = CASE WHEN done THEN 'completed' ELSE 'partially_returned' END,
                      completed_at = CASE WHEN done THEN now() END WHERE id = b;
  IF done THEN UPDATE reservations SET active = false WHERE booking_id = b; END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_check_in AFTER UPDATE OF in_at ON booking_units FOR EACH ROW EXECUTE FUNCTION fn_check_in();

-- Work orders drive the unit status
CREATE FUNCTION fn_work_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'in_progress' THEN
    UPDATE units SET status = 'maintenance' WHERE id = NEW.unit_id AND status IN ('available','damaged');
    NEW.started_at := coalesce(NEW.started_at, now());
  ELSIF NEW.status = 'completed' THEN
    UPDATE units SET status = 'available', condition = coalesce(NEW.condition_after, 'good')
     WHERE id = NEW.unit_id AND status IN ('maintenance','damaged');
    NEW.completed_at := coalesce(NEW.completed_at, now());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_work_order BEFORE INSERT OR UPDATE OF status ON work_orders
  FOR EACH ROW EXECUTE FUNCTION fn_work_order();

-- Generic audit (password hashes masked, no-op updates skipped)
CREATE FUNCTION fn_audit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) - 'password_hash' END;
        n jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) - 'password_hash' END;
        ch text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key ORDER BY key) INTO ch FROM jsonb_each(n) WHERE key <> 'updated_at' AND o -> key IS DISTINCT FROM value;
    IF ch IS NULL THEN RETURN NULL; END IF;
  END IF;
  INSERT INTO audit_logs (user_id, action, entity, entity_id, old_values, new_values, changed)
  VALUES (nullif(current_setting('app.current_user_id', true), '')::uuid, lower(TG_OP), TG_TABLE_NAME,
          coalesce(n ->> 'id', o ->> 'id'), o, n, ch);
  RETURN NULL;
END $$;

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
            WHERE table_schema = 'public' AND column_name = 'updated_at' LOOP
    EXECUTE format('CREATE TRIGGER trg_upd BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['users','customers','items','units','bookings','booking_items','booking_units',
                           'payments','deliveries','work_orders'] LOOP
    EXECUTE format('CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_audit()', t);
  END LOOP;
END $$;

-- ---------- views for the app screens ----------
-- "Speakers: 10 of 20 available"; filter by category slug for the tabs
CREATE VIEW v_inventory AS
SELECT i.id AS item_id, i.sku, i.name, coalesce(i.short_name, i.name) AS short_name, i.icon, i.image_url,
       i.daily_rate, c.slug AS category,
       count(u.id) FILTER (WHERE u.status NOT IN ('retired','lost'))     AS total,
       count(u.id) FILTER (WHERE u.status = 'available')                 AS available,
       count(u.id) FILTER (WHERE u.status = 'rented')                    AS rented,
       count(u.id) FILTER (WHERE u.status IN ('maintenance','damaged'))  AS unavailable,
       count(u.id) FILTER (WHERE u.status = 'available') <= i.reorder_level AS low_stock
  FROM items i JOIN categories c ON c.id = i.category_id LEFT JOIN units u ON u.item_id = i.id
 WHERE i.is_active GROUP BY i.id, c.slug;

-- "Sharma Wedding - 4 Speakers - Due 6:00 PM today"
CREATE VIEW v_due_returns AS
SELECT b.id AS booking_id, b.number, coalesce(b.event_name, c.company, c.name) AS title, c.name AS customer,
       string_agg(bi.quantity || ' ' || coalesce(i.short_name, i.name), ', ' ORDER BY i.name) AS details,
       b.rental_end AS due_at,
       CASE WHEN b.rental_end < now() THEN 'overdue' WHEN x.d = 0 THEN 'today'
            WHEN x.d = 1 THEN 'tomorrow' ELSE 'upcoming' END AS due_status,
       'Due ' || to_char(b.rental_end AT TIME ZONE w.timezone, 'FMHH12:MI AM') ||
         CASE x.d WHEN 0 THEN ' today' WHEN 1 THEN ' tomorrow'
                  ELSE ' on ' || to_char(b.rental_end AT TIME ZONE w.timezone, 'DD Mon') END AS due_text
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id JOIN warehouses w ON w.id = b.warehouse_id
  JOIN booking_items bi ON bi.booking_id = b.id JOIN items i ON i.id = bi.item_id
  CROSS JOIN LATERAL (SELECT (b.rental_end AT TIME ZONE w.timezone)::date - (now() AT TIME ZONE w.timezone)::date AS d) x
 WHERE b.status IN ('active','partially_returned')
 GROUP BY b.id, c.id, w.timezone, x.d;

-- TOTAL / AVAILABLE / RENTED tiles + alert counts
CREATE VIEW v_dashboard AS
SELECT count(*) FILTER (WHERE status NOT IN ('retired','lost')) AS total,
       count(*) FILTER (WHERE status = 'available')             AS available,
       count(*) FILTER (WHERE status = 'rented')                AS rented,
       count(*) FILTER (WHERE status IN ('maintenance','damaged')) AS unavailable,
       (SELECT count(*) FROM v_due_returns WHERE due_status = 'today')   AS due_today,
       (SELECT count(*) FROM v_due_returns WHERE due_status = 'overdue') AS overdue
  FROM units;
COMMIT;