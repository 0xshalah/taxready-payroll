/**
 * Script to update a user's password via Supabase Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY env variable.
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/reset-password.mjs shalahuddin@taxready.app TaxReady2026!
 */

const SUPABASE_URL = 'https://ojroxmfpohbctuakrany.supabase.co';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const newPassword = process.argv[3];

if (!serviceRoleKey) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Find it at: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}
if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-password.mjs <email> <new-password>');
  process.exit(1);
}

async function main() {
  // Step 1: Find user by email
  console.log(`Looking up user: ${email}...`);
  
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
  });

  if (!listRes.ok) {
    console.error('Failed to list users:', listRes.status, await listRes.text());
    process.exit(1);
  }

  const { users } = await listRes.json();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`User with email "${email}" not found in Supabase Auth.`);
    console.log('\nAvailable users:');
    users.forEach(u => console.log(`  - ${u.email} (id: ${u.id})`));
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (id: ${user.id})`);

  // Step 2: Update password
  console.log('Updating password...');
  
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!updateRes.ok) {
    console.error('Failed to update password:', updateRes.status, await updateRes.text());
    process.exit(1);
  }

  console.log(`✅ Password updated successfully for ${email}`);
}

main().catch(console.error);
