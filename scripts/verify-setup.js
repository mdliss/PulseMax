#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Run this to check if all required env vars are configured
 */

const requiredVars = {
  // Firebase Client (Public)
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'Firebase API Key',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'Firebase Auth Domain',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'Firebase Project ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': 'Firebase Messaging Sender ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'Firebase App ID',

  // Firebase Admin (Server)
  'FIREBASE_SERVICE_ACCOUNT_KEY': 'Firebase Service Account JSON',
};

const optionalVars = {
  // Redis (for caching and queues)
  'UPSTASH_REDIS_REST_URL': 'Upstash Redis REST URL',
  'UPSTASH_REDIS_REST_TOKEN': 'Upstash Redis REST Token',
  'REDIS_URL': 'Redis URL for BullMQ',

  // Rails API (optional)
  'RAILS_API_URL': 'Rails API URL',
  'RAILS_API_KEY': 'Rails API Key',
};

console.log('\n🔍 Checking Environment Variables...\n');

let allRequired = true;
let hasOptional = false;

// Check required vars
console.log('✅ REQUIRED VARIABLES:');
for (const [key, description] of Object.entries(requiredVars)) {
  const exists = !!process.env[key];
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${key}: ${exists ? 'Set' : 'MISSING'}`);

  if (!exists) {
    allRequired = false;
  }

  // Validate Firebase Service Account
  if (key === 'FIREBASE_SERVICE_ACCOUNT_KEY' && exists) {
    try {
      const parsed = JSON.parse(process.env[key]);
      if (parsed.type === 'service_account' && parsed.project_id) {
        console.log(`   └─ Valid JSON for project: ${parsed.project_id}`);
      } else {
        console.log(`   └─ ⚠️  JSON parsed but doesn't look like a service account`);
      }
    } catch (e) {
      console.log(`   └─ ❌ Invalid JSON format`);
      allRequired = false;
    }
  }
}

// Check optional vars
console.log('\n📦 OPTIONAL VARIABLES:');
for (const [key, description] of Object.entries(optionalVars)) {
  const exists = !!process.env[key];
  const status = exists ? '✅' : '⚠️ ';
  console.log(`${status} ${key}: ${exists ? 'Set' : 'Not set'}`);

  if (exists) {
    hasOptional = true;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (allRequired) {
  console.log('✅ All required variables are configured!');
  console.log('   You can run: npm run dev');
} else {
  console.log('❌ Some required variables are missing.');
  console.log('   See .env.example for reference.');
}

if (!hasOptional) {
  console.log('\n⚠️  No optional variables set.');
  console.log('   - Redis vars needed for caching and background jobs');
  console.log('   - Rails API vars needed for data ingestion');
}

console.log('='.repeat(60) + '\n');

process.exit(allRequired ? 0 : 1);
