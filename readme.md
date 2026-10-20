# 🗄️ Rentory Database

PostgreSQL schema for **Rentory**, the inventory and rental dispatch system for AV, lighting and event equipment.

The whole database lives in one file, `schema.sql`, so you can set it up with a single command.

## 📁 Files

| File | Purpose |
| --- | --- |
| `schema.sql` | Tables, constraints, indexes, business-rule triggers and views |
| `seed.sql` | Optional development data (dev only, never load in production) |

## 🚀 Quick Start

**Requirements:** PostgreSQL 14 or newer (tested on 16). The extensions `pgcrypto`, `citext`, `pg_trgm` and `btree_gist` ship with the standard PostgreSQL contrib package.

```bash
createdb rentory
psql -d rentory -f apps/api/db/schema.sql
psql -d rentory -f apps/api/db/seed.sql   # optional sample data
```

Both files run inside a transaction, so a failure leaves nothing half-created.

To start over:

```bash
dropdb rentory && createdb rentory
```

**Sample logins** (seed data only): `admin@rentory.supply`, `manager@rentory.supply`, `sarah@rentory.supply`, `driver@rentory.supply`, `tech@rentory.supply`. The password for all of them is `ChangeMe!123`.

## 🧱 Tables (16)

| Area | Tables | What they hold |
| --- | --- | --- |
| People & places | `warehouses`, `users`, `auth_sessions`, `customers` | Staff accounts, refresh tokens, clients |
| Inventory | `categories`, `items`, `units` | Catalog entries (what customers rent) and the physical, QR-scannable assets |
| Bookings | `bookings`, `booking_items`, `booking_units`, `reservations`, `payments` | Rentals, requested lines, units actually scanned out and in, stock holds, money |
| Logistics | `deliveries` | Transport to and from the venue |
| Operations | `work_orders`, `notifications`, `audit_logs` | Maintenance, alerts, change history |

### Relationships

```
customers ──< bookings >── warehouses
                │
                ├──< booking_items >── items >── categories
                │         │              │
                │         └──< booking_units >── units   (check-out / check-in)
                │
                ├──< reservations >── items              (stock holds by time window)
                ├──< payments
                └──< deliveries >── users (driver)

units ──< work_orders        users ──< auth_sessions / notifications
```

- `items` is the **catalog entry** (JBL EON 15" Speakers). `units` are the **physical assets** (SPK-0001 to SPK-0020). Each unit's `asset_tag` is what the QR or barcode encodes.
- `booking_items` is what the customer **asked for** (4 speakers). `booking_units` is what **actually left** the warehouse. One row covers both check-out (`out_*` columns) and check-in (`in_*` columns).

## ⚙️ Rules the database enforces

The database protects its own data, so every client (mobile, web, API) gets the same behaviour.

- **No over-booking.** Inserting into `reservations` fails if it would exceed the units available in that time window.
- **No double check-out.** A unit that is already out can't be scanned onto another booking.
- **Wrong-item protection.** A unit must match the item on the booking line it is scanned against.
- **Automatic check-in.** Setting `in_at` and `condition_in` on a `booking_units` row:
  - returns the unit to `available` (or `damaged` if it came back damaged),
  - moves the booking to `partially_returned`, then `completed` when every unit is back,
  - releases its reservations.
- **Work orders drive unit status.** `in_progress` puts the unit in `maintenance`, `completed` returns it to `available`.
- **Automatic totals.** `bookings.subtotal` follows `booking_items`, and `total` and `line_total` are generated columns.
- **Audit trail.** Changes to users, customers, items, units, bookings, booking_items, booking_units, payments, deliveries and work_orders are logged in `audit_logs`. Password hashes are masked and no-op updates are skipped.

## 🔧 Helper functions

| Function | Use |
| --- | --- |
| `fn_confirm_booking(booking_id)` | Draft to confirmed, and reserves the stock |
| `fn_cancel_booking(booking_id)` | Cancels a draft or confirmed booking and releases the stock |
| `fn_available(item_id, from, to)` | Units free for an item in a time window |

## 📊 Views for the app screens

| View | Powers |
| --- | --- |
| `v_inventory` | Inventory list with `available` / `total`, stock bars, low-stock flag and category slug for the filter tabs |
| `v_due_returns` | "Upcoming return" card, for example *Sharma Wedding · 4 Speakers · Due 6:00 PM today* |
| `v_dashboard` | TOTAL / AVAILABLE / RENTED tiles, plus due-today and overdue counts |

```sql
SELECT short_name, available, total FROM v_inventory WHERE category = 'audio';
SELECT title, details, due_text FROM v_due_returns ORDER BY due_at;
SELECT * FROM v_dashboard;
```

## 🔌 Using it from the API

To attribute audit entries to the logged-in user, set this at the start of each request transaction:

```sql
SET LOCAL app.current_user_id = '<user-uuid>';
```

Typical flows:

```sql
-- Confirm a booking (reserves stock)
SELECT fn_confirm_booking('<booking-uuid>');

-- Scan a unit out
INSERT INTO booking_units (booking_item_id, unit_id, out_by)
VALUES ('<booking-item-uuid>', '<unit-uuid>', '<user-uuid>');

-- Scan a unit back in
UPDATE booking_units
   SET in_at = now(), condition_in = 'good', in_by = '<user-uuid>'
 WHERE unit_id = '<unit-uuid>' AND in_at IS NULL;
```

## 📝 Design notes

- **UUID primary keys** and `timestamptz` everywhere.
- **Money** is `NUMERIC(12,2)`. Payment amounts are always positive and `kind` sets the direction.
- **Statuses** are `CHECK` constraints rather than enum types, so adding a value is a one-line change.
- **`booking_items.unit_rate`** is a price snapshot, so old bookings keep their original price when catalog rates change.
- **Deliberately left out** to stay small: invoices, saved reports and AI tables. Payments attach to the booking. Add them as new tables when needed.

## 🔄 Changing the schema later

`schema.sql` is the full current schema for new setups. Once the database holds real data, don't re-run it. Put changes in Alembic migrations (`apps/api/src/migrations`) and keep `schema.sql` updated as the reference.
