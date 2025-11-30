import { useState, useEffect, useRef, useId, useCallback } from 'react';
import mermaid from 'mermaid';
import './App.css';

// Mermaid theme configurations
const mermaidLightTheme = {
  primaryColor: '#7c3aed',
  primaryTextColor: '#1a1a2e',
  primaryBorderColor: '#5E17EB',
  secondaryColor: '#E0E7FF',
  tertiaryColor: '#F5F3FF',
  lineColor: '#5E17EB',
  textColor: '#1a1a2e',
  mainBkg: '#F5F3FF',
  nodeBorder: '#5E17EB',
  clusterBkg: '#E0E7FF',
  clusterBorder: '#7c3aed',
  titleColor: '#1a1a2e',
  edgeLabelBackground: '#ffffff',
  nodeTextColor: '#1a1a2e',
};

const mermaidDarkTheme = {
  primaryColor: '#7c3aed',
  primaryTextColor: '#e2e8f0',
  primaryBorderColor: '#8b5cf6',
  secondaryColor: '#312e81',
  tertiaryColor: '#1e1b4b',
  lineColor: '#8b5cf6',
  textColor: '#e2e8f0',
  mainBkg: '#1e1b4b',
  nodeBorder: '#8b5cf6',
  clusterBkg: '#312e81',
  clusterBorder: '#7c3aed',
  titleColor: '#e2e8f0',
  edgeLabelBackground: '#1e293b',
  nodeTextColor: '#e2e8f0',
};

// Initialize mermaid
const initMermaid = (isDark = false) => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: isDark ? mermaidDarkTheme : mermaidLightTheme,
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
};

// Initial mermaid setup
initMermaid(document.documentElement.getAttribute('data-theme') === 'dark');

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

      {/* UIN Lifecycle Operations */}
      <UinLifecycleOperations onStatusChange={fetchStats} />

      {error && (
        <div className="error-message">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}
    </div>
  );
}

// UIN Lifecycle Operations Component
function UinLifecycleOperations({ onStatusChange }) {
  const [activeOp, setActiveOp] = useState('fetch');
  const [uinInput, setUinInput] = useState('');
  const [entityId, setEntityId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [peekList, setPeekList] = useState([]);

  const operations = [
    { id: 'fetch', label: 'Fetch', desc: 'View top UINs in pool', method: 'GET', endpoint: '/pool/peek' },
    { id: 'preassign', label: 'Pre-assign', desc: 'Reserve a UIN from pool', method: 'POST', endpoint: '/pool/preassign' },
    { id: 'assign', label: 'Assign', desc: 'Assign UIN to entity', method: 'POST', endpoint: '/pool/assign' },
    { id: 'revoke', label: 'Revoke', desc: 'Revoke an assigned UIN', method: 'POST', endpoint: '/pool/revoke' },
    { id: 'retire', label: 'Retire', desc: 'Permanently retire a UIN', method: 'POST', endpoint: '/pool/retire' },
  ];

  const executeOperation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const op = operations.find(o => o.id === activeOp);

    try {
      if (activeOp === 'fetch') {
        // Fetch top UINs from pool (peek without claiming)
        const response = await fetch(`${API_BASE_URL}${op.endpoint}?status=AVAILABLE&limit=10`);
        const data = await response.json();
        if (data.success) {
          setPeekList(data.uins || []);
          setResult({ message: `Found ${data.uins?.length || 0} available UINs`, count: data.uins?.length || 0 });
        } else {
          setError(data.error || 'Failed to fetch UINs');
        }
      } else {
        let body = {};

        if (activeOp === 'preassign') {
          body = { scope: 'foundational' };
        } else if (activeOp === 'assign') {
          body = { uin: uinInput, entityId: entityId || `entity-${Date.now()}` };
        } else if (activeOp === 'revoke') {
          body = { uin: uinInput, reason: reason || 'Manual revocation via UI' };
        } else if (activeOp === 'retire') {
          body = { uin: uinInput, reason: reason || 'Manual retirement via UI' };
        }

        const response = await fetch(`${API_BASE_URL}${op.endpoint}`, {
          method: op.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();

        if (data.success) {
          setResult(data);
          if (data.uin) setUinInput(data.uin);
          if (onStatusChange) onStatusChange();
        } else {
          setError(data.error || `${op.label} operation failed`);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card">
      <div className="section-header">
        <h2>UIN Lifecycle Operations</h2>
        <p className="section-description">Test the complete UIN lifecycle: pre-assign → assign → revoke/retire</p>
      </div>

      {/* Operation Tabs */}
      <div className="operation-tabs">
        {operations.map(op => (
          <button
            key={op.id}
            className={`operation-tab ${activeOp === op.id ? 'active' : ''}`}
            onClick={() => { setActiveOp(op.id); setResult(null); setError(null); }}
          >
            <span className="op-label">{op.label}</span>
            <span className="op-desc">{op.desc}</span>
          </button>
        ))}
      </div>

      {/* Operation Form */}
      <div className="operation-form">
        {activeOp === 'fetch' && (
          <div className="form-hint">
            <p>Peek at the top available UINs in the pool without claiming them. Use this to see what's available and select a UIN for testing lifecycle operations.</p>
          </div>
        )}

        {activeOp === 'preassign' && (
          <div className="form-hint">
            <p>Click the button to pre-assign an available UIN from the pool. The UIN will be reserved but not yet assigned to an entity.</p>
          </div>
        )}

        {(activeOp === 'assign' || activeOp === 'revoke' || activeOp === 'retire') && (
          <div className="form-group">
            <label>UIN</label>
            <input
              type="text"
              value={uinInput}
              onChange={(e) => setUinInput(e.target.value.toUpperCase())}
              placeholder="Enter UIN (e.g., A1B2C3D4E5F6G7H8I9)"
              className="input-text mono"
            />
            <small className="help-text">
              {activeOp === 'assign' ? 'Enter a pre-assigned UIN to assign to an entity' :
               activeOp === 'revoke' ? 'Enter an assigned UIN to revoke' :
               'Enter a UIN to permanently retire'}
            </small>
          </div>
        )}

        {activeOp === 'assign' && (
          <div className="form-group">
            <label>Entity ID</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Entity identifier (optional, auto-generated if empty)"
              className="input-text"
            />
            <small className="help-text">The identifier of the entity this UIN will be assigned to</small>
          </div>
        )}

        {(activeOp === 'revoke' || activeOp === 'retire') && (
          <div className="form-group">
            <label>Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={activeOp === 'revoke' ? 'Reason for revocation' : 'Reason for retirement'}
              className="input-text"
            />
            <small className="help-text">Optional reason for audit trail</small>
          </div>
        )}

        <div className="form-actions">
          <button
            onClick={executeOperation}
            disabled={loading || ((activeOp !== 'preassign' && activeOp !== 'fetch') && !uinInput)}
            className={`btn-primary btn-large ${activeOp === 'revoke' ? 'btn-warning' : ''} ${activeOp === 'retire' ? 'btn-danger' : ''}`}
          >
            {loading ? 'Processing...' : activeOp === 'fetch' ? 'Fetch Top UINs' : `Execute ${operations.find(o => o.id === activeOp)?.label}`}
          </button>
        </div>

        {/* Peek List Display for Fetch operation */}
        {activeOp === 'fetch' && peekList.length > 0 && (
          <div className="peek-list">
            <div className="peek-header">
              <h4>Top Available UINs</h4>
              <span className="peek-count">{peekList.length} UINs</span>
            </div>
            <div className="peek-items">
              {peekList.map((item, index) => (
                <div key={item.uin} className="peek-item" onClick={() => setUinInput(item.uin)}>
                  <span className="peek-index">#{index + 1}</span>
                  <code className="peek-uin">{item.uin}</code>
                  <div className="peek-meta">
                    <span className="peek-scope">{item.scope}</span>
                    <span className="peek-time">{new Date(item.iat).toLocaleDateString()}</span>
                    {item.meta?.provenance && (
                      <span className={`peek-provenance ${item.meta.provenance.hardware ? 'hardware' : 'software'}`}>
                        {item.meta.provenance.hardware ? 'HSM TRNG' : 'CSPRNG'}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn-use"
                    onClick={(e) => { e.stopPropagation(); setUinInput(item.uin); setActiveOp('preassign'); }}
                    title="Use this UIN"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && activeOp !== 'fetch' && (
          <div className="operation-result success">
            <div className="result-header">
              <span className="result-icon">✓</span>
              <span className="result-title">Operation Successful</span>
            </div>
            <div className="result-body">
              {result.uin && (
                <div className="result-item">
                  <span className="result-label">UIN</span>
                  <code className="result-value">{result.uin}</code>
                </div>
              )}
              {result.status && (
                <div className="result-item">
                  <span className="result-label">New Status</span>
                  <span className={`status-pill status-${result.status}`}>{result.status}</span>
                </div>
              )}
              {result.entityId && (
                <div className="result-item">
                  <span className="result-label">Entity ID</span>
                  <span className="result-value">{result.entityId}</span>
                </div>
              )}
              {result.message && (
                <div className="result-item">
                  <span className="result-label">Message</span>
                  <span className="result-value">{result.message}</span>
                </div>
              )}
              {result.record?.meta?.provenance && (
                <div className="result-item">
                  <span className="result-label">Provenance</span>
                  <span className={`provenance-badge ${result.record.meta.provenance.hardware ? 'hardware' : 'software'}`}>
                    {result.record.meta.provenance.source}
                    {result.record.meta.provenance.fipsLevel > 0 && ` (FIPS Level ${result.record.meta.provenance.fipsLevel})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="operation-result error">
            <div className="result-header">
              <span className="result-icon">✕</span>
              <span className="result-title">Operation Failed</span>
            </div>
            <div className="result-body">
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>
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
                <li><strong>HSM TRNG Support</strong> - Hardware True Random Number Generation with provenance tracking</li>
                <li><strong>Complete Audit Trail</strong> - Immutable logging of all UIN lifecycle events</li>
                <li><strong>Sector Tokenization</strong> - Unlinkable, sector-specific derived identifiers</li>
                <li><strong>Multi-Format Output</strong> - JSON, JWT (RFC 7519), and JSON-LD (W3C Linked Data)</li>
                <li><strong>Entropy Provenance</strong> - Track whether UINs were generated using HSM TRNG or software CSPRNG</li>
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
                  <code>/pool/peek</code>
                </div>
                <p>Preview top available UINs without claiming them.</p>
                <pre className="code-block">{`// Request: GET /pool/peek?status=AVAILABLE&limit=10
// Response
{
  "success": true,
  "uins": [
    { "uin": "ABC123...", "scope": "foundational", "iat": "...", "meta": { "provenance": {...} } }
  ]
}`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/pool/revoke</code>
                </div>
                <p>Revoke an assigned UIN (fraud, error correction).</p>
                <pre className="code-block">{`// Request
{ "uin": "ABCD1234...", "reason": "Fraud detected" }`}</pre>
              </div>

              <div className="endpoint-card">
                <div className="endpoint-header">
                  <span className="method post">POST</span>
                  <code>/pool/retire</code>
                </div>
                <p>Retire a UIN (end-of-life, death registration).</p>
                <pre className="code-block">{`// Request
{ "uin": "ABCD1234...", "reason": "Death registration" }`}</pre>
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
                    <td>Random Generation (Primary)</td>
                    <td>HSM Hardware TRNG</td>
                    <td>FIPS 140-2 certified entropy from physical sources</td>
                  </tr>
                  <tr>
                    <td>Random Generation (Fallback)</td>
                    <td>Node.js <code>crypto.randomBytes</code></td>
                    <td>Software CSPRNG when HSM unavailable</td>
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

              <h2>Entropy Provenance Tracking</h2>
              <p>Every generated UIN includes provenance metadata identifying its entropy source:</p>
              <pre className="code-block">{`{
  "provenance": {
    "source": "HSM Hardware TRNG" | "Node.js CSPRNG",
    "hardware": true | false,
    "fipsLevel": 0 | 2 | 3,
    "provider": "utimaco" | "yubihsm" | "thales" | "software"
  }
}`}</pre>
              <p>HSM TRNG is always prioritized over software CSPRNG when available.</p>

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
                <div className="header-with-logo">
                  {status.hsm?.provider && (
                    <img
                      src={`/logos/${status.hsm?.provider === 'yubihsm' ? 'yubico' : status.hsm?.provider}.png`}
                      alt="HSM"
                      className="card-logo"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <h3>{status.hsm?.providerName || 'HSM'}</h3>
                </div>
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
                <div className="header-with-logo">
                  <img src="/logos/vault.png" alt="Vault" className="card-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                  <h3>HashiCorp Vault</h3>
                </div>
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
          <h2>Supported HSM Providers (Priority Order)</h2>
        </div>
        <p className="section-description">
          Hardware TRNG is always prioritized over software CSPRNG. Production HSMs provide FIPS 140-2 Level 3 certified entropy.
        </p>
        <div className="providers-grid">
          {[
            { name: 'Utimaco', desc: 'CryptoServer/SecurityServer - Priority 1', priority: 1, fips: 3, trng: true, logo: '/logos/utimaco.png' },
            { name: 'Thales Luna', desc: 'Enterprise network HSM - Priority 2', priority: 2, fips: 3, trng: true, logo: '/logos/thales.png' },
            { name: 'SafeNet', desc: 'ProtectServer HSM - Priority 3', priority: 3, fips: 3, trng: true, logo: '/logos/safenet.png' },
            { name: 'Entrust nShield', desc: 'nShield HSM - Priority 4', priority: 4, fips: 3, trng: true, logo: '/logos/entrust.png' },
            { name: 'AWS CloudHSM', desc: 'AWS managed HSM - Priority 5', priority: 5, fips: 3, trng: true, logo: '/logos/aws.png' },
            { name: 'Azure Dedicated HSM', desc: 'Azure HSM (Thales-based) - Priority 6', priority: 6, fips: 3, trng: true, logo: '/logos/azure.png' },
            { name: 'YubiHSM 2', desc: 'Compact USB HSM - Priority 7', priority: 7, fips: 2, trng: true, logo: '/logos/yubikey.png' },
            { name: 'SoftHSM', desc: 'Development only - NO TRNG', priority: 8, fips: 0, trng: false, logo: '/logos/softhsm.png' },
          ].map(p => (
            <div key={p.name} className={`provider-card ${p.trng ? 'has-trng' : 'no-trng'}`}>
              <div className="provider-logo">
                <img
                  src={p.logo}
                  alt={`${p.name} logo`}
                  onError={(e) => { e.target.src = '/logos/default-hsm.svg'; }}
                />
              </div>
              <div className="provider-info">
                <h4>{p.name}</h4>
                <p>{p.desc}</p>
                <div className="provider-badges">
                  {p.trng ? (
                    <span className="badge badge-trng">Hardware TRNG</span>
                  ) : (
                    <span className="badge badge-no-trng">Software PRNG</span>
                  )}
                  {p.fips > 0 && (
                    <span className="badge badge-fips">FIPS Level {p.fips}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRNG Priority Explanation */}
      <div className="section-card">
        <div className="section-header">
          <h2>Random Number Generation</h2>
        </div>
        <div className="trng-explanation">
          <div className="priority-list">
            <div className="priority-item primary">
              <span className="priority-num">1</span>
              <div className="priority-content">
                <strong>HSM Hardware TRNG</strong>
                <p>FIPS 140-2 Level 3 certified entropy from physical random sources</p>
              </div>
            </div>
            <div className="priority-item fallback">
              <span className="priority-num">2</span>
              <div className="priority-content">
                <strong>Node.js CSPRNG</strong>
                <p>Software-based fallback (crypto.randomBytes)</p>
              </div>
            </div>
          </div>
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
# Or use AppRole (recommended for production)
VAULT_ROLE_ID=<role_id>
VAULT_SECRET_ID=<secret_id>

# HSM Configuration
HSM_ENABLED=true
# Auto-detect in priority order (recommended)
HSM_PROVIDER=auto
# Or specify: utimaco|thales|safenet|ncipher|aws-cloudhsm|azure-hsm|yubihsm|softhsm
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

// Generate JSON-LD from payload
function generateJsonLd(payload, provenance) {
  return {
    "@context": {
      "@vocab": "https://schema.org/",
      "osia": "https://osia.readthedocs.io/en/latest/",
      "uin": "osia:uniqueIdentificationNumber",
      "iss": "osia:issuer",
      "iat": "osia:issuedAt",
      "exp": "osia:expiresAt",
      "provenance": "osia:provenance"
    },
    "@type": "osia:UniqueIdentificationNumber",
    "@id": `urn:osia:uin:${payload.uin}`,
    "identifier": payload.uin,
    "uin_formatted": payload.uin_formatted,
    "mode": payload.mode,
    "issuer": payload.iss,
    "issuedAt": payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
    "notBefore": payload.nbf ? new Date(payload.nbf * 1000).toISOString() : undefined,
    "expiresAt": payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
    "checksum": payload.checksum,
    "hash_rmd160": payload.hash_rmd160,
    "provenance": provenance ? {
      "@type": "osia:Provenance",
      "source": provenance.source,
      "hardware": provenance.hardware,
      "fipsLevel": provenance.fipsLevel,
      "provider": provenance.provider
    } : undefined
  };
}

// Theme Toggle Component
function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

// Main App Component
function App() {
  // Theme state - check localStorage and system preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('osia-theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeTab, setActiveTab] = useState('generate');
  const [mode, setMode] = useState('foundational');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('osia-theme', theme);
    initMermaid(theme === 'dark');
  }, [theme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

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
  const jsonLd = payload ? generateJsonLd(payload, result?.provenance) : null;

  // Output format state
  const [outputFormat, setOutputFormat] = useState('json');

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
  const copyJsonLd = () => copyToClipboard(JSON.stringify(jsonLd, null, 2));

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
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img
              src={OSIA_LOGO_URL}
              alt="OSIA Logo"
              className="logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-titles">
              <h1>UIN Generator <span className="version">v2.0</span></h1>
              <p className="subtitle">Open Standards for Identity APIs</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <div className="main-container">

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
          <div className="tab-content" style={{padding: 0}}>
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

                  {/* Provenance Display */}
                  {result.provenance && (
                    <div className="output-card provenance-card">
                      <div className="output-header">
                        <h3>Entropy Provenance</h3>
                        <span className={`provenance-indicator ${result.provenance.hardware ? 'hardware' : 'software'}`}>
                          {result.provenance.hardware ? 'Hardware TRNG' : 'Software CSPRNG'}
                        </span>
                      </div>
                      <div className="provenance-details">
                        <div className="provenance-item">
                          <span className="prov-label">Source</span>
                          <span className="prov-value">{result.provenance.source}</span>
                        </div>
                        {result.provenance.provider && (
                          <div className="provenance-item">
                            <span className="prov-label">Provider</span>
                            <span className="prov-value">{result.provenance.provider}</span>
                          </div>
                        )}
                        {result.provenance.fipsLevel > 0 && (
                          <div className="provenance-item">
                            <span className="prov-label">FIPS Level</span>
                            <span className="prov-value fips-badge">Level {result.provenance.fipsLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Output Format Tabs */}
                  <div className="output-card">
                    <div className="output-format-tabs">
                      <button
                        className={`format-tab ${outputFormat === 'json' ? 'active' : ''}`}
                        onClick={() => setOutputFormat('json')}
                      >
                        JSON
                      </button>
                      <button
                        className={`format-tab ${outputFormat === 'jwt' ? 'active' : ''}`}
                        onClick={() => setOutputFormat('jwt')}
                      >
                        JWT
                      </button>
                      <button
                        className={`format-tab ${outputFormat === 'jsonld' ? 'active' : ''}`}
                        onClick={() => setOutputFormat('jsonld')}
                      >
                        JSON-LD
                      </button>
                    </div>

                    {outputFormat === 'json' && (
                      <div className="format-content">
                        <div className="output-header">
                          <h3>JSON Payload</h3>
                          <button onClick={copyPayload} className="btn-icon" title="Copy JSON">COPY</button>
                        </div>
                        <pre className="json-output">{JSON.stringify(payload, null, 2)}</pre>
                      </div>
                    )}

                    {outputFormat === 'jwt' && (
                      <div className="format-content">
                        <div className="output-header">
                          <h3>JWT (RFC 7519)</h3>
                          <button onClick={copyJwt} className="btn-icon" title="Copy JWT">COPY</button>
                        </div>
                        <div className="jwt-output">
                          <code className="jwt-token">{jwt}</code>
                          <small className="jwt-note">Unsigned JWT (alg: none) - sign with your key for production</small>
                        </div>
                      </div>
                    )}

                    {outputFormat === 'jsonld' && (
                      <div className="format-content">
                        <div className="output-header">
                          <h3>JSON-LD (Linked Data)</h3>
                          <button onClick={copyJsonLd} className="btn-icon" title="Copy JSON-LD">COPY</button>
                        </div>
                        <pre className="json-output jsonld-output">{JSON.stringify(jsonLd, null, 2)}</pre>
                        <small className="jsonld-note">W3C JSON-LD format with OSIA vocabulary context</small>
                      </div>
                    )}
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
          </div>
        )}

        {activeTab === 'pool' && <PoolDashboard />}
        {activeTab === 'lookup' && <UinLookup />}
        {activeTab === 'security' && <SecurityStatus />}
        {activeTab === 'docs' && <Documentation />}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>
            <strong>OSIA UIN Generator v2.0</strong>
            <span className="footer-sep">|</span>
            Open Standards for Identity APIs
            <span className="footer-sep">|</span>
            <a href="https://secureidentityalliance.org/osia" target="_blank" rel="noopener noreferrer">
              Learn More
            </a>
          </p>
          <p className="footer-note">
            API Server: {API_BASE_URL}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
