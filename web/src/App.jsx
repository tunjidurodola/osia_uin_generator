import { useState, useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';
import './App.css';

// Initialize mermaid with sky theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#87CEEB',
    primaryTextColor: '#1a1a2e',
    primaryBorderColor: '#5BA4CF',
    secondaryColor: '#E0F4FF',
    tertiaryColor: '#F0F8FF',
    lineColor: '#5BA4CF',
    textColor: '#1a1a2e',
    mainBkg: '#E0F4FF',
    nodeBorder: '#5BA4CF',
    clusterBkg: '#F0F8FF',
    clusterBorder: '#87CEEB',
    titleColor: '#1a1a2e',
    edgeLabelBackground: '#ffffff',
    nodeTextColor: '#1a1a2e',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

// Mermaid Diagram Component
function MermaidDiagram({ chart, title }) {
  const containerRef = useRef(null);
  const uniqueId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart || !containerRef.current) return;

      try {
        // Clear previous content
        setSvg('');
        setError(null);

        const id = `mermaid-${uniqueId}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart, uniqueId]);

  return (
    <div className="mermaid-diagram" ref={containerRef}>
      {title && <div className="diagram-title">{title}</div>}
      {error ? (
        <div className="diagram-error">
          <span className="error-icon">!</span>
          <span>Diagram rendering failed: {error}</span>
          <pre className="diagram-source">{chart}</pre>
        </div>
      ) : svg ? (
        <div
          className="diagram-content"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="diagram-loading">Loading diagram...</div>
      )}
    </div>
  );
}

const API_BASE_URL = '/api';
const OSIA_LOGO_URL = 'https://mma.prnewswire.com/media/2394623/OSIA_Logo.jpg';

// Tab component
function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Pool Statistics Dashboard Component
function PoolDashboard() {
  const [scope, setScope] = useState('foundational');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-generation state
  const [pregenCount, setPregenCount] = useState(100);
  const [pregenMode, setPregenMode] = useState('foundational');
  const [pregenScope, setPregenScope] = useState('foundational');
  const [pregenLength, setPregenLength] = useState(19);
  const [pregenResult, setPregenResult] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/pool/stats?scope=${scope}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const preGenerateUins = async () => {
    setLoading(true);
    setError(null);
    setPregenResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/uin/pre-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(pregenCount),
          mode: pregenMode,
          scope: pregenScope,
          options: {
            length: parseInt(pregenLength),
            excludeAmbiguous: true
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setPregenResult(data.result);
        fetchStats();
      } else {
        setError(data.error || 'Pre-generation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      {/* Statistics Section */}
      <div className="section-card">
        <div className="section-header">
          <h2>Pool Statistics</h2>
          <p className="section-description">View UIN pool statistics by scope</p>
        </div>

        <div className="stats-controls">
          <div className="form-inline">
            <label>Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="input-select">
              <option value="">All Scopes</option>
              <option value="foundational">Foundational</option>
              <option value="health">Health</option>
              <option value="tax">Tax</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
            </select>
          </div>
          <button onClick={fetchStats} disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : 'Refresh Statistics'}
          </button>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">T</div>
              <div className="stat-info">
                <div className="stat-value">{stats.total?.toLocaleString() || 0}</div>
                <div className="stat-label">Total UINs</div>
              </div>
            </div>
            <div className="stat-card stat-available">
              <div className="stat-icon">A</div>
              <div className="stat-info">
                <div className="stat-value">{stats.available?.toLocaleString() || 0}</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
            <div className="stat-card stat-preassigned">
              <div className="stat-icon">P</div>
              <div className="stat-info">
                <div className="stat-value">{stats.preassigned?.toLocaleString() || 0}</div>
                <div className="stat-label">Pre-assigned</div>
              </div>
            </div>
            <div className="stat-card stat-assigned">
              <div className="stat-icon">U</div>
              <div className="stat-info">
                <div className="stat-value">{stats.assigned?.toLocaleString() || 0}</div>
                <div className="stat-label">Assigned</div>
              </div>
            </div>
            <div className="stat-card stat-retired">
              <div className="stat-icon">R</div>
              <div className="stat-info">
                <div className="stat-value">{stats.retired?.toLocaleString() || 0}</div>
                <div className="stat-label">Retired</div>
              </div>
            </div>
            <div className="stat-card stat-revoked">
              <div className="stat-icon">X</div>
              <div className="stat-info">
                <div className="stat-value">{stats.revoked?.toLocaleString() || 0}</div>
                <div className="stat-label">Revoked</div>
              </div>
            </div>
          </div>
        )}

        {!stats && !loading && (
          <div className="empty-state">
            <p>Click "Refresh Statistics" to load pool data</p>
          </div>
        )}
      </div>

      {/* Pre-generation Section */}
      <div className="section-card">
        <div className="section-header">
          <h2>Pre-generate UINs</h2>
          <p className="section-description">Batch generate UINs to populate the pool</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Count</label>
            <input
              type="number"
              value={pregenCount}
              onChange={(e) => setPregenCount(e.target.value)}
              min="1"
              max="10000"
              className="input-text"
            />
            <small className="help-text">Number of UINs to generate (1-10,000)</small>
          </div>
          <div className="form-group">
            <label>Mode</label>
            <select value={pregenMode} onChange={(e) => setPregenMode(e.target.value)} className="input-select">
              <option value="foundational">Foundational</option>
              <option value="random">Random</option>
            </select>
          </div>
          <div className="form-group">
            <label>Scope</label>
            <select value={pregenScope} onChange={(e) => setPregenScope(e.target.value)} className="input-select">
              <option value="foundational">Foundational</option>
              <option value="health">Health</option>
              <option value="tax">Tax</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div className="form-group">
            <label>Length</label>
            <input
              type="number"
              value={pregenLength}
              onChange={(e) => setPregenLength(e.target.value)}
              min="8"
              max="32"
              className="input-text"
            />
            <small className="help-text">Characters (8-32)</small>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={preGenerateUins} disabled={loading} className="btn-primary btn-large">
            {loading ? 'Generating...' : 'Generate UINs'}
          </button>
        </div>

        {pregenResult && (
          <div className="success-banner">
            <span className="success-icon">+</span>
            <div className="success-content">
              <strong>{pregenResult.inserted?.toLocaleString()} UINs generated successfully</strong>
              {pregenResult.errors > 0 && <span className="error-note">{pregenResult.errors} errors occurred</span>}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}
    </div>
  );
}

// Documentation Component
function Documentation() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'api', label: 'API Reference' },
    { id: 'lifecycle', label: 'UIN Lifecycle' },
    { id: 'security', label: 'Security' },
    { id: 'deployment', label: 'Deployment' },
  ];

  return (
    <div className="tab-content docs-tab">
      <div className="docs-layout">
        {/* Sidebar Navigation */}
        <nav className="docs-nav">
          <h3>Documentation</h3>
          <ul>
            {sections.map(s => (
              <li key={s.id}>
                <button
                  className={activeSection === s.id ? 'active' : ''}
                  onClick={() => setActiveSection(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="docs-meta">
            <small>Version 2.0.0</small>
          </div>
        </nav>

        {/* Content Area */}
        <div className="docs-content">
          {activeSection === 'overview' && (
            <article className="doc-article">
              <h1>OSIA UIN Generator</h1>
              <p className="lead">
                A production-grade, PostgreSQL-backed Unique Identification Number (UIN) generator
                based on the <strong>Open Standards for Identity APIs (OSIA)</strong> specification.
              </p>

              <h2>Key Features</h2>
              <ul className="feature-list">
                <li><strong>OSIA-Based Design</strong> - Implements POST /v1/uin endpoint pattern</li>
                <li><strong>Four Generation Modes</strong> - Foundational, Random, Structured, and Sector Token</li>
                <li><strong>PostgreSQL Pool Management</strong> - Pre-generation, claiming, and assignment workflows</li>
                <li><strong>Cryptographic Security</strong> - CSPRNG, HMAC-SHA256, RIPEMD-160 hashing</li>
                <li><strong>Complete Audit Trail</strong> - Immutable logging of all UIN lifecycle events</li>
                <li><strong>Sector Tokenization</strong> - Unlinkable, sector-specific derived identifiers</li>
                <li><strong>RFC 7519 JWT Support</strong> - Token-based UIN representation</li>
              </ul>

              <h2>Supported Sectors</h2>
              <div className="sector-grid">
                {['Health', 'Tax', 'Finance', 'Telco', 'Statistics', 'Education', 'Social', 'Government'].map(s => (
                  <span key={s} className="sector-badge">{s}</span>
                ))}
              </div>

              <h2>Technology Stack</h2>
              <table className="doc-table">
                <thead>
                  <tr><th>Layer</th><th>Technology</th></tr>
                </thead>
                <tbody>
                  <tr><td>Runtime</td><td>Node.js 20+</td></tr>
                  <tr><td>Server</td><td>Express.js 4.x</td></tr>
                  <tr><td>Database</td><td>PostgreSQL 15+</td></tr>
                  <tr><td>Query Builder</td><td>Knex.js 3.x</td></tr>
                  <tr><td>Frontend</td><td>React 18 + Vite</td></tr>
                  <tr><td>Process Manager</td><td>PM2</td></tr>
                </tbody>
              </table>

              <h2>Quick Start</h2>
              <pre className="code-block">{`# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start the API server
npm start

# Or use PM2 for production
pm2 start ecosystem.config.cjs`}</pre>
            </article>
          )}

          {activeSection === 'architecture' && (
            <article className="doc-article">
              <h1>System Architecture</h1>

              <h2>High-Level Overview</h2>
              <MermaidDiagram
                title="System Architecture"
                chart={`graph TB
    subgraph "Client Layer"
        WEB[Web UI<br/>React + Vite]
        EXT[External Systems<br/>Civil Registry / CRVS]
    end

    subgraph "API Layer"
        API[Express.js Server<br/>REST API]
        AUTH[Auth Middleware<br/>OAuth 2.0 / JWT]
    end

    subgraph "Business Logic"
        GEN[UIN Generator<br/>CSPRNG + Checksum]
        POOL[Pool Service<br/>Lifecycle Management]
        SECTOR[Sector Token<br/>HMAC Derivation]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>uin_pool + uin_audit)]
    end

    WEB --> API
    EXT --> API
    API --> AUTH
    AUTH --> GEN
    AUTH --> POOL
    AUTH --> SECTOR
    GEN --> DB
    POOL --> DB
    SECTOR --> GEN`}
              />

              <h2>Component Diagram</h2>
              <MermaidDiagram
                title="Component Architecture"
                chart={`flowchart LR
    server[server.mjs] --> gen[uinGenerator.mjs]
    server --> pool[poolService.mjs]
    gen --> check[checksum.mjs]
    gen --> hash[hash.mjs]
    gen --> sector[sectorToken.mjs]
    pool --> db[db.mjs]
    pool --> gen
    sector --> hash
    db --> config[config.mjs]`}
              />

              <h2>Database Schema</h2>
              <MermaidDiagram
                title="Entity Relationship Diagram"
                chart={`erDiagram
    uin_pool {
        varchar uin PK "Primary UIN"
        text mode "Generation mode"
        text scope "Sector scope"
        uin_status status "Lifecycle status"
        timestamptz iat "Issued at"
        timestamptz nbf "Not before"
        timestamptz exp "Expiry"
        char hash_rmd160 "RIPEMD-160 hash"
        text claimed_by "Claiming system"
        timestamptz claimed_at "Claim timestamp"
        text assigned_to_ref "External reference"
        timestamptz assigned_at "Assignment time"
        text transaction_id "OSIA transaction"
        jsonb attributes "Person attributes"
        jsonb meta "Additional metadata"
    }

    uin_audit {
        bigserial id PK "Audit record ID"
        varchar uin FK "UIN reference"
        text event_type "Event type"
        uin_status old_status "Previous status"
        uin_status new_status "New status"
        text actor_system "Actor system"
        text actor_ref "Actor reference"
        jsonb details "Event details"
        timestamptz created_at "Event timestamp"
    }

    uin_pool ||--o{ uin_audit : "has"`}
              />

              <h2>Generation Modes</h2>
              <table className="doc-table">
                <thead>
                  <tr><th>Mode</th><th>Description</th><th>Use Case</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>foundational</code></td>
                    <td>High-entropy CSPRNG, no embedded PII</td>
                    <td>Primary national ID, lifelong identifier</td>
                  </tr>
                  <tr>
                    <td><code>random</code></td>
                    <td>Configurable length, charset, checksum</td>
                    <td>Ad-hoc identifiers, testing</td>
                  </tr>
                  <tr>
                    <td><code>structured</code></td>
                    <td>Template-based with placeholders</td>
                    <td>Region/facility-encoded IDs</td>
                  </tr>
                  <tr>
                    <td><code>sector_token</code></td>
                    <td>HMAC-derived, unlinkable tokens</td>
                    <td>Health, tax, finance sector IDs</td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {activeSection === 'api' && (
            <article className="doc-article">
              <h1>API Reference</h1>

              <h2>Primary Endpoint</h2>
              <div className="endpoint-card primary">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/v1/uin</code>
                </div>
                <p>Generate a new UIN following the OSIA endpoint pattern.</p>

                <h4>Query Parameters</h4>
                <table className="doc-table">
                  <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>transactionId</code></td><td>string</td><td>Yes</td><td>Transaction identifier for tracking</td></tr>
                  </tbody>
                </table>

                <h4>Request Body</h4>
                <pre className="code-block">{`{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15"
}`}</pre>

                <h4>Response (200 OK)</h4>
                <pre className="code-block">{`"ABCD1234EFGH5678XYZ"`}</pre>

                <h4>Error Response</h4>
                <pre className="code-block">{`{
  "code": 400,
  "message": "Missing transactionId parameter"
}`}</pre>
              </div>

              <h2>Pool Management Endpoints</h2>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method get">GET</span>
                  <code>/pool/stats</code>
                </div>
                <p>Get pool statistics by scope.</p>
                <pre className="code-block">{`// Response
{
  "success": true,
  "stats": {
    "total": 10000,
    "available": 8500,
    "preassigned": 500,
    "assigned": 950,
    "retired": 45,
    "revoked": 5
  }
}`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/uin/pre-generate</code>
                </div>
                <p>Batch pre-generate UINs into the pool.</p>
                <pre className="code-block">{`// Request
{
  "count": 1000,
  "mode": "foundational",
  "scope": "foundational",
  "options": { "length": 19 }
}`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/uin/claim</code>
                </div>
                <p>Claim an available UIN (AVAILABLE → PREASSIGNED).</p>
                <pre className="code-block">{`// Request
{ "scope": "health", "client_id": "hospital-a" }

// Response
{
  "success": true,
  "result": {
    "uin": "ABCD1234EFGH5678XYZ",
    "status": "PREASSIGNED",
    "claimed_at": "2025-11-29T12:00:00Z"
  }
}`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/uin/assign</code>
                </div>
                <p>Assign UIN to external reference (PREASSIGNED → ASSIGNED).</p>
                <pre className="code-block">{`// Request
{
  "uin": "ABCD1234EFGH5678XYZ",
  "assigned_to_ref": "CR-2025-001234",
  "actor_system": "civil-registry",
  "actor_ref": "enrollment-123"
}`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method get">GET</span>
                  <code>/uin/:uin</code>
                </div>
                <p>Lookup UIN details by value.</p>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method get">GET</span>
                  <code>/uin/:uin/audit</code>
                </div>
                <p>Get complete audit trail for a UIN.</p>
              </div>

              <h2>Stateless Generation</h2>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/generate</code>
                </div>
                <p>Generate UIN without database persistence.</p>
                <pre className="code-block">{`// Request
{
  "mode": "foundational",
  "length": 19,
  "charset": "A-Z0-9",
  "checksum": { "enabled": true, "algorithm": "iso7064" }
}`}</pre>
              </div>
            </article>
          )}

          {activeSection === 'lifecycle' && (
            <article className="doc-article">
              <h1>UIN Lifecycle</h1>

              <h2>State Machine</h2>
              <MermaidDiagram
                title="UIN State Transitions"
                chart={`stateDiagram-v2
    [*] --> AVAILABLE: Pre-generate

    AVAILABLE --> PREASSIGNED: Claim
    PREASSIGNED --> AVAILABLE: Release
    PREASSIGNED --> ASSIGNED: Assign

    ASSIGNED --> RETIRED: Retire
    ASSIGNED --> REVOKED: Revoke

    RETIRED --> [*]
    REVOKED --> [*]

    note right of AVAILABLE: Pool of ready UINs
    note right of PREASSIGNED: Reserved, not yet bound
    note right of ASSIGNED: Bound to person/entity
    note right of RETIRED: End of life (death, etc.)
    note right of REVOKED: Fraud/abuse`}
              />

              <h2>Lifecycle States</h2>
              <table className="doc-table">
                <thead>
                  <tr><th>Status</th><th>Description</th><th>Transitions</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="status-badge available">AVAILABLE</span></td>
                    <td>Pre-generated, ready to be claimed</td>
                    <td>→ PREASSIGNED</td>
                  </tr>
                  <tr>
                    <td><span className="status-badge preassigned">PREASSIGNED</span></td>
                    <td>Claimed by system, not yet bound to PII</td>
                    <td>→ ASSIGNED, → AVAILABLE (release)</td>
                  </tr>
                  <tr>
                    <td><span className="status-badge assigned">ASSIGNED</span></td>
                    <td>Bound to a person/entity reference</td>
                    <td>→ RETIRED, → REVOKED</td>
                  </tr>
                  <tr>
                    <td><span className="status-badge retired">RETIRED</span></td>
                    <td>No longer active (death, end-of-life)</td>
                    <td>Terminal state</td>
                  </tr>
                  <tr>
                    <td><span className="status-badge revoked">REVOKED</span></td>
                    <td>Explicitly invalidated (fraud)</td>
                    <td>Terminal state</td>
                  </tr>
                </tbody>
              </table>

              <h2>Workflow: Civil Registration</h2>
              <MermaidDiagram
                title="Civil Registration Sequence"
                chart={`sequenceDiagram
    participant CR as Civil Registry
    participant API as OSIA UIN API
    participant DB as PostgreSQL

    Note over CR,DB: Birth Registration Flow

    CR->>API: POST /uin/claim {scope: foundational}
    API->>DB: SELECT ... FOR UPDATE SKIP LOCKED
    DB-->>API: UIN row (status: AVAILABLE)
    API->>DB: UPDATE status = PREASSIGNED
    API->>DB: INSERT audit (PREASSIGNED)
    API-->>CR: {uin: ABC123, status: PREASSIGNED}

    Note over CR: Collect person data

    CR->>API: POST /uin/assign {uin, assigned_to_ref}
    API->>DB: UPDATE status = ASSIGNED
    API->>DB: INSERT audit (ASSIGNED)
    API-->>CR: {success: true}

    Note over CR,DB: Death Registration Flow

    CR->>API: POST /uin/status {uin, new_status: RETIRED}
    API->>DB: UPDATE status = RETIRED
    API->>DB: INSERT audit (RETIRED)
    API-->>CR: {success: true}`}
              />

              <h2>Workflow: Sector Token Derivation</h2>
              <MermaidDiagram
                title="Sector Token Derivation"
                chart={`sequenceDiagram
    participant HS as Health System
    participant API as OSIA UIN API
    participant HMAC as HMAC-SHA256

    Note over HS,HMAC: Derive Health Sector Token

    HS->>API: POST /generate {mode: sector_token}
    API->>HMAC: HMAC(secret_health, UIN + salt)
    HMAC-->>API: Derived token bytes
    API->>API: Encode to charset
    API-->>HS: {token: HLTH-XXX-YYY-ZZZ}

    Note over HS,HMAC: Token is unlinkable to foundational UIN`}
              />
            </article>
          )}

          {activeSection === 'security' && (
            <article className="doc-article">
              <h1>Security</h1>

              <h2>Cryptographic Components</h2>
              <table className="doc-table">
                <thead>
                  <tr><th>Component</th><th>Algorithm</th><th>Purpose</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Random Generation</td>
                    <td>Node.js <code>crypto.randomBytes</code></td>
                    <td>CSPRNG for UIN generation</td>
                  </tr>
                  <tr>
                    <td>Integrity Hash</td>
                    <td>RIPEMD-160(SHA3-256(UIN+salt))</td>
                    <td>UIN integrity verification</td>
                  </tr>
                  <tr>
                    <td>Sector Derivation</td>
                    <td>HMAC-SHA256</td>
                    <td>Unlinkable sector tokens</td>
                  </tr>
                  <tr>
                    <td>Checksum</td>
                    <td>ISO 7064 MOD 37-2, MOD 97-10</td>
                    <td>Transcription error detection</td>
                  </tr>
                </tbody>
              </table>

              <h2>Sector Token Security</h2>
              <MermaidDiagram
                title="HMAC Token Derivation Flow"
                chart={`flowchart LR
    subgraph "Input"
        UIN[Foundational UIN]
        SECTOR[Sector Name]
        SECRET[Sector Secret]
        SALT[Random Salt]
    end

    subgraph "Process"
        CONCAT[Concatenate]
        HMAC[HMAC-SHA256]
        ENCODE[Base Encode]
    end

    subgraph "Output"
        TOKEN[Sector Token]
    end

    UIN --> CONCAT
    SECTOR --> CONCAT
    SALT --> CONCAT
    CONCAT --> HMAC
    SECRET --> HMAC
    HMAC --> ENCODE
    ENCODE --> TOKEN

    style SECRET fill:#ff6b6b,color:#fff
    style TOKEN fill:#51cf66,color:#fff`}
              />

              <h2>Security Best Practices</h2>
              <ul className="feature-list">
                <li><strong>Sector Secrets</strong> - Use unique, high-entropy secrets per sector (min 32 bytes)</li>
                <li><strong>Database Security</strong> - Row-level locking prevents race conditions</li>
                <li><strong>No PII in UIN</strong> - Foundational mode embeds no personal data</li>
                <li><strong>Constant-Time Comparison</strong> - Token verification uses timing-safe comparison</li>
                <li><strong>Audit Immutability</strong> - Audit records are append-only</li>
                <li><strong>TLS Everywhere</strong> - All API communications over HTTPS</li>
              </ul>

              <h2>Authentication (Production)</h2>
              <pre className="code-block">{`# OAuth 2.0 Bearer Token
Authorization: Bearer <access_token>

# Required scope for UIN generation
Scope: uin.generate

# JWT Claims verification
{
  "iss": "identity-provider",
  "aud": "osia-uin-api",
  "scope": "uin.generate",
  "exp": 1735500000
}`}</pre>
            </article>
          )}

          {activeSection === 'deployment' && (
            <article className="doc-article">
              <h1>Deployment</h1>

              <h2>Environment Variables</h2>
              <pre className="code-block">{`# Server Configuration
PORT=19020
HOST=0.0.0.0
NODE_ENV=production

# Database (PostgreSQL)
OSIA_DB_HOST=localhost
OSIA_DB_PORT=5432
OSIA_DB_USER=osia_user
OSIA_DB_PASSWORD=secure_password
OSIA_DB_NAME=osia_prod

# UIN Defaults
UIN_DEFAULT_LENGTH=19
UIN_DEFAULT_CHARSET=A-Z0-9
UIN_DEFAULT_MODE=foundational
UIN_CHECKSUM_ALGORITHM=iso7064

# Sector Secrets (CHANGE IN PRODUCTION!)
SECTOR_SECRET_HEALTH=<32+ byte secret>
SECTOR_SECRET_TAX=<32+ byte secret>
SECTOR_SECRET_FINANCE=<32+ byte secret>
# ... other sectors

# CORS
UIN_ENABLE_CORS=true
UIN_CORS_ORIGIN=https://your-domain.gov`}</pre>

              <h2>PM2 Deployment</h2>
              <pre className="code-block">{`# Start all services
pm2 start ecosystem.config.cjs

# Start API only
pm2 start ecosystem.config.cjs --only osia-uin-api-dev

# View logs
pm2 logs osia-uin-api-dev

# Monitor
pm2 monit

# Save process list
pm2 save

# Setup startup script
pm2 startup`}</pre>

              <h2>Docker Deployment</h2>
              <pre className="code-block">{`# PostgreSQL
docker run -d \\
  --name osia-postgres \\
  -e POSTGRES_DB=osia_prod \\
  -e POSTGRES_USER=osia_user \\
  -e POSTGRES_PASSWORD=secure_password \\
  -p 5432:5432 \\
  -v osia_data:/var/lib/postgresql/data \\
  postgres:15

# Run migrations
npm run migrate

# Start API server
npm start`}</pre>

              <h2>Deployment Architecture</h2>
              <MermaidDiagram
                title="Production Deployment"
                chart={`graph TB
    subgraph "Load Balancer"
        LB[nginx / HAProxy]
    end

    subgraph "Application Tier"
        API1[OSIA API Node 1]
        API2[OSIA API Node 2]
        API3[OSIA API Node 3]
    end

    subgraph "Database Tier"
        PG_PRIMARY[(PostgreSQL Primary)]
        PG_REPLICA[(PostgreSQL Replica)]
    end

    subgraph "Monitoring"
        PM2[PM2 Monitor]
        LOGS[Centralized Logs]
    end

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> PG_PRIMARY
    API2 --> PG_PRIMARY
    API3 --> PG_PRIMARY

    PG_PRIMARY --> PG_REPLICA

    API1 --> PM2
    API2 --> PM2
    API3 --> PM2

    API1 --> LOGS
    API2 --> LOGS
    API3 --> LOGS`}
              />

              <h2>Health Check</h2>
              <pre className="code-block">{`# API Health endpoint
GET /health

# Response
{
  "status": "healthy",
  "service": "osia-uin-generator",
  "version": "2.0.0",
  "database": "connected",
  "config": { "mode": "foundational", "length": 19 }
}`}</pre>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

// Security/Crypto Status Component
function SecurityStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/crypto/status`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="tab-content">
      <div className="section-card">
        <div className="section-header">
          <h2>Cryptographic Services Status</h2>
          <button onClick={fetchStatus} disabled={loading} className="btn-secondary">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}

        {status && (
          <div className="security-grid">
            {/* HSM Status Card */}
            <div className={`security-card ${status.hsm?.enabled ? 'enabled' : 'disabled'}`}>
              <div className="security-card-header">
                <h3>HSM</h3>
                <span className={`status-indicator ${status.hsm?.enabled ? 'active' : 'inactive'}`}>
                  {status.hsm?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="security-card-body">
                <div className="security-detail">
                  <span className="label">Mode</span>
                  <span className="value">{status.hsm?.mode || 'N/A'}</span>
                </div>
                <div className="security-detail">
                  <span className="label">Provider</span>
                  <span className="value">{status.hsm?.providerName || status.hsm?.provider || 'N/A'}</span>
                </div>
                <div className="security-detail">
                  <span className="label">Initialized</span>
                  <span className={`value ${status.hsm?.initialized ? 'yes' : 'no'}`}>
                    {status.hsm?.initialized ? 'Yes' : 'No'}
                  </span>
                </div>
                {status.hsm?.slot !== undefined && (
                  <div className="security-detail">
                    <span className="label">Slot</span>
                    <span className="value">{status.hsm?.slot}</span>
                  </div>
                )}
                {status.hsm?.keyLabel && (
                  <div className="security-detail">
                    <span className="label">Key Label</span>
                    <span className="value mono">{status.hsm?.keyLabel}</span>
                  </div>
                )}
              </div>
              <div className="security-card-footer">
                {status.hsm?.mode === 'hardware' ? (
                  <span className="security-badge hardware">Hardware Cryptography</span>
                ) : (
                  <span className="security-badge software">Software Fallback</span>
                )}
              </div>
            </div>

            {/* Vault Status Card */}
            <div className={`security-card ${status.vault?.enabled ? 'enabled' : 'disabled'}`}>
              <div className="security-card-header">
                <h3>HashiCorp Vault</h3>
                <span className={`status-indicator ${status.vault?.enabled ? 'active' : 'inactive'}`}>
                  {status.vault?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="security-card-body">
                <div className="security-detail">
                  <span className="label">Authenticated</span>
                  <span className={`value ${status.vault?.authenticated ? 'yes' : 'no'}`}>
                    {status.vault?.authenticated ? 'Yes' : 'No'}
                  </span>
                </div>
                {status.vault?.address && (
                  <div className="security-detail">
                    <span className="label">Address</span>
                    <span className="value mono">{status.vault?.address}</span>
                  </div>
                )}
              </div>
              <div className="security-card-footer">
                {status.vault?.authenticated ? (
                  <span className="security-badge connected">Connected</span>
                ) : status.vault?.enabled ? (
                  <span className="security-badge warning">Not Authenticated</span>
                ) : (
                  <span className="security-badge disabled">Disabled</span>
                )}
              </div>
            </div>

            {/* Secrets Status Card */}
            <div className={`security-card ${status.secretsLoaded > 0 ? 'enabled' : 'disabled'}`}>
              <div className="security-card-header">
                <h3>Sector Secrets</h3>
                <span className={`status-indicator ${status.secretsLoaded > 0 ? 'active' : 'inactive'}`}>
                  {status.secretsLoaded > 0 ? 'Loaded' : 'Not Loaded'}
                </span>
              </div>
              <div className="security-card-body">
                <div className="security-detail">
                  <span className="label">Secrets Count</span>
                  <span className="value">{status.secretsLoaded || 0}</span>
                </div>
                <div className="security-detail">
                  <span className="label">Source</span>
                  <span className="value">
                    {status.vault?.authenticated ? 'Vault' : 'Environment'}
                  </span>
                </div>
              </div>
              <div className="security-card-footer">
                {status.secretsLoaded >= 8 ? (
                  <span className="security-badge success">All Sectors Configured</span>
                ) : status.secretsLoaded > 0 ? (
                  <span className="security-badge warning">Partial Configuration</span>
                ) : (
                  <span className="security-badge error">No Secrets Loaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {!status && !loading && !error && (
          <div className="empty-state">
            <p>Click "Refresh" to load security status</p>
          </div>
        )}
      </div>

      {/* HSM Providers Info */}
      <div className="section-card">
        <div className="section-header">
          <h2>Supported HSM Providers</h2>
        </div>
        <div className="providers-grid">
          {[
            { name: 'SoftHSM', desc: 'Software-based HSM for development and testing', icon: 'S' },
            { name: 'Thales Luna', desc: 'Enterprise-grade network HSM', icon: 'T' },
            { name: 'AWS CloudHSM', desc: 'Cloud-based HSM in AWS', icon: 'A' },
            { name: 'YubiHSM', desc: 'Compact USB HSM device', icon: 'Y' },
            { name: 'Azure Key Vault', desc: 'Azure managed HSM service', icon: 'Z' },
          ].map(p => (
            <div key={p.name} className="provider-card">
              <div className="provider-icon">{p.icon}</div>
              <div className="provider-info">
                <h4>{p.name}</h4>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Guide */}
      <div className="section-card">
        <div className="section-header">
          <h2>Configuration</h2>
        </div>
        <div className="config-guide">
          <h4>Environment Variables</h4>
          <pre className="code-block">{`# HashiCorp Vault
VAULT_ENABLED=true
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=<token>
# Or use AppRole
VAULT_ROLE_ID=<role_id>
VAULT_SECRET_ID=<secret_id>

# HSM Configuration
HSM_ENABLED=true
HSM_PROVIDER=softhsm|thales|aws-cloudhsm|yubihsm
HSM_LIBRARY=/path/to/pkcs11/library.so
HSM_SLOT=0
HSM_PIN=<pin>
HSM_KEY_LABEL=osia-sector-key`}</pre>
        </div>
      </div>
    </div>
  );
}

// UIN Lookup Component
function UinLookup() {
  const [uin, setUin] = useState('');
  const [uinData, setUinData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookupUin = async () => {
    if (!uin.trim()) {
      setError('Please enter a UIN');
      return;
    }

    setLoading(true);
    setError(null);
    setUinData(null);
    setAuditData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/uin/${uin}`);
      const data = await response.json();

      if (data.success) {
        setUinData(data.uin);
        const auditResponse = await fetch(`${API_BASE_URL}/uin/${uin}/audit`);
        const auditData = await auditResponse.json();
        if (auditData.success) {
          setAuditData(auditData.audit);
        }
      } else {
        setError(data.error || 'UIN not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'status-available',
      preassigned: 'status-preassigned',
      assigned: 'status-assigned',
      retired: 'status-retired',
      revoked: 'status-revoked'
    };
    return colors[status?.toLowerCase()] || '';
  };

  return (
    <div className="tab-content">
      <div className="section-card">
        <div className="section-header">
          <h2>Search UIN</h2>
          <p className="section-description">Enter a UIN to retrieve its details and audit history</p>
        </div>

        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={uin}
              onChange={(e) => setUin(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && lookupUin()}
              placeholder="Enter UIN (e.g., ABCD1234EFGH5678)"
              className="search-input"
              spellCheck="false"
            />
            <button onClick={lookupUin} disabled={loading} className="search-btn">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
      </div>

      {uinData && (
        <div className="section-card">
          <div className="section-header">
            <h2>UIN Details</h2>
            <span className={`status-pill ${getStatusColor(uinData.status)}`}>
              {uinData.status}
            </span>
          </div>

          <div className="uin-display-card">
            <div className="uin-display-value">{uinData.uin}</div>
            <div className="uin-display-hash">
              <span className="hash-label">RMD-160:</span>
              <code>{uinData.hash_rmd160}</code>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Mode</span>
              <span className="detail-value">{uinData.mode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Scope</span>
              <span className="detail-value">{uinData.scope}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Issued At</span>
              <span className="detail-value">{new Date(uinData.iat).toLocaleString()}</span>
            </div>
            {uinData.claimed_by && (
              <div className="detail-item">
                <span className="detail-label">Claimed By</span>
                <span className="detail-value">{uinData.claimed_by}</span>
              </div>
            )}
            {uinData.claimed_at && (
              <div className="detail-item">
                <span className="detail-label">Claimed At</span>
                <span className="detail-value">{new Date(uinData.claimed_at).toLocaleString()}</span>
              </div>
            )}
            {uinData.assigned_to_ref && (
              <div className="detail-item">
                <span className="detail-label">Assigned To</span>
                <span className="detail-value">{uinData.assigned_to_ref}</span>
              </div>
            )}
            {uinData.assigned_at && (
              <div className="detail-item">
                <span className="detail-label">Assigned At</span>
                <span className="detail-value">{new Date(uinData.assigned_at).toLocaleString()}</span>
              </div>
            )}
            {uinData.transaction_id && (
              <div className="detail-item full-width">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value mono">{uinData.transaction_id}</span>
              </div>
            )}
          </div>

          {uinData.attributes && Object.keys(uinData.attributes).length > 0 && (
            <div className="attributes-section">
              <h4>Attributes</h4>
              <pre className="attributes-json">{JSON.stringify(uinData.attributes, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {auditData && auditData.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>Audit Trail</h2>
            <span className="event-count">{auditData.length} events</span>
          </div>

          <div className="timeline">
            {auditData.map((event, index) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="event-type">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="event-time">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                  <div className="timeline-details">
                    {event.old_status && event.new_status && (
                      <div className="status-change">
                        <span className={`status-mini ${getStatusColor(event.old_status)}`}>{event.old_status}</span>
                        <span className="arrow">→</span>
                        <span className={`status-mini ${getStatusColor(event.new_status)}`}>{event.new_status}</span>
                      </div>
                    )}
                    {(event.actor_system || event.actor_ref) && (
                      <div className="actor-info">
                        {event.actor_system && <span>System: {event.actor_system}</span>}
                        {event.actor_ref && <span>Ref: {event.actor_ref}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Base64URL encode for JWT
function base64UrlEncode(str) {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Format UIN with separator
function formatUinWithSeparator(uin, pattern, separator) {
  if (!uin || !pattern || !separator) return uin;
  const segments = pattern.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
  if (segments.length === 0) return uin;

  let result = [];
  let pos = 0;
  for (const len of segments) {
    if (pos >= uin.length) break;
    result.push(uin.substring(pos, pos + len));
    pos += len;
  }
  if (pos < uin.length) {
    result.push(uin.substring(pos));
  }
  return result.join(separator);
}

// Generate JWT from payload
function generateJwt(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  return `${headerB64}.${payloadB64}.`;
}

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [mode, setMode] = useState('foundational');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state for different modes
  const [length, setLength] = useState(19);
  const [charset, setCharset] = useState('A-Z0-9');
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [useChecksum, setUseChecksum] = useState(true);
  const [checksumAlgorithm, setChecksumAlgorithm] = useState('iso7064');

  // Separator/formatting options
  const [useSeparator, setUseSeparator] = useState(false);
  const [separatorChar, setSeparatorChar] = useState('-');
  const [separatorPattern, setSeparatorPattern] = useState('4-4-4-4-3');

  // Lifecycle options
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(365);
  const [notBeforeOffset, setNotBeforeOffset] = useState(0);
  const [issuer, setIssuer] = useState('osia-uin-generator');
  const [audience, setAudience] = useState('');

  // Structured mode
  const [template, setTemplate] = useState('RR-YYYY-FFF-NNNNN');
  const [regionCode, setRegionCode] = useState('12');
  const [year, setYear] = useState('2025');
  const [facilityCode, setFacilityCode] = useState('043');

  // Sector token mode
  const [foundationalUin, setFoundationalUin] = useState('');
  const [sector, setSector] = useState('health');
  const [tokenLength, setTokenLength] = useState(20);

  // Computed formatted UIN
  const formattedUin = result?.value && useSeparator
    ? formatUinWithSeparator(result.value, separatorPattern, separatorChar)
    : result?.value;

  // Compute payload with lifecycle
  const computePayload = () => {
    if (!result?.value) return null;

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      uin: result.value,
      uin_formatted: useSeparator ? formattedUin : undefined,
      mode: result.mode,
      iss: issuer || undefined,
      aud: audience || undefined,
      iat: now,
      nbf: now + (notBeforeOffset * 60),
      exp: hasExpiry ? now + (expiryDays * 24 * 60 * 60) : undefined,
      checksum: result.checksum?.used ? {
        algorithm: result.checksum.algorithm,
        value: result.checksum.value
      } : undefined,
      properties: result.properties,
      hash_rmd160: result.hash_rmd160
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
  };

  const payload = computePayload();
  const jwt = payload ? generateJwt(payload) : null;

  const generateUin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let options = { mode };

      switch (mode) {
        case 'foundational':
        case 'random':
          options = {
            ...options,
            length: parseInt(length),
            charset,
            excludeAmbiguous,
          };
          if (useChecksum) {
            options.checksum = {
              enabled: true,
              algorithm: checksumAlgorithm
            };
          }
          break;

        case 'structured':
          options = {
            ...options,
            template,
            values: {
              R: regionCode,
              Y: year,
              F: facilityCode
            },
            randomSegments: {
              N: { length: 5, charset: '0-9' }
            }
          };
          if (useChecksum) {
            options.checksum = {
              enabled: true,
              algorithm: checksumAlgorithm
            };
          }
          break;

        case 'sector_token':
          if (!foundationalUin) {
            setError('Foundational UIN is required for sector token mode');
            setLoading(false);
            return;
          }
          options = {
            ...options,
            foundationalUin,
            sector,
            tokenLength: parseInt(tokenLength),
            charset
          };
          break;
      }

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to API server');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text || result?.value || '');
  };

  const copyFormatted = () => copyToClipboard(formattedUin);
  const copyRaw = () => copyToClipboard(result?.value);
  const copyPayload = () => copyToClipboard(JSON.stringify(payload, null, 2));
  const copyJwt = () => copyToClipboard(jwt);

  // Separator presets
  const separatorPresets = [
    { label: 'Dashes (4-4-4-4-3)', pattern: '4-4-4-4-3', char: '-' },
    { label: 'Dots (5-5-5-5)', pattern: '5-5-5-5', char: '.' },
    { label: 'Spaces (4-4-4-4-4)', pattern: '4-4-4-4-4', char: ' ' },
    { label: 'Colons (2-4-4-4-5)', pattern: '2-4-4-4-5', char: ':' },
    { label: 'Custom', pattern: '', char: '' },
  ];

  return (
    <div className="App">
      <div className="container-wide">
        <header className="header">
          <img
            src={OSIA_LOGO_URL}
            alt="OSIA Logo"
            className="logo"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="logo-placeholder" style={{display: 'none'}}>
            <h1>OSIA</h1>
          </div>
          <h1>UIN Generator v2.0</h1>
          <p className="subtitle">Open Standards for Identity APIs - PostgreSQL-Backed Pool&nbsp;Management</p>
        </header>

        <div className="tabs">
          <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>
            Generate UIN
          </TabButton>
          <TabButton active={activeTab === 'pool'} onClick={() => setActiveTab('pool')}>
            Pool Management
          </TabButton>
          <TabButton active={activeTab === 'lookup'} onClick={() => setActiveTab('lookup')}>
            UIN Lookup
          </TabButton>
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
            Security
          </TabButton>
          <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')}>
            Documentation
          </TabButton>
        </div>

        {activeTab === 'generate' && (
          <div className="generate-layout">
            {/* Left Panel - Generator */}
            <div className="generator-panel">
              <div className="panel-card">
                <div className="panel-header">
                  <h2>Configuration</h2>
                </div>

                {/* Mode Selection */}
                <div className="config-section">
                  <label className="config-label">Generation Mode</label>
                  <div className="mode-grid">
                    {[
                      { id: 'foundational', title: 'Foundational', desc: 'High-entropy ID' },
                      { id: 'random', title: 'Random', desc: 'Configurable' },
                      { id: 'structured', title: 'Structured', desc: 'Template-based' },
                      { id: 'sector_token', title: 'Sector Token', desc: 'Derived' },
                    ].map(m => (
                      <button
                        key={m.id}
                        className={`mode-chip ${mode === m.id ? 'active' : ''}`}
                        onClick={() => setMode(m.id)}
                      >
                        <span className="chip-title">{m.title}</span>
                        <span className="chip-desc">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific Options */}
                {(mode === 'foundational' || mode === 'random') && (
                  <div className="config-section">
                    <label className="config-label">UIN Parameters</label>
                    <div className="param-grid">
                      <div className="param-item">
                        <label>Length</label>
                        <input type="number" value={length} onChange={(e) => setLength(e.target.value)} min="8" max="64" className="input-sm" />
                      </div>
                      <div className="param-item">
                        <label>Charset</label>
                        <select value={charset} onChange={(e) => setCharset(e.target.value)} className="input-sm">
                          <option value="A-Z0-9">A-Z, 0-9</option>
                          <option value="0-9">0-9</option>
                          <option value="safe">Safe</option>
                          <option value="hex">Hex</option>
                        </select>
                      </div>
                      <div className="param-item">
                        <label>Checksum</label>
                        <select value={useChecksum ? checksumAlgorithm : 'none'} onChange={(e) => { if(e.target.value === 'none') { setUseChecksum(false); } else { setUseChecksum(true); setChecksumAlgorithm(e.target.value); }}} className="input-sm">
                          <option value="none">None</option>
                          <option value="iso7064">ISO 7064</option>
                          <option value="modN">Mod N</option>
                          <option value="iso7064mod97">Mod 97</option>
                        </select>
                      </div>
                    </div>
                    <label className="checkbox-inline">
                      <input type="checkbox" checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)} />
                      <span>Exclude ambiguous (0, O, I, 1, l)</span>
                    </label>
                  </div>
                )}

                {mode === 'structured' && (
                  <div className="config-section">
                    <label className="config-label">Template Configuration</label>
                    <div className="param-item full">
                      <label>Template</label>
                      <input type="text" value={template} onChange={(e) => setTemplate(e.target.value)} className="input-sm mono" placeholder="RR-YYYY-FFF-NNNNN" />
                    </div>
                    <div className="param-grid">
                      <div className="param-item"><label>Region</label><input type="text" value={regionCode} onChange={(e) => setRegionCode(e.target.value)} className="input-sm" /></div>
                      <div className="param-item"><label>Year</label><input type="text" value={year} onChange={(e) => setYear(e.target.value)} className="input-sm" /></div>
                      <div className="param-item"><label>Facility</label><input type="text" value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} className="input-sm" /></div>
                    </div>
                  </div>
                )}

                {mode === 'sector_token' && (
                  <div className="config-section">
                    <label className="config-label">Sector Token Configuration</label>
                    <div className="param-item full">
                      <label>Foundational UIN</label>
                      <input type="text" value={foundationalUin} onChange={(e) => setFoundationalUin(e.target.value.toUpperCase())} className="input-sm mono" placeholder="Enter UIN" />
                    </div>
                    <div className="param-grid">
                      <div className="param-item">
                        <label>Sector</label>
                        <select value={sector} onChange={(e) => setSector(e.target.value)} className="input-sm">
                          <option value="health">Health</option>
                          <option value="tax">Tax</option>
                          <option value="finance">Finance</option>
                          <option value="education">Education</option>
                          <option value="government">Government</option>
                        </select>
                      </div>
                      <div className="param-item"><label>Length</label><input type="number" value={tokenLength} onChange={(e) => setTokenLength(e.target.value)} className="input-sm" min="8" max="64" /></div>
                    </div>
                  </div>
                )}

                {/* Separator Configuration */}
                <div className="config-section">
                  <div className="config-header">
                    <label className="config-label">Display Format</label>
                    <label className="toggle-inline">
                      <input type="checkbox" checked={useSeparator} onChange={(e) => setUseSeparator(e.target.checked)} />
                      <span>Use separators</span>
                    </label>
                  </div>
                  {useSeparator && (
                    <div className="separator-config">
                      <div className="preset-chips">
                        {separatorPresets.map((p, i) => (
                          <button
                            key={i}
                            className={`preset-chip ${separatorPattern === p.pattern && separatorChar === p.char ? 'active' : ''}`}
                            onClick={() => { setSeparatorPattern(p.pattern); setSeparatorChar(p.char); }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <div className="param-grid">
                        <div className="param-item">
                          <label>Pattern</label>
                          <input type="text" value={separatorPattern} onChange={(e) => setSeparatorPattern(e.target.value)} className="input-sm mono" placeholder="4-4-4-4" />
                        </div>
                        <div className="param-item">
                          <label>Separator</label>
                          <input type="text" value={separatorChar} onChange={(e) => setSeparatorChar(e.target.value)} className="input-sm mono" maxLength="2" />
                        </div>
                      </div>
                      {result?.value && (
                        <div className="format-preview">
                          <span className="preview-label">Preview:</span>
                          <code className="preview-value">{formattedUin}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lifecycle Configuration */}
                <div className="config-section">
                  <label className="config-label">Lifecycle & Claims</label>
                  <div className="claims-grid">
                    <div className="param-item">
                      <label>Issuer (iss)</label>
                      <input type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} className="input-sm" placeholder="issuer" />
                    </div>
                    <div className="param-item">
                      <label>Audience (aud)</label>
                      <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} className="input-sm" placeholder="optional" />
                    </div>
                    <div className="param-item">
                      <label>Not Before (nbf)</label>
                      <div className="input-with-suffix">
                        <input type="number" value={notBeforeOffset} onChange={(e) => setNotBeforeOffset(parseInt(e.target.value) || 0)} className="input-sm" min="0" />
                        <span className="suffix">min</span>
                      </div>
                    </div>
                  </div>
                  <div className="expiry-row">
                    <label className="expiry-toggle">
                      <input type="checkbox" checked={hasExpiry} onChange={(e) => setHasExpiry(e.target.checked)} />
                      <span>Token Expires</span>
                    </label>
                    {hasExpiry ? (
                      <div className="expiry-input">
                        <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(parseInt(e.target.value) || 1)} className="input-sm" min="1" />
                        <span className="suffix">days</span>
                      </div>
                    ) : (
                      <span className="no-expiry-badge">Infinite Lifetime</span>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <button onClick={generateUin} disabled={loading} className="btn-generate-main">
                  {loading ? 'Generating...' : 'Generate UIN'}
                </button>

                {error && (
                  <div className="error-inline">
                    <span className="error-icon">!</span>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Output */}
            <div className="output-panel">
              {result ? (
                <>
                  {/* UIN Display */}
                  <div className="output-card uin-card">
                    <div className="output-header">
                      <h3>Generated UIN</h3>
                      <div className="output-actions">
                        <button onClick={copyRaw} className="btn-icon" title="Copy raw">RAW</button>
                        {useSeparator && <button onClick={copyFormatted} className="btn-icon" title="Copy formatted">FMT</button>}
                      </div>
                    </div>
                    <div className="uin-display">
                      <div className="uin-raw">{result.value}</div>
                      {useSeparator && <div className="uin-formatted">{formattedUin}</div>}
                    </div>
                    <div className="uin-badges">
                      <span className="badge">{result.mode}</span>
                      {result.checksum?.used && <span className="badge">{result.checksum.algorithm}</span>}
                      {!hasExpiry && <span className="badge badge-green">No Expiry</span>}
                      {hasExpiry && <span className="badge badge-orange">{expiryDays}d TTL</span>}
                    </div>
                  </div>

                  {/* JSON Payload */}
                  <div className="output-card">
                    <div className="output-header">
                      <h3>JSON Payload</h3>
                      <button onClick={copyPayload} className="btn-icon" title="Copy JSON">COPY</button>
                    </div>
                    <pre className="json-output">{JSON.stringify(payload, null, 2)}</pre>
                  </div>

                  {/* JWT */}
                  <div className="output-card">
                    <div className="output-header">
                      <h3>JWT (RFC 7519)</h3>
                      <button onClick={copyJwt} className="btn-icon" title="Copy JWT">COPY</button>
                    </div>
                    <div className="jwt-output">
                      <code className="jwt-token">{jwt}</code>
                      <small className="jwt-note">Unsigned JWT (alg: none) - sign with your key for production</small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="output-empty">
                  <div className="empty-icon">ID</div>
                  <h3>No UIN Generated</h3>
                  <p>Configure options and click Generate to create a unique identifier</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pool' && <PoolDashboard />}
        {activeTab === 'lookup' && <UinLookup />}
        {activeTab === 'security' && <SecurityStatus />}
        {activeTab === 'docs' && <Documentation />}

        <footer className="footer">
          <p>
            <strong>OSIA UIN Generator v2.0</strong> |
            Open Standards for Identity APIs |
            <a href="https://secureidentityalliance.org/osia" target="_blank" rel="noopener noreferrer">
              Learn More
            </a>
          </p>
          <p className="note">
            <small>API Server: {API_BASE_URL} | RFC 7519 JWT Support</small>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
