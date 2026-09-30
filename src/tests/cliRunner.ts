/**
 * Standalone CLI Test Runner
 * Can be executed via: npx tsx src/tests/cliRunner.ts
 */

import { runAllAutomatedTests } from './unitAndIntegration.test';

async function main() {
  console.log('==================================================');
  console.log('REAL-TIME CLOUD EVENT TRACKER: AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  const results = await runAllAutomatedTests();

  let passed = 0;
  let failed = 0;

  results.forEach((r) => {
    if (r.status === 'PASS') {
      passed++;
      console.log(`[PASS] ${r.testId}: ${r.scenario}`);
      console.log(`       Input:    ${r.input}`);
      console.log(`       Expected: ${r.expectedResult}`);
      console.log(`       Actual:   ${r.actualResult}\n`);
    } else {
      failed++;
      console.log(`[FAIL] ${r.testId}: ${r.scenario}`);
      console.log(`       Input:    ${r.input}`);
      console.log(`       Expected: ${r.expectedResult}`);
      console.log(`       Actual:   ${r.actualResult}\n`);
    }
  });

  console.log('==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED, TOTAL: ${results.length}`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
