import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface ClerkUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: Array<{ email_address: string }>;
}

interface SignInTokenResponse {
  id: string;
  token: string;
  url?: string;
  user_id: string;
}

/**
 * Parses simple KEY=VALUE or KEY="VALUE" format from .env files without external dependencies.
 */
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

/**
 * Loads environment variables from standard local env files.
 */
function loadEnvironment() {
  loadEnvFile(path.resolve('.env.local'));
  loadEnvFile(path.resolve('.env'));
}

/**
 * Provisions a test user in Clerk, generates an instant sign-in ticket URL,
 * and optionally captures an authenticated Playwright storageState file.
 */
export async function setupTestUser(options: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  saveSession?: boolean;
} = {}) {
  loadEnvironment();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY is not defined in your environment or .env.local.');
    console.error('   Please run `pnpm dlx clerk whoami` or add CLERK_SECRET_KEY to .env.local.');
    process.exit(1);
  }

  let projectName = 'app';
  try {
    const pkgPath = path.resolve('package.json');
    if (existsSync(pkgPath)) {
      projectName = JSON.parse(readFileSync(pkgPath, 'utf-8')).name || 'app';
    }
  } catch {}

  const defaultUrl = process.env.PORTLESS_URL ||
    (process.env.LOCAL_DOMAIN ? `https://${process.env.LOCAL_DOMAIN}` : `https://${projectName}.localhost`);

  const {
    email = 'test-agent@example.com',
    password = 'TestPassword123!',
    firstName = 'Test',
    lastName = 'Agent',
    saveSession = false,
  } = options;

  const clerkHeaders = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };

  console.log(`🔍 Checking if test user '${email}' exists in Clerk...`);

  let userId: string | null = null;

  // 1. Check if user already exists
  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers: clerkHeaders }
    );
    if (searchRes.ok) {
      const users = (await searchRes.json()) as ClerkUser[];
      if (users.length > 0 && users[0]?.id) {
        userId = users[0].id;
        console.log(`   Found existing test user: ${userId}`);
      }
    }
  } catch (err) {
    console.warn(`   Notice: Could not search users: ${String(err)}`);
  }

  // 2. Create user if not found
  if (!userId) {
    console.log(`✨ Creating new test user '${email}'...`);
    const createRes = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: clerkHeaders,
      body: JSON.stringify({
        email_address: [email],
        first_name: firstName,
        last_name: lastName,
        password,
        skip_password_checks: true,
        skip_password_requirement: true,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`❌ Failed to create test user: ${createRes.status} ${errText}`);
      process.exit(1);
    }

    const newUser = (await createRes.json()) as ClerkUser;
    userId = newUser.id;
    console.log(`   Created test user: ${userId}`);
  }

  // 3. Create single-use Sign-in Ticket Token
  console.log(`🔑 Generating single-use sign-in ticket token for ${userId}...`);
  const tokenRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: clerkHeaders,
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 86400, // Valid for 24 hours
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error(`❌ Failed to create sign-in token: ${tokenRes.status} ${errText}`);
    process.exit(1);
  }

  const tokenData = (await tokenRes.json()) as SignInTokenResponse;
  const ticketToken = tokenData.token;

  // Construct local sign-in ticket URL
  const signInUrl = `${defaultUrl}/sign-in?__clerk_ticket=${ticketToken}`;

  console.log('\n============================================================');
  console.log('✅ Test User Ready!');
  console.log(`   User ID : ${userId}`);
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log('------------------------------------------------------------');
  console.log('🔗 Instant 1-Click Sign-In URL (Ticket):');
  console.log(`   ${signInUrl}`);
  console.log('------------------------------------------------------------');
  console.log('👉 For Playwright MCP manual testing:');
  console.log(`   browser_navigate({ "url": "${signInUrl}" })`);
  console.log('============================================================\n');

  // 4. Optionally capture storageState using Playwright
  if (saveSession) {
    try {
      console.log('🎭 Launching headless browser to capture authenticated session...');
      const { chromium } = await import('@playwright/test');
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();

      await page.goto(signInUrl, { waitUntil: 'networkidle' });
      // Wait briefly for Clerk to exchange ticket and set session cookies
      await page.waitForTimeout(2000);

      const stateDir = path.resolve('playwright/.clerk');
      if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
      const statePath = path.join(stateDir, 'user.json');

      await context.storageState({ path: statePath });
      await browser.close();

      console.log(`💾 Authenticated session saved to: ${statePath}`);
      console.log('   Use this storageState in automated tests:');
      console.log("   use: { storageState: 'playwright/.clerk/user.json' }\n");
    } catch (err) {
      console.warn(`⚠️  Could not automatically capture storageState via Playwright: ${String(err)}`);
      console.warn('   (Playwright may not be installed or browser binaries are missing.)');
    }
  }

  return {
    userId,
    email,
    password,
    ticketToken,
    signInUrl,
  };
}

// Direct execution via CLI: node scripts/create-test-user.ts [--save-session]
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const saveSession = args.includes('--save-session') || args.includes('-s');
  setupTestUser({ saveSession }).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
