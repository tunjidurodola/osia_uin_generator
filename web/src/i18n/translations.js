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
      pregen: {
        displayFormat: 'Display Format',
        noFormat: 'No format (use default)',
        formatHelp: 'Associates format for display when UINs are retrieved',
        formatApplied: 'Format applied'
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
        formats: 'Display Formats',
        lifecycle: 'UIN Lifecycle',
        security: 'Security',
        deployment: 'Deployment'
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
      architecture: {
        title: 'System Architecture',
        highLevel: 'High-Level Overview',
        component: 'Component Diagram',
        dbSchema: 'Database Schema',
        genModes: 'Generation Modes',
        mode: 'Mode',
        description: 'Description',
        useCase: 'Use Case',
        modes: {
          foundationalDesc: 'High-entropy CSPRNG, no embedded PII',
          foundationalUse: 'Primary national ID, lifelong identifier',
          randomDesc: 'Configurable length, charset, checksum',
          randomUse: 'Ad-hoc identifiers, testing',
          structuredDesc: 'Template-based with placeholders',
          structuredUse: 'Region/facility-encoded IDs',
          sectorDesc: 'HMAC-derived, unlinkable tokens',
          sectorUse: 'Health, tax, finance sector IDs'
        }
      },
      api: {
        title: 'API Reference',
        osiaEndpoint: 'OSIA-Compliant Endpoint',
        osiaEndpointDesc: 'Generate a new UIN following the OSIA endpoint pattern.',
        infoEndpoints: 'Information Endpoints',
        poolEndpoints: 'Pool Management Endpoints',
        lifecycleEndpoints: 'UIN Lifecycle Endpoints',
        statelessEndpoints: 'Stateless Generation',
        queryParams: 'Query Parameters',
        parameter: 'Parameter',
        type: 'Type',
        required: 'Required',
        descriptionCol: 'Description',
        transactionIdDesc: 'Transaction identifier for tracking',
        requestBody: 'Request Body',
        response: 'Response',
        errorResponse: 'Error Response',
        endpoints: {
          health: 'Health check with HSM, Vault, and database status.',
          cryptoStatus: 'Cryptographic services status (HSM, Vault, secrets).',
          modes: 'List available generation modes.',
          sectors: 'List supported sectors for tokenization.',
          poolStats: 'Get pool statistics by scope.',
          poolPeek: 'Preview top available UINs without claiming them.',
          poolPreassign: 'Pre-assign a UIN from the pool. Changes status: AVAILABLE → PREASSIGNED.',
          poolAssign: 'Assign a pre-assigned UIN to an entity. Changes status: PREASSIGNED → ASSIGNED.',
          poolRevoke: 'Revoke an assigned UIN (fraud, error correction). Changes status: → REVOKED.',
          poolRetire: 'Retire a UIN (end-of-life, death registration). Changes status: → RETIRED.',
          uinPregenerate: 'Batch pre-generate UINs into the pool.',
          uinClaim: 'Claim an available UIN (AVAILABLE → PREASSIGNED).',
          uinAssign: 'Assign UIN to external reference (PREASSIGNED → ASSIGNED).',
          uinRelease: 'Release a pre-assigned UIN back to pool (PREASSIGNED → AVAILABLE).',
          uinStatus: 'Update UIN status (retire, revoke, etc.).',
          uinCleanup: 'Release stale pre-assigned UINs back to available.',
          uinLookup: 'Lookup UIN details by value.',
          uinAudit: 'Get complete audit trail for a UIN.',
          generate: 'Generate UIN without database persistence.',
          // Format endpoints
          formatsList: 'List all available UIN display formats.',
          formatsGet: 'Get a specific format by ID or code.',
          formatsCreate: 'Create a new display format configuration.',
          formatsUpdate: 'Update an existing format configuration.',
          formatsDelete: 'Delete a format (cannot delete default).',
          formatsPreview: 'Preview how a UIN would look with a format.',
          uinFormatSet: 'Set a format override for a specific UIN.',
          uinFormatRemove: 'Remove format override, revert to default.'
        },
        formatEndpoints: 'Format Configuration Endpoints'
      },
      formats: {
        title: 'UIN Display Formats',
        description: 'Format configurations define how UINs are displayed without storing pre-formatted values. This is efficient as millions of UINs can share the same format rules.',
        howItWorks: 'How It Works',
        howItWorksDesc: 'Instead of storing formatted UINs (inefficient for millions of records), format rules are stored once and applied at display time.',
        example: 'Example',
        exampleRaw: 'Raw UIN',
        exampleFormatted: 'Formatted',
        configTable: 'Format Configuration',
        field: 'Field',
        fieldDesc: 'Description',
        fields: {
          formatCode: 'Unique identifier for the format (e.g., OSIA_STANDARD)',
          separator: 'Character(s) inserted between segments (e.g., ".", "-", " ")',
          segmentLengths: 'Array defining segment sizes (e.g., [5,4,4,4,2] for XXXXX.XXXX.XXXX.XXXX.XX)',
          displayCase: 'Case transformation: upper, lower, or preserve',
          prefix: 'Optional prefix added before UIN (e.g., "UIN-")',
          suffix: 'Optional suffix added after UIN',
          appliesTo: 'Auto-apply to UINs matching scope or mode'
        },
        defaultFormats: 'Default Formats',
        defaultFormatsDesc: 'The system includes pre-configured formats:',
        formatNames: {
          osiaStandard: 'OSIA Standard - Dots every 5/4/4/4/2 characters',
          osiaCompact: 'OSIA Compact - No separators',
          osiaDashed: 'OSIA Dashed - Dashes instead of dots',
          osiaSpaced: 'OSIA Spaced - Spaces between segments',
          healthId: 'Health ID - Sector-specific format with prefix',
          taxId: 'Tax ID - Traditional tax number format',
          shortId: 'Short ID - 12-character format with dashes'
        },
        apiUsage: 'API Usage',
        listFormats: 'List all formats',
        previewFormat: 'Preview a format',
        setOverride: 'Set per-UIN override',
        batchBehavior: 'Batch Generation Behavior',
        batchBehaviorDesc: 'When generating UINs in batch with a format specified:',
        batchSmall: 'Small batches (≤10): Formatting is applied inline to each UIN',
        batchLarge: 'Large batches (>10): A format_metadata section is appended instead, allowing downstream systems to apply formatting',
        batchNote: 'This optimization prevents performance issues when generating hundreds of UINs.',
        poolGeneration: 'Pool Pre-generation',
        poolGenerationDesc: 'When pre-generating UINs into the pool, the format association is stored in uin_format_overrides table. The formatted UIN is never stored - only the association. When UINs are retrieved, formatting is applied dynamically.'
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
          retired: 'No longer active (death, end-of-life)',
          revoked: 'Explicitly invalidated (fraud/abuse)',
          terminal: 'Terminal state'
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
          randomPrimaryPurpose: 'FIPS 140-2 certified entropy from physical sources',
          randomFallback: 'Random Generation (Fallback)',
          randomFallbackPurpose: 'Software CSPRNG when HSM unavailable',
          integrity: 'Integrity Hash',
          integrityPurpose: 'UIN integrity verification',
          sectorDerivation: 'Sector Derivation',
          sectorDerivationPurpose: 'Unlinkable sector tokens',
          checksum: 'Checksum',
          checksumPurpose: 'Transcription error detection'
        },
        provenance: {
          title: 'Entropy Provenance Tracking',
          description: 'Every generated UIN includes provenance metadata identifying its entropy source:',
          priority: 'HSM TRNG is always prioritized over software CSPRNG when available.'
        },
        sectorSecurity: {
          title: 'Sector Token Security'
        },
        bestPractices: {
          title: 'Security Best Practices',
          sectorSecrets: 'Sector Secrets',
          sectorSecretsDesc: 'Use unique, high-entropy secrets per sector (min 32 bytes)',
          dbSecurity: 'Database Security',
          dbSecurityDesc: 'Row-level locking prevents race conditions',
          noPii: 'No PII in UIN',
          noPiiDesc: 'Foundational mode embeds no personal data',
          constantTime: 'Constant-Time Comparison',
          constantTimeDesc: 'Token verification uses timing-safe comparison',
          auditImmutable: 'Audit Immutability',
          auditImmutableDesc: 'Audit records are append-only',
          tls: 'TLS Everywhere',
          tlsDesc: 'All API communications over HTTPS'
        },
        auth: {
          title: 'Authentication (Production)'
        }
      },
      deployment: {
        title: 'Deployment',
        envVars: 'Environment Variables',
        pm2: 'PM2 Deployment',
        docker: 'Docker Deployment',
        architecture: 'Deployment Architecture',
        healthCheck: 'Health Check'
      }
    },

    // Security tab
    security: {
      title: 'Cryptographic Services Status',
      refresh: 'Refresh',
      fetchError: 'Failed to fetch status',
      enabled: 'Enabled',
      disabled: 'Disabled',
      mode: 'Mode',
      provider: 'Provider',
      initialized: 'Initialized',
      slot: 'Slot',
      keyLabel: 'Key Label',
      hardwareCrypto: 'Hardware Cryptography',
      softwareFallback: 'Software Fallback',
      authenticated: 'Authenticated',
      address: 'Address',
      connected: 'Connected',
      notAuthenticated: 'Not Authenticated',
      sectorSecrets: 'Sector Secrets',
      loaded: 'Loaded',
      notLoaded: 'Not Loaded',
      secretsCount: 'Secrets Count',
      source: 'Source',
      environment: 'Environment',
      allConfigured: 'All Sectors Configured',
      partialConfig: 'Partial Configuration',
      noSecrets: 'No Secrets Loaded',
      clickRefresh: 'Click "Refresh" to load security status',
      hsmProviders: 'Supported HSM Providers (Priority Order)',
      hsmProvidersDesc: 'Hardware TRNG is always prioritized over software CSPRNG. Production HSMs provide FIPS 140-2 Level 3 certified entropy.'
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
      pregen: {
        displayFormat: 'Anzeigeformat',
        noFormat: 'Kein Format (Standard verwenden)',
        formatHelp: 'Verknüpft das Format für die Anzeige beim Abrufen der UINs',
        formatApplied: 'Format angewendet'
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
        formats: 'Anzeigeformate',
        lifecycle: 'UIN-Lebenszyklus',
        security: 'Sicherheit',
        deployment: 'Bereitstellung'
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
      architecture: {
        title: 'Systemarchitektur',
        highLevel: 'Übersicht auf hoher Ebene',
        component: 'Komponentendiagramm',
        dbSchema: 'Datenbankschema',
        genModes: 'Generierungsmodi',
        mode: 'Modus',
        description: 'Beschreibung',
        useCase: 'Anwendungsfall',
        modes: {
          foundationalDesc: 'Hochentropisches CSPRNG, keine eingebetteten personenbezogenen Daten',
          foundationalUse: 'Primäre nationale ID, lebenslanger Identifikator',
          randomDesc: 'Konfigurierbare Länge, Zeichensatz, Prüfsumme',
          randomUse: 'Ad-hoc-Identifikatoren, Tests',
          structuredDesc: 'Vorlagenbasiert mit Platzhaltern',
          structuredUse: 'Region-/Einrichtungs-codierte IDs',
          sectorDesc: 'HMAC-abgeleitete, nicht verknüpfbare Tokens',
          sectorUse: 'Gesundheits-, Steuer-, Finanzsektor-IDs'
        }
      },
      api: {
        title: 'API-Referenz',
        osiaEndpoint: 'OSIA-konformer Endpunkt',
        osiaEndpointDesc: 'Generieren Sie eine neue UIN gemäß dem OSIA-Endpunktmuster.',
        infoEndpoints: 'Informationsendpunkte',
        poolEndpoints: 'Pool-Verwaltungsendpunkte',
        lifecycleEndpoints: 'UIN-Lebenszyklusendpunkte',
        statelessEndpoints: 'Zustandslose Generierung',
        queryParams: 'Abfrageparameter',
        parameter: 'Parameter',
        type: 'Typ',
        required: 'Erforderlich',
        descriptionCol: 'Beschreibung',
        transactionIdDesc: 'Transaktionskennung zur Nachverfolgung',
        requestBody: 'Anfragekörper',
        response: 'Antwort',
        errorResponse: 'Fehlerantwort',
        endpoints: {
          health: 'Gesundheitscheck mit HSM-, Vault- und Datenbankstatus.',
          cryptoStatus: 'Status kryptografischer Dienste (HSM, Vault, Geheimnisse).',
          modes: 'Verfügbare Generierungsmodi auflisten.',
          sectors: 'Unterstützte Sektoren für Tokenisierung auflisten.',
          poolStats: 'Pool-Statistiken nach Bereich abrufen.',
          poolPeek: 'Vorschau der verfügbaren UINs ohne Reservierung.',
          poolPreassign: 'UIN aus Pool vorbelegen. Status: VERFÜGBAR → VORBELEGT.',
          poolAssign: 'Vorbelegte UIN einer Entität zuweisen. Status: VORBELEGT → ZUGEWIESEN.',
          poolRevoke: 'Zugewiesene UIN widerrufen (Betrug, Fehlerkorrektur). Status: → WIDERRUFEN.',
          poolRetire: 'UIN stilllegen (Lebensende, Sterberegistrierung). Status: → STILLGELEGT.',
          uinPregenerate: 'UINs stapelweise in den Pool vorgenerieren.',
          uinClaim: 'Verfügbare UIN reservieren (VERFÜGBAR → VORBELEGT).',
          uinAssign: 'UIN externer Referenz zuweisen (VORBELEGT → ZUGEWIESEN).',
          uinRelease: 'Vorbelegte UIN zurück in Pool freigeben (VORBELEGT → VERFÜGBAR).',
          uinStatus: 'UIN-Status aktualisieren (stilllegen, widerrufen, usw.).',
          uinCleanup: 'Veraltete vorbelegte UINs freigeben.',
          uinLookup: 'UIN-Details nach Wert nachschlagen.',
          uinAudit: 'Vollständiges Audit-Protokoll für UIN abrufen.',
          generate: 'UIN ohne Datenbankpersistenz generieren.',
          // Format endpoints
          formatsList: 'Alle verfügbaren UIN-Anzeigeformate auflisten.',
          formatsGet: 'Ein bestimmtes Format nach ID oder Code abrufen.',
          formatsCreate: 'Neue Anzeigeformat-Konfiguration erstellen.',
          formatsUpdate: 'Bestehende Format-Konfiguration aktualisieren.',
          formatsDelete: 'Format löschen (Standard kann nicht gelöscht werden).',
          formatsPreview: 'Vorschau, wie eine UIN mit einem Format aussieht.',
          uinFormatSet: 'Format-Überschreibung für eine bestimmte UIN festlegen.',
          uinFormatRemove: 'Format-Überschreibung entfernen, zum Standard zurückkehren.'
        },
        formatEndpoints: 'Format-Konfigurations-Endpunkte'
      },
      formats: {
        title: 'UIN-Anzeigeformate',
        description: 'Format-Konfigurationen definieren, wie UINs angezeigt werden, ohne vorformatierte Werte zu speichern. Dies ist effizient, da Millionen von UINs dieselben Formatregeln teilen können.',
        howItWorks: 'Funktionsweise',
        howItWorksDesc: 'Anstatt formatierte UINs zu speichern (ineffizient bei Millionen von Datensätzen), werden Formatregeln einmal gespeichert und zur Anzeigezeit angewendet.',
        example: 'Beispiel',
        exampleRaw: 'Rohe UIN',
        exampleFormatted: 'Formatiert',
        configTable: 'Format-Konfiguration',
        field: 'Feld',
        fieldDesc: 'Beschreibung',
        fields: {
          formatCode: 'Eindeutiger Bezeichner für das Format (z.B. OSIA_STANDARD)',
          separator: 'Zeichen zwischen Segmenten (z.B. ".", "-", " ")',
          segmentLengths: 'Array zur Definition der Segmentgrößen (z.B. [5,4,4,4,2] für XXXXX.XXXX.XXXX.XXXX.XX)',
          displayCase: 'Groß-/Kleinschreibung: upper, lower oder preserve',
          prefix: 'Optionales Präfix vor der UIN (z.B. "UIN-")',
          suffix: 'Optionales Suffix nach der UIN',
          appliesTo: 'Automatisch auf UINs mit passendem Scope oder Modus anwenden'
        },
        defaultFormats: 'Standardformate',
        defaultFormatsDesc: 'Das System enthält vorkonfigurierte Formate:',
        formatNames: {
          osiaStandard: 'OSIA Standard - Punkte alle 5/4/4/4/2 Zeichen',
          osiaCompact: 'OSIA Kompakt - Keine Trennzeichen',
          osiaDashed: 'OSIA Gestrichelt - Bindestriche statt Punkte',
          osiaSpaced: 'OSIA Leerzeichen - Leerzeichen zwischen Segmenten',
          healthId: 'Gesundheits-ID - Sektorspezifisches Format mit Präfix',
          taxId: 'Steuer-ID - Traditionelles Steuernummernformat',
          shortId: 'Kurz-ID - 12-Zeichen-Format mit Bindestrichen'
        },
        apiUsage: 'API-Verwendung',
        listFormats: 'Alle Formate auflisten',
        previewFormat: 'Format-Vorschau',
        setOverride: 'Pro-UIN-Überschreibung festlegen',
        batchBehavior: 'Verhalten bei Stapelgenerierung',
        batchBehaviorDesc: 'Bei der Stapelgenerierung von UINs mit festgelegtem Format:',
        batchSmall: 'Kleine Stapel (≤10): Formatierung wird inline auf jede UIN angewendet',
        batchLarge: 'Große Stapel (>10): Stattdessen wird ein format_metadata-Abschnitt angehängt, der nachgelagerten Systemen die Formatierung ermöglicht',
        batchNote: 'Diese Optimierung verhindert Leistungsprobleme bei der Generierung von Hunderten von UINs.',
        poolGeneration: 'Pool-Vorgenerierung',
        poolGenerationDesc: 'Bei der Vorgenerierung von UINs in den Pool wird die Format-Zuordnung in der Tabelle uin_format_overrides gespeichert. Die formatierte UIN wird nie gespeichert - nur die Zuordnung. Beim Abrufen von UINs wird die Formatierung dynamisch angewendet.'
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
          revoked: 'Aufgrund von Betrug/Missbrauch ungültig gemacht',
          terminal: 'Endzustand'
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
          randomPrimaryPurpose: 'FIPS 140-2 zertifizierte Entropie aus physischen Quellen',
          randomFallback: 'Zufallsgenerierung (Fallback)',
          randomFallbackPurpose: 'Software-CSPRNG wenn HSM nicht verfügbar',
          integrity: 'Integritäts-Hash',
          integrityPurpose: 'UIN-Integritätsüberprüfung',
          sectorDerivation: 'Sektor-Ableitung',
          sectorDerivationPurpose: 'Nicht verknüpfbare Sektor-Tokens',
          checksum: 'Prüfsumme',
          checksumPurpose: 'Erkennung von Eingabefehlern'
        },
        provenance: {
          title: 'Entropie-Herkunftsverfolgung',
          description: 'Jede generierte UIN enthält Herkunftsmetadaten, die ihre Entropiequelle identifizieren:',
          priority: 'HSM-TRNG wird immer gegenüber Software-CSPRNG bevorzugt, wenn verfügbar.'
        },
        sectorSecurity: {
          title: 'Sektor-Token-Sicherheit'
        },
        bestPractices: {
          title: 'Bewährte Sicherheitspraktiken',
          sectorSecrets: 'Sektor-Geheimnisse',
          sectorSecretsDesc: 'Verwenden Sie einzigartige, hochentropische Geheimnisse pro Sektor (min. 32 Bytes)',
          dbSecurity: 'Datenbanksicherheit',
          dbSecurityDesc: 'Zeilensperren verhindern Race Conditions',
          noPii: 'Keine PII in UIN',
          noPiiDesc: 'Grundlegender Modus enthält keine personenbezogenen Daten',
          constantTime: 'Zeitkonstanter Vergleich',
          constantTimeDesc: 'Token-Verifizierung verwendet zeitkonstanten Vergleich',
          auditImmutable: 'Unveränderliches Audit',
          auditImmutableDesc: 'Audit-Einträge sind nur hinzufügbar',
          tls: 'TLS überall',
          tlsDesc: 'Alle API-Kommunikation über HTTPS'
        },
        auth: {
          title: 'Authentifizierung (Produktion)'
        }
      },
      deployment: {
        title: 'Bereitstellung',
        envVars: 'Umgebungsvariablen',
        pm2: 'PM2-Bereitstellung',
        docker: 'Docker-Bereitstellung',
        architecture: 'Bereitstellungsarchitektur',
        healthCheck: 'Gesundheitscheck'
      }
    },

    // Security tab (SecurityStatus component)
    security: {
      title: 'Status der kryptografischen Dienste',
      refresh: 'Aktualisieren',
      fetchError: 'Status konnte nicht abgerufen werden',
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
      mode: 'Modus',
      provider: 'Anbieter',
      initialized: 'Initialisiert',
      slot: 'Slot',
      keyLabel: 'Schlüsselbezeichnung',
      hardwareCrypto: 'Hardware-Kryptografie',
      softwareFallback: 'Software-Fallback',
      authenticated: 'Authentifiziert',
      address: 'Adresse',
      connected: 'Verbunden',
      notAuthenticated: 'Nicht authentifiziert',
      sectorSecrets: 'Sektor-Geheimnisse',
      loaded: 'Geladen',
      notLoaded: 'Nicht geladen',
      secretsCount: 'Anzahl Geheimnisse',
      source: 'Quelle',
      environment: 'Umgebung',
      allConfigured: 'Alle Sektoren konfiguriert',
      partialConfig: 'Teilweise Konfiguration',
      noSecrets: 'Keine Geheimnisse geladen',
      clickRefresh: 'Klicken Sie auf "Aktualisieren" um den Sicherheitsstatus zu laden',
      hsmProviders: 'Unterstützte HSM-Anbieter (Prioritätsreihenfolge)',
      hsmProvidersDesc: 'Hardware-TRNG wird immer gegenüber Software-CSPRNG bevorzugt. Produktions-HSMs bieten FIPS 140-2 Level 3 zertifizierte Entropie.'
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
      pregen: {
        displayFormat: "Format d'affichage",
        noFormat: 'Pas de format (utiliser par défaut)',
        formatHelp: "Associe le format pour l'affichage lors de la récupération des UINs",
        formatApplied: 'Format appliqué'
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
        formats: "Formats d'affichage",
        lifecycle: 'Cycle de vie UIN',
        security: 'Sécurité',
        deployment: 'Déploiement'
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
      architecture: {
        title: 'Architecture du système',
        highLevel: 'Vue d\'ensemble de haut niveau',
        component: 'Diagramme des composants',
        dbSchema: 'Schéma de base de données',
        genModes: 'Modes de génération',
        mode: 'Mode',
        description: 'Description',
        useCase: 'Cas d\'utilisation',
        modes: {
          foundationalDesc: 'CSPRNG à haute entropie, sans données personnelles intégrées',
          foundationalUse: 'ID national primaire, identifiant à vie',
          randomDesc: 'Longueur, jeu de caractères et somme de contrôle configurables',
          randomUse: 'Identifiants ad-hoc, tests',
          structuredDesc: 'Basé sur modèle avec variables de substitution',
          structuredUse: 'IDs encodés par région/établissement',
          sectorDesc: 'Jetons dérivés HMAC, non liables',
          sectorUse: 'IDs secteur santé, fiscal, finance'
        }
      },
      api: {
        title: 'Référence API',
        osiaEndpoint: 'Endpoint conforme OSIA',
        osiaEndpointDesc: 'Générer un nouvel UIN selon le modèle d\'endpoint OSIA.',
        infoEndpoints: "Endpoints d'information",
        poolEndpoints: 'Endpoints de gestion du pool',
        lifecycleEndpoints: 'Endpoints du cycle de vie UIN',
        statelessEndpoints: 'Génération sans état',
        queryParams: 'Paramètres de requête',
        parameter: 'Paramètre',
        type: 'Type',
        required: 'Requis',
        descriptionCol: 'Description',
        transactionIdDesc: 'Identifiant de transaction pour le suivi',
        requestBody: 'Corps de la requête',
        response: 'Réponse',
        errorResponse: "Réponse d'erreur",
        endpoints: {
          health: 'Contrôle de santé avec état HSM, Vault et base de données.',
          cryptoStatus: 'État des services cryptographiques (HSM, Vault, secrets).',
          modes: 'Lister les modes de génération disponibles.',
          sectors: 'Lister les secteurs pris en charge pour la tokenisation.',
          poolStats: 'Obtenir les statistiques du pool par portée.',
          poolPeek: 'Aperçu des UINs disponibles sans les réserver.',
          poolPreassign: 'Pré-attribuer un UIN du pool. Statut : DISPONIBLE → PRÉ-ATTRIBUÉ.',
          poolAssign: 'Attribuer un UIN pré-attribué à une entité. Statut : PRÉ-ATTRIBUÉ → ATTRIBUÉ.',
          poolRevoke: 'Révoquer un UIN attribué (fraude, correction). Statut : → RÉVOQUÉ.',
          poolRetire: 'Retirer un UIN (fin de vie, décès). Statut : → RETIRÉ.',
          uinPregenerate: 'Pré-générer des UINs en lot dans le pool.',
          uinClaim: 'Réserver un UIN disponible (DISPONIBLE → PRÉ-ATTRIBUÉ).',
          uinAssign: 'Attribuer l\'UIN à une référence externe (PRÉ-ATTRIBUÉ → ATTRIBUÉ).',
          uinRelease: 'Libérer un UIN pré-attribué dans le pool (PRÉ-ATTRIBUÉ → DISPONIBLE).',
          uinStatus: 'Mettre à jour le statut UIN (retirer, révoquer, etc.).',
          uinCleanup: 'Libérer les UINs pré-attribués obsolètes.',
          uinLookup: 'Rechercher les détails d\'un UIN par valeur.',
          uinAudit: 'Obtenir la piste d\'audit complète pour un UIN.',
          generate: 'Générer un UIN sans persistance en base de données.',
          // Format endpoints
          formatsList: 'Lister tous les formats d\'affichage UIN disponibles.',
          formatsGet: 'Obtenir un format spécifique par ID ou code.',
          formatsCreate: 'Créer une nouvelle configuration de format d\'affichage.',
          formatsUpdate: 'Mettre à jour une configuration de format existante.',
          formatsDelete: 'Supprimer un format (impossible de supprimer le format par défaut).',
          formatsPreview: 'Aperçu de l\'apparence d\'un UIN avec un format.',
          uinFormatSet: 'Définir un format personnalisé pour un UIN spécifique.',
          uinFormatRemove: 'Supprimer le format personnalisé, revenir au défaut.'
        },
        formatEndpoints: 'Endpoints de configuration des formats'
      },
      formats: {
        title: 'Formats d\'affichage UIN',
        description: 'Les configurations de format définissent comment les UINs sont affichés sans stocker de valeurs préformatées. C\'est efficace car des millions d\'UINs peuvent partager les mêmes règles de format.',
        howItWorks: 'Fonctionnement',
        howItWorksDesc: 'Au lieu de stocker des UINs formatés (inefficace pour des millions d\'enregistrements), les règles de format sont stockées une fois et appliquées lors de l\'affichage.',
        example: 'Exemple',
        exampleRaw: 'UIN brut',
        exampleFormatted: 'Formaté',
        configTable: 'Configuration du format',
        field: 'Champ',
        fieldDesc: 'Description',
        fields: {
          formatCode: 'Identifiant unique pour le format (ex: OSIA_STANDARD)',
          separator: 'Caractère(s) inséré(s) entre les segments (ex: ".", "-", " ")',
          segmentLengths: 'Tableau définissant les tailles de segment (ex: [5,4,4,4,2] pour XXXXX.XXXX.XXXX.XXXX.XX)',
          displayCase: 'Transformation de casse : upper, lower ou preserve',
          prefix: 'Préfixe optionnel avant l\'UIN (ex: "UIN-")',
          suffix: 'Suffixe optionnel après l\'UIN',
          appliesTo: 'Appliquer automatiquement aux UINs correspondant au scope ou mode'
        },
        defaultFormats: 'Formats par défaut',
        defaultFormatsDesc: 'Le système inclut des formats préconfigurés :',
        formatNames: {
          osiaStandard: 'OSIA Standard - Points tous les 5/4/4/4/2 caractères',
          osiaCompact: 'OSIA Compact - Sans séparateurs',
          osiaDashed: 'OSIA Tirets - Tirets au lieu de points',
          osiaSpaced: 'OSIA Espaces - Espaces entre les segments',
          healthId: 'ID Santé - Format sectoriel avec préfixe',
          taxId: 'ID Fiscal - Format traditionnel de numéro fiscal',
          shortId: 'ID Court - Format 12 caractères avec tirets'
        },
        apiUsage: 'Utilisation de l\'API',
        listFormats: 'Lister tous les formats',
        previewFormat: 'Aperçu d\'un format',
        setOverride: 'Définir un format personnalisé par UIN',
        batchBehavior: 'Comportement de génération par lot',
        batchBehaviorDesc: 'Lors de la génération d\'UINs par lot avec un format spécifié :',
        batchSmall: 'Petits lots (≤10) : Le formatage est appliqué en ligne à chaque UIN',
        batchLarge: 'Grands lots (>10) : Une section format_metadata est ajoutée à la place, permettant aux systèmes en aval d\'appliquer le formatage',
        batchNote: 'Cette optimisation évite les problèmes de performance lors de la génération de centaines d\'UINs.',
        poolGeneration: 'Pré-génération du pool',
        poolGenerationDesc: 'Lors de la pré-génération d\'UINs dans le pool, l\'association de format est stockée dans la table uin_format_overrides. L\'UIN formaté n\'est jamais stocké - seulement l\'association. Lors de la récupération des UINs, le formatage est appliqué dynamiquement.'
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
          retired: 'N\'est plus actif (décès, etc.)',
          revoked: 'Invalidé pour fraude/abus',
          terminal: 'État terminal'
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
          randomPrimaryPurpose: 'Entropie certifiée FIPS 140-2 provenant de sources physiques',
          randomFallback: 'Génération aléatoire (Secours)',
          randomFallbackPurpose: 'CSPRNG logiciel lorsque le HSM n\'est pas disponible',
          integrity: "Hash d'intégrité",
          integrityPurpose: 'Vérification de l\'intégrité UIN',
          sectorDerivation: 'Dérivation sectorielle',
          sectorDerivationPurpose: 'Jetons sectoriels non liables',
          checksum: 'Somme de contrôle',
          checksumPurpose: 'Détection des erreurs de transcription'
        },
        provenance: {
          title: "Suivi de la provenance de l'entropie",
          description: 'Chaque UIN généré inclut des métadonnées de provenance identifiant sa source d\'entropie :',
          priority: 'Le TRNG HSM est toujours privilégié par rapport au CSPRNG logiciel lorsqu\'il est disponible.'
        },
        sectorSecurity: {
          title: 'Sécurité des jetons sectoriels'
        },
        bestPractices: {
          title: 'Bonnes pratiques de sécurité',
          sectorSecrets: 'Secrets sectoriels',
          sectorSecretsDesc: 'Utilisez des secrets uniques à haute entropie par secteur (min. 32 octets)',
          dbSecurity: 'Sécurité de la base de données',
          dbSecurityDesc: 'Le verrouillage par ligne empêche les conditions de concurrence',
          noPii: 'Pas de données personnelles dans l\'UIN',
          noPiiDesc: 'Le mode fondamental n\'intègre aucune donnée personnelle',
          constantTime: 'Comparaison à temps constant',
          constantTimeDesc: 'La vérification des jetons utilise une comparaison sécurisée',
          auditImmutable: 'Audit immuable',
          auditImmutableDesc: 'Les enregistrements d\'audit sont en ajout uniquement',
          tls: 'TLS partout',
          tlsDesc: 'Toutes les communications API via HTTPS'
        },
        auth: {
          title: 'Authentification (Production)'
        }
      },
      deployment: {
        title: 'Déploiement',
        envVars: 'Variables d\'environnement',
        pm2: 'Déploiement PM2',
        docker: 'Déploiement Docker',
        architecture: 'Architecture de déploiement',
        healthCheck: 'Contrôle de santé'
      }
    },

    // Security tab (SecurityStatus component)
    security: {
      title: 'État des services cryptographiques',
      refresh: 'Actualiser',
      fetchError: 'Échec de récupération du statut',
      enabled: 'Activé',
      disabled: 'Désactivé',
      mode: 'Mode',
      provider: 'Fournisseur',
      initialized: 'Initialisé',
      slot: 'Slot',
      keyLabel: 'Libellé de clé',
      hardwareCrypto: 'Cryptographie matérielle',
      softwareFallback: 'Secours logiciel',
      authenticated: 'Authentifié',
      address: 'Adresse',
      connected: 'Connecté',
      notAuthenticated: 'Non authentifié',
      sectorSecrets: 'Secrets sectoriels',
      loaded: 'Chargé',
      notLoaded: 'Non chargé',
      secretsCount: 'Nombre de secrets',
      source: 'Source',
      environment: 'Environnement',
      allConfigured: 'Tous les secteurs configurés',
      partialConfig: 'Configuration partielle',
      noSecrets: 'Aucun secret chargé',
      clickRefresh: 'Cliquez sur "Actualiser" pour charger l\'état de sécurité',
      hsmProviders: 'Fournisseurs HSM pris en charge (Ordre de priorité)',
      hsmProvidersDesc: 'Le TRNG matériel est toujours prioritaire sur le CSPRNG logiciel. Les HSM de production fournissent une entropie certifiée FIPS 140-2 Niveau 3.'
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
      pregen: {
        displayFormat: 'Formato de visualización',
        noFormat: 'Sin formato (usar predeterminado)',
        formatHelp: 'Asocia el formato para la visualización cuando se recuperan los UINs',
        formatApplied: 'Formato aplicado'
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
        formats: 'Formatos de visualización',
        lifecycle: 'Ciclo de vida UIN',
        security: 'Seguridad',
        deployment: 'Implementación'
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
      architecture: {
        title: 'Arquitectura del sistema',
        highLevel: 'Visión general de alto nivel',
        component: 'Diagrama de componentes',
        dbSchema: 'Esquema de base de datos',
        genModes: 'Modos de generación',
        mode: 'Modo',
        description: 'Descripción',
        useCase: 'Caso de uso',
        modes: {
          foundationalDesc: 'CSPRNG de alta entropía, sin datos personales integrados',
          foundationalUse: 'ID nacional primario, identificador vitalicio',
          randomDesc: 'Longitud, juego de caracteres y suma de verificación configurables',
          randomUse: 'Identificadores ad-hoc, pruebas',
          structuredDesc: 'Basado en plantilla con marcadores de posición',
          structuredUse: 'IDs codificados por región/instalación',
          sectorDesc: 'Tokens derivados HMAC, no vinculables',
          sectorUse: 'IDs sector salud, fiscal, finanzas'
        }
      },
      api: {
        title: 'Referencia API',
        osiaEndpoint: 'Endpoint compatible con OSIA',
        osiaEndpointDesc: 'Generar un nuevo UIN según el patrón de endpoint OSIA.',
        infoEndpoints: 'Endpoints de información',
        poolEndpoints: 'Endpoints de gestión del pool',
        lifecycleEndpoints: 'Endpoints del ciclo de vida UIN',
        statelessEndpoints: 'Generación sin estado',
        queryParams: 'Parámetros de consulta',
        parameter: 'Parámetro',
        type: 'Tipo',
        required: 'Requerido',
        descriptionCol: 'Descripción',
        transactionIdDesc: 'Identificador de transacción para seguimiento',
        requestBody: 'Cuerpo de la solicitud',
        response: 'Respuesta',
        errorResponse: 'Respuesta de error',
        endpoints: {
          health: 'Comprobación de estado con HSM, Vault y base de datos.',
          cryptoStatus: 'Estado de servicios criptográficos (HSM, Vault, secretos).',
          modes: 'Listar modos de generación disponibles.',
          sectors: 'Listar sectores compatibles para tokenización.',
          poolStats: 'Obtener estadísticas del pool por ámbito.',
          poolPeek: 'Vista previa de UINs disponibles sin reservarlos.',
          poolPreassign: 'Preasignar un UIN del pool. Estado: DISPONIBLE → PREASIGNADO.',
          poolAssign: 'Asignar un UIN preasignado a una entidad. Estado: PREASIGNADO → ASIGNADO.',
          poolRevoke: 'Revocar un UIN asignado (fraude, corrección). Estado: → REVOCADO.',
          poolRetire: 'Retirar un UIN (fin de vida, defunción). Estado: → RETIRADO.',
          uinPregenerate: 'Pregenerar UINs en lote al pool.',
          uinClaim: 'Reservar un UIN disponible (DISPONIBLE → PREASIGNADO).',
          uinAssign: 'Asignar UIN a referencia externa (PREASIGNADO → ASIGNADO).',
          uinRelease: 'Liberar UIN preasignado al pool (PREASIGNADO → DISPONIBLE).',
          uinStatus: 'Actualizar estado UIN (retirar, revocar, etc.).',
          uinCleanup: 'Liberar UINs preasignados obsoletos.',
          uinLookup: 'Buscar detalles de UIN por valor.',
          uinAudit: 'Obtener registro de auditoría completo para un UIN.',
          generate: 'Generar UIN sin persistencia en base de datos.',
          // Format endpoints
          formatsList: 'Listar todos los formatos de visualización UIN disponibles.',
          formatsGet: 'Obtener un formato específico por ID o código.',
          formatsCreate: 'Crear una nueva configuración de formato de visualización.',
          formatsUpdate: 'Actualizar una configuración de formato existente.',
          formatsDelete: 'Eliminar un formato (no se puede eliminar el predeterminado).',
          formatsPreview: 'Vista previa de cómo se vería un UIN con un formato.',
          uinFormatSet: 'Establecer un formato personalizado para un UIN específico.',
          uinFormatRemove: 'Eliminar formato personalizado, volver al predeterminado.'
        },
        formatEndpoints: 'Endpoints de configuración de formatos'
      },
      formats: {
        title: 'Formatos de visualización UIN',
        description: 'Las configuraciones de formato definen cómo se muestran los UINs sin almacenar valores preformateados. Esto es eficiente ya que millones de UINs pueden compartir las mismas reglas de formato.',
        howItWorks: 'Cómo funciona',
        howItWorksDesc: 'En lugar de almacenar UINs formateados (ineficiente para millones de registros), las reglas de formato se almacenan una vez y se aplican en el momento de la visualización.',
        example: 'Ejemplo',
        exampleRaw: 'UIN sin formato',
        exampleFormatted: 'Formateado',
        configTable: 'Configuración del formato',
        field: 'Campo',
        fieldDesc: 'Descripción',
        fields: {
          formatCode: 'Identificador único para el formato (ej: OSIA_STANDARD)',
          separator: 'Carácter(es) insertado(s) entre segmentos (ej: ".", "-", " ")',
          segmentLengths: 'Array que define los tamaños de segmento (ej: [5,4,4,4,2] para XXXXX.XXXX.XXXX.XXXX.XX)',
          displayCase: 'Transformación de mayúsculas/minúsculas: upper, lower o preserve',
          prefix: 'Prefijo opcional antes del UIN (ej: "UIN-")',
          suffix: 'Sufijo opcional después del UIN',
          appliesTo: 'Aplicar automáticamente a UINs que coincidan con el scope o modo'
        },
        defaultFormats: 'Formatos predeterminados',
        defaultFormatsDesc: 'El sistema incluye formatos preconfigurados:',
        formatNames: {
          osiaStandard: 'OSIA Estándar - Puntos cada 5/4/4/4/2 caracteres',
          osiaCompact: 'OSIA Compacto - Sin separadores',
          osiaDashed: 'OSIA Guiones - Guiones en lugar de puntos',
          osiaSpaced: 'OSIA Espacios - Espacios entre segmentos',
          healthId: 'ID Salud - Formato sectorial con prefijo',
          taxId: 'ID Fiscal - Formato tradicional de número fiscal',
          shortId: 'ID Corto - Formato de 12 caracteres con guiones'
        },
        apiUsage: 'Uso de la API',
        listFormats: 'Listar todos los formatos',
        previewFormat: 'Vista previa de un formato',
        setOverride: 'Establecer formato personalizado por UIN',
        batchBehavior: 'Comportamiento de generación por lotes',
        batchBehaviorDesc: 'Al generar UINs por lotes con un formato especificado:',
        batchSmall: 'Lotes pequeños (≤10): El formato se aplica en línea a cada UIN',
        batchLarge: 'Lotes grandes (>10): Se añade una sección format_metadata en su lugar, permitiendo que los sistemas posteriores apliquen el formato',
        batchNote: 'Esta optimización evita problemas de rendimiento al generar cientos de UINs.',
        poolGeneration: 'Pre-generación del pool',
        poolGenerationDesc: 'Al pre-generar UINs en el pool, la asociación de formato se almacena en la tabla uin_format_overrides. El UIN formateado nunca se almacena - solo la asociación. Al recuperar los UINs, el formato se aplica dinámicamente.'
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
          retired: 'Ya no está activo (fallecimiento, etc.)',
          revoked: 'Invalidado por fraude/abuso',
          terminal: 'Estado terminal'
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
          randomPrimaryPurpose: 'Entropía certificada FIPS 140-2 de fuentes físicas',
          randomFallback: 'Generación aleatoria (Respaldo)',
          randomFallbackPurpose: 'CSPRNG software cuando HSM no está disponible',
          integrity: 'Hash de integridad',
          integrityPurpose: 'Verificación de integridad UIN',
          sectorDerivation: 'Derivación sectorial',
          sectorDerivationPurpose: 'Tokens sectoriales no vinculables',
          checksum: 'Suma de verificación',
          checksumPurpose: 'Detección de errores de transcripción'
        },
        provenance: {
          title: 'Seguimiento de procedencia de la entropía',
          description: 'Cada UIN generado incluye metadatos de procedencia que identifican su fuente de entropía:',
          priority: 'El TRNG HSM siempre tiene prioridad sobre el CSPRNG software cuando está disponible.'
        },
        sectorSecurity: {
          title: 'Seguridad de tokens sectoriales'
        },
        bestPractices: {
          title: 'Mejores prácticas de seguridad',
          sectorSecrets: 'Secretos sectoriales',
          sectorSecretsDesc: 'Use secretos únicos de alta entropía por sector (mín. 32 bytes)',
          dbSecurity: 'Seguridad de base de datos',
          dbSecurityDesc: 'Bloqueo a nivel de fila previene condiciones de carrera',
          noPii: 'Sin datos personales en UIN',
          noPiiDesc: 'El modo fundamental no contiene datos personales',
          constantTime: 'Comparación de tiempo constante',
          constantTimeDesc: 'La verificación de tokens usa comparación segura',
          auditImmutable: 'Auditoría inmutable',
          auditImmutableDesc: 'Los registros de auditoría son solo de adición',
          tls: 'TLS en todas partes',
          tlsDesc: 'Todas las comunicaciones API via HTTPS'
        },
        auth: {
          title: 'Autenticación (Producción)'
        }
      },
      deployment: {
        title: 'Implementación',
        envVars: 'Variables de entorno',
        pm2: 'Implementación PM2',
        docker: 'Implementación Docker',
        architecture: 'Arquitectura de implementación',
        healthCheck: 'Comprobación de estado'
      }
    },

    // Security tab (SecurityStatus component)
    security: {
      title: 'Estado de servicios criptográficos',
      refresh: 'Actualizar',
      fetchError: 'Error al obtener estado',
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
      mode: 'Modo',
      provider: 'Proveedor',
      initialized: 'Inicializado',
      slot: 'Slot',
      keyLabel: 'Etiqueta de clave',
      hardwareCrypto: 'Criptografía hardware',
      softwareFallback: 'Respaldo software',
      authenticated: 'Autenticado',
      address: 'Dirección',
      connected: 'Conectado',
      notAuthenticated: 'No autenticado',
      sectorSecrets: 'Secretos sectoriales',
      loaded: 'Cargado',
      notLoaded: 'No cargado',
      secretsCount: 'Cantidad de secretos',
      source: 'Fuente',
      environment: 'Entorno',
      allConfigured: 'Todos los sectores configurados',
      partialConfig: 'Configuración parcial',
      noSecrets: 'Sin secretos cargados',
      clickRefresh: 'Haga clic en "Actualizar" para cargar el estado de seguridad',
      hsmProviders: 'Proveedores HSM compatibles (Orden de prioridad)',
      hsmProvidersDesc: 'El TRNG hardware siempre tiene prioridad sobre CSPRNG software. Los HSM de producción proporcionan entropía certificada FIPS 140-2 Nivel 3.'
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
