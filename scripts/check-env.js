#!/usr/bin/env node

/**
 * Quick script to check if environment variables are loading correctly
 */

console.log('🔍 Checking environment variables...\n');

const requiredVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY', 
  'AWS_S3_BUCKET_NAME',
  'AWS_REGION',
  'NEXT_PUBLIC_MEDIA_BASE_URL'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  
  if (isSet) {
    if (varName.includes('SECRET')) {
      console.log(`✅ ${varName}: SET (hidden for security)`);
    } else if (varName.includes('KEY_ID')) {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n');

if (allPresent) {
  console.log('🎉 All required environment variables are set!');
  console.log('💡 If uploads still fail, check that your AWS credentials are valid.');
} else {
  console.log('⚠️  Some environment variables are missing!');
  console.log('\nAdd them to your .env.local file:');
  console.log('---');
  console.log('AWS_REGION=us-east-2');
  console.log('AWS_ACCESS_KEY_ID=your_access_key_id');
  console.log('AWS_SECRET_ACCESS_KEY=your_secret_access_key');
  console.log('AWS_S3_BUCKET_NAME=letters-for-lena-media');
  console.log('NEXT_PUBLIC_MEDIA_BASE_URL=https://letters-for-lena-media.s3.us-east-2.amazonaws.com');
  console.log('---');
  console.log('\n💡 Then restart your dev server: npm run dev');
}

process.exit(allPresent ? 0 : 1);

