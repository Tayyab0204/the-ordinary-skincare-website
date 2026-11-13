-- Cloudflare D1 schema. Run once in: Cloudflare dashboard > Storage & Databases > D1 > your database > Console
-- (paste everything below and run).

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,          -- e.g. TO-1A2B3C4D5E6F
  placed_at   TEXT NOT NULL,             -- ISO time
  status      TEXT NOT NULL DEFAULT 'new', -- new / confirmed / shipped / delivered / cancelled (edit in the D1 dashboard)
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  postal      TEXT,
  note        TEXT,
  items       TEXT NOT NULL,             -- JSON: [{sku,size,qty,unit,unit_paid}]
  free_items  TEXT,                      -- JSON: free serum given with the order
  gross       REAL NOT NULL,
  discount    REAL NOT NULL,
  subtotal    REAL NOT NULL,
  shipping    REAL NOT NULL,
  total       REAL NOT NULL,
  payment     TEXT NOT NULL DEFAULT 'cod'
);
CREATE INDEX IF NOT EXISTS idx_orders_placed ON orders(placed_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  product     TEXT NOT NULL,             -- product id, e.g. niacinamide-10-zinc-1
  created_at  TEXT NOT NULL,
  name        TEXT NOT NULL,
  rating      INTEGER NOT NULL,
  text        TEXT NOT NULL,
  age         INTEGER NOT NULL,
  texture     TEXT NOT NULL,
  skin        TEXT NOT NULL,
  photo       TEXT NOT NULL,
  token_hash  TEXT NOT NULL,             -- lets the writer remove their own review
  ip_hash     TEXT NOT NULL              -- only used to limit spam (3 reviews / hour)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  topic       TEXT,
  message     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_at DESC);

CREATE TABLE IF NOT EXISTS subscribers (
  email         TEXT PRIMARY KEY,
  subscribed_at TEXT NOT NULL
);
