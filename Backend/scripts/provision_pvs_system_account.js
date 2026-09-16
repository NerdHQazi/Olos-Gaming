// PvS Phase 1: idempotent provisioning of the System ("Neigel") account and treasury wallet.
// Safe to re-run: it looks up the existing account/wallet by email/user_id instead of duplicating them.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SYSTEM_EMAIL = 'olosgamingsoc@gmail.com';
const SYSTEM_FULL_NAME = 'Neigel';
const TREASURY_INITIAL_BALANCE = 50000.00;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Backend/.env');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function findExistingUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  let user = await findExistingUserByEmail(SYSTEM_EMAIL);

  if (!user) {
    const randomPassword = require('crypto').randomBytes(32).toString('hex');
    const { data, error } = await supabase.auth.admin.createUser({
      email: SYSTEM_EMAIL,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: SYSTEM_FULL_NAME, pvs_system_account: true },
    });
    if (error) throw error;
    user = data.user;
    console.log('Created System auth.users row:', user.id);
  } else {
    console.log('System auth.users row already exists:', user.id);
  }

  // Permanently block interactive login; this account is never meant to authenticate.
  const { error: banError } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: '876600h',
  });
  if (banError) throw banError;

  // Remove the public profile row auto-created by on_auth_user_created so the
  // System account cannot appear on any player-facing profile/leaderboard surface.
  const { error: profileDeleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);
  if (profileDeleteError) throw profileDeleteError;

  // Ensure the wallet row exists (created by the same trigger) and set the approved treasury balance.
  const { error: walletUpsertError } = await supabase
    .from('wallets')
    .upsert({ user_id: user.id, balance: TREASURY_INITIAL_BALANCE, locked_balance: 0 }, { onConflict: 'user_id' });
  if (walletUpsertError) throw walletUpsertError;

  console.log('Provisioned System wallet with balance:', TREASURY_INITIAL_BALANCE);
  console.log('System user id (record this for the SYSTEM_USER_ID secret):', user.id);
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
