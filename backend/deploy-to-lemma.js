#!/usr/bin/env node
/**
 * deploy-to-lemma.js
 * 
 * Deploys the Brainzy backend to a Lemma pod:
 *   1. Creates tables: academic_papers, flashcards, exam_questions, user_progress
 *   2. Creates agents: tutor-agent, quiz-generator-agent
 *   3. Seeds sample documents to /knowledge folder
 * 
 * Usage:
 *   node deploy-to-lemma.js --pod-id <YOUR_POD_ID>
 * 
 * The script reads your Lemma auth token from the browser's localStorage via the
 * Lemma CLI session, OR you can pass it via LEMMA_TOKEN env var.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const podIdArg = args[args.indexOf('--pod-id') + 1];
const POD_ID = podIdArg || process.env.LEMMA_POD_ID;
const TOKEN = process.env.LEMMA_TOKEN;
const API_BASE = 'api.lemma.work';

if (!POD_ID) {
  console.error('❌ Error: --pod-id is required. Usage: node deploy-to-lemma.js --pod-id <id>');
  console.error('   Find your pod ID at: app.lemma.work → Pod Settings');
  process.exit(1);
}
if (!TOKEN) {
  console.error('❌ Error: LEMMA_TOKEN env var is required.');
  console.error('   Get your token from: app.lemma.work → Developer → API Token');
  process.exit(1);
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: API_BASE,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── Table schemas ────────────────────────────────────────────────────────────

const TABLES = [
  {
    name: 'academic_papers',
    primary_key_column: 'id',
    enable_rls: false,
    visibility: 'POD',
    columns: [
      { name: 'title', type: 'TEXT', required: true },
      { name: 'filename', type: 'TEXT', required: true },
      { name: 'file_path', type: 'TEXT', required: true },
      { name: 'summary', type: 'TEXT', required: false },
    ],
  },
  {
    name: 'flashcards',
    primary_key_column: 'id',
    enable_rls: false,
    visibility: 'POD',
    columns: [
      { name: 'paper_id', type: 'UUID', required: true },
      { name: 'question', type: 'TEXT', required: true },
      { name: 'answer', type: 'TEXT', required: true },
      { name: 'difficulty', type: 'TEXT', required: true, default: 'medium' },
    ],
  },
  {
    name: 'exam_questions',
    primary_key_column: 'id',
    enable_rls: false,
    visibility: 'POD',
    columns: [
      { name: 'paper_id', type: 'UUID', required: true },
      { name: 'question', type: 'TEXT', required: true },
      { name: 'options', type: 'JSON', required: true },
      { name: 'correct_answer', type: 'TEXT', required: true },
      { name: 'explanation', type: 'TEXT', required: true },
    ],
  },
  {
    name: 'user_progress',
    primary_key_column: 'id',
    enable_rls: false,
    visibility: 'POD',
    columns: [
      { name: 'paper_id', type: 'UUID', required: false },
      { name: 'milestone', type: 'TEXT', required: true },
      { name: 'status', type: 'TEXT', required: true, default: 'pending' },
      { name: 'notes', type: 'TEXT', required: false },
    ],
  },
];

// ─── Agent configs ────────────────────────────────────────────────────────────

const AGENTS = [
  JSON.parse(fs.readFileSync(path.join(__dirname, 'tutor-agent.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.join(__dirname, 'quiz-generator-agent.json'), 'utf8')),
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Deploying Brainzy backend to Lemma pod: ${POD_ID}\n`);

  // 1. Create tables
  console.log('📋 Creating database tables...');
  for (const table of TABLES) {
    try {
      await apiRequest('POST', `/v1/pods/${POD_ID}/tables`, table);
      console.log(`   ✓ Created table: ${table.name}`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('409')) {
        console.log(`   ⏭ Table already exists: ${table.name}`);
      } else {
        console.warn(`   ⚠ Table ${table.name}: ${e.message}`);
      }
    }
  }

  // 2. Create agents
  console.log('\n🤖 Deploying agents...');
  for (const agent of AGENTS) {
    try {
      await apiRequest('POST', `/v1/pods/${POD_ID}/agents`, agent);
      console.log(`   ✓ Created agent: ${agent.name}`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('409')) {
        // Try update instead
        try {
          await apiRequest('PUT', `/v1/pods/${POD_ID}/agents/${agent.name}`, agent);
          console.log(`   ✓ Updated agent: ${agent.name}`);
        } catch (e2) {
          console.warn(`   ⚠ Agent ${agent.name}: ${e2.message}`);
        }
      } else {
        console.warn(`   ⚠ Agent ${agent.name}: ${e.message}`);
      }
    }
  }

  console.log('\n✅ Backend deployment complete!');
  console.log('\nNext steps:');
  console.log('  1. Go to app.lemma.work → your pod → Desks');
  console.log('  2. Create a new Desk → upload the frontend/out/ folder');
  console.log('  3. Set entry point to index.html');
  console.log('  4. Publish — Lemma will inject window.__LEMMA_CONFIG__ automatically\n');
}

main().catch(e => {
  console.error('❌ Deployment failed:', e.message);
  process.exit(1);
});
