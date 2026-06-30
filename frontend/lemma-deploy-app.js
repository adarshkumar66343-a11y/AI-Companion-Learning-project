#!/usr/bin/env node
/**
 * lemma-deploy-app.js
 *
 * Deploys Brainzy frontend to Lemma.work via the Apps API:
 *   POST /pods/{pod_id}/apps           → create app
 *   POST /pods/{pod_id}/apps/{name}/bundle  → upload dist zip
 *
 * Usage:
 *   $env:LEMMA_TOKEN = "your-token"
 *   $env:LEMMA_POD_ID = "your-pod-id"
 *   node lemma-deploy-app.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────

const POD_ID   = process.env.LEMMA_POD_ID;
const TOKEN    = process.env.LEMMA_TOKEN;
const APP_NAME = 'brainzy';
const ZIP_PATH = path.resolve(__dirname, 'brainzy-desk.zip');
const API_HOST = 'api.lemma.work';

if (!POD_ID || !TOKEN) {
  console.error('\n❌  Missing required environment variables:\n');
  if (!POD_ID) console.error('   $env:LEMMA_POD_ID = "your-pod-id"');
  if (!TOKEN)  console.error('   $env:LEMMA_TOKEN  = "your-api-token"');
  console.error('\n   Find both at: app.lemma.work → Pod Settings → Developer\n');
  process.exit(1);
}

if (!fs.existsSync(ZIP_PATH)) {
  console.error(`❌  Bundle not found at: ${ZIP_PATH}`);
  console.error('   Run: npm run build  inside the frontend folder first.');
  process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function jsonRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: API_HOST,
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          else resolve(json);
        } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function multipartUpload(urlPath, fieldName, filePath) {
  return new Promise((resolve, reject) => {
    const fileData   = fs.readFileSync(filePath);
    const fileName   = path.basename(filePath);
    const boundary   = `----LemmaBoundary${Date.now()}`;
    const CRLF       = '\r\n';

    const header =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${CRLF}` +
      `Content-Type: application/zip${CRLF}${CRLF}`;
    const footer = `${CRLF}--${boundary}--${CRLF}`;

    const headerBuf = Buffer.from(header);
    const footerBuf = Buffer.from(footer);
    const body      = Buffer.concat([headerBuf, fileData, footerBuf]);

    const options = {
      hostname: API_HOST,
      path: urlPath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          else resolve(json);
        } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function deploy() {
  const zipSizeMB = (fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n🚀  Deploying Brainzy to Lemma pod: ${POD_ID}`);
  console.log(`    Bundle: ${ZIP_PATH} (${zipSizeMB} MB)\n`);

  // ── Step 1: Create the app (idempotent — update if exists) ──────────────────
  let app;
  try {
    console.log('📦  Step 1/2 — Creating app record...');
    app = await jsonRequest('POST', `/pods/${POD_ID}/apps`, {
      name: APP_NAME,
      description: 'Brainzy — AI-powered academic learning companion built with Lemma',
      visibility: 'POD',
      public_slug: 'brainzy',
    });
    console.log(`   ✓  App created: ${app.name} (id: ${app.id})`);
  } catch (e) {
    if (e.message.includes('409') || e.message.includes('already exists') || e.message.includes('conflict')) {
      console.log(`   ℹ  App already exists — will update bundle.`);
      app = { name: APP_NAME };
    } else {
      throw e;
    }
  }

  // ── Step 2: Upload the bundle ───────────────────────────────────────────────
  console.log(`\n⬆️   Step 2/2 — Uploading bundle...`);
  const result = await multipartUpload(
    `/pods/${POD_ID}/apps/${APP_NAME}/bundle`,
    'dist_archive',
    ZIP_PATH
  );

  console.log(`   ✓  Bundle uploaded!`);

  const appUrl = result?.app?.url ?? `https://app.lemma.work/pods/${POD_ID}/apps/${APP_NAME}`;
  console.log(`\n✅  Brainzy is live!`);
  console.log(`    🔗  ${appUrl}\n`);
}

deploy().catch(e => {
  console.error(`\n❌  Deployment failed: ${e.message}\n`);
  process.exit(1);
});
