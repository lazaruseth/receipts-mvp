#!/usr/bin/env npx tsx

/**
 * Phase Audit Script
 *
 * Run this script before moving to the next phase to ensure all requirements are met.
 *
 * Usage:
 *   npx tsx scripts/audit-phase.ts 1    # Audit Phase 1 (Foundation)
 *   npx tsx scripts/audit-phase.ts 2    # Audit Phase 2 (Monetization)
 *   npx tsx scripts/audit-phase.ts 3    # Audit Phase 3 (Scale)
 *   npx tsx scripts/audit-phase.ts all  # Run all audits
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');

interface AuditCheck {
  name: string;
  description: string;
  check: () => Promise<AuditResult>;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AuditResult {
  passed: boolean;
  message: string;
  details?: string[];
}

// ============================================
// PHASE 1: FOUNDATION CHECKS
// ============================================

const phase1Checks: AuditCheck[] = [
  // Database
  {
    name: 'Database URL Configured',
    description: 'DATABASE_URL environment variable is set',
    severity: 'critical',
    check: async () => {
      const envLocalPath = path.join(ROOT_DIR, '.env.local');
      if (!fs.existsSync(envLocalPath)) {
        return { passed: false, message: '.env.local not found' };
      }
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      if (!content.includes('DATABASE_URL=') || content.includes('DATABASE_URL=""') || content.includes('# DATABASE_URL')) {
        return { passed: false, message: 'DATABASE_URL not set in .env.local' };
      }
      return { passed: true, message: 'DATABASE_URL is configured' };
    },
  },
  {
    name: 'Capture Service Exists',
    description: 'capture-service.ts persists captures to database',
    severity: 'critical',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/services/capture-service.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'capture-service.ts not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('prisma.capture.create')) {
        return { passed: false, message: 'capture-service.ts does not persist to database' };
      }
      return { passed: true, message: 'Capture service persists to database' };
    },
  },
  // Authentication
  {
    name: 'Auth Helper Exists',
    description: 'auth-helpers.ts provides getUserIdFromRequest()',
    severity: 'critical',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/auth-helpers.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'auth-helpers.ts not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasRequireAuth = content.includes('requireAuth');
      const hasGetAuth = content.includes('getAuthFromRequest');
      if (!hasRequireAuth || !hasGetAuth) {
        return { passed: false, message: 'Missing requireAuth or getAuthFromRequest functions' };
      }
      return { passed: true, message: 'Auth helpers properly implemented' };
    },
  },
  {
    name: 'Agent Routes Require Auth',
    description: 'All agent routes call requireAuth()',
    severity: 'critical',
    check: async () => {
      const routes = [
        'src/app/api/capture/route.ts',
        'src/app/api/parse/route.ts',
        'src/app/api/validate/route.ts',
        'src/app/api/anchor/route.ts',
        'src/app/api/agents/register/route.ts',
        'src/app/api/passport/generate/route.ts',
      ];
      const missing: string[] = [];
      for (const route of routes) {
        const filePath = path.join(ROOT_DIR, route);
        if (!fs.existsSync(filePath)) {
          missing.push(`${route} - file not found`);
          continue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes('requireAuth')) {
          missing.push(`${route} - no requireAuth call`);
        }
      }
      if (missing.length > 0) {
        return { passed: false, message: 'Some routes missing auth', details: missing };
      }
      return { passed: true, message: 'All agent routes require authentication' };
    },
  },
  {
    name: 'Public Routes Properly Configured',
    description: 'Agent routes NOT in PUBLIC_ROUTES list',
    severity: 'critical',
    check: async () => {
      const middlewarePath = path.join(ROOT_DIR, 'src/middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf-8');

      // Extract PUBLIC_ROUTES array
      const match = content.match(/const PUBLIC_ROUTES = \[([\s\S]*?)\];/);
      if (!match) {
        return { passed: false, message: 'Could not find PUBLIC_ROUTES in middleware' };
      }

      const publicRoutes = match[1];
      const dangerousRoutes = ['/api/capture', '/api/parse', '/api/validate', '/api/anchor'];
      const found: string[] = [];

      for (const route of dangerousRoutes) {
        if (publicRoutes.includes(route)) {
          found.push(route);
        }
      }

      if (found.length > 0) {
        return {
          passed: false,
          message: 'Agent routes incorrectly listed as public',
          details: found
        };
      }
      return { passed: true, message: 'Agent routes not in PUBLIC_ROUTES' };
    },
  },

  // Secrets
  {
    name: 'No Hardcoded Secrets',
    description: 'Secrets throw error in production if missing',
    severity: 'critical',
    check: async () => {
      const files = [
        'src/lib/passport.ts',
        'src/lib/auth.ts',
      ];
      const issues: string[] = [];

      for (const file of files) {
        const filePath = path.join(ROOT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for production throw
        if (!content.includes("process.env.NODE_ENV === 'production'") ||
            !content.includes('throw new Error')) {
          issues.push(`${file} - may not throw in production when secret missing`);
        }
      }

      if (issues.length > 0) {
        return { passed: false, message: 'Some files may not fail safely', details: issues };
      }
      return { passed: true, message: 'Secrets throw errors in production' };
    },
  },

  // Database Services
  {
    name: 'All Services Exist',
    description: 'All 5 database services are implemented',
    severity: 'critical',
    check: async () => {
      const services = [
        'src/lib/services/agent-service.ts',
        'src/lib/services/agreement-service.ts',
        'src/lib/services/staking-service.ts',
        'src/lib/services/dispute-service.ts',
        'src/lib/services/policy-service.ts',
        'src/lib/services/capture-service.ts',
      ];
      const missing: string[] = [];

      for (const service of services) {
        const filePath = path.join(ROOT_DIR, service);
        if (!fs.existsSync(filePath)) {
          missing.push(service);
        }
      }

      if (missing.length > 0) {
        return { passed: false, message: 'Missing service files', details: missing };
      }
      return { passed: true, message: 'All services exist' };
    },
  },
  {
    name: 'Services Have Fallback',
    description: 'Services gracefully handle missing database',
    severity: 'high',
    check: async () => {
      const services = [
        'src/lib/services/agent-service.ts',
        'src/lib/services/agreement-service.ts',
        'src/lib/services/staking-service.ts',
        'src/lib/services/dispute-service.ts',
        'src/lib/services/policy-service.ts',
        'src/lib/services/capture-service.ts',
      ];
      const noFallback: string[] = [];

      for (const service of services) {
        const filePath = path.join(ROOT_DIR, service);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes('dbAvailable') && !content.includes('DATABASE_URL')) {
          noFallback.push(service);
        }
      }

      if (noFallback.length > 0) {
        return { passed: false, message: 'Services without fallback', details: noFallback };
      }
      return { passed: true, message: 'All services have fallback logic' };
    },
  },

  // Rate Limiting
  {
    name: 'Rate Limiting Implemented',
    description: 'Middleware has rate limiting with multiple tiers',
    severity: 'high',
    check: async () => {
      const middlewarePath = path.join(ROOT_DIR, 'src/middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf-8');

      const hasTiers = content.includes('RATE_LIMITS') || content.includes('rateLimitStore');
      const hasHeaders = content.includes('X-RateLimit-Limit');

      if (!hasTiers) {
        return { passed: false, message: 'No rate limit tiers found' };
      }
      if (!hasHeaders) {
        return { passed: false, message: 'Rate limit headers not set' };
      }
      return { passed: true, message: 'Rate limiting with headers implemented' };
    },
  },

  // Security Headers
  {
    name: 'Security Headers Set',
    description: 'Standard security headers added to responses',
    severity: 'high',
    check: async () => {
      const middlewarePath = path.join(ROOT_DIR, 'src/middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf-8');

      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
      ];
      const missing: string[] = [];

      for (const header of requiredHeaders) {
        if (!content.includes(header)) {
          missing.push(header);
        }
      }

      if (missing.length > 0) {
        return { passed: false, message: 'Missing security headers', details: missing };
      }
      return { passed: true, message: 'All security headers present' };
    },
  },

  // Build Check
  {
    name: 'Build Succeeds',
    description: 'npm run build completes without errors',
    severity: 'critical',
    check: async () => {
      try {
        execSync('npm run build', {
          cwd: ROOT_DIR,
          stdio: 'pipe',
          timeout: 120000
        });
        return { passed: true, message: 'Build successful' };
      } catch (error: any) {
        const output = error.stdout?.toString() || error.stderr?.toString() || 'Unknown error';
        const errorLines = output.split('\n').filter((l: string) => l.includes('error') || l.includes('Error'));
        return {
          passed: false,
          message: 'Build failed',
          details: errorLines.slice(0, 5)
        };
      }
    },
  },

  // Type Safety
  {
    name: 'TypeScript Passes',
    description: 'No TypeScript errors in codebase',
    severity: 'high',
    check: async () => {
      try {
        execSync('npx tsc --noEmit', {
          cwd: ROOT_DIR,
          stdio: 'pipe',
          timeout: 60000
        });
        return { passed: true, message: 'No TypeScript errors' };
      } catch (error: any) {
        const output = error.stdout?.toString() || error.stderr?.toString() || '';
        const errorCount = (output.match(/error TS/g) || []).length;
        return {
          passed: false,
          message: `${errorCount} TypeScript errors`,
          details: output.split('\n').filter((l: string) => l.includes('error TS')).slice(0, 5)
        };
      }
    },
  },
];

// ============================================
// PHASE 2: MONETIZATION CHECKS
// ============================================

const phase2Checks: AuditCheck[] = [
  {
    name: 'Stripe Library Exists',
    description: 'src/lib/stripe.ts is implemented',
    severity: 'critical',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/stripe.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'stripe.ts not found' };
      }
      return { passed: true, message: 'Stripe library exists' };
    },
  },
  {
    name: 'Billing Routes Exist',
    description: 'Billing API routes are implemented',
    severity: 'critical',
    check: async () => {
      const routes = [
        'src/app/api/billing/checkout/route.ts',
        'src/app/api/billing/webhook/route.ts',
      ];
      const missing: string[] = [];
      for (const route of routes) {
        if (!fs.existsSync(path.join(ROOT_DIR, route))) {
          missing.push(route);
        }
      }
      if (missing.length > 0) {
        return { passed: false, message: 'Missing billing routes', details: missing };
      }
      return { passed: true, message: 'Billing routes exist' };
    },
  },
  {
    name: 'Pricing Page Exists',
    description: 'Public pricing page is implemented',
    severity: 'high',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/app/pricing/page.tsx');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'Pricing page not found' };
      }
      return { passed: true, message: 'Pricing page exists' };
    },
  },
  {
    name: 'Usage Metering Exists',
    description: 'Usage tracking is implemented',
    severity: 'high',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/metering.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'metering.ts not found' };
      }
      return { passed: true, message: 'Metering library exists' };
    },
  },
  // Include Phase 1 checks as prerequisites
  ...phase1Checks.filter(c => c.severity === 'critical'),
];

// ============================================
// PHASE 3: SCALE CHECKS
// ============================================

const phase3Checks: AuditCheck[] = [
  {
    name: 'Background Jobs Exist',
    description: 'Job queue is implemented',
    severity: 'critical',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/jobs.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'jobs.ts not found' };
      }
      return { passed: true, message: 'Jobs library exists' };
    },
  },
  {
    name: 'Webhook Delivery Implemented',
    description: 'Webhooks actually deliver to URLs',
    severity: 'high',
    check: async () => {
      const filePath = path.join(ROOT_DIR, 'src/lib/webhooks.ts');
      if (!fs.existsSync(filePath)) {
        return { passed: false, message: 'webhooks.ts not found' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('fetch(') && !content.includes('axios')) {
        return { passed: false, message: 'No HTTP delivery found in webhooks' };
      }
      return { passed: true, message: 'Webhook delivery implemented' };
    },
  },
  // Include Phase 1 & 2 critical checks
  ...phase1Checks.filter(c => c.severity === 'critical'),
  ...phase2Checks.filter(c => c.severity === 'critical' && !c.name.includes('Phase 1')),
];

// ============================================
// RUNNER
// ============================================

async function runAudit(phase: number | 'all') {
  console.log('\n' + '='.repeat(60));
  console.log(`  REMASTER PHASE AUDIT - ${phase === 'all' ? 'ALL PHASES' : `PHASE ${phase}`}`);
  console.log('='.repeat(60) + '\n');

  let checks: AuditCheck[];
  switch (phase) {
    case 1:
      checks = phase1Checks;
      break;
    case 2:
      checks = phase2Checks;
      break;
    case 3:
      checks = phase3Checks;
      break;
    case 'all':
      checks = [...new Map([...phase1Checks, ...phase2Checks, ...phase3Checks].map(c => [c.name, c])).values()];
      break;
    default:
      console.error(`Unknown phase: ${phase}`);
      process.exit(1);
  }

  const results: { check: AuditCheck; result: AuditResult }[] = [];
  let criticalFailures = 0;
  let highFailures = 0;

  for (const check of checks) {
    process.stdout.write(`  [${check.severity.toUpperCase().padEnd(8)}] ${check.name}... `);

    try {
      const result = await check.check();
      results.push({ check, result });

      if (result.passed) {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL');
        console.log(`             ${result.message}`);
        if (result.details) {
          result.details.forEach(d => console.log(`             - ${d}`));
        }
        if (check.severity === 'critical') criticalFailures++;
        if (check.severity === 'high') highFailures++;
      }
    } catch (error: any) {
      console.log('💥 ERROR');
      console.log(`             ${error.message}`);
      results.push({
        check,
        result: { passed: false, message: error.message }
      });
      if (check.severity === 'critical') criticalFailures++;
    }
  }

  // Summary
  console.log('\n' + '-'.repeat(60));
  const passed = results.filter(r => r.result.passed).length;
  const failed = results.length - passed;

  console.log(`  SUMMARY: ${passed}/${results.length} checks passed`);

  if (criticalFailures > 0) {
    console.log(`\n  🚫 ${criticalFailures} CRITICAL failures - CANNOT proceed to next phase`);
  }
  if (highFailures > 0) {
    console.log(`  ⚠️  ${highFailures} HIGH priority failures - Should fix before next phase`);
  }

  if (criticalFailures === 0 && highFailures === 0) {
    console.log(`\n  ✅ PHASE ${phase} AUDIT PASSED - Ready for next phase!`);
  }

  console.log('-'.repeat(60) + '\n');

  // Exit with error code if critical failures
  if (criticalFailures > 0) {
    process.exit(1);
  }
}

// Parse arguments
const arg = process.argv[2];
if (!arg) {
  console.log('Usage: npx tsx scripts/audit-phase.ts <phase>');
  console.log('  phase: 1, 2, 3, or all');
  process.exit(1);
}

const phase = arg === 'all' ? 'all' : parseInt(arg, 10);
runAudit(phase);
