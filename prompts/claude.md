Here’s your **unified master prompt for Claude** (Option C, with DB + audit + Knex) – you can copy-paste this directly.

---

### 💬 Claude Prompt – OSIA UIN Generator Engine + PostgreSQL + PM2 Service (Node.js 22 + Knex)

You are an expert backend engineer and architect, specializing in:

* **Node.js 22.x**
* **PostgreSQL (13+) with Knex**
* **Cryptography & identity systems (OSIA, UIN, tokenization)**
* **PM2-based microservices**

Your task is to design and implement a **complete, production-grade UIN Generator Engine** with:

1. A **Node.js 22.x codebase** (ESM) implementing a UIN Generator Engine.
2. A **PostgreSQL backend** in database `osia_dev` with:

   * `uin_pool` (core lifecycle table)
   * `uin_audit` (full audit logging).
3. A **CLI tool** to generate UINs and pre-fill the pool.
4. A **PM2-managed HTTP API endpoint** (not auto-started) that exposes OSIA-like endpoints for:

   * Generating UINs on demand.
   * Pre-generating UINs into the pool.
   * Claiming/pre-assigning a UIN.
   * Assigning a UIN.
   * Releasing stale pre-assignments.
   * Retiring/revoking UINs.
5. Clean, well-structured code with **Knex** for DB access and **Node’s crypto** for CSPRNG + hashing.

You must **not hallucinate libraries**. Prefer built-in Node modules and widely used, mainstream packages only.

---

## 0. Environment & Global Constraints

* Runtime: **Node.js 22.x**
* Module system: **ESM** (`"type": "module"` in `package.json`).
* Package manager: ok to show `npm` commands; user may translate to Yarn later.
* OS: Linux (Ubuntu-like).
* Process manager: **PM2** (no auto-start; user will start manually).
* Database:

  * **PostgreSQL** instance with a database called **`osia_dev`**.
  * Assume standard connectivity via host/port/user/password env vars.
* No Docker/Kubernetes in this prompt (this is a host-based dev service).
* Logging: console logging is fine (structured logs preferred but lightweight).
* No hard-coded secrets or hosts – read configuration from environment variables or a small config file.

---

## 1. PostgreSQL Schema (Database: `osia_dev`)

Use Knex migrations or at least provide **complete SQL** to create the schema.

### 1.1 UIN status enum

Create a custom type to represent UIN lifecycle states:

```sql
CREATE TYPE uin_status AS ENUM (
  'AVAILABLE',    -- pre-generated, not yet claimed
  'PREASSIGNED',  -- claimed by external system, not yet bound to PII
  'ASSIGNED',     -- bound to a PII record in Civil/Population Registry
  'RETIRED',      -- no longer in use (death, end-of-life)
  'REVOKED'       -- explicitly revoked (fraud, abuse, etc.)
);
```

### 1.2 Core table: `uin_pool`

```sql
CREATE TABLE uin_pool (
  uin              VARCHAR(32) PRIMARY KEY,   -- the UIN string itself
  mode             TEXT NOT NULL,            -- "random" | "structured" | "foundational" | "sector_token"
  scope            TEXT,                     -- sector/purpose (e.g. foundational, health, tax, finance)

  iat              TIMESTAMPTZ NOT NULL DEFAULT now(),  -- issued at (when generated)
  nbf              TIMESTAMPTZ,                           -- not before (valid from)
  exp              TIMESTAMPTZ,                           -- expiry (if any)
  status           uin_status NOT NULL DEFAULT 'AVAILABLE',
  ts               TIMESTAMPTZ NOT NULL DEFAULT now(),   -- last status change timestamp

  hash_rmd160      CHAR(40) NOT NULL,                    -- RIPEMD-160 hash (hex) of UIN or UIN+salt
  cert_pem         TEXT,                                 -- optional certificate or binding artifact (PEM)

  claimed_by       TEXT,         -- system/client that pre-assigned (e.g. 'CIVIL_REGISTRY')
  claimed_at       TIMESTAMPTZ,  -- when status became PREASSIGNED

  assigned_to_ref  TEXT,         -- external reference ID (civil registry ID, person ID, etc.)
  assigned_at      TIMESTAMPTZ,  -- when status became ASSIGNED

  meta             JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_uin_pool_status ON uin_pool(status);
CREATE INDEX idx_uin_pool_scope_status ON uin_pool(scope, status);
CREATE INDEX idx_uin_pool_claimed_by_status ON uin_pool(claimed_by, status);
CREATE INDEX idx_uin_pool_exp ON uin_pool(exp);
```

### 1.3 Audit table: `uin_audit`

Create a separate table for **immutable audit logging** of all lifecycle changes and major operations:

```sql
CREATE TABLE uin_audit (
  id               BIGSERIAL PRIMARY KEY,
  uin              VARCHAR(32) NOT NULL,
  event_type       TEXT NOT NULL,       -- e.g. 'GENERATED', 'PREASSIGNED', 'ASSIGNED', 'RELEASED', 'RETIRED', 'REVOKED'
  old_status       uin_status,
  new_status       uin_status,
  actor_system     TEXT,                -- caller / system identifier
  actor_ref        TEXT,                -- external case/transaction reference if any
  details          JSONB DEFAULT '{}'::JSONB, -- additional context (IP, reason, etc.)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uin_audit_uin ON uin_audit(uin);
CREATE INDEX idx_uin_audit_event_type ON uin_audit(event_type);
CREATE INDEX idx_uin_audit_created_at ON uin_audit(created_at);
```

For every significant change to `uin_pool.status` or assignments, write a corresponding row in `uin_audit`.

---

## 2. UIN Generator Engine – Functional Requirements

Implement a **UIN Generator Engine** that supports multiple modes and integrates with the DB.

### 2.1 Core concepts

* **Foundational UIN**

  * Lifelong, single-per-person identifier.
  * By default, **no embedded PII**.
  * High entropy, globally unique.

* **Sector Token**

  * Derived from foundational UIN for a specific **sector scope**:

    * Examples: `health`, `tax`, `finance`, `telco`, `stats`.
  * Should be unlinkable across sectors without access to secret/key.
  * Rotatable; old tokens can be revoked and new ones issued.

* **CSPRNG requirement**

  * MUST use a **cryptographically secure PRNG**, NOT `Math.random()`.
  * Use Node 22’s crypto APIs:

    * `crypto.randomBytes()` or `crypto.webcrypto.getRandomValues()`.
  * Guarantee high entropy.

* **Checksum**

  * Optional but supported.
  * Provide at least:

    * A simple **mod N** checksum.
    * A pluggable hook for a more formal algorithm (e.g. simplified ISO 7064).
  * Ability to append checksum to base value and verify it.

* **Hashing**

  * Compute `hash_rmd160` as something like:

    ```js
    hash_rmd160 = RIPEMD160(SHA3-256(UIN + optional_salt))
    ```

  * Use Node’s `crypto` module.

  * Store 40-char hex string.

### 2.2 Supported generation modes

Implement a main function, e.g.:

```ts
generateUin(options: UinGenerationOptions): GeneratedUinResult
```

Where (TypeScript-style types for clarity):

```ts
type UinGenerationOptions = {
  mode: "random" | "structured" | "foundational" | "sector_token";

  // Shared options
  length?: number;
  charset?: string;          // e.g. "A-Z0-9" interpreted in code
  excludeAmbiguous?: boolean; // drop I,O,0,1 if true
  checksum?: {
    enabled: boolean;
    algorithm: "modN" | "iso7064";
    [key: string]: unknown;
  };

  // Structured (PII-light) mode
  template?: string;         // e.g. "RR-YYYY-FFF-NNNNN"
  values?: Record<string, string | number>;
  randomSegments?: Record<string, { length: number; charset: string }>;

  // Sector token mode
  foundationalUin?: string;
  sector?: string;
  tokenLength?: number;

  // DB integration flags
  persistToDb?: boolean;   // if true, insert into uin_pool as AVAILABLE
  scope?: string;          // when persisting, used as scope
};

type GeneratedUinResult = {
  value: string;          // final UIN/token string
  mode: string;
  rawComponents?: Record<string, string>;
  checksum?: {
    used: boolean;
    algorithm?: string;
    value?: string;
  };
  hash_rmd160: string;
};
```

#### Mode 1: Fully Random (`"random"`)

* CSPRNG-only.
* Configurable length (e.g. 8–32).
* Configurable charset (`0-9`, `A-Z0-9`, etc.).
* Option to exclude ambiguous chars.
* Optional checksum.

#### Mode 2: PII-Structured (`"structured"`)

* Non-sensitive, pattern-based.
* Example template: `RR-YYYY-FFF-NNNNN`.

  * `RR`: region.
  * `YYYY`: year (birth year or registration year).
  * `FFF`: facility code.
  * `NNNNN`: random digits from CSPRNG.
* Use a small template engine:

  * Replace named placeholders with provided values.
  * Generate random segments where specified.
* Still compute `hash_rmd160`.

#### Mode 3: Sector Token (`"sector_token"`)

* Input: foundationalUin + sector.

* Use a **keyed derivation** (HMAC-based):

  ```js
  token = HMAC(secretForSector, foundationalUin + ":" + sector + ":" + optionalSalt)
  ```

* Derive a token string of specified length/charset.

* The secret per sector should come from env/config (dev-safe; real secret management can come later).

* Do **not** store tokens by default unless `persistToDb` is true.

#### Mode 4: Foundational (`"foundational"`)

* Recommended default mode for main UIN assignment.
* Purely random (no PII) but with optional checksum and constraints.
* Suitable defaults:

  * Length: 19.
  * Charset: A–Z + 0–9 (optionally excluding ambiguous chars).
  * Checksum: e.g. 1–2 chars using `modN` or simplified `iso7064`.

---

## 3. Node.js Project Structure

Create this structure under:

`/scripts/dev/osia/uin-generator`

```text
/scripts/dev/osia/uin-generator/
  package.json
  knexfile.mjs          # or knex config in src/db.mjs
  README.md

  src/
    config.mjs          # load env, build config object
    db.mjs              # Knex setup & exports
    checksum.mjs        # checksums & helpers
    hash.mjs            # RIPEMD160/SHA3-based hash helpers
    sectorToken.mjs     # sector token derivation
    uinGenerator.mjs    # core generation engine
    poolService.mjs     # DB operations on uin_pool + uin_audit
    cli.mjs             # command-line tool for generation/pre-generation
    server.mjs          # HTTP API for PM2 endpoint

  migrations/
    001_init_schema.sql # OR a set of Knex migrations (explain clearly)

  ecosystem.config.cjs  # PM2 config
```

Use ES modules in the `src/*.mjs` files, and Knex with a standard Postgres client.

---

## 4. Knex + Database Integration

### 4.1 Knex config (`db.mjs` or `knexfile.mjs`)

* Use environment variables:

  * `OSIA_DB_HOST`
  * `OSIA_DB_PORT`
  * `OSIA_DB_USER`
  * `OSIA_DB_PASSWORD`
  * `OSIA_DB_NAME` (default to `osia_dev`)

* Example (ESM style):

```js
// src/db.mjs
import knex from 'knex';
import { config } from './config.mjs';

export const db = knex({
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  },
  pool: { min: 2, max: 10 },
});
```

### 4.2 `poolService.mjs` – DB Operations

Implement functions like:

```ts
// Pre-generate a batch of UINs into uin_pool
async function preGenerateUins({ count, mode, scope, options }): Promise<void>;

// Claim / preassign one AVAILABLE UIN
async function claimUin({ scope, clientId }): Promise<UinPoolRow | null>;

// Confirm assignment (PREASSIGNED → ASSIGNED)
async function assignUin({ uin, assignedToRef, actorSystem, actorRef }): Promise<UinPoolRow | null>;

// Release PREASSIGNED UIN back to AVAILABLE
async function releaseUin({ uin, actorSystem, actorRef }): Promise<UinPoolRow | null>;

// Retire/revoke UIN (e.g. after death)
async function updateUinStatus({ uin, newStatus, reason, actorSystem, actorRef }): Promise<UinPoolRow | null>;

// Background cleanup: release stale PREASSIGNED
async function releaseStalePreassigned({ olderThanMinutes }): Promise<number>;
```

Each function must:

1. Use **transactions** where appropriate.
2. Update `uin_pool`.
3. Insert an entry into `uin_audit` with:

   * `uin`
   * `event_type` (e.g. "GENERATED", "PREASSIGNED", "ASSIGNED", "RELEASED", "STATUS_CHANGED")
   * `old_status` / `new_status`
   * `actor_system`, `actor_ref`
   * `details` (JSON) with any extra context.

### 4.3 Concurrency-safe claim (PREASSIGN)

Use the `FOR UPDATE SKIP LOCKED` pattern via Knex (or raw SQL) to ensure no duplicate claims:

Conceptual SQL:

```sql
WITH c AS (
  SELECT uin
  FROM uin_pool
  WHERE status = 'AVAILABLE'
    AND (scope = $1 OR $1 IS NULL)
  ORDER BY iat
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE uin_pool up
SET status     = 'PREASSIGNED',
    claimed_by = $2,
    claimed_at = now(),
    ts         = now()
FROM c
WHERE up.uin = c.uin
RETURNING up.*;
```

Implement this using Knex `.raw()` or transaction + `FOR UPDATE SKIP LOCKED`.

---

## 5. Hash & Checksum Helpers

### 5.1 Hash helper (`hash.mjs`)

Implement a helper function such as:

```js
import crypto from 'crypto';

export function computeUinHash(uin, salt = '') {
  const inner = crypto.createHash('sha3-256')
    .update(uin + salt, 'utf8')
    .digest();
  return crypto.createHash('ripemd160')
    .update(inner)
    .digest('hex');  // 40-char hex
}
```

* Always compute `hash_rmd160` and store it in `uin_pool.hash_rmd160`.

### 5.2 Checksum helper (`checksum.mjs`)

Implement:

```js
export function computeModNChecksum(input, modulus) { /* ... */ }
export function appendChecksum(base, options) { /* ... */ }
export function verifyChecksum(valueWithChecksum, options) { /* ... */ }
```

At minimum:

* A simple `modN` checksum (e.g. sum of char codes mod N).
* A pluggable hook for `iso7064` (you can implement a simplified variant and clearly document the variant in comments).

---

## 6. CLI Tool (`src/cli.mjs`)

Implement a CLI that wraps `generateUin()` and optional DB writes.

Examples:

```bash
# Generate a foundational UIN and print to stdout
node src/cli.mjs --mode foundational --length 19

# Generate a random UIN with checksum and print JSON
node src/cli.mjs --mode random --length 16 --checksum iso7064 --json

# Pre-generate 10,000 AVAILABLE foundational UINs into uin_pool
node src/cli.mjs pre-generate \
  --count 10000 \
  --mode foundational \
  --scope foundational \
  --length 19
```

Requirements:

* Use either simple `process.argv` parsing or a minimal dependency like `commander` or `yargs`.
* Support a `--json` flag to output `GeneratedUinResult` plus DB metadata in JSON.

---

## 7. HTTP API (PM2 Endpoint – `src/server.mjs`)

Implement a small HTTP API using **Express or Fastify** (your choice; pick one mainstream library).

### 7.1 Basic endpoints

Implement at least the following endpoints:

1. `GET /health`

   * Returns `{ status: "ok" }` or similar.

2. `POST /uin/generate`

   * Body: `UinGenerationOptions` (without DB persistence by default).
   * Behavior:

     * Calls `generateUin()`.
     * Does **not** write to DB unless `persistToDb: true` is passed.
   * Returns: `GeneratedUinResult`.

3. `POST /uin/pre-generate`

   * Body: `{ count, mode, scope, options }`.
   * Behavior:

     * Generate `count` UINs.
     * Insert them into `uin_pool` with `status='AVAILABLE'`.
     * Insert audit rows with `event_type='GENERATED'`.
   * Returns summary: `{ inserted: N }`.

4. `POST /uin/claim`

   * Body: `{ scope, client_id }`.
   * Behavior:

     * Uses the concurrency-safe claim logic to move one UIN from `AVAILABLE` → `PREASSIGNED`.
     * Writes an audit row `event_type='PREASSIGNED'`.
   * Returns: UIN record or 404-like if none is available.

5. `POST /uin/assign`

   * Body: `{ uin, assigned_to_ref, actor_system, actor_ref }`.
   * Behavior:

     * Only allow if current status is `PREASSIGNED`.
     * Update to `ASSIGNED`, set `assigned_to_ref`, `assigned_at`, update `ts`.
     * Write audit: `event_type='ASSIGNED'`.
   * Returns: updated UIN row or error.

6. `POST /uin/release`

   * Body: `{ uin, actor_system, actor_ref }`.
   * Behavior:

     * If status is `PREASSIGNED`, set back to `AVAILABLE`, clear `claimed_*`.
     * Audit: `event_type='RELEASED'`.
   * Returns: updated UIN row or error.

7. `POST /uin/status`

   * Body: `{ uin, new_status, reason, actor_system, actor_ref }`.
   * Behavior:

     * For transitions like `ASSIGNED → RETIRED` or `ASSIGNED → REVOKED`.
     * Update `uin_pool.status`.
     * Audit `event_type='STATUS_CHANGED'` or more specific like `RETIRED`, `REVOKED`.

8. `POST /uin/cleanup-preassigned`

   * Body: `{ older_than_minutes }`.
   * Behavior:

     * Find PREASSIGNED UINs whose `claimed_at` is older than threshold.
     * Set them back to `AVAILABLE`.
     * Write audit rows for each release (or aggregated if you prefer).
   * Returns: `{ released: N }`.

All endpoints should:

* Validate input and respond with:

  * `400` for invalid payloads.
  * `404` / `409` semantics where appropriate (e.g. status mismatch).
* Return JSON responses.

### 7.2 PM2 Config (`ecosystem.config.cjs`)

Create a PM2 ecosystem file with something like:

```js
module.exports = {
  apps: [
    {
      name: "osia-uin-generator-dev",
      script: "./src/server.mjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 19020,
        OSIA_DB_HOST: "127.0.0.1",
        OSIA_DB_PORT: 5432,
        OSIA_DB_USER: "osia_dev_user",
        OSIA_DB_PASSWORD: "change_me",
        OSIA_DB_NAME: "osia_dev"
      }
    }
  ]
};
```

**Important:**
Do **NOT** auto-start this service. The user will manually start it using:

```bash
cd /scripts/dev/osia/uin-generator
pm2 start ecosystem.config.cjs --only osia-uin-generator-dev
```

---

## 8. Testing & README

### 8.1 Minimal tests

Provide either:

* A simple test script `src/test.mjs` which:

  * Connects to DB.
  * Generates a few UINs on-demand.
  * Pre-generates some into `uin_pool`.
  * Claims one, assigns it, releases another.
  * Logs results to console.

Or a very lightweight test harness the user can run with:

```bash
node src/test.mjs
```

### 8.2 README.md

Document clearly:

* Project overview and purpose.
* Prerequisites:

  * Node.js 22
  * PostgreSQL database `osia_dev`
  * PM2
* Setup steps:

```bash
cd /scripts/dev/osia/uin-generator
npm install
# Run migrations or psql schema
node src/cli.mjs --mode foundational --length 19
pm2 start ecosystem.config.cjs --only osia-uin-generator-dev
```

* Example `curl` commands for:

  * `/health`
  * `/uin/generate`
  * `/uin/pre-generate`
  * `/uin/claim`
  * `/uin/assign`
  * `/uin/release`
  * `/uin/status`
  * `/uin/cleanup-preassigned`

* Security notes:

  * Uses CSPRNG, not `Math.random()`.
  * Uses RIPEMD160 over SHA3-256 of UIN+salt for `hash_rmd160`.
  * Sector secrets are dev-only, eventually to be moved to Vault/HSM.

---

## 9. Output Requirements

When you respond:

1. Start with a **file list** with brief descriptions.

2. Then provide **full source code** for each file, in this order:

   * `package.json`
   * `src/config.mjs`
   * `src/db.mjs`
   * `src/checksum.mjs`
   * `src/hash.mjs`
   * `src/sectorToken.mjs`
   * `src/uinGenerator.mjs`
   * `src/poolService.mjs`
   * `src/cli.mjs`
   * `src/server.mjs`
   * `migrations/001_init_schema.sql` (or equivalent Knex migration code)
   * `ecosystem.config.cjs`
   * `src/test.mjs` (optional but preferred)
   * `README.md`

3. Ensure the project is **consistent and runnable** with:

```bash
cd /scripts/dev/osia/uin-generator
npm install
# apply migrations / run SQL
node src/cli.mjs --mode foundational --length 19
pm2 start ecosystem.config.cjs --only osia-uin-generator-dev
```

4. Do **not** leave TODOs like “implement later”.
   All core logic — UIN generation, checksum, hashing, PostgreSQL integration, claim/assign/release/retire, audit logging — must be implemented.
