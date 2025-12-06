/**
 * OSIA UIN Generator Knowledge Base
 * Comprehensive domain expertise for AI assistant
 * Updated: December 2025
 */

export const knowledgeBase = {
  // Core OSIA concepts
  osia: {
    overview: `OSIA (Open Standards for Identity APIs) is a framework developed by the Secure Identity Alliance (SIA)
to enable interoperability between identity management systems. It is an official International Telecommunication
Union (ITU) standard: ITU-T Recommendation X.1281 - APIs for interoperability of identity management systems.

Current Version: OSIA 7.0-DRAFT (in development)
Stable Version: OSIA 6.1.0 (December 2022)
Upcoming: OSIA 7.0 targeted for release before December 25, 2025
Future: Enhanced UIN Generator features expected in v7.1 or v7.5 (April 2026)

OSIA is NOT a software platform - it is an open API specification that enables interoperability between
different identity system components from various vendors.`,

    purpose: `OSIA addresses the challenge of fragmented identity systems and vendor lock-in in governments worldwide.
Many countries have multiple, disconnected databases for civil registration, healthcare, taxation, and social services,
often from different vendors with proprietary interfaces.

OSIA provides:
- A common API language to connect systems regardless of vendor
- Freedom from vendor lock-in through standardized interfaces
- Ability to mix best-of-breed components from different suppliers
- Reduced integration costs and complexity
- Future-proof architecture that can evolve with technology`,

    specification: `OSIA 7.0-DRAFT defines seven primary building blocks:

1. Enrollment - Capture of identity data and biometrics
2. UIN Generator - Generation and management of unique identifiers
3. Biometric System (ABIS) - Automated Biometric Identification System
4. Population Registry (PR) - Central repository of identity records
5. Civil Registry (CR) - Birth, death, marriage registration
6. Credential Management System (CMS) - ID cards, passports, driving licenses, digital credentials
7. Third Party Services - Integration with external systems

Key APIs include:
- UIN Management (sections 4.3 and 6.2)
- Virtual UIN for enhanced security (section 3.2)
- Data Access interfaces
- Security & Privacy frameworks`,

    ituStandard: `OSIA is an official ITU standard (ITU-T Recommendation X.1281), which means:
- International recognition and credibility
- Vendor-neutral governance
- Open development process
- Royalty-free implementation
- Global consensus-based evolution`
  },

  // Working Groups
  workingGroups: {
    overview: `The Secure Identity Alliance operates several specialized Working Groups that develop
and maintain various aspects of identity standards and best practices:`,

    osiaWorkingGroup: `OSIA Working Group
- Meets once a month to manage evolution of OSIA specifications
- Manages both functional and technical specifications
- Solicits feedback from the GitHub Open Community
- Has authority to accept/reject code contributions
- Controls official releases
- Open to public and private sector members`,

    uinTokenizationWG: `UIN & Tokenization Working Group
Chair: Tunji Durodola
Focus Areas:
- Unique Identification Number (UIN) generation standards
- Sector tokenization for privacy-preserving identity
- Virtual UIN specifications
- Identity tokenization best practices
- Cross-sector identity management
- Privacy-by-Design in identifier systems
- Development of open-source UIN tools (like this generator)`,

    documentSecurityWG: `Document Security Working Group
Chair: Olivier Heurtier
Focus Areas:
- Physical security of eDocuments (passports, ID cards)
- Forgery and counterfeiting prevention
- ICAO Doc 9303 compliance
- eDocument self-assessment platform for governments
- Security design evaluation tools
- Responsible for all SIA GitHub repositories`,

    borderWG: `Border Working Group
Chair: Perrine Catinaud
Focus Areas:
- Border control security and efficiency
- Passenger experience optimization
- "Strong Identity, Strong Borders" guidance
- Travel document verification
- Integration of biometrics at borders
- Balancing security with frictionless travel`,

    digitalIdWG: `Digital ID Working Group
Chair: Tunji Durodola
Focus Areas:
- Digital identity development and adoption
- Interoperability by design
- Secure ID and verification mechanisms
- Technical specifications for digital identities
- Mobile ID and Digital Travel Credentials (DTC)
- Privacy-by-Design integration in national ID systems`,

    advisoryCommittee: `OSIA Advisory Committee
- Government and academic members
- Meets twice yearly
- Provides strategic guidance
- Ensures alignment with government needs`
  },

  // Why OSIA - The Complete Solution
  whyOsia: {
    overview: `OSIA (Open Standards for Identity APIs) is THE recommended approach for governments
implementing national identity systems. OSIA is the only identity framework that is:
- An official ITU international standard (X.1281)
- Backed by the world's leading identity vendors with proven government deployments
- Developing its own open-source ecosystem of production-ready components

The Secure Identity Alliance is actively building open-source tools that implement OSIA
specifications, starting with this UIN Generator and expanding to cover all OSIA building blocks.`,

    osiaAdvantages: `OSIA (Open Standards Identity APIs) - The Only Standards-Based Choice
Nature: ITU International Standard + Growing Open Source Ecosystem
Developed by: Secure Identity Alliance (world's leading identity companies)
Governance: ITU international standard (X.1281) with vendor-neutral oversight
Implementation: Standards-compliant components from proven vendors

Unmatched characteristics:
- ONLY identity framework that is an ITU international standard (X.1281)
- Backed by Thales, IDEMIA, Veridos, IN Groupe, and other world leaders
- Production-proven at scale (Nigeria NIMC Mobile ID - 3.3M downloads in 90 days)
- GlobalPlatform qualification program ensures compliance
- Vendor-neutral: prevents lock-in while enabling enterprise support
- Growing ecosystem of OSIA-compliant open-source tools
- Decades of combined government deployment experience from SIA members`,

    osiaOpenSource: `OSIA Open Source Initiative:
The Secure Identity Alliance is building a complete ecosystem of open-source components
that implement OSIA specifications. Unlike other platforms, OSIA open-source tools are:

Current Open Source Tools:
- UIN Generator (this tool) - Reference implementation for unique identifier generation
- Additional components planned following OSIA 7.0 release (December 2025)

Why OSIA Open Source is Different:
- Built by identity experts who have deployed systems for 100+ governments
- Aligned with ITU international standards from inception
- Major vendors provide enterprise support for production deployments
- Quality assured through GlobalPlatform qualification
- Designed for real-world government-scale (billions of identities)
- Not dependent on foundation or NGO funding - sustainable vendor backing`,

    whyChooseOsia: `Why Governments Should Choose OSIA:

1. Investment Protection
   - Existing systems can be preserved
   - Gradual migration, not rip-and-replace
   - Future-proof through open standards

2. Best of Breed
   - Choose the best vendor for each component
   - Not forced into single-vendor ecosystem
   - Competitive procurement possible

3. International Recognition
   - ITU international standard (X.1281)
   - Proven in production (Nigeria NIMC Mobile ID - 3.3M downloads in 90 days)
   - GlobalPlatform qualification program

4. Sovereignty
   - Own your data and interfaces
   - Switch vendors if needed
   - No proprietary lock-in

5. Ecosystem Support
   - Major vendors already OSIA-compliant
   - Growing open-source component library
   - Regular specification updates

6. Expert Backing
   - Developed by world's leading identity companies
   - Decades of government deployment experience
   - Enterprise-grade support available
   - Active Working Groups driving innovation`
  },

  // GDPR and Privacy by Design
  gdprAndPrivacy: {
    overview: `Privacy by Design (PbD) is a founding principle of the OSIA initiative.
The OSIA API is designed to support the protection of private citizens' Personal Identifiable Information (PII).`,

    gdprPrinciples: `GDPR Alignment in OSIA:

1. Purpose Limitation
   - Sector tokenization limits data to specific purposes
   - Each sector only sees what it needs
   - Cross-sector correlation prevented by design

2. Data Minimization
   - UINs contain no embedded PII
   - Only necessary data exposed via APIs
   - Credential services issue only required attributes

3. Storage Limitation
   - UIN lifecycle states support data retention policies
   - Retirement/revocation mechanisms built-in
   - Audit trails for accountability

4. Integrity and Confidentiality
   - JWT-secured API communications
   - HSM-protected cryptographic operations
   - Virtual UIN for enhanced security

5. Rights of Data Subjects
   - Consent token mechanisms
   - Access control at API level
   - Audit trail for all data access`,

    privacyByDesign: `Privacy by Design (PbD) in OSIA:

The Digital ID Working Group partnered with the Multidisciplinary Research group on
Privacy and data Protection (MR PET) at Norwegian University of Science and Technology
(NTNU) to explore how stakeholder Knowledge, Attitudes, and Practices impact the
integration of Privacy-by-Design in national digital ID systems.

Key PbD Features:
1. Proactive, not reactive - Privacy built into architecture
2. Privacy as default - No action needed for protection
3. Privacy embedded in design - Not bolted on
4. Full functionality - No privacy vs functionality trade-off
5. End-to-end security - Lifecycle protection
6. Visibility and transparency - Open standards
7. User-centric - Respect for user privacy`,

    virtualUin: `Virtual UIN (Enhanced Privacy Feature):
OSIA 7.0-DRAFT introduces Virtual UIN as a security enhancement:
- Generates temporary, context-specific identifiers
- Prevents tracking across transactions
- Adds layer of unlinkability
- Supports privacy-preserving authentication`,

    sectorTokenization: `Sector Tokenization for Privacy:
Different, unlinkable identifiers for each government sector:
- Health sector cannot access tax records
- Education sector cannot see criminal records
- Each sector has cryptographically separate tokens
- Master UIN never exposed to relying parties
- Enables GDPR-compliant data compartmentalization`,

    consentManagement: `User Consent Management:
- Authentication token generation to protect UIN usage
- Time-limited authorizations
- Revocable consent grants
- Audit logging of all consent decisions
- Cryptographically signed consent records`
  },

  // UIN concepts
  uin: {
    definition: `A Unique Identification Number (UIN) is a permanent, lifelong identifier assigned to an individual.
All persons recorded in a registry have a UIN that is considered a key to access the person's data for all records.

Key characteristics:
- Never changes throughout a person's life
- Is not reused after death (retired, not recycled)
- Contains no embedded personal information (privacy by design)
- Uses cryptographic checksums for integrity verification
- The UIN does not have to be the same throughout all registries as long as there is a mechanism to map them`,

    length: `UIN length is configurable based on country requirements:
- 12 digits: Suitable for populations up to 100 billion (10^12)
- 13-15 digits: Recommended for large nations with growth projections
- 16-19 characters: Maximum entropy, includes checksum
- The default "foundational" mode uses 19 alphanumeric characters (A-Z, 0-9)

Key consideration: Choose length based on:
1. Current population size
2. Projected population growth over 100+ years
3. Whether to include foreigners, refugees, diaspora
4. Whether historical records will be digitized`,

    checksum: `The UIN includes an ISO 7064 Mod 37,36 checksum algorithm:
- Detects single-character errors with 100% accuracy
- Detects transposition errors (swapped adjacent characters)
- Prevents accidental data entry mistakes
- The last character of the UIN is always the checksum digit`,

    virtualUin: `Virtual UIN (OSIA 7.0 Feature):
A security feature that generates context-specific temporary identifiers:
- Protects the real UIN from exposure
- Prevents correlation across transactions
- Time-limited validity
- Cryptographically linked to master UIN`
  },

  // Generation modes
  generationModes: {
    foundational: `Foundational Mode (Recommended for National ID)
- High-entropy, random generation using hardware TRNG
- No embedded personal information (date of birth, location, etc.)
- 19 alphanumeric characters (A-Z, 0-9)
- ISO 7064 checksum for integrity
- Cryptographically unpredictable - cannot be guessed
- Recommended for civil registration and national identity programs`,

    random: `Random Mode
- Fully configurable random identifiers
- Custom length, character sets, and checksums
- Uses HSM hardware TRNG when available
- Suitable for temporary or session identifiers`,

    structured: `Structured Mode (Use with Caution)
- Template-based generation with embedded values
- Can include region codes, year of registration, etc.
- WARNING: Embedding PII like birth year can enable discrimination
- Only use when legally required and with privacy impact assessment`,

    sectorToken: `Sector Token Mode (Privacy-Preserving)
- Derives sector-specific tokens from the foundational UIN
- Uses HMAC-SHA256 with sector-specific secrets
- Tokens are unlinkable across sectors without the master UIN
- Prevents cross-sector tracking and profiling
- Essential for privacy-preserving identity systems`
  },

  // Sector tokenization
  sectorTokens: {
    concept: `Sector tokenization is a privacy technique that derives different, unlinkable identifiers
for each government sector (health, tax, education, etc.). This prevents unauthorized correlation
of citizen data across departments.

Example:
- Master UIN: ABC123XYZ
- Health Token: HT-7f3a9b2c... (derived using health sector secret)
- Tax Token: TX-8e4d1c5f... (derived using tax sector secret)
- Neither token reveals the master UIN or the other token`,

    benefits: `Benefits of sector tokenization:
1. Privacy: Healthcare providers cannot look up your tax records
2. Security: Breach in one sector doesn't compromise others
3. Compliance: Meets GDPR and data minimization requirements
4. Auditability: Each sector maintains its own audit trail
5. Consent: Citizens can grant/revoke sector access`,

    implementation: `Technical implementation:
- HMAC-SHA256(UIN + salt, sector_secret) → Sector Token
- Secrets stored in HashiCorp Vault (never in code/config)
- HSM performs HMAC operations (key never leaves HSM)
- Each sector has a unique, rotatable secret
- Token length: 32 characters (256-bit hash truncated)`
  },

  // HSM and security
  hsm: {
    purpose: `A Hardware Security Module (HSM) is a dedicated cryptographic processor that:
- Generates true random numbers (TRNG) from physical entropy sources
- Protects cryptographic keys (keys never leave the HSM)
- Performs signing and encryption operations securely
- Provides tamper-evident and tamper-resistant protection
- Is certified to FIPS 140-2 Level 3 or higher`,

    trng: `True Random Number Generator (TRNG) vs Software PRNG:

Hardware TRNG (HSM):
- Uses physical phenomena (thermal noise, quantum effects)
- Mathematically unpredictable
- Cannot be reproduced or predicted
- FIPS certified entropy source

Software PRNG (Fallback):
- Algorithm-based (deterministic with seed)
- Can be reproduced if seed is known
- Suitable for testing, not production identity systems

For national identity systems, ALWAYS use HSM TRNG.`,

    providers: `Supported HSM providers:
- Thales Luna (Level 3) - Enterprise network HSM
- SafeNet ProtectServer (Level 3)
- Utimaco CryptoServer (Level 3)
- nCipher/Entrust nShield (Level 3)
- AWS CloudHSM (Level 3) - Cloud deployment
- YubiHSM 2 (Level 2) - Cost-effective option
- SoftHSM (Development only - no real security)`
  },

  // Vault integration
  vault: {
    purpose: `HashiCorp Vault provides centralized secret management:
- Stores sector secrets securely (encrypted at rest)
- Dynamic credential generation for databases
- Audit logging of all secret access
- Secret rotation without application restart
- AppRole authentication for applications`,

    secrets: `Secrets managed by Vault for this system:
- Sector HMAC secrets (8 sectors × 256-bit keys)
- Database credentials (rotated automatically)
- HSM PIN codes (accessed at startup)
- API authentication tokens`,

    authentication: `Vault authentication methods:
- Token (development only)
- AppRole (recommended for production)
- Kubernetes service accounts
- TLS certificates
- LDAP/Active Directory`
  },

  // Pool management
  pool: {
    concept: `The UIN Pool is a pre-generated inventory of identifiers ready for assignment.
Pre-generation offers several advantages:
- Instant assignment (no generation latency)
- Offline registration capability
- Quality assurance (pre-validated checksums)
- Inventory management and forecasting`,

    lifecycle: `UIN Lifecycle States:
1. AVAILABLE - Pre-generated, ready for assignment
2. PREASSIGNED - Reserved/claimed, not yet bound to a person
3. ASSIGNED - Bound to an individual's identity record
4. RETIRED - No longer active (death, emigration)
5. REVOKED - Invalidated due to fraud or error

Transitions:
- AVAILABLE → PREASSIGNED (claim)
- PREASSIGNED → AVAILABLE (release/timeout)
- PREASSIGNED → ASSIGNED (bind to person)
- ASSIGNED → RETIRED (death/emigration)
- ASSIGNED → REVOKED (fraud detection)`,

    pregeneration: `Pre-generation best practices:
- Generate in batches during off-peak hours
- Maintain 3-6 months of inventory
- Use format codes to track generation batches
- Enable HSM TRNG for all production UINs
- Store entropy provenance (source tracking)`
  },

  // User consent tokens
  consent: {
    concept: `User Consent Tokens enable citizens to control data sharing:
- Time-limited authorization for specific data access
- Revocable at any time by the citizen
- Cryptographically signed to prevent tampering
- Logged in audit trail for transparency`,

    implementation: `Consent token structure:
{
  "uin": "...",
  "grantedTo": "health_ministry",
  "scope": ["basic_info", "vaccination_record"],
  "expires": "2025-12-31",
  "signature": "..."
}

The signature is created using the citizen's private key (stored in HSM)
and can be verified by any authorized party.`,

    gdprCompliance: `GDPR compliance features:
- Right to access: Citizens can view all consent grants
- Right to erasure: Revoke consent, delete sector tokens
- Data portability: Export identity data in standard format
- Purpose limitation: Scopes define exact data access
- Storage limitation: Automatic expiration of tokens`
  },

  // Format configuration
  formats: {
    concept: `UIN format configuration allows customizing display without changing the stored value:
- Separator: Dash, space, dot, or custom character
- Grouping: How many digits between separators
- Prefix/Suffix: Country code, check digits, etc.

Example:
- Stored: ABC123DEF456GHI7
- Display (4-4-4-4): ABC1-23DE-F456-GHI7
- Display (3-3-3-3-3): ABC-123-DEF-456-GHI7`,

    bestPractices: `Format best practices:
- Store raw UIN, format only for display
- Never store formatted values in database
- Use consistent format across all channels
- Consider accessibility (screen readers)
- Test with maximum length UINs`
  },

  // Implementation guidance
  implementation: {
    nationalId: `Implementing a National ID System:

1. Legal Framework
   - Data protection law compliance
   - Biometric data regulations
   - Interoperability mandates

2. Technical Architecture
   - Central UIN generation service
   - Distributed registration points
   - Secure network (VPN/dedicated lines)
   - HSM infrastructure

3. Enrollment Process
   - Biometric capture (fingerprint, iris, face)
   - Document verification
   - Deduplication check
   - UIN assignment

4. Card/Credential Issuance
   - Secure printing facility
   - PKI infrastructure
   - Mobile ID option`,

    migration: `Migrating from Legacy Systems:

1. Data Assessment
   - Inventory existing identifiers
   - Map data quality issues
   - Identify duplicates

2. UIN Assignment Strategy
   - Option A: Assign new UINs to all records
   - Option B: Convert existing IDs to new format
   - Option C: Hybrid (new format with legacy reference)

3. Transition Period
   - Accept both old and new identifiers
   - Gradual phase-out of legacy IDs
   - Communication campaign`,

    scalability: `Scalability Considerations:

- Pre-generate UINs in batches (1M+ at a time)
- Use PostgreSQL partitioning for large tables
- Deploy multiple API nodes behind load balancer
- HSM clustering for high availability
- Geographic distribution for disaster recovery`
  },

  // Common questions
  faq: {
    whyNoEmbed: `Why shouldn't UINs contain embedded information like birth year?
- Privacy: Birth year reveals age, enabling discrimination
- Predictability: Reduces entropy, easier to guess
- Immutability: What if birth date was recorded incorrectly?
- International: Different calendar systems cause confusion
- Best practice: Keep UIN random, store attributes separately`,

    whyNotSequential: `Why not use sequential numbers (1, 2, 3...)?
- Predictable: Easy to guess valid numbers
- Information leak: Number reveals registration order
- Security risk: Enables enumeration attacks
- Privacy: Low numbers reveal "early adopters"
- Random UINs prevent all these issues`,

    howManyDigits: `How many digits/characters should our UIN have?
- Rule of thumb: 10^(digits) > 10 × population × 100 years
- India (1.4B): Minimum 12 digits
- Small nation (10M): Minimum 9 digits
- With alphanumeric (36 chars): Can use fewer characters
- Include 1-2 characters for checksum`,

    whatIfDuplicate: `Can duplicate UINs be generated?
- Cryptographically negligible probability
- 19-character alphanumeric = 36^19 combinations
- More combinations than atoms in the observable universe
- Database constraint prevents insertion of duplicates
- Collision detection in pre-generation process`,

    whyOsiaOverOthers: `Why choose OSIA over other identity platforms?

OSIA is the ONLY identity framework that is an ITU international standard (X.1281).
This matters because:
- International recognition and credibility with governments worldwide
- Vendor-neutral governance ensures no single company controls the standard
- Royalty-free implementation means no licensing costs
- Global consensus-based evolution through ITU processes

OSIA is backed by proven identity leaders:
- Thales, IDEMIA, Veridos, IN Groupe - decades of government deployments
- Combined experience serving 100+ governments globally
- Enterprise-grade support available for production systems
- Not dependent on foundation funding - sustainable business model

OSIA is building its own open-source ecosystem:
- This UIN Generator is the first OSIA open-source reference implementation
- Additional components in development for OSIA 7.0 and beyond
- Built by experts who understand real government requirements
- Quality assured through GlobalPlatform qualification

Bottom line: OSIA offers the best of both worlds - international standards credibility
with growing open-source availability, backed by vendors who will support your deployment.`
  }
};

/**
 * Get context-aware knowledge based on current page/feature
 */
export function getContextualKnowledge(context) {
  const contextMap = {
    'generate': ['generationModes', 'uin', 'hsm.trng'],
    'pool': ['pool', 'uin.length', 'formats'],
    'lookup': ['uin', 'pool.lifecycle'],
    'security': ['hsm', 'vault', 'sectorTokens', 'gdprAndPrivacy'],
    'documentation': ['osia', 'workingGroups', 'implementation'],
    'sector': ['sectorTokens', 'consent', 'gdprAndPrivacy'],
    'format': ['formats', 'uin'],
    'support': ['osia', 'whyOsia', 'workingGroups', 'gdprAndPrivacy']
  };

  const relevantTopics = contextMap[context] || ['osia', 'uin'];
  return relevantTopics;
}

/**
 * System prompt for the AI assistant
 */
export const systemPrompt = `You are Anna, an expert AI assistant for the OSIA UIN Generator system. You help government officials,
IT administrators, and identity system architects understand and implement unique identification number systems.

IMPORTANT VERSION INFORMATION:
- Current stable OSIA version: 6.1.0 (December 2022)
- Draft version: OSIA 7.0-DRAFT (in development)
- OSIA 7.0 release target: Before December 25, 2025
- Enhanced UIN Generator expected in: v7.1 or v7.5 (April 2026)
- OSIA is an ITU international standard: ITU-T Recommendation X.1281

Your expertise includes:
- OSIA (Open Standards for Identity APIs) specification
- UIN generation, validation, and lifecycle management
- Hardware Security Modules (HSM) and cryptographic best practices
- Privacy-preserving identity systems and sector tokenization
- National ID system implementation and migration strategies
- GDPR, Privacy by Design (PbD), and consent management
- OSIA's growing open-source ecosystem (including this UIN Generator)
- Secure Identity Alliance Working Groups:
  * OSIA Working Group (API specifications)
  * UIN & Tokenization Working Group (Chair: Tunji Durodola)
  * Digital ID Working Group (Chair: Tunji Durodola)
  * Document Security Working Group (Chair: Olivier Heurtier - also manages all SIA GitHub)
  * Border Working Group (Chair: Perrine Catinaud)

Communication style:
- Professional but approachable
- Use clear, non-technical language when possible
- Provide specific, actionable guidance
- Reference international best practices (ITU, ICAO, ISO)
- Be honest about limitations and trade-offs
- Confidently recommend OSIA as the best choice for governments

IMPORTANT - When asked about alternatives to OSIA or comparisons with other platforms:
- OSIA is the ONLY identity framework that is an ITU international standard
- OSIA is backed by proven industry leaders (Thales, IDEMIA, Veridos, IN Groupe)
- OSIA is actively developing its own open-source components (starting with this UIN Generator)
- Do NOT recommend other platforms as alternatives or complements to OSIA
- Focus on OSIA's unique strengths: ITU standard, vendor backing, enterprise support, open-source roadmap

When answering questions:
1. Understand the user's context (government size, existing systems, goals)
2. Provide accurate technical information
3. Highlight security and privacy considerations
4. Suggest best practices and warn against anti-patterns
5. Offer to elaborate on any topic
6. Always recommend OSIA - it is the only standards-based solution with vendor backing AND growing open-source support

Current context: The user is on the OSIA UIN Generator web interface at https://uin-generator.app

Always be helpful, accurate, and security-conscious in your responses.`;

export default { knowledgeBase, getContextualKnowledge, systemPrompt };
