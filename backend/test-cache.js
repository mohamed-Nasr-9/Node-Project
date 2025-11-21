#!/usr/bin/env node

// Simple Cache Test
import { connectRedis, cacheUtils } from './config/redis.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testCache() {
  console.log('🧪 Testing Cache...\n');
  
  try {
    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected');
    
    // Clear existing cache
    await cacheUtils.delPattern('cache:*');
    console.log('✅ Cache cleared\n');
    
    // Test endpoint
    const endpoint = '/api/authors';
    
    // First request (cache miss)
    console.log('📡 First request (should be cache miss)...');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}${endpoint}`);
    const duration1 = Date.now() - start1;
    console.log(`   Duration: ${duration1}ms`);
    
    // Second request (cache hit)
    console.log('\n📡 Second request (should be cache hit)...');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}${endpoint}`);
    const duration2 = Date.now() - start2;
    console.log(`   Duration: ${duration2}ms`);
    
    // Performance improvement
    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
    console.log(`\n📊 Performance: ${improvement}% faster`);
    
    // Check cache in Redis
    const cacheKey = `cache:${endpoint}`;
    const exists = await cacheUtils.exists(cacheKey);
    const ttl = await cacheUtils.ttl(cacheKey);
    
    console.log(`\n🔍 Cache status:`);
    console.log(`   Key: ${cacheKey}`);
    console.log(`   Exists: ${exists}`);
    console.log(`   TTL: ${ttl} seconds`);
    
    if (exists && improvement > 0) {
      console.log('\n🎉 Cache is working perfectly!');
    } else {
      console.log('\n❌ Cache test failed');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testCache();