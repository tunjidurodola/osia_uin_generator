#!/usr/bin/env node

/**
 * CLI Tool for UIN Generator with Database Support
 * Provides command-line interface for UIN generation and pool management
 */

import { generateUin, validateUin } from './uinGenerator.mjs';
import { getConfig } from './config.mjs';
import {
  preGenerateUins,
  claimUin,
  assignUin,
  releaseUin,
  updateUinStatus,
  releaseStalePreassigned,
  getUin,
  getUinAudit,
  getPoolStats
} from './poolService.mjs';
import { closeDb } from './db.mjs';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    command: null,
    mode: null,
    length: null,
    charset: null,
    excludeAmbiguous: null,
    checksum: null,
    checksumAlgorithm: null,
    template: null,
    values: {},
    foundationalUin: null,
    sector: null,
    tokenLength: null,
    json: false,
    validate: false,
    help: false,
    // Database options
    count: null,
    scope: null,
    clientId: null,
    assignedToRef: null,
    actorSystem: null,
    actorRef: null,
    newStatus: null,
    reason: null,
    olderThanMinutes: null
  };

  // Check for commands (pre-generate, pool-stats, claim, etc.)
  if (args.length > 0 && !args[0].startsWith('--')) {
    options.command = args[0];
    args = args.slice(1);
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = nextArg;
        i++;
        break;

      case '--length':
      case '-l':
        options.length = parseInt(nextArg);
        i++;
        break;

      case '--charset':
      case '-c':
        options.charset = nextArg;
        i++;
        break;

      case '--exclude-ambiguous':
      case '--no-ambiguous':
        options.excludeAmbiguous = true;
        break;

      case '--checksum':
        if (nextArg && !nextArg.startsWith('--')) {
          options.checksumAlgorithm = nextArg;
          i++;
        } else {
          options.checksumAlgorithm = 'iso7064';
        }
        options.checksum = true;
        break;

      case '--template':
      case '-t':
        options.template = nextArg;
        i++;
        break;

      case '--region':
      case '-r':
        options.values.R = nextArg;
        i++;
        break;

      case '--year':
      case '-y':
        options.values.Y = nextArg;
        i++;
        break;

      case '--facility':
      case '-f':
        options.values.F = nextArg;
        i++;
        break;

      case '--uin':
      case '-u':
        options.foundationalUin = nextArg;
        i++;
        break;

      case '--sector':
      case '-s':
        options.sector = nextArg;
        i++;
        break;

      case '--token-length':
        options.tokenLength = parseInt(nextArg);
        i++;
        break;

      case '--json':
      case '-j':
        options.json = true;
        break;

      case '--validate':
        options.validate = true;
        break;

      case '--help':
      case '-h':
        options.help = true;
        break;

      // Database options
      case '--count':
        options.count = parseInt(nextArg);
        i++;
        break;

      case '--scope':
        options.scope = nextArg;
        i++;
        break;

      case '--client-id':
        options.clientId = nextArg;
        i++;
        break;

      case '--assigned-to':
        options.assignedToRef = nextArg;
        i++;
        break;

      case '--actor-system':
        options.actorSystem = nextArg;
        i++;
        break;

      case '--actor-ref':
        options.actorRef = nextArg;
        i++;
        break;

      case '--status':
        options.newStatus = nextArg;
        i++;
        break;

      case '--reason':
        options.reason = nextArg;
        i++;
        break;

      case '--older-than':
        options.olderThanMinutes = parseInt(nextArg);
        i++;
        break;

      default:
        if (arg.startsWith('--')) {
          const [key, value] = arg.split('=');
          const cleanKey = key.replace(/^--/, '');

          if (value) {
            options.values[cleanKey.toUpperCase()] = value;
          } else if (nextArg && !nextArg.startsWith('--')) {
            options.values[cleanKey.toUpperCase()] = nextArg;
            i++;
          }
        }
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
UIN Generator CLI - OSIA-Compliant with PostgreSQL Pool Management

USAGE:
  node cli.mjs [COMMAND] [OPTIONS]

COMMANDS:
  (none)              Generate a single UIN (default)
  pre-generate        Pre-generate UINs into the pool
  pool-stats          Show pool statistics
  claim               Claim an available UIN
  assign              Assign a preassigned UIN
  release             Release a preassigned UIN
  status              Update UIN status
  cleanup             Release stale preassigned UINs
  lookup              Look up a UIN
  audit               Show UIN audit history

GENERATION OPTIONS:
  --mode, -m <mode>              Generation mode (foundational, random, structured, sector_token)
  --length, -l <number>          Length of UIN (default: 19)
  --charset, -c <charset>        Character set (numeric, alphanumeric, safe, or custom)
  --exclude-ambiguous            Exclude ambiguous characters (0, O, I, 1, l)
  --checksum [algorithm]         Enable checksum (modN, iso7064, iso7064mod97)
  --json, -j                     Output in JSON format

DATABASE OPTIONS:
  --count <number>               Number of UINs to pre-generate
  --scope <scope>                Scope/sector for generation or claim
  --client-id <id>               Client identifier for claim
  --assigned-to <ref>            External reference for assignment
  --actor-system <system>        Actor system identifier
  --actor-ref <ref>              Transaction/case reference
  --status <status>              New status (RETIRED, REVOKED, etc.)
  --reason <text>                Reason for status change
  --older-than <minutes>         Minutes threshold for cleanup

EXAMPLES:

  # Generate a foundational UIN
  node cli.mjs --mode foundational --length 19 --json

  # Pre-generate 10,000 UINs into pool
  node cli.mjs pre-generate --count 10000 --mode foundational --scope foundational

  # Show pool statistics
  node cli.mjs pool-stats

  # Show pool statistics for specific scope
  node cli.mjs pool-stats --scope health

  # Claim a UIN
  node cli.mjs claim --scope foundational --client-id CIVIL_REGISTRY

  # Assign a claimed UIN
  node cli.mjs assign --uin ABC123XYZ --assigned-to PERSON_12345 --actor-system CIVIL_REGISTRY

  # Release a preassigned UIN
  node cli.mjs release --uin ABC123XYZ --actor-system CIVIL_REGISTRY

  # Retire a UIN
  node cli.mjs status --uin ABC123XYZ --status RETIRED --reason "Person deceased"

  # Cleanup stale preassignments (older than 60 minutes)
  node cli.mjs cleanup --older-than 60

  # Look up a UIN
  node cli.mjs lookup --uin ABC123XYZ --json

  # Show audit history
  node cli.mjs audit --uin ABC123XYZ
`);
}

/**
 * Build generation options from CLI args
 */
function buildGenerationOptions(cliOptions) {
  const options = {
    mode: cliOptions.mode || 'foundational'
  };

  if (cliOptions.length !== null) {
    options.length = cliOptions.length;
  }

  if (cliOptions.charset) {
    options.charset = cliOptions.charset;
  }

  if (cliOptions.excludeAmbiguous) {
    options.excludeAmbiguous = true;
  }

  if (cliOptions.checksum) {
    options.checksum = {
      enabled: true,
      algorithm: cliOptions.checksumAlgorithm || 'iso7064'
    };
  }

  if (cliOptions.template) {
    options.template = cliOptions.template;
  }

  if (Object.keys(cliOptions.values).length > 0) {
    options.values = cliOptions.values;
  }

  if (cliOptions.foundationalUin) {
    options.foundationalUin = cliOptions.foundationalUin;
  }

  if (cliOptions.sector) {
    options.sector = cliOptions.sector;
  }

  if (cliOptions.tokenLength) {
    options.tokenLength = cliOptions.tokenLength;
  }

  return options;
}

/**
 * Main CLI function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const cliOptions = parseArgs(args);

    if (cliOptions.help || args.length === 0) {
      printHelp();
      process.exit(0);
    }

    const config = getConfig();

    // Handle commands
    switch (cliOptions.command) {
      case 'pre-generate':
        await handlePreGenerate(cliOptions);
        break;

      case 'pool-stats':
        await handlePoolStats(cliOptions);
        break;

      case 'claim':
        await handleClaim(cliOptions);
        break;

      case 'assign':
        await handleAssign(cliOptions);
        break;

      case 'release':
        await handleRelease(cliOptions);
        break;

      case 'status':
        await handleStatus(cliOptions);
        break;

      case 'cleanup':
        await handleCleanup(cliOptions);
        break;

      case 'lookup':
        await handleLookup(cliOptions);
        break;

      case 'audit':
        await handleAudit(cliOptions);
        break;

      default:
        // Default: generate a single UIN
        if (cliOptions.validate) {
          await handleValidate(cliOptions);
        } else {
          await handleGenerate(cliOptions);
        }
        break;
    }

    await closeDb();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    await closeDb();
    process.exit(1);
  }
}

/**
 * Handle single UIN generation
 */
async function handleGenerate(cliOptions) {
  const generationOptions = buildGenerationOptions(cliOptions);
  const result = generateUin(generationOptions);

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.value);
  }
}

/**
 * Handle validation
 */
async function handleValidate(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for validation');
    process.exit(1);
  }

  const validationOptions = cliOptions.checksum
    ? {
        checksum: {
          enabled: true,
          algorithm: cliOptions.checksumAlgorithm || 'iso7064',
          length: cliOptions.checksumAlgorithm === 'iso7064mod97' ? 2 : 1
        }
      }
    : {};

  const result = validateUin(cliOptions.foundationalUin, validationOptions);

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.valid) {
      console.log(`✓ Valid UIN (length: ${result.length})`);
    } else {
      console.log(`✗ Invalid UIN: ${result.error}`);
      process.exit(1);
    }
  }
}

/**
 * Handle pre-generation
 */
async function handlePreGenerate(cliOptions) {
  if (!cliOptions.count) {
    console.error('Error: --count is required for pre-generate');
    process.exit(1);
  }

  if (!cliOptions.mode) {
    console.error('Error: --mode is required for pre-generate');
    process.exit(1);
  }

  const generationOptions = buildGenerationOptions(cliOptions);
  const scope = cliOptions.scope || cliOptions.mode;

  const result = await preGenerateUins({
    count: cliOptions.count,
    mode: cliOptions.mode,
    scope: scope,
    options: generationOptions
  });

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n✓ Pre-generation complete:`);
    console.log(`  Inserted: ${result.inserted}`);
    console.log(`  Errors: ${result.errors}`);
  }
}

/**
 * Handle pool statistics
 */
async function handlePoolStats(cliOptions) {
  const stats = await getPoolStats(cliOptions.scope || null);

  if (cliOptions.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log('\nPool Statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Available: ${stats.available}`);
    console.log(`  Preassigned: ${stats.preassigned}`);
    console.log(`  Assigned: ${stats.assigned}`);
    console.log(`  Retired: ${stats.retired}`);
    console.log(`  Revoked: ${stats.revoked}`);
  }
}

/**
 * Handle claim
 */
async function handleClaim(cliOptions) {
  const result = await claimUin({
    scope: cliOptions.scope || null,
    clientId: cliOptions.clientId || 'CLI'
  });

  if (!result) {
    console.error('No available UINs to claim');
    process.exit(1);
  }

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Claimed UIN: ${result.uin}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Claimed by: ${result.claimed_by}`);
  }
}

/**
 * Handle assign
 */
async function handleAssign(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for assign');
    process.exit(1);
  }

  if (!cliOptions.assignedToRef) {
    console.error('Error: --assigned-to is required for assign');
    process.exit(1);
  }

  const result = await assignUin({
    uin: cliOptions.foundationalUin,
    assignedToRef: cliOptions.assignedToRef,
    actorSystem: cliOptions.actorSystem || 'CLI',
    actorRef: cliOptions.actorRef || null
  });

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Assigned UIN: ${result.uin}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Assigned to: ${result.assigned_to_ref}`);
  }
}

/**
 * Handle release
 */
async function handleRelease(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for release');
    process.exit(1);
  }

  const result = await releaseUin({
    uin: cliOptions.foundationalUin,
    actorSystem: cliOptions.actorSystem || 'CLI',
    actorRef: cliOptions.actorRef || null
  });

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Released UIN: ${result.uin}`);
    console.log(`  Status: ${result.status}`);
  }
}

/**
 * Handle status update
 */
async function handleStatus(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for status');
    process.exit(1);
  }

  if (!cliOptions.newStatus) {
    console.error('Error: --status is required');
    process.exit(1);
  }

  const result = await updateUinStatus({
    uin: cliOptions.foundationalUin,
    newStatus: cliOptions.newStatus,
    reason: cliOptions.reason || 'No reason provided',
    actorSystem: cliOptions.actorSystem || 'CLI',
    actorRef: cliOptions.actorRef || null
  });

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Updated UIN: ${result.uin}`);
    console.log(`  New status: ${result.status}`);
  }
}

/**
 * Handle cleanup
 */
async function handleCleanup(cliOptions) {
  if (!cliOptions.olderThanMinutes) {
    console.error('Error: --older-than is required for cleanup');
    process.exit(1);
  }

  const result = await releaseStalePreassigned({
    olderThanMinutes: cliOptions.olderThanMinutes
  });

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✓ Cleanup complete:`);
    console.log(`  Released: ${result.released} UINs`);
  }
}

/**
 * Handle lookup
 */
async function handleLookup(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for lookup');
    process.exit(1);
  }

  const result = await getUin(cliOptions.foundationalUin);

  if (!result) {
    console.error(`UIN not found: ${cliOptions.foundationalUin}`);
    process.exit(1);
  }

  if (cliOptions.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\nUIN: ${result.uin}`);
    console.log(`Mode: ${result.mode}`);
    console.log(`Scope: ${result.scope}`);
    console.log(`Status: ${result.status}`);
    console.log(`Issued at: ${result.iat}`);
    if (result.claimed_by) {
      console.log(`Claimed by: ${result.claimed_by}`);
      console.log(`Claimed at: ${result.claimed_at}`);
    }
    if (result.assigned_to_ref) {
      console.log(`Assigned to: ${result.assigned_to_ref}`);
      console.log(`Assigned at: ${result.assigned_at}`);
    }
  }
}

/**
 * Handle audit history
 */
async function handleAudit(cliOptions) {
  if (!cliOptions.foundationalUin) {
    console.error('Error: --uin is required for audit');
    process.exit(1);
  }

  const results = await getUinAudit(cliOptions.foundationalUin);

  if (cliOptions.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\nAudit history for ${cliOptions.foundationalUin}:\n`);
    results.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.event_type}`);
      console.log(`   ${entry.old_status || 'N/A'} → ${entry.new_status || 'N/A'}`);
      console.log(`   Actor: ${entry.actor_system}`);
      console.log(`   Time: ${entry.created_at}`);
      if (entry.details && Object.keys(entry.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(entry.details)}`);
      }
      console.log('');
    });
  }
}

// Run CLI
main();
