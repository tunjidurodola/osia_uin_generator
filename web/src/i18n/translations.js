/**
 * OSIA UIN Generator - Internationalization (i18n) Translations
 * Languages: English (EN), German (DE), French (FR), Spanish (ES)
 *
 * Translation approach: Natural, professional language suitable for
 * government/enterprise identity management systems.
 */

export const translations = {
  en: {
    // Language metadata
    _meta: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧'
    },

    // Header
    header: {
      title: 'OSIA UIN Generator',
      subtitle: 'Unique Identification Number Generator',
      version: 'v2.0'
    },

    // Navigation tabs
    nav: {
      generate: 'Generate',
      pool: 'Pool Management',
      lookup: 'UIN Lookup',
      security: 'Security',
      docs: 'Documentation'
    },

    // Generate tab
    generate: {
      title: 'Generate UIN',
      subtitle: 'Create unique identification numbers with configurable parameters',
      mode: {
        label: 'Generation Mode',
        foundational: 'Foundational',
        foundationalDesc: 'High-entropy, lifelong identifier with no embedded PII',
        random: 'Random',
        randomDesc: 'Configurable random identifier',
        structured: 'Structured',
        structuredDesc: 'Template-based with embedded values',
        sectorToken: 'Sector Token',
        sectorTokenDesc: 'Cryptographically derived sector-specific token'
      },
      parameters: {
        label: 'Parameters',
        length: 'Length',
        charset: 'Character Set',
        charsetAlphaNum: 'Alphanumeric (A-Z, 0-9)',
        charsetNumeric: 'Numeric only (0-9)',
        charsetAlpha: 'Alphabetic only (A-Z)',
        charsetHex: 'Hexadecimal (0-9, A-F)',
        excludeAmbiguous: 'Exclude ambiguous (0, O, I, 1, l)'
      },
      structured: {
        label: 'Template Configuration',
        template: 'Template',
        region: 'Region',
        year: 'Year',
        facility: 'Facility'
      },
      sectorToken: {
        label: 'Sector Token Configuration',
        foundationalUin: 'Foundational UIN',
        enterUin: 'Enter UIN',
        sector: 'Sector',
        sectors: {
          health: 'Health',
          tax: 'Tax',
          finance: 'Finance',
          education: 'Education',
          government: 'Government'
        }
      },
      checksum: {
        label: 'Checksum',
        enabled: 'Enable checksum',
        algorithm: 'Algorithm',
        iso7064: 'ISO 7064 MOD 37-2',
        mod97: 'MOD 97-10 (IBAN-style)',
        luhn: 'Luhn Algorithm'
      },
      separator: {
        label: 'Formatting',
        enabled: 'Use separator',
        pattern: 'Pattern',
        char: 'Separator',
        preview: 'Preview'
      },
      lifecycle: {
        label: 'Lifecycle & Claims',
        issuer: 'Issuer (iss)',
        audience: 'Audience (aud)',
        notBefore: 'Not Before (nbf)',
        minutes: 'min',
        expires: 'Token Expires',
        days: 'days',
        noExpiry: 'Infinite Lifetime'
      },
      button: 'Generate UIN',
      generating: 'Generating...',
      output: {
        title: 'Generated UIN',
        copyRaw: 'RAW',
        copyFormatted: 'FMT',
        provenance: 'Entropy Provenance',
        hardwareTrng: 'Hardware TRNG',
        softwareCsprng: 'Software CSPRNG',
        source: 'Source',
        provider: 'Provider',
        fipsLevel: 'FIPS Level',
        format: {
          json: 'JSON',
          jwt: 'JWT',
          jsonld: 'JSON-LD'
        },
        jsonPayload: 'JSON Payload',
        jwtTitle: 'JWT (RFC 7519)',
        jwtNote: 'Unsigned JWT (alg: none) - sign with your key for production',
        jsonldTitle: 'JSON-LD (Linked Data)',
        jsonldNote: 'W3C JSON-LD format with OSIA vocabulary context',
        copy: 'COPY',
        emptyTitle: 'No UIN Generated',
        emptyMessage: 'Configure options and click Generate to create a unique identifier'
      }
    },

    // Pool Management tab
    pool: {
      title: 'Pool Management',
      subtitle: 'Monitor and manage the UIN pool',
      stats: {
        title: 'Pool Statistics',
        total: 'Total',
        available: 'Available',
        preassigned: 'Pre-assigned',
        assigned: 'Assigned',
        retired: 'Retired',
        revoked: 'Revoked',
        refresh: 'Refresh',
        lastUpdated: 'Last updated'
      },
      pregenerate: {
        title: 'Pre-generate UINs',
        count: 'Count',
        scope: 'Scope',
        button: 'Pre-generate',
        generating: 'Generating...',
        success: 'Successfully generated {count} UINs',
        error: 'Failed to generate UINs'
      },
      lifecycle: {
        title: 'UIN Lifecycle Operations',
        subtitle: 'Test the complete UIN lifecycle: pre-assign → assign → revoke/retire',
        currentUin: 'Current UIN',
        operations: {
          fetch: 'Fetch',
          fetchDesc: 'Get 1 UIN from pool',
          preassign: 'Pre-assign',
          preassignDesc: 'Reserve the UIN',
          assign: 'Assign',
          assignDesc: 'Assign to entity',
          revoke: 'Revoke',
          revokeDesc: 'Revoke UIN',
          retire: 'Retire',
          retireDesc: 'Retire UIN'
        },
        hints: {
          fetch: 'Fetch a single available UIN from the pool to view and copy. This does not claim or reserve the UIN.',
          preassign: 'Pre-assign reserves an available UIN from the pool. The UIN changes from AVAILABLE to PREASSIGNED status.',
          assign: 'Enter a PREASSIGNED UIN to assign to an entity',
          revoke: 'Enter an ASSIGNED UIN to revoke',
          retire: 'Enter a UIN to permanently retire'
        },
        fields: {
          uin: 'UIN',
          uinPlaceholder: "Enter UIN or click 'Use' above",
          entityId: 'Entity ID',
          entityIdPlaceholder: 'Entity identifier (optional)',
          entityIdHelp: 'External reference for this UIN assignment',
          reason: 'Reason',
          reasonRevoke: 'Reason for revocation',
          reasonRetire: 'Reason for retirement',
          reasonHelp: 'Optional reason for audit trail'
        },
        buttons: {
          fetchUin: 'Fetch UIN',
          preassignUin: 'Pre-assign UIN',
          assignUin: 'Assign UIN',
          revokeUin: 'Revoke UIN',
          retireUin: 'Retire UIN',
          copy: 'Copy',
          copied: 'Copied!',
          use: 'Use',
          processing: 'Processing...'
        },
        result: {
          success: 'Operation Successful',
          failed: 'Operation Failed',
          newStatus: 'New Status',
          message: 'Message'
        }
      }
    },

    // UIN Lookup tab
    lookup: {
      title: 'UIN Lookup',
      subtitle: 'Search for UIN details and audit history',
      search: {
        placeholder: 'Enter UIN to search',
        button: 'Search',
        searching: 'Searching...'
      },
      result: {
        title: 'UIN Details',
        uin: 'UIN',
        status: 'Status',
        mode: 'Mode',
        scope: 'Scope',
        created: 'Created',
        claimed: 'Claimed',
        claimedBy: 'Claimed By',
        assigned: 'Assigned',
        assignedTo: 'Assigned To',
        hash: 'Hash (RIPEMD-160)',
        provenance: 'Provenance'
      },
      audit: {
        title: 'Audit Trail',
        event: 'Event',
        oldStatus: 'Previous Status',
        newStatus: 'New Status',
        actor: 'Actor',
        timestamp: 'Timestamp',
        details: 'Details',
        noRecords: 'No audit records found'
      },
      notFound: 'UIN not found',
      error: 'Error searching for UIN'
    },

    // Security tab
    security: {
      title: 'Security Status',
      subtitle: 'Cryptographic services and HSM status',
      hsm: {
        title: 'Hardware Security Module',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        provider: 'Provider',
        type: 'Type',
        trng: 'Hardware TRNG',
        available: 'Available',
        notAvailable: 'Not Available',
        fipsLevel: 'FIPS Level',
        randomSource: 'Random Source'
      },
      vault: {
        title: 'HashiCorp Vault',
        status: 'Status',
        authenticated: 'Authenticated',
        notAuthenticated: 'Not Authenticated',
        address: 'Address',
        secretsLoaded: 'Secrets Loaded'
      },
      database: {
        title: 'Database',
        status: 'Status',
        connected: 'Connected',
        disconnected: 'Disconnected'
      },
      providers: {
        title: 'Supported HSM Providers',
        production: 'Production',
        cloud: 'Cloud',
        development: 'Development',
        compact: 'Compact'
      }
    },

    // Documentation tab
    docs: {
      title: 'Documentation',
      version: 'Version',
      sections: {
        overview: 'Overview',
        architecture: 'Architecture',
        api: 'API Reference',
        lifecycle: 'UIN Lifecycle',
        security: 'Security'
      },
      overview: {
        title: 'OSIA UIN Generator',
        lead: 'A production-grade, PostgreSQL-backed Unique Identification Number (UIN) generator based on the <strong>Open Standards for Identity APIs (OSIA)</strong> specification.',
        features: {
          title: 'Key Features',
          osia: 'OSIA-Based Design',
          osiaDesc: 'Implements POST /v1/uin endpoint pattern',
          modes: 'Four Generation Modes',
          modesDesc: 'Foundational, Random, Structured, and Sector Token',
          pool: 'PostgreSQL Pool Management',
          poolDesc: 'Pre-generation, claiming, and assignment workflows',
          crypto: 'Cryptographic Security',
          cryptoDesc: 'CSPRNG, HMAC-SHA256, RIPEMD-160 hashing',
          hsm: 'HSM TRNG Support',
          hsmDesc: 'Hardware True Random Number Generation with provenance tracking',
          audit: 'Complete Audit Trail',
          auditDesc: 'Immutable logging of all UIN lifecycle events',
          sector: 'Sector Tokenization',
          sectorDesc: 'Unlinkable, sector-specific derived identifiers',
          formats: 'Multi-Format Output',
          formatsDesc: 'JSON, JWT (RFC 7519), and JSON-LD (W3C Linked Data)',
          provenance: 'Entropy Provenance',
          provenanceDesc: 'Track whether UINs were generated using HSM TRNG or software CSPRNG'
        },
        sectors: {
          title: 'Supported Sectors',
          health: 'Health',
          tax: 'Tax',
          finance: 'Finance',
          telco: 'Telco',
          statistics: 'Statistics',
          education: 'Education',
          social: 'Social',
          government: 'Government'
        },
        stack: {
          title: 'Technology Stack',
          layer: 'Layer',
          technology: 'Technology',
          runtime: 'Runtime',
          server: 'Server',
          database: 'Database',
          queryBuilder: 'Query Builder',
          frontend: 'Frontend',
          processManager: 'Process Manager'
        },
        quickStart: {
          title: 'Quick Start',
          install: 'Install dependencies',
          migrate: 'Run database migrations',
          start: 'Start the API server',
          pm2: 'Or use PM2 for production'
        }
      },
      api: {
        title: 'API Reference',
        osiaEndpoint: 'OSIA-Compliant Endpoint',
        infoEndpoints: 'Information Endpoints',
        poolEndpoints: 'Pool Management Endpoints',
        lifecycleEndpoints: 'UIN Lifecycle Endpoints',
        statelessEndpoints: 'Stateless Generation',
        queryParams: 'Query Parameters',
        requestBody: 'Request Body',
        response: 'Response',
        errorResponse: 'Error Response'
      },
      lifecycle: {
        title: 'UIN Lifecycle',
        stateMachine: 'State Machine',
        states: {
          title: 'Lifecycle States',
          status: 'Status',
          description: 'Description',
          transitions: 'Transitions',
          available: 'Pre-generated, ready to be claimed',
          preassigned: 'Claimed by system, not yet bound to PII',
          assigned: 'Bound to a person/entity reference',
          retired: 'No longer active (death, etc.)',
          revoked: 'Invalidated due to fraud/abuse'
        },
        workflow: {
          title: 'Workflow: Civil Registration',
          sectorTitle: 'Workflow: Sector Token Derivation'
        }
      },
      security: {
        title: 'Security',
        crypto: {
          title: 'Cryptographic Components',
          component: 'Component',
          algorithm: 'Algorithm',
          purpose: 'Purpose',
          randomPrimary: 'Random Generation (Primary)',
          randomFallback: 'Random Generation (Fallback)',
          integrity: 'Integrity Hash',
          sectorDerivation: 'Sector Derivation',
          checksum: 'Checksum'
        },
        provenance: {
          title: 'Entropy Provenance Tracking',
          description: 'Every generated UIN includes provenance metadata identifying its entropy source:',
          priority: 'HSM TRNG is always prioritized over software CSPRNG when available.'
        },
        sectorSecurity: {
          title: 'Sector Token Security'
        }
      }
    },

    // Footer
    footer: {
      title: 'OSIA UIN Generator v2.0',
      subtitle: 'Open Standards for Identity APIs',
      learnMore: 'Learn More',
      apiServer: 'API Server'
    },

    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      na: 'N/A',
      language: 'Language',
      optional: 'optional',
      copy: 'COPY',
      none: 'None'
    },

    // Status labels
    status: {
      available: 'Available',
      preassigned: 'Pre-assigned',
      assigned: 'Assigned',
      retired: 'Retired',
      revoked: 'Revoked'
    }
  },

  // ==========================================================================
  // GERMAN (Deutsch)
  // ==========================================================================
  de: {
    _meta: {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪'
    },

    header: {
      title: 'OSIA UIN-Generator',
      subtitle: 'Generator für eindeutige Identifikationsnummern',
      version: 'v2.0'
    },

    nav: {
      generate: 'Generieren',
      pool: 'Pool-Verwaltung',
      lookup: 'UIN-Suche',
      security: 'Sicherheit',
      docs: 'Dokumentation'
    },

    generate: {
      title: 'UIN generieren',
      subtitle: 'Erstellen Sie eindeutige Identifikationsnummern mit konfigurierbaren Parametern',
      mode: {
        label: 'Generierungsmodus',
        foundational: 'Grundlegend',
        foundationalDesc: 'Hochentropischer, lebenslanger Identifikator ohne eingebettete personenbezogene Daten',
        random: 'Zufällig',
        randomDesc: 'Konfigurierbarer Zufallsidentifikator',
        structured: 'Strukturiert',
        structuredDesc: 'Vorlagenbasiert mit eingebetteten Werten',
        sectorToken: 'Sektor-Token',
        sectorTokenDesc: 'Kryptografisch abgeleitetes sektorspezifisches Token'
      },
      parameters: {
        label: 'Parameter',
        length: 'Länge',
        charset: 'Zeichensatz',
        charsetAlphaNum: 'Alphanumerisch (A-Z, 0-9)',
        charsetNumeric: 'Nur Zahlen (0-9)',
        charsetAlpha: 'Nur Buchstaben (A-Z)',
        charsetHex: 'Hexadezimal (0-9, A-F)',
        excludeAmbiguous: 'Mehrdeutige Zeichen ausschließen (0, O, I, 1, l)'
      },
      structured: {
        label: 'Vorlagenkonfiguration',
        template: 'Vorlage',
        region: 'Region',
        year: 'Jahr',
        facility: 'Einrichtung'
      },
      sectorToken: {
        label: 'Sektor-Token-Konfiguration',
        foundationalUin: 'Grundlegende UIN',
        enterUin: 'UIN eingeben',
        sector: 'Sektor',
        sectors: {
          health: 'Gesundheit',
          tax: 'Steuer',
          finance: 'Finanzen',
          education: 'Bildung',
          government: 'Regierung'
        }
      },
      checksum: {
        label: 'Prüfsumme',
        enabled: 'Prüfsumme aktivieren',
        algorithm: 'Algorithmus',
        iso7064: 'ISO 7064 MOD 37-2',
        mod97: 'MOD 97-10 (IBAN-Stil)',
        luhn: 'Luhn-Algorithmus'
      },
      separator: {
        label: 'Formatierung',
        enabled: 'Trennzeichen verwenden',
        pattern: 'Muster',
        char: 'Trennzeichen',
        preview: 'Vorschau'
      },
      lifecycle: {
        label: 'Lebenszyklus & Ansprüche',
        issuer: 'Aussteller (iss)',
        audience: 'Zielgruppe (aud)',
        notBefore: 'Nicht vor (nbf)',
        minutes: 'Min.',
        expires: 'Token läuft ab',
        days: 'Tage',
        noExpiry: 'Unbegrenzte Gültigkeit'
      },
      button: 'UIN generieren',
      generating: 'Wird generiert...',
      output: {
        title: 'Generierte UIN',
        copyRaw: 'ROH',
        copyFormatted: 'FMT',
        provenance: 'Entropie-Herkunft',
        hardwareTrng: 'Hardware-TRNG',
        softwareCsprng: 'Software-CSPRNG',
        source: 'Quelle',
        provider: 'Anbieter',
        fipsLevel: 'FIPS-Stufe',
        format: {
          json: 'JSON',
          jwt: 'JWT',
          jsonld: 'JSON-LD'
        },
        jsonPayload: 'JSON-Nutzdaten',
        jwtTitle: 'JWT (RFC 7519)',
        jwtNote: 'Unsigniertes JWT (alg: none) – für den Produktiveinsatz mit Ihrem Schlüssel signieren',
        jsonldTitle: 'JSON-LD (Linked Data)',
        jsonldNote: 'W3C JSON-LD-Format mit OSIA-Vokabular-Kontext',
        copy: 'KOPIEREN',
        emptyTitle: 'Keine UIN generiert',
        emptyMessage: 'Konfigurieren Sie die Optionen und klicken Sie auf Generieren, um eine eindeutige Identifikationsnummer zu erstellen'
      }
    },

    pool: {
      title: 'Pool-Verwaltung',
      subtitle: 'Überwachen und verwalten Sie den UIN-Pool',
      stats: {
        title: 'Pool-Statistiken',
        total: 'Gesamt',
        available: 'Verfügbar',
        preassigned: 'Vorbelegt',
        assigned: 'Zugewiesen',
        retired: 'Stillgelegt',
        revoked: 'Widerrufen',
        refresh: 'Aktualisieren',
        lastUpdated: 'Zuletzt aktualisiert'
      },
      pregenerate: {
        title: 'UINs vorgenerieren',
        count: 'Anzahl',
        scope: 'Bereich',
        button: 'Vorgenerieren',
        generating: 'Wird generiert...',
        success: '{count} UINs erfolgreich generiert',
        error: 'UINs konnten nicht generiert werden'
      },
      lifecycle: {
        title: 'UIN-Lebenszyklus-Operationen',
        subtitle: 'Testen Sie den vollständigen UIN-Lebenszyklus: Vorbelegen → Zuweisen → Widerrufen/Stilllegen',
        currentUin: 'Aktuelle UIN',
        operations: {
          fetch: 'Abrufen',
          fetchDesc: '1 UIN aus Pool holen',
          preassign: 'Vorbelegen',
          preassignDesc: 'UIN reservieren',
          assign: 'Zuweisen',
          assignDesc: 'Entität zuweisen',
          revoke: 'Widerrufen',
          revokeDesc: 'UIN widerrufen',
          retire: 'Stilllegen',
          retireDesc: 'UIN stilllegen'
        },
        hints: {
          fetch: 'Rufen Sie eine einzelne verfügbare UIN aus dem Pool ab, um sie anzuzeigen und zu kopieren. Dies reserviert die UIN nicht.',
          preassign: 'Vorbelegen reserviert eine verfügbare UIN aus dem Pool. Der Status ändert sich von VERFÜGBAR zu VORBELEGT.',
          assign: 'Geben Sie eine VORBELEGTE UIN ein, um sie einer Entität zuzuweisen',
          revoke: 'Geben Sie eine ZUGEWIESENE UIN ein, um sie zu widerrufen',
          retire: 'Geben Sie eine UIN ein, um sie dauerhaft stillzulegen'
        },
        fields: {
          uin: 'UIN',
          uinPlaceholder: "UIN eingeben oder oben auf 'Verwenden' klicken",
          entityId: 'Entitäts-ID',
          entityIdPlaceholder: 'Entitätskennung (optional)',
          entityIdHelp: 'Externe Referenz für diese UIN-Zuweisung',
          reason: 'Begründung',
          reasonRevoke: 'Grund für den Widerruf',
          reasonRetire: 'Grund für die Stilllegung',
          reasonHelp: 'Optionale Begründung für die Audit-Protokollierung'
        },
        buttons: {
          fetchUin: 'UIN abrufen',
          preassignUin: 'UIN vorbelegen',
          assignUin: 'UIN zuweisen',
          revokeUin: 'UIN widerrufen',
          retireUin: 'UIN stilllegen',
          copy: 'Kopieren',
          copied: 'Kopiert!',
          use: 'Verwenden',
          processing: 'Wird verarbeitet...'
        },
        result: {
          success: 'Operation erfolgreich',
          failed: 'Operation fehlgeschlagen',
          newStatus: 'Neuer Status',
          message: 'Nachricht'
        }
      }
    },

    lookup: {
      title: 'UIN-Suche',
      subtitle: 'Suchen Sie nach UIN-Details und Audit-Verlauf',
      search: {
        placeholder: 'UIN zur Suche eingeben',
        button: 'Suchen',
        searching: 'Wird gesucht...'
      },
      result: {
        title: 'UIN-Details',
        uin: 'UIN',
        status: 'Status',
        mode: 'Modus',
        scope: 'Bereich',
        created: 'Erstellt',
        claimed: 'Beansprucht',
        claimedBy: 'Beansprucht von',
        assigned: 'Zugewiesen',
        assignedTo: 'Zugewiesen an',
        hash: 'Hash (RIPEMD-160)',
        provenance: 'Herkunft'
      },
      audit: {
        title: 'Audit-Protokoll',
        event: 'Ereignis',
        oldStatus: 'Vorheriger Status',
        newStatus: 'Neuer Status',
        actor: 'Akteur',
        timestamp: 'Zeitstempel',
        details: 'Details',
        noRecords: 'Keine Audit-Einträge gefunden'
      },
      notFound: 'UIN nicht gefunden',
      error: 'Fehler bei der UIN-Suche'
    },

    security: {
      title: 'Sicherheitsstatus',
      subtitle: 'Kryptografische Dienste und HSM-Status',
      hsm: {
        title: 'Hardware-Sicherheitsmodul',
        status: 'Status',
        enabled: 'Aktiviert',
        disabled: 'Deaktiviert',
        provider: 'Anbieter',
        type: 'Typ',
        trng: 'Hardware-TRNG',
        available: 'Verfügbar',
        notAvailable: 'Nicht verfügbar',
        fipsLevel: 'FIPS-Stufe',
        randomSource: 'Zufallsquelle'
      },
      vault: {
        title: 'HashiCorp Vault',
        status: 'Status',
        authenticated: 'Authentifiziert',
        notAuthenticated: 'Nicht authentifiziert',
        address: 'Adresse',
        secretsLoaded: 'Geladene Geheimnisse'
      },
      database: {
        title: 'Datenbank',
        status: 'Status',
        connected: 'Verbunden',
        disconnected: 'Getrennt'
      },
      providers: {
        title: 'Unterstützte HSM-Anbieter',
        production: 'Produktion',
        cloud: 'Cloud',
        development: 'Entwicklung',
        compact: 'Kompakt'
      }
    },

    docs: {
      title: 'Dokumentation',
      version: 'Version',
      sections: {
        overview: 'Übersicht',
        architecture: 'Architektur',
        api: 'API-Referenz',
        lifecycle: 'UIN-Lebenszyklus',
        security: 'Sicherheit'
      },
      overview: {
        title: 'OSIA UIN-Generator',
        lead: 'Ein produktionsreifer, PostgreSQL-gestützter Generator für eindeutige Identifikationsnummern (UIN), basierend auf der Spezifikation <strong>Open Standards for Identity APIs (OSIA)</strong>.',
        features: {
          title: 'Hauptfunktionen',
          osia: 'OSIA-basiertes Design',
          osiaDesc: 'Implementiert das POST /v1/uin Endpunktmuster',
          modes: 'Vier Generierungsmodi',
          modesDesc: 'Grundlegend, Zufällig, Strukturiert und Sektor-Token',
          pool: 'PostgreSQL Pool-Verwaltung',
          poolDesc: 'Vorgenerierung, Reservierung und Zuweisungsabläufe',
          crypto: 'Kryptografische Sicherheit',
          cryptoDesc: 'CSPRNG, HMAC-SHA256, RIPEMD-160-Hashing',
          hsm: 'HSM-TRNG-Unterstützung',
          hsmDesc: 'Hardware-basierte echte Zufallszahlengenerierung mit Herkunftsverfolgung',
          audit: 'Vollständige Audit-Protokollierung',
          auditDesc: 'Unveränderliche Protokollierung aller UIN-Lebenszyklusereignisse',
          sector: 'Sektor-Tokenisierung',
          sectorDesc: 'Nicht verknüpfbare, sektorspezifische abgeleitete Identifikatoren',
          formats: 'Mehrere Ausgabeformate',
          formatsDesc: 'JSON, JWT (RFC 7519) und JSON-LD (W3C Linked Data)',
          provenance: 'Entropie-Herkunft',
          provenanceDesc: 'Nachverfolgung, ob UINs mit HSM-TRNG oder Software-CSPRNG generiert wurden'
        },
        sectors: {
          title: 'Unterstützte Sektoren',
          health: 'Gesundheit',
          tax: 'Steuern',
          finance: 'Finanzen',
          telco: 'Telekommunikation',
          statistics: 'Statistik',
          education: 'Bildung',
          social: 'Soziales',
          government: 'Regierung'
        },
        stack: {
          title: 'Technologie-Stack',
          layer: 'Schicht',
          technology: 'Technologie',
          runtime: 'Laufzeit',
          server: 'Server',
          database: 'Datenbank',
          queryBuilder: 'Query-Builder',
          frontend: 'Frontend',
          processManager: 'Prozess-Manager'
        },
        quickStart: {
          title: 'Schnellstart',
          install: 'Abhängigkeiten installieren',
          migrate: 'Datenbankmigrationen ausführen',
          start: 'API-Server starten',
          pm2: 'Oder PM2 für Produktion verwenden'
        }
      },
      api: {
        title: 'API-Referenz',
        osiaEndpoint: 'OSIA-konformer Endpunkt',
        infoEndpoints: 'Informationsendpunkte',
        poolEndpoints: 'Pool-Verwaltungsendpunkte',
        lifecycleEndpoints: 'UIN-Lebenszyklusendpunkte',
        statelessEndpoints: 'Zustandslose Generierung',
        queryParams: 'Abfrageparameter',
        requestBody: 'Anfragekörper',
        response: 'Antwort',
        errorResponse: 'Fehlerantwort'
      },
      lifecycle: {
        title: 'UIN-Lebenszyklus',
        stateMachine: 'Zustandsautomat',
        states: {
          title: 'Lebenszyklusstatus',
          status: 'Status',
          description: 'Beschreibung',
          transitions: 'Übergänge',
          available: 'Vorgeneriert, bereit zur Reservierung',
          preassigned: 'Vom System reserviert, noch nicht an PII gebunden',
          assigned: 'An eine Person/Entität gebunden',
          retired: 'Nicht mehr aktiv (Tod usw.)',
          revoked: 'Aufgrund von Betrug/Missbrauch ungültig gemacht'
        },
        workflow: {
          title: 'Arbeitsablauf: Personenstandsregistrierung',
          sectorTitle: 'Arbeitsablauf: Sektor-Token-Ableitung'
        }
      },
      security: {
        title: 'Sicherheit',
        crypto: {
          title: 'Kryptografische Komponenten',
          component: 'Komponente',
          algorithm: 'Algorithmus',
          purpose: 'Zweck',
          randomPrimary: 'Zufallsgenerierung (Primär)',
          randomFallback: 'Zufallsgenerierung (Fallback)',
          integrity: 'Integritäts-Hash',
          sectorDerivation: 'Sektor-Ableitung',
          checksum: 'Prüfsumme'
        },
        provenance: {
          title: 'Entropie-Herkunftsverfolgung',
          description: 'Jede generierte UIN enthält Herkunftsmetadaten, die ihre Entropiequelle identifizieren:',
          priority: 'HSM-TRNG wird immer gegenüber Software-CSPRNG bevorzugt, wenn verfügbar.'
        },
        sectorSecurity: {
          title: 'Sektor-Token-Sicherheit'
        }
      }
    },

    footer: {
      title: 'OSIA UIN-Generator v2.0',
      subtitle: 'Open Standards for Identity APIs',
      learnMore: 'Mehr erfahren',
      apiServer: 'API-Server'
    },

    common: {
      loading: 'Wird geladen...',
      error: 'Fehler',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      yes: 'Ja',
      no: 'Nein',
      na: 'k.A.',
      language: 'Sprache',
      optional: 'optional',
      copy: 'KOPIEREN',
      none: 'Keine'
    },

    status: {
      available: 'Verfügbar',
      preassigned: 'Vorbelegt',
      assigned: 'Zugewiesen',
      retired: 'Stillgelegt',
      revoked: 'Widerrufen'
    }
  },

  // ==========================================================================
  // FRENCH (Français)
  // ==========================================================================
  fr: {
    _meta: {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷'
    },

    header: {
      title: 'Générateur OSIA UIN',
      subtitle: "Générateur de numéros d'identification uniques",
      version: 'v2.0'
    },

    nav: {
      generate: 'Générer',
      pool: 'Gestion du pool',
      lookup: 'Recherche UIN',
      security: 'Sécurité',
      docs: 'Documentation'
    },

    generate: {
      title: 'Générer un UIN',
      subtitle: "Créez des numéros d'identification uniques avec des paramètres configurables",
      mode: {
        label: 'Mode de génération',
        foundational: 'Fondamental',
        foundationalDesc: 'Identifiant à haute entropie, à vie, sans données personnelles intégrées',
        random: 'Aléatoire',
        randomDesc: 'Identifiant aléatoire configurable',
        structured: 'Structuré',
        structuredDesc: 'Basé sur un modèle avec valeurs intégrées',
        sectorToken: 'Jeton sectoriel',
        sectorTokenDesc: 'Jeton sectoriel dérivé cryptographiquement'
      },
      parameters: {
        label: 'Paramètres',
        length: 'Longueur',
        charset: 'Jeu de caractères',
        charsetAlphaNum: 'Alphanumérique (A-Z, 0-9)',
        charsetNumeric: 'Numérique uniquement (0-9)',
        charsetAlpha: 'Alphabétique uniquement (A-Z)',
        charsetHex: 'Hexadécimal (0-9, A-F)',
        excludeAmbiguous: 'Exclure les caractères ambigus (0, O, I, 1, l)'
      },
      structured: {
        label: 'Configuration du modèle',
        template: 'Modèle',
        region: 'Région',
        year: 'Année',
        facility: 'Établissement'
      },
      sectorToken: {
        label: 'Configuration du jeton sectoriel',
        foundationalUin: 'UIN fondamental',
        enterUin: 'Entrer UIN',
        sector: 'Secteur',
        sectors: {
          health: 'Santé',
          tax: 'Fiscalité',
          finance: 'Finance',
          education: 'Éducation',
          government: 'Gouvernement'
        }
      },
      checksum: {
        label: 'Somme de contrôle',
        enabled: 'Activer la somme de contrôle',
        algorithm: 'Algorithme',
        iso7064: 'ISO 7064 MOD 37-2',
        mod97: 'MOD 97-10 (style IBAN)',
        luhn: 'Algorithme de Luhn'
      },
      separator: {
        label: 'Formatage',
        enabled: 'Utiliser un séparateur',
        pattern: 'Motif',
        char: 'Séparateur',
        preview: 'Aperçu'
      },
      lifecycle: {
        label: 'Cycle de vie et revendications',
        issuer: 'Émetteur (iss)',
        audience: 'Audience (aud)',
        notBefore: 'Pas avant (nbf)',
        minutes: 'min',
        expires: 'Le jeton expire',
        days: 'jours',
        noExpiry: 'Durée de vie illimitée'
      },
      button: 'Générer UIN',
      generating: 'Génération en cours...',
      output: {
        title: 'UIN généré',
        copyRaw: 'BRUT',
        copyFormatted: 'FMT',
        provenance: "Provenance de l'entropie",
        hardwareTrng: 'TRNG matériel',
        softwareCsprng: 'CSPRNG logiciel',
        source: 'Source',
        provider: 'Fournisseur',
        fipsLevel: 'Niveau FIPS',
        format: {
          json: 'JSON',
          jwt: 'JWT',
          jsonld: 'JSON-LD'
        },
        jsonPayload: 'Charge utile JSON',
        jwtTitle: 'JWT (RFC 7519)',
        jwtNote: 'JWT non signé (alg: none) - signez avec votre clé pour la production',
        jsonldTitle: 'JSON-LD (Linked Data)',
        jsonldNote: 'Format W3C JSON-LD avec contexte de vocabulaire OSIA',
        copy: 'COPIER',
        emptyTitle: 'Aucun UIN généré',
        emptyMessage: "Configurez les options et cliquez sur Générer pour créer un identifiant unique"
      }
    },

    pool: {
      title: 'Gestion du pool',
      subtitle: 'Surveillez et gérez le pool UIN',
      stats: {
        title: 'Statistiques du pool',
        total: 'Total',
        available: 'Disponible',
        preassigned: 'Pré-attribué',
        assigned: 'Attribué',
        retired: 'Retiré',
        revoked: 'Révoqué',
        refresh: 'Actualiser',
        lastUpdated: 'Dernière mise à jour'
      },
      pregenerate: {
        title: 'Pré-générer des UINs',
        count: 'Nombre',
        scope: 'Portée',
        button: 'Pré-générer',
        generating: 'Génération en cours...',
        success: '{count} UINs générés avec succès',
        error: 'Échec de la génération des UINs'
      },
      lifecycle: {
        title: 'Opérations du cycle de vie UIN',
        subtitle: 'Testez le cycle de vie complet : pré-attribuer → attribuer → révoquer/retirer',
        currentUin: 'UIN actuel',
        operations: {
          fetch: 'Récupérer',
          fetchDesc: 'Obtenir 1 UIN du pool',
          preassign: 'Pré-attribuer',
          preassignDesc: "Réserver l'UIN",
          assign: 'Attribuer',
          assignDesc: 'Attribuer à une entité',
          revoke: 'Révoquer',
          revokeDesc: "Révoquer l'UIN",
          retire: 'Retirer',
          retireDesc: "Retirer l'UIN"
        },
        hints: {
          fetch: "Récupérez un UIN disponible du pool pour l'afficher et le copier. Cela ne réserve pas l'UIN.",
          preassign: "La pré-attribution réserve un UIN disponible du pool. Le statut passe de DISPONIBLE à PRÉ-ATTRIBUÉ.",
          assign: 'Entrez un UIN PRÉ-ATTRIBUÉ pour l\'attribuer à une entité',
          revoke: 'Entrez un UIN ATTRIBUÉ pour le révoquer',
          retire: 'Entrez un UIN pour le retirer définitivement'
        },
        fields: {
          uin: 'UIN',
          uinPlaceholder: "Entrez l'UIN ou cliquez sur 'Utiliser' ci-dessus",
          entityId: "ID de l'entité",
          entityIdPlaceholder: "Identifiant de l'entité (optionnel)",
          entityIdHelp: 'Référence externe pour cette attribution UIN',
          reason: 'Motif',
          reasonRevoke: 'Motif de la révocation',
          reasonRetire: 'Motif du retrait',
          reasonHelp: "Motif optionnel pour la piste d'audit"
        },
        buttons: {
          fetchUin: 'Récupérer UIN',
          preassignUin: 'Pré-attribuer UIN',
          assignUin: 'Attribuer UIN',
          revokeUin: 'Révoquer UIN',
          retireUin: 'Retirer UIN',
          copy: 'Copier',
          copied: 'Copié !',
          use: 'Utiliser',
          processing: 'Traitement en cours...'
        },
        result: {
          success: 'Opération réussie',
          failed: 'Opération échouée',
          newStatus: 'Nouveau statut',
          message: 'Message'
        }
      }
    },

    lookup: {
      title: 'Recherche UIN',
      subtitle: "Recherchez les détails d'un UIN et son historique d'audit",
      search: {
        placeholder: 'Entrez un UIN à rechercher',
        button: 'Rechercher',
        searching: 'Recherche en cours...'
      },
      result: {
        title: "Détails de l'UIN",
        uin: 'UIN',
        status: 'Statut',
        mode: 'Mode',
        scope: 'Portée',
        created: 'Créé',
        claimed: 'Réclamé',
        claimedBy: 'Réclamé par',
        assigned: 'Attribué',
        assignedTo: 'Attribué à',
        hash: 'Hash (RIPEMD-160)',
        provenance: 'Provenance'
      },
      audit: {
        title: "Piste d'audit",
        event: 'Événement',
        oldStatus: 'Statut précédent',
        newStatus: 'Nouveau statut',
        actor: 'Acteur',
        timestamp: 'Horodatage',
        details: 'Détails',
        noRecords: "Aucun enregistrement d'audit trouvé"
      },
      notFound: 'UIN non trouvé',
      error: "Erreur lors de la recherche de l'UIN"
    },

    security: {
      title: 'État de la sécurité',
      subtitle: 'Services cryptographiques et état du HSM',
      hsm: {
        title: 'Module de sécurité matériel',
        status: 'État',
        enabled: 'Activé',
        disabled: 'Désactivé',
        provider: 'Fournisseur',
        type: 'Type',
        trng: 'TRNG matériel',
        available: 'Disponible',
        notAvailable: 'Non disponible',
        fipsLevel: 'Niveau FIPS',
        randomSource: 'Source aléatoire'
      },
      vault: {
        title: 'HashiCorp Vault',
        status: 'État',
        authenticated: 'Authentifié',
        notAuthenticated: 'Non authentifié',
        address: 'Adresse',
        secretsLoaded: 'Secrets chargés'
      },
      database: {
        title: 'Base de données',
        status: 'État',
        connected: 'Connecté',
        disconnected: 'Déconnecté'
      },
      providers: {
        title: 'Fournisseurs HSM pris en charge',
        production: 'Production',
        cloud: 'Cloud',
        development: 'Développement',
        compact: 'Compact'
      }
    },

    docs: {
      title: 'Documentation',
      version: 'Version',
      sections: {
        overview: 'Aperçu',
        architecture: 'Architecture',
        api: 'Référence API',
        lifecycle: 'Cycle de vie UIN',
        security: 'Sécurité'
      },
      overview: {
        title: 'Générateur OSIA UIN',
        lead: "Un générateur de numéros d'identification uniques (UIN) de qualité production, basé sur PostgreSQL, conforme à la spécification <strong>Open Standards for Identity APIs (OSIA)</strong>.",
        features: {
          title: 'Fonctionnalités principales',
          osia: 'Conception basée sur OSIA',
          osiaDesc: "Implémente le modèle d'endpoint POST /v1/uin",
          modes: 'Quatre modes de génération',
          modesDesc: 'Fondamental, Aléatoire, Structuré et Jeton sectoriel',
          pool: 'Gestion de pool PostgreSQL',
          poolDesc: "Flux de pré-génération, de réservation et d'attribution",
          crypto: 'Sécurité cryptographique',
          cryptoDesc: 'CSPRNG, HMAC-SHA256, hachage RIPEMD-160',
          hsm: 'Prise en charge HSM TRNG',
          hsmDesc: 'Génération de nombres aléatoires matérielle avec suivi de provenance',
          audit: "Piste d'audit complète",
          auditDesc: 'Journalisation immuable de tous les événements du cycle de vie UIN',
          sector: 'Tokenisation sectorielle',
          sectorDesc: 'Identifiants sectoriels dérivés non liables',
          formats: 'Formats de sortie multiples',
          formatsDesc: 'JSON, JWT (RFC 7519) et JSON-LD (W3C Linked Data)',
          provenance: "Provenance de l'entropie",
          provenanceDesc: 'Suivi indiquant si les UINs ont été générés avec HSM TRNG ou CSPRNG logiciel'
        },
        sectors: {
          title: 'Secteurs pris en charge',
          health: 'Santé',
          tax: 'Fiscalité',
          finance: 'Finance',
          telco: 'Télécommunications',
          statistics: 'Statistiques',
          education: 'Éducation',
          social: 'Social',
          government: 'Gouvernement'
        },
        stack: {
          title: 'Stack technologique',
          layer: 'Couche',
          technology: 'Technologie',
          runtime: "Environnement d'exécution",
          server: 'Serveur',
          database: 'Base de données',
          queryBuilder: 'Constructeur de requêtes',
          frontend: 'Frontend',
          processManager: 'Gestionnaire de processus'
        },
        quickStart: {
          title: 'Démarrage rapide',
          install: 'Installer les dépendances',
          migrate: 'Exécuter les migrations de base de données',
          start: "Démarrer le serveur d'API",
          pm2: 'Ou utiliser PM2 pour la production'
        }
      },
      api: {
        title: 'Référence API',
        osiaEndpoint: 'Endpoint conforme OSIA',
        infoEndpoints: "Endpoints d'information",
        poolEndpoints: 'Endpoints de gestion du pool',
        lifecycleEndpoints: 'Endpoints du cycle de vie UIN',
        statelessEndpoints: 'Génération sans état',
        queryParams: 'Paramètres de requête',
        requestBody: 'Corps de la requête',
        response: 'Réponse',
        errorResponse: "Réponse d'erreur"
      },
      lifecycle: {
        title: 'Cycle de vie UIN',
        stateMachine: 'Machine à états',
        states: {
          title: 'États du cycle de vie',
          status: 'Statut',
          description: 'Description',
          transitions: 'Transitions',
          available: 'Pré-généré, prêt à être réservé',
          preassigned: 'Réservé par le système, pas encore lié aux données personnelles',
          assigned: 'Lié à une personne/entité',
          retired: 'Plus actif (décès, etc.)',
          revoked: 'Invalidé pour fraude/abus'
        },
        workflow: {
          title: "Flux de travail : Enregistrement d'état civil",
          sectorTitle: 'Flux de travail : Dérivation de jeton sectoriel'
        }
      },
      security: {
        title: 'Sécurité',
        crypto: {
          title: 'Composants cryptographiques',
          component: 'Composant',
          algorithm: 'Algorithme',
          purpose: 'Objectif',
          randomPrimary: 'Génération aléatoire (Primaire)',
          randomFallback: 'Génération aléatoire (Secours)',
          integrity: "Hash d'intégrité",
          sectorDerivation: 'Dérivation sectorielle',
          checksum: 'Somme de contrôle'
        },
        provenance: {
          title: "Suivi de la provenance de l'entropie",
          description: 'Chaque UIN généré inclut des métadonnées de provenance identifiant sa source d\'entropie :',
          priority: 'Le TRNG HSM est toujours privilégié par rapport au CSPRNG logiciel lorsqu\'il est disponible.'
        },
        sectorSecurity: {
          title: 'Sécurité des jetons sectoriels'
        }
      }
    },

    footer: {
      title: 'Générateur OSIA UIN v2.0',
      subtitle: 'Open Standards for Identity APIs',
      learnMore: 'En savoir plus',
      apiServer: 'Serveur API'
    },

    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      yes: 'Oui',
      no: 'Non',
      na: 'N/D',
      language: 'Langue',
      optional: 'optionnel',
      copy: 'COPIER',
      none: 'Aucun'
    },

    status: {
      available: 'Disponible',
      preassigned: 'Pré-attribué',
      assigned: 'Attribué',
      retired: 'Retiré',
      revoked: 'Révoqué'
    }
  },

  // ==========================================================================
  // SPANISH (Español)
  // ==========================================================================
  es: {
    _meta: {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸'
    },

    header: {
      title: 'Generador OSIA UIN',
      subtitle: 'Generador de números de identificación únicos',
      version: 'v2.0'
    },

    nav: {
      generate: 'Generar',
      pool: 'Gestión del pool',
      lookup: 'Búsqueda UIN',
      security: 'Seguridad',
      docs: 'Documentación'
    },

    generate: {
      title: 'Generar UIN',
      subtitle: 'Cree números de identificación únicos con parámetros configurables',
      mode: {
        label: 'Modo de generación',
        foundational: 'Fundamental',
        foundationalDesc: 'Identificador de alta entropía, vitalicio, sin datos personales integrados',
        random: 'Aleatorio',
        randomDesc: 'Identificador aleatorio configurable',
        structured: 'Estructurado',
        structuredDesc: 'Basado en plantilla con valores integrados',
        sectorToken: 'Token sectorial',
        sectorTokenDesc: 'Token sectorial derivado criptográficamente'
      },
      parameters: {
        label: 'Parámetros',
        length: 'Longitud',
        charset: 'Juego de caracteres',
        charsetAlphaNum: 'Alfanumérico (A-Z, 0-9)',
        charsetNumeric: 'Solo numérico (0-9)',
        charsetAlpha: 'Solo alfabético (A-Z)',
        charsetHex: 'Hexadecimal (0-9, A-F)',
        excludeAmbiguous: 'Excluir caracteres ambiguos (0, O, I, 1, l)'
      },
      structured: {
        label: 'Configuración de plantilla',
        template: 'Plantilla',
        region: 'Región',
        year: 'Año',
        facility: 'Instalación'
      },
      sectorToken: {
        label: 'Configuración del token sectorial',
        foundationalUin: 'UIN fundamental',
        enterUin: 'Introducir UIN',
        sector: 'Sector',
        sectors: {
          health: 'Salud',
          tax: 'Fiscal',
          finance: 'Finanzas',
          education: 'Educación',
          government: 'Gobierno'
        }
      },
      checksum: {
        label: 'Suma de verificación',
        enabled: 'Habilitar suma de verificación',
        algorithm: 'Algoritmo',
        iso7064: 'ISO 7064 MOD 37-2',
        mod97: 'MOD 97-10 (estilo IBAN)',
        luhn: 'Algoritmo de Luhn'
      },
      separator: {
        label: 'Formato',
        enabled: 'Usar separador',
        pattern: 'Patrón',
        char: 'Separador',
        preview: 'Vista previa'
      },
      lifecycle: {
        label: 'Ciclo de vida y claims',
        issuer: 'Emisor (iss)',
        audience: 'Audiencia (aud)',
        notBefore: 'No antes de (nbf)',
        minutes: 'min',
        expires: 'El token expira',
        days: 'días',
        noExpiry: 'Vigencia ilimitada'
      },
      button: 'Generar UIN',
      generating: 'Generando...',
      output: {
        title: 'UIN generado',
        copyRaw: 'BRUTO',
        copyFormatted: 'FMT',
        provenance: 'Procedencia de la entropía',
        hardwareTrng: 'TRNG hardware',
        softwareCsprng: 'CSPRNG software',
        source: 'Fuente',
        provider: 'Proveedor',
        fipsLevel: 'Nivel FIPS',
        format: {
          json: 'JSON',
          jwt: 'JWT',
          jsonld: 'JSON-LD'
        },
        jsonPayload: 'Carga útil JSON',
        jwtTitle: 'JWT (RFC 7519)',
        jwtNote: 'JWT sin firmar (alg: none) - firme con su clave para producción',
        jsonldTitle: 'JSON-LD (Linked Data)',
        jsonldNote: 'Formato W3C JSON-LD con contexto de vocabulario OSIA',
        copy: 'COPIAR',
        emptyTitle: 'Ningún UIN generado',
        emptyMessage: 'Configure las opciones y haga clic en Generar para crear un identificador único'
      }
    },

    pool: {
      title: 'Gestión del pool',
      subtitle: 'Supervise y gestione el pool de UINs',
      stats: {
        title: 'Estadísticas del pool',
        total: 'Total',
        available: 'Disponible',
        preassigned: 'Preasignado',
        assigned: 'Asignado',
        retired: 'Retirado',
        revoked: 'Revocado',
        refresh: 'Actualizar',
        lastUpdated: 'Última actualización'
      },
      pregenerate: {
        title: 'Pregenerar UINs',
        count: 'Cantidad',
        scope: 'Ámbito',
        button: 'Pregenerar',
        generating: 'Generando...',
        success: '{count} UINs generados exitosamente',
        error: 'Error al generar UINs'
      },
      lifecycle: {
        title: 'Operaciones del ciclo de vida UIN',
        subtitle: 'Pruebe el ciclo de vida completo: preasignar → asignar → revocar/retirar',
        currentUin: 'UIN actual',
        operations: {
          fetch: 'Obtener',
          fetchDesc: 'Obtener 1 UIN del pool',
          preassign: 'Preasignar',
          preassignDesc: 'Reservar el UIN',
          assign: 'Asignar',
          assignDesc: 'Asignar a entidad',
          revoke: 'Revocar',
          revokeDesc: 'Revocar UIN',
          retire: 'Retirar',
          retireDesc: 'Retirar UIN'
        },
        hints: {
          fetch: 'Obtenga un UIN disponible del pool para verlo y copiarlo. Esto no reserva el UIN.',
          preassign: 'La preasignación reserva un UIN disponible del pool. El estado cambia de DISPONIBLE a PREASIGNADO.',
          assign: 'Ingrese un UIN PREASIGNADO para asignarlo a una entidad',
          revoke: 'Ingrese un UIN ASIGNADO para revocarlo',
          retire: 'Ingrese un UIN para retirarlo permanentemente'
        },
        fields: {
          uin: 'UIN',
          uinPlaceholder: "Ingrese UIN o haga clic en 'Usar' arriba",
          entityId: 'ID de entidad',
          entityIdPlaceholder: 'Identificador de entidad (opcional)',
          entityIdHelp: 'Referencia externa para esta asignación de UIN',
          reason: 'Motivo',
          reasonRevoke: 'Motivo de la revocación',
          reasonRetire: 'Motivo del retiro',
          reasonHelp: 'Motivo opcional para el registro de auditoría'
        },
        buttons: {
          fetchUin: 'Obtener UIN',
          preassignUin: 'Preasignar UIN',
          assignUin: 'Asignar UIN',
          revokeUin: 'Revocar UIN',
          retireUin: 'Retirar UIN',
          copy: 'Copiar',
          copied: '¡Copiado!',
          use: 'Usar',
          processing: 'Procesando...'
        },
        result: {
          success: 'Operación exitosa',
          failed: 'Operación fallida',
          newStatus: 'Nuevo estado',
          message: 'Mensaje'
        }
      }
    },

    lookup: {
      title: 'Búsqueda UIN',
      subtitle: 'Busque detalles de UIN e historial de auditoría',
      search: {
        placeholder: 'Ingrese UIN para buscar',
        button: 'Buscar',
        searching: 'Buscando...'
      },
      result: {
        title: 'Detalles del UIN',
        uin: 'UIN',
        status: 'Estado',
        mode: 'Modo',
        scope: 'Ámbito',
        created: 'Creado',
        claimed: 'Reclamado',
        claimedBy: 'Reclamado por',
        assigned: 'Asignado',
        assignedTo: 'Asignado a',
        hash: 'Hash (RIPEMD-160)',
        provenance: 'Procedencia'
      },
      audit: {
        title: 'Registro de auditoría',
        event: 'Evento',
        oldStatus: 'Estado anterior',
        newStatus: 'Nuevo estado',
        actor: 'Actor',
        timestamp: 'Marca de tiempo',
        details: 'Detalles',
        noRecords: 'No se encontraron registros de auditoría'
      },
      notFound: 'UIN no encontrado',
      error: 'Error al buscar el UIN'
    },

    security: {
      title: 'Estado de seguridad',
      subtitle: 'Servicios criptográficos y estado del HSM',
      hsm: {
        title: 'Módulo de seguridad hardware',
        status: 'Estado',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        provider: 'Proveedor',
        type: 'Tipo',
        trng: 'TRNG hardware',
        available: 'Disponible',
        notAvailable: 'No disponible',
        fipsLevel: 'Nivel FIPS',
        randomSource: 'Fuente aleatoria'
      },
      vault: {
        title: 'HashiCorp Vault',
        status: 'Estado',
        authenticated: 'Autenticado',
        notAuthenticated: 'No autenticado',
        address: 'Dirección',
        secretsLoaded: 'Secretos cargados'
      },
      database: {
        title: 'Base de datos',
        status: 'Estado',
        connected: 'Conectado',
        disconnected: 'Desconectado'
      },
      providers: {
        title: 'Proveedores HSM compatibles',
        production: 'Producción',
        cloud: 'Nube',
        development: 'Desarrollo',
        compact: 'Compacto'
      }
    },

    docs: {
      title: 'Documentación',
      version: 'Versión',
      sections: {
        overview: 'Descripción general',
        architecture: 'Arquitectura',
        api: 'Referencia API',
        lifecycle: 'Ciclo de vida UIN',
        security: 'Seguridad'
      },
      overview: {
        title: 'Generador OSIA UIN',
        lead: 'Un generador de números de identificación únicos (UIN) de nivel de producción, respaldado por PostgreSQL, basado en la especificación <strong>Open Standards for Identity APIs (OSIA)</strong>.',
        features: {
          title: 'Características principales',
          osia: 'Diseño basado en OSIA',
          osiaDesc: 'Implementa el patrón de endpoint POST /v1/uin',
          modes: 'Cuatro modos de generación',
          modesDesc: 'Fundamental, Aleatorio, Estructurado y Token sectorial',
          pool: 'Gestión de pool PostgreSQL',
          poolDesc: 'Flujos de pregeneración, reserva y asignación',
          crypto: 'Seguridad criptográfica',
          cryptoDesc: 'CSPRNG, HMAC-SHA256, hash RIPEMD-160',
          hsm: 'Soporte HSM TRNG',
          hsmDesc: 'Generación de números aleatorios por hardware con seguimiento de procedencia',
          audit: 'Registro de auditoría completo',
          auditDesc: 'Registro inmutable de todos los eventos del ciclo de vida UIN',
          sector: 'Tokenización sectorial',
          sectorDesc: 'Identificadores sectoriales derivados no vinculables',
          formats: 'Múltiples formatos de salida',
          formatsDesc: 'JSON, JWT (RFC 7519) y JSON-LD (W3C Linked Data)',
          provenance: 'Procedencia de la entropía',
          provenanceDesc: 'Seguimiento de si los UINs fueron generados con HSM TRNG o CSPRNG software'
        },
        sectors: {
          title: 'Sectores compatibles',
          health: 'Salud',
          tax: 'Impuestos',
          finance: 'Finanzas',
          telco: 'Telecomunicaciones',
          statistics: 'Estadísticas',
          education: 'Educación',
          social: 'Social',
          government: 'Gobierno'
        },
        stack: {
          title: 'Stack tecnológico',
          layer: 'Capa',
          technology: 'Tecnología',
          runtime: 'Entorno de ejecución',
          server: 'Servidor',
          database: 'Base de datos',
          queryBuilder: 'Constructor de consultas',
          frontend: 'Frontend',
          processManager: 'Gestor de procesos'
        },
        quickStart: {
          title: 'Inicio rápido',
          install: 'Instalar dependencias',
          migrate: 'Ejecutar migraciones de base de datos',
          start: 'Iniciar el servidor API',
          pm2: 'O usar PM2 para producción'
        }
      },
      api: {
        title: 'Referencia API',
        osiaEndpoint: 'Endpoint compatible con OSIA',
        infoEndpoints: 'Endpoints de información',
        poolEndpoints: 'Endpoints de gestión del pool',
        lifecycleEndpoints: 'Endpoints del ciclo de vida UIN',
        statelessEndpoints: 'Generación sin estado',
        queryParams: 'Parámetros de consulta',
        requestBody: 'Cuerpo de la solicitud',
        response: 'Respuesta',
        errorResponse: 'Respuesta de error'
      },
      lifecycle: {
        title: 'Ciclo de vida UIN',
        stateMachine: 'Máquina de estados',
        states: {
          title: 'Estados del ciclo de vida',
          status: 'Estado',
          description: 'Descripción',
          transitions: 'Transiciones',
          available: 'Pregenerado, listo para ser reservado',
          preassigned: 'Reservado por el sistema, aún no vinculado a datos personales',
          assigned: 'Vinculado a una persona/entidad',
          retired: 'Ya no activo (fallecimiento, etc.)',
          revoked: 'Invalidado por fraude/abuso'
        },
        workflow: {
          title: 'Flujo de trabajo: Registro civil',
          sectorTitle: 'Flujo de trabajo: Derivación de token sectorial'
        }
      },
      security: {
        title: 'Seguridad',
        crypto: {
          title: 'Componentes criptográficos',
          component: 'Componente',
          algorithm: 'Algoritmo',
          purpose: 'Propósito',
          randomPrimary: 'Generación aleatoria (Primario)',
          randomFallback: 'Generación aleatoria (Respaldo)',
          integrity: 'Hash de integridad',
          sectorDerivation: 'Derivación sectorial',
          checksum: 'Suma de verificación'
        },
        provenance: {
          title: 'Seguimiento de procedencia de la entropía',
          description: 'Cada UIN generado incluye metadatos de procedencia que identifican su fuente de entropía:',
          priority: 'El TRNG HSM siempre tiene prioridad sobre el CSPRNG software cuando está disponible.'
        },
        sectorSecurity: {
          title: 'Seguridad de tokens sectoriales'
        }
      }
    },

    footer: {
      title: 'Generador OSIA UIN v2.0',
      subtitle: 'Open Standards for Identity APIs',
      learnMore: 'Más información',
      apiServer: 'Servidor API'
    },

    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      yes: 'Sí',
      no: 'No',
      na: 'N/D',
      language: 'Idioma',
      optional: 'opcional',
      copy: 'COPIAR',
      none: 'Ninguno'
    },

    status: {
      available: 'Disponible',
      preassigned: 'Preasignado',
      assigned: 'Asignado',
      retired: 'Retirado',
      revoked: 'Revocado'
    }
  }
};

// Helper function to get nested translation
export function t(lang, key) {
  const keys = key.split('.');
  let value = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  return value;
}

// Get available languages
export function getLanguages() {
  return Object.keys(translations).map(code => ({
    code,
    ...translations[code]._meta
  }));
}

export default translations;
