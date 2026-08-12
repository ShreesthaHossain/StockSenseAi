/**
 * Manual End-to-End Test Script for StockSense AI
 * 
 * This script tests the main functionality of the application.
 * Run with: node scripts/test-manual.js
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function testAPI(ticker) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/predict?ticker=${ticker}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200,
            data: json
          });
        } catch (_e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 StockSense AI - Manual E2E Tests\n');
  
  const tests = [
    { name: 'Valid ticker (AAPL)', ticker: 'AAPL', expectSuccess: true },
    { name: 'Valid ticker (GOOGL)', ticker: 'GOOGL', expectSuccess: true },
    { name: 'Valid ticker (MSFT)', ticker: 'MSFT', expectSuccess: true },
    { name: 'Invalid ticker format', ticker: 'INVALID123', expectSuccess: false },
    { name: 'Empty ticker', ticker: '', expectSuccess: false },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    
    try {
      const result = await testAPI(test.ticker);
      const success = result.success === test.expectSuccess;
      
      if (success) {
        console.log(`  ✅ PASSED (Status: ${result.status})`);
        passed++;
      } else {
        console.log(`  ❌ FAILED - Expected ${test.expectSuccess ? 'success' : 'failure'}, got ${result.success}`);
        failed++;
      }
      
      if (result.success && result.data.indicators) {
        const indicatorCount = Object.keys(result.data.indicators).length;
        console.log(`  📊 Indicators computed: ${indicatorCount}`);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('='.repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40));
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
