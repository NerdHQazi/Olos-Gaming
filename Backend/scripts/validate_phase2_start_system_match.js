// PvS Phase 2 scripted validation: calls start_system_match as a real authenticated
// human (disposable QA account) and prints the RPC result. Wallet/match/queue
// evidence and cleanup are captured separately via `supabase db query --linked`
// because service_role has no direct table grants on wallets/matches/match_queue.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.qa.local' });

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const qaEmail = process.env.QA_PLAYER_C_EMAIL;
const qaPassword = process.env.QA_PLAYER_C_PASSWORD;
if (!url || !anonKey || !qaEmail || !qaPassword) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_ANON_KEY/QA_PLAYER_C_EMAIL/QA_PLAYER_C_PASSWORD');
}

async function main() {
  const gameType = process.argv[2] || 'chess';
  const stake = Number(process.argv[3] || 10);

  const authClient = createClient(url, anonKey);
  const { data: signIn, error: signInError } = await authClient.auth.signInWithPassword({ email: qaEmail, password: qaPassword });
  if (signInError) throw signInError;

  const { data: rpcResult, error: rpcError } = await authClient.rpc('start_system_match', {
    p_user_id: signIn.user.id,
    p_game_type: gameType,
    p_stake_amount: stake,
  });
  if (rpcError) throw rpcError;

  console.log(JSON.stringify({ human_id: signIn.user.id, rpc_result: rpcResult }, null, 2));
  await authClient.auth.signOut();
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
