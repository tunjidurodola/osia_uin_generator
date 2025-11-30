# OSIA UIN Generator - Test Plan

**Version:** 2.0
**Date:** November 2025
**Author:** Tunji Durodola

---

## 1. Overview

This document outlines the comprehensive test plan for the OSIA UIN Generator v2.0, covering functional, security, performance, and integration testing across all components including HSM and HashiCorp Vault integrations.

---

## 2. Test Scope

### In Scope

| Component | Coverage |
|-----------|----------|
| UIN Generation | All 4 modes (Foundational, Random, Structured, Sector Token) |
| Pool Management | Pre-generation, claiming, assignment, release, status updates |
| HSM Integration | All supported providers, TRNG priority, fallback behavior |
| Vault Integration | Authentication, secret retrieval, caching |
| API Endpoints | All REST endpoints including health and crypto status |
| Web Interface | All tabs (Generate, Pool, Lookup, Security, Documentation) |
| Database | PostgreSQL operations, audit logging, transactions |
| Security | Authentication, CORS, input validation |

### Out of Scope

- Load balancer configuration testing
- Third-party HSM vendor hardware testing (unless available)
- Network infrastructure testing

---

## 3. Test Categories

### 3.1 Unit Tests

#### 3.1.1 UIN Generation

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| UG-001 | Generate foundational UIN with default settings | 19-char alphanumeric UIN with valid checksum |
| UG-002 | Generate UIN with custom length (12 chars) | 12-char UIN |
| UG-003 | Generate UIN with numeric-only charset | UIN containing only 0-9 |
| UG-004 | Generate UIN excluding ambiguous chars | No O, 0, I, 1, L in output |
| UG-005 | Generate random mode UIN | Valid random UIN per config |
| UG-006 | Generate structured mode UIN | UIN matching template pattern |
| UG-007 | Generate sector token from foundational UIN | Unlinkable sector-specific token |
| UG-008 | Validate correct UIN checksum | Validation returns true |
| UG-009 | Reject UIN with invalid checksum | Validation returns false |
| UG-010 | Verify UIN uniqueness (1000 generations) | All UINs unique |

#### 3.1.2 Checksum Algorithms

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| CS-001 | ISO 7064 MOD 37-2 checksum generation | Valid check character |
| CS-002 | ISO 7064 MOD 97-10 checksum generation | Valid 2-digit checksum |
| CS-003 | Luhn algorithm checksum | Valid Luhn digit |
| CS-004 | Damm algorithm checksum | Valid anti-transposition digit |
| CS-005 | Checksum validation - correct input | Returns true |
| CS-006 | Checksum validation - single char error | Returns false |
| CS-007 | Checksum validation - transposition error | Returns false |

#### 3.1.3 Hash Functions

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| HF-001 | SHA3-256 hash generation | 64-char hex hash |
| HF-002 | RIPEMD-160 hash generation | 40-char hex hash |
| HF-003 | Combined hash (RIPEMD-160 of SHA3-256) | Consistent output |
| HF-004 | Hash with salt | Different hash with different salt |

### 3.2 HSM Integration Tests

#### 3.2.1 HSM Detection and Initialization

| Test ID | Description | Expected Result | Prerequisites |
|---------|-------------|-----------------|---------------|
| HSM-001 | Auto-detect Thales Luna HSM | Provider detected, TRNG available | Thales Luna installed |
| HSM-002 | Auto-detect SafeNet HSM | Provider detected, TRNG available | SafeNet installed |
| HSM-003 | Auto-detect Utimaco HSM | Provider detected, TRNG available | Utimaco installed |
| HSM-004 | Auto-detect AWS CloudHSM | Provider detected | AWS CloudHSM configured |
| HSM-005 | Auto-detect SoftHSM | Provider detected, TRNG=false | SoftHSM installed |
| HSM-006 | Fallback when no HSM present | Software mode activated | No HSM |
| HSM-007 | Initialize with explicit provider | Correct provider initialized | Provider library exists |
| HSM-008 | Handle missing library gracefully | Fallback to software | Library path invalid |
| HSM-009 | Handle invalid PIN | Error logged, fallback | Wrong PIN provided |
| HSM-010 | Handle slot not found | Error logged, fallback | Invalid slot number |

#### 3.2.2 TRNG Priority Testing

| Test ID | Description | Expected Result | Prerequisites |
|---------|-------------|-----------------|---------------|
| TRNG-001 | Generate random bytes via HSM TRNG | Hardware-sourced entropy | Production HSM |
| TRNG-002 | Verify TRNG fallback on HSM failure | Software CSPRNG used | HSM then disconnect |
| TRNG-003 | randomBytesWithSource returns HSM info | source: "Thales Luna", hardware: true | Thales Luna |
| TRNG-004 | randomBytesWithSource returns software info | source: "Node.js CSPRNG", hardware: false | No HSM |
| TRNG-005 | SoftHSM reports no TRNG | hasTrng: false | SoftHSM only |
| TRNG-006 | TRNG used for UIN generation | UIN generated with hardware entropy | Production HSM |
| TRNG-007 | TRNG used for sector token salt | Salt from HSM | Production HSM |

#### 3.2.3 HSM Cryptographic Operations

| Test ID | Description | Expected Result | Prerequisites |
|---------|-------------|-----------------|---------------|
| HSM-C01 | HMAC-SHA256 via HSM | Correct HMAC output | HSM with key |
| HSM-C02 | HMAC-SHA384 via HSM | Correct HMAC output | HSM with key |
| HSM-C03 | HMAC-SHA512 via HSM | Correct HMAC output | HSM with key |
| HSM-C04 | Key creation in HSM | Key created with correct attributes | HSM access |
| HSM-C05 | Key lookup in HSM | Existing key found | Key exists |
| HSM-C06 | Key non-extractable | Extraction fails | HSM key |
| HSM-C07 | Session management | Session opens/closes cleanly | HSM access |

### 3.3 HashiCorp Vault Tests

#### 3.3.1 Authentication

| Test ID | Description | Expected Result | Prerequisites |
|---------|-------------|-----------------|---------------|
| VLT-001 | Token authentication | authenticated: true | Valid token |
| VLT-002 | AppRole authentication | Token received | Valid role_id/secret_id |
| VLT-003 | Invalid token rejected | Authentication fails | Invalid token |
| VLT-004 | Expired token handling | Re-authentication attempted | Expired token |
| VLT-005 | Token renewal | Token renewed successfully | Renewable token |

#### 3.3.2 Secret Operations

| Test ID | Description | Expected Result | Prerequisites |
|---------|-------------|-----------------|---------------|
| VLT-010 | Read sector secrets | All 8 sector secrets retrieved | Secrets exist |
| VLT-011 | Read database credentials | DB config returned | Credentials stored |
| VLT-012 | Read HSM configuration | HSM config returned | Config stored |
| VLT-013 | Secret caching | Cached value returned within TTL | Recent read |
| VLT-014 | Cache invalidation after TTL | Fresh value fetched | Wait > 5 min |
| VLT-015 | Handle missing secret | Error returned gracefully | Secret doesn't exist |
| VLT-016 | Handle Vault unavailable | Fallback to env vars | Vault offline |

### 3.4 API Endpoint Tests

#### 3.4.1 Primary Endpoints

| Test ID | Endpoint | Method | Expected Status | Expected Result |
|---------|----------|--------|-----------------|-----------------|
| API-001 | /v1/uin | POST | 200 | UIN string returned |
| API-002 | /v1/uin (no transactionId) | POST | 400 | Error message |
| API-003 | /generate | POST | 200 | UIN with metadata |
| API-004 | /validate | POST | 200 | Validation result |
| API-005 | /batch | POST | 200 | Array of UINs |
| API-006 | /health | GET | 200 | Health status with crypto info |
| API-007 | /crypto/status | GET | 200 | HSM/Vault status |
| API-008 | /modes | GET | 200 | Available modes |
| API-009 | /sectors | GET | 200 | Supported sectors |

#### 3.4.2 Pool Management Endpoints

| Test ID | Endpoint | Method | Expected Status | Expected Result |
|---------|----------|--------|-----------------|-----------------|
| API-020 | /pool/stats | GET | 200 | Pool statistics |
| API-021 | /uin/pre-generate | POST | 200 | Generated count |
| API-022 | /uin/claim | POST | 200 | Claimed UIN |
| API-023 | /uin/assign | POST | 200 | Assignment confirmation |
| API-024 | /uin/release | POST | 200 | Release confirmation |
| API-025 | /uin/status | POST | 200 | Status update confirmation |
| API-026 | /uin/:uin | GET | 200 | UIN details |
| API-027 | /uin/:uin (not found) | GET | 404 | Not found error |
| API-028 | /uin/:uin/audit | GET | 200 | Audit trail |

### 3.5 Database Tests

#### 3.5.1 CRUD Operations

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| DB-001 | Insert UIN record | Record created with correct fields |
| DB-002 | Read UIN by primary key | Record returned |
| DB-003 | Update UIN status | Status updated, ts updated |
| DB-004 | Insert audit record | Audit entry created |
| DB-005 | Query audit by UIN | All events for UIN returned |

#### 3.5.2 Transaction Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| DB-010 | Concurrent claim attempts | Only one succeeds (FOR UPDATE SKIP LOCKED) |
| DB-011 | Transaction rollback on error | No partial updates |
| DB-012 | Audit + status atomic update | Both succeed or both fail |

### 3.6 Security Tests

#### 3.6.1 Input Validation

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SEC-001 | SQL injection in UIN parameter | Input sanitized, no injection |
| SEC-002 | XSS in attributes JSON | HTML escaped |
| SEC-003 | Invalid charset characters | Rejected with error |
| SEC-004 | Oversized request body | 413 Payload Too Large |
| SEC-005 | Invalid JSON body | 400 Bad Request |

#### 3.6.2 Authentication/Authorization

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SEC-010 | Request without auth header | 401 Unauthorized (if auth enabled) |
| SEC-011 | Invalid bearer token | 401 Unauthorized |
| SEC-012 | Insufficient scope | 403 Forbidden |

#### 3.6.3 CORS

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SEC-020 | Allowed origin request | CORS headers present |
| SEC-021 | Disallowed origin request | CORS blocked |
| SEC-022 | Preflight OPTIONS request | 204 with CORS headers |

---

## 4. Integration Test Scenarios

### 4.1 Full UIN Lifecycle

```
Scenario: Complete UIN lifecycle from generation to retirement

Given the system is initialized with HSM and Vault
And the database is empty
And sector secrets are loaded from Vault

When I pre-generate 100 UINs with scope "civil-registry"
Then 100 UINs should be in AVAILABLE status
And audit records should show PRE_GENERATED events

When I claim a UIN for the civil registry system
Then the UIN status should be PREASSIGNED
And claimed_by should be "civil-registry"
And audit should show CLAIMED event

When I assign the UIN to person ref "PERSON-12345"
Then the UIN status should be ASSIGNED
And assigned_to_ref should be "PERSON-12345"
And audit should show ASSIGNED event

When I generate a sector token for "health" sector
Then a unique token should be returned
And the token should not be linkable to the foundational UIN
And the token derivation should use HSM TRNG for salt (if available)

When I retire the UIN with reason "DEATH"
Then the UIN status should be RETIRED
And audit should show RETIRED event with reason
```

### 4.2 HSM Failover Scenario

```
Scenario: HSM becomes unavailable during operation

Given the system is using Thales Luna HSM
And HSM TRNG is being used for random generation

When the HSM connection is interrupted
Then the system should log a warning
And random generation should fallback to Node.js CSPRNG
And the /crypto/status endpoint should show hasTrng: false
And UIN generation should continue without interruption
```

### 4.3 Vault Secret Rotation

```
Scenario: Sector secrets are rotated in Vault

Given the system has loaded sector secrets from Vault
And cached secrets have not expired

When sector secrets are updated in Vault
Then within 5 minutes, new secrets should be used
And existing sector tokens remain valid with old secrets
And new sector tokens use new secrets
```

---

## 5. Performance Tests

### 5.1 Throughput Tests

| Test ID | Scenario | Target |
|---------|----------|--------|
| PERF-001 | UIN generation (software CSPRNG) | 1000/sec |
| PERF-002 | UIN generation (HSM TRNG) | 100/sec (HSM dependent) |
| PERF-003 | Sector token derivation | 500/sec |
| PERF-004 | Pool claim operations | 500/sec |
| PERF-005 | Concurrent claims (100 threads) | No deadlocks |

### 5.2 Latency Tests

| Test ID | Operation | P50 | P99 |
|---------|-----------|-----|-----|
| PERF-010 | /generate (software) | <10ms | <50ms |
| PERF-011 | /generate (HSM) | <50ms | <200ms |
| PERF-012 | /uin/claim | <20ms | <100ms |
| PERF-013 | /uin/:uin lookup | <5ms | <20ms |
| PERF-014 | Vault secret read (cached) | <1ms | <5ms |
| PERF-015 | Vault secret read (uncached) | <50ms | <200ms |

---

## 6. Test Environment

### 6.1 Development Environment

| Component | Configuration |
|-----------|---------------|
| Node.js | v20.x |
| PostgreSQL | v15.x (local) |
| Vault | Dev mode (in-memory) |
| HSM | SoftHSM 2.x |

### 6.2 Staging Environment

| Component | Configuration |
|-----------|---------------|
| Node.js | v20.x |
| PostgreSQL | v15.x (dedicated) |
| Vault | HA cluster |
| HSM | YubiHSM 2 or AWS CloudHSM |

### 6.3 Production Environment

| Component | Configuration |
|-----------|---------------|
| Node.js | v20.x (clustered) |
| PostgreSQL | v15.x (primary/replica) |
| Vault | Enterprise HA |
| HSM | Thales Luna / SafeNet / Utimaco |

---

## 7. Test Execution

### 7.1 Automated Tests

```bash
# Unit tests
npm test

# Database integration tests
npm run test:db

# API integration tests
npm run test:api

# Full test suite
npm run test:all
```

### 7.2 Manual Tests

| Test Category | Frequency | Responsible |
|---------------|-----------|-------------|
| HSM integration | Per release | Security team |
| Vault integration | Per release | DevOps team |
| UI testing | Per release | QA team |
| Penetration testing | Quarterly | External vendor |

---

## 8. Test Data

### 8.1 Sector Secrets (Test Only)

```bash
# DO NOT USE IN PRODUCTION
SECTOR_SECRET_HEALTH=test-health-secret-32bytes-min
SECTOR_SECRET_TAX=test-tax-secret-32bytes-minimum
SECTOR_SECRET_FINANCE=test-finance-secret-32bytes
# ... etc
```

### 8.2 Test UINs

| UIN | Purpose | Status |
|-----|---------|--------|
| TEST000000000000001 | Valid checksum test | AVAILABLE |
| TEST000000000000002 | Lifecycle test | ASSIGNED |
| INVALID0000000000X | Invalid checksum test | N/A |

---

## 9. Acceptance Criteria

### 9.1 Release Criteria

- [ ] All unit tests pass (100%)
- [ ] All integration tests pass (100%)
- [ ] No critical or high security vulnerabilities
- [ ] Performance targets met (P99 latency)
- [ ] HSM TRNG priority verified
- [ ] Vault secret loading verified
- [ ] Documentation updated

### 9.2 HSM-Specific Criteria

- [ ] Production HSM detected and prioritized over SoftHSM
- [ ] Hardware TRNG used when available
- [ ] Graceful fallback when HSM unavailable
- [ ] No secret key extraction possible
- [ ] FIPS 140-2 Level 3 provider recognized

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| HSM unavailable | Low | High | Software fallback, monitoring |
| Vault unavailable | Low | Medium | Cached secrets, env fallback |
| Database corruption | Low | Critical | Backups, replication |
| Secret leakage | Low | Critical | HSM key protection, Vault |
| Performance degradation | Medium | Medium | Monitoring, scaling |

---

## 11. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Lead | | | |
| Security | | | |
| DevOps | | | |
| Project Manager | | | |
