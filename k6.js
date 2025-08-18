import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';


const transactionTrend = new Trend('transaction_duration');
const unexpectedErrorCounter = new Counter('unexpected_errors');
const validationCounter = new Counter('validation_tests');

export const options = {
  scenarios: {
    normal_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      tags: { test_type: 'normal_load' },
    },
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'spike_test' },
    },
    validation_test: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 100,
      tags: { test_type: 'validation_test' },
    },
    high_tps_test: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      tags: { test_type: 'high_tps' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.20'], 
    transaction_duration: ['p(95)<800'],
    unexpected_errors: ['count<50'], 
    validation_tests: ['count>50'],
    checks: ['rate>0.90'], 
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3333/api';

export default function () {
  const scenario = Math.random();
  const testType = __ENV.test_type || 'mixed';
  
 
  if (testType === 'validation_test' || scenario < 0.15) {
   
    const validationScenario = Math.random();
    if (validationScenario < 0.4) {
      testInvalidAmount();
    } else if (validationScenario < 0.8) {
      testInvalidType();
    } else {
      testMissingFields();
    }
    validationCounter.add(1);
  } else {
   
    testValidTransaction();
  }
}

function testValidTransaction() {
  const transaction = {
    type: Math.random() > 0.5 ? 'PIX_IN' : 'PIX_OUT',
    amount: Math.floor(Math.random() * 100000) + 100,
  };

  const response = http.post(
    `${BASE_URL}/transaction`,
    JSON.stringify(transaction),
    { 
      headers: { 'Content-Type': 'application/json' }, 
      timeout: '10s',
      tags: { scenario: 'valid_transaction' }
    }
  );

  const checkResult = check(response, {
    'valid transaction status': (r) => r.status === 201,
    'has transactionId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.transactionId && body.transactionId.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 1s': (r) => r.timings.duration < 1000,
    'content-type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  transactionTrend.add(response.timings.duration);
  if (response.status >= 400) {
    unexpectedErrorCounter.add(1);
  }
}

function testInvalidAmount() {
  const invalidAmounts = [0, -100, -1, null, undefined, 'invalid', '', 1.5, 10.99];
  const amount = invalidAmounts[Math.floor(Math.random() * invalidAmounts.length)];
  
  const transaction = {
    type: 'PIX_IN',
    amount: amount,
  };

  const response = http.post(
    `${BASE_URL}/transaction`,
    JSON.stringify(transaction),
    { 
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'invalid_amount' }
    }
  );

  check(response, {
    'invalid amount rejected': (r) => r.status === 400,
    'error message present': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error && (body.error.includes('Amount') || body.error.includes('greater than 0'));
      } catch {
        return false;
      }
    },
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

}

function testInvalidType() {
  const invalidTypes = [null, undefined, 'INVALID', 'PIX', '', 'pix_in', 123];
  const type = invalidTypes[Math.floor(Math.random() * invalidTypes.length)];
  
  const transaction = {
    type: type,
    amount: 10000,
  };

  const response = http.post(
    `${BASE_URL}/transaction`,
    JSON.stringify(transaction),
    { 
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'invalid_type' }
    }
  );

  check(response, {
    'invalid type rejected': (r) => r.status === 400,
    'error message present': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error && (body.error.includes('type') || body.error.includes('Invalid'));
      } catch {
        return false;
      }
    },
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

}

function testMissingFields() {
  const scenarios = [
    {},
    { type: 'PIX_IN' }, 
    { amount: 10000 },
    null, 
    'invalid json',
  ];
  
  const payload = scenarios[Math.floor(Math.random() * scenarios.length)];

  const response = http.post(
    `${BASE_URL}/transaction`,
    typeof payload === 'string' ? payload : JSON.stringify(payload),
    { 
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'missing_fields' }
    }
  );

  check(response, {
    'missing fields rejected': (r) => r.status === 400,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });


}
