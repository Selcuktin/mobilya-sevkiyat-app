// Load testing script using Artillery.js or custom implementation

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class LoadTester {
  constructor(config) {
    this.config = {
      baseUrl: 'http://localhost:3000',
      concurrent: 10,
      duration: 60, // seconds
      rampUp: 10, // seconds
      ...config
    };
    this.results = [];
    this.activeRequests = 0;
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.responseTimes = [];
  }

  async runTest(scenarios) {
    console.log(`Starting load test with ${this.config.concurrent} concurrent users for ${this.config.duration}s`);
    console.log(`Base URL: ${this.config.baseUrl}`);
    
    const startTime = Date.now();
    const endTime = startTime + (this.config.duration * 1000);
    
    // Ramp up users gradually
    const rampUpInterval = (this.config.rampUp * 1000) / this.config.concurrent;
    
    const promises = [];
    
    for (let i = 0; i < this.config.concurrent; i++) {
      const delay = i * rampUpInterval;
      promises.push(
        new Promise(resolve => {
          setTimeout(() => {
            this.runUserSession(scenarios, endTime).then(resolve);
          }, delay);
        })
      );
    }
    
    await Promise.all(promises);
    
    this.printResults();
  }

  async runUserSession(scenarios, endTime) {
    while (Date.now() < endTime) {
      for (const scenario of scenarios) {
        if (Date.now() >= endTime) break;
        
        try {
          await this.executeScenario(scenario);
          await this.sleep(scenario.thinkTime || 1000);
        } catch (error) {
          console.error('Scenario error:', error.message);
        }
      }
    }
  }

  async executeScenario(scenario) {
    const startTime = performance.now();
    this.activeRequests++;
    this.totalRequests++;

    try {
      const response = await this.makeRequest(scenario);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.responseTimes.push(responseTime);
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        this.successfulRequests++;
      } else {
        this.failedRequests++;
        console.warn(`Request failed: ${scenario.name} - Status: ${response.statusCode}`);
      }
      
      this.results.push({
        scenario: scenario.name,
        method: scenario.method,
        url: scenario.url,
        statusCode: response.statusCode,
        responseTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.failedRequests++;
      console.error(`Request error: ${scenario.name} - ${error.message}`);
    } finally {
      this.activeRequests--;
    }
  }

  makeRequest(scenario) {
    return new Promise((resolve, reject) => {
      const url = new URL(scenario.url, this.config.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: scenario.method || 'GET',
        headers: {
          'User-Agent': 'LoadTester/1.0',
          'Accept': 'application/json',
          ...scenario.headers
        },
        timeout: 30000
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (scenario.body) {
        req.write(JSON.stringify(scenario.body));
      }

      req.end();
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n=== Load Test Results ===');
    console.log(`Total Requests: ${this.totalRequests}`);
    console.log(`Successful Requests: ${this.successfulRequests}`);
    console.log(`Failed Requests: ${this.failedRequests}`);
    console.log(`Success Rate: ${((this.successfulRequests / this.totalRequests) * 100).toFixed(2)}%`);
    
    if (this.responseTimes.length > 0) {
      const sortedTimes = this.responseTimes.sort((a, b) => a - b);
      const avg = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
      const min = sortedTimes[0];
      const max = sortedTimes[sortedTimes.length - 1];
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      
      console.log('\n=== Response Times (ms) ===');
      console.log(`Average: ${avg.toFixed(2)}`);
      console.log(`Min: ${min.toFixed(2)}`);
      console.log(`Max: ${max.toFixed(2)}`);
      console.log(`50th percentile: ${p50.toFixed(2)}`);
      console.log(`95th percentile: ${p95.toFixed(2)}`);
      console.log(`99th percentile: ${p99.toFixed(2)}`);
    }
    
    // Requests per second
    const rps = this.totalRequests / this.config.duration;
    console.log(`\nRequests per second: ${rps.toFixed(2)}`);
    
    // Error analysis
    if (this.failedRequests > 0) {
      console.log('\n=== Error Analysis ===');
      const errorsByStatus = {};
      this.results.forEach(result => {
        if (result.statusCode >= 400) {
          errorsByStatus[result.statusCode] = (errorsByStatus[result.statusCode] || 0) + 1;
        }
      });
      
      Object.entries(errorsByStatus).forEach(([status, count]) => {
        console.log(`Status ${status}: ${count} errors`);
      });
    }
  }

  // Export results to JSON
  exportResults(filename = 'load-test-results.json') {
    const summary = {
      config: this.config,
      summary: {
        totalRequests: this.totalRequests,
        successfulRequests: this.successfulRequests,
        failedRequests: this.failedRequests,
        successRate: (this.successfulRequests / this.totalRequests) * 100,
        averageResponseTime: this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length,
        requestsPerSecond: this.totalRequests / this.config.duration
      },
      results: this.results
    };
    
    require('fs').writeFileSync(filename, JSON.stringify(summary, null, 2));
    console.log(`Results exported to ${filename}`);
  }
}

// Test scenarios for the application
const scenarios = [
  {
    name: 'Homepage',
    method: 'GET',
    url: '/',
    thinkTime: 2000
  },
  {
    name: 'Dashboard',
    method: 'GET',
    url: '/dashboard',
    thinkTime: 3000
  },
  {
    name: 'Products API',
    method: 'GET',
    url: '/api/products',
    headers: {
      'Authorization': 'Bearer test-token'
    },
    thinkTime: 1000
  },
  {
    name: 'Customers API',
    method: 'GET',
    url: '/api/customers',
    headers: {
      'Authorization': 'Bearer test-token'
    },
    thinkTime: 1000
  },
  {
    name: 'Shipments API',
    method: 'GET',
    url: '/api/shipments',
    headers: {
      'Authorization': 'Bearer test-token'
    },
    thinkTime: 1500
  },
  {
    name: 'Health Check',
    method: 'GET',
    url: '/api/health',
    thinkTime: 500
  }
];

// Stress test scenarios
const stressScenarios = [
  {
    name: 'Create Product',
    method: 'POST',
    url: '/api/products',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: {
      name: 'Load Test Product',
      category: 'Test Category',
      price: 100,
      description: 'Created during load test',
      initialStock: 10,
      minStock: 5
    },
    thinkTime: 2000
  },
  {
    name: 'Update Product',
    method: 'PUT',
    url: '/api/products/1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: {
      name: 'Updated Load Test Product',
      price: 150
    },
    thinkTime: 1500
  }
];

// Run different types of tests
async function runTests() {
  const testType = process.argv[2] || 'normal';
  
  switch (testType) {
    case 'light':
      console.log('Running light load test...');
      const lightTester = new LoadTester({
        concurrent: 5,
        duration: 30,
        rampUp: 5
      });
      await lightTester.runTest(scenarios.slice(0, 3));
      lightTester.exportResults('light-test-results.json');
      break;
      
    case 'normal':
      console.log('Running normal load test...');
      const normalTester = new LoadTester({
        concurrent: 10,
        duration: 60,
        rampUp: 10
      });
      await normalTester.runTest(scenarios);
      normalTester.exportResults('normal-test-results.json');
      break;
      
    case 'stress':
      console.log('Running stress test...');
      const stressTester = new LoadTester({
        concurrent: 50,
        duration: 120,
        rampUp: 20
      });
      await stressTester.runTest([...scenarios, ...stressScenarios]);
      stressTester.exportResults('stress-test-results.json');
      break;
      
    case 'spike':
      console.log('Running spike test...');
      const spikeTester = new LoadTester({
        concurrent: 100,
        duration: 60,
        rampUp: 5 // Quick ramp up for spike test
      });
      await spikeTester.runTest(scenarios);
      spikeTester.exportResults('spike-test-results.json');
      break;
      
    default:
      console.log('Usage: node load-test.js [light|normal|stress|spike]');
      process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { LoadTester, scenarios, stressScenarios };