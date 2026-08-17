// Phase 7 security boundary reconfirmation for a PvS match.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.qa.local' });

const MATCH_ID = process.argv[2];
if (!MATCH_ID) throw new Error('Usage: node validate_phase7_security_negatives.js <match_id>');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const qaEmail = process.env.QA_PLAYER_C_EMAIL;
const qaPassword = process.env.QA_PLAYER_C_PASSWORD;
const qaOtherEmail = process.env.QA_PLAYER_D_EMAIL;
const qaOtherPassword = process.env.QA_PLAYER_D_PASSWORD;
if (!url || !anonKey || !qaEmail || !qaPassword || !qaOtherEmail || !qaOtherPassword) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_ANON_KEY/QA_PLAYER_C_*/QA_PLAYER_D_*');
}

async function main() {
  const humanClient = createClient(url, anonKey);
  const { data: humanSignIn, error: humanSignInError } = await humanClient.auth.signInWithPassword({ email: qaEmail, password: qaPassword });
  if (humanSignInError) throw humanSignInError;

  const outsiderClient = createClient(url, anonKey);
  const { data: outsiderSignIn, error: outsiderSignInError } = await outsiderClient.auth.signInWithPassword({ email: qaOtherEmail, password: qaOtherPassword });
  if (outsiderSignInError) throw outsiderSignInError;

  const results = {};

  const directApply = await humanClient.rpc('apply_validated_game_move', {
    p_match_id: MATCH_ID, p_player_id: humanSignIn.user.id, p_expected_move_number: 0,
    p_board_state: {}, p_next_turn: humanSignIn.user.id,
  });
  results.direct_apply_validated_game_move = { data: directApply.data, error: directApply.error?.message };

  const directFinalize = await humanClient.rpc('finalize_match_outcome', {
    p_match_id: MATCH_ID, p_winner_id: humanSignIn.user.id, p_resolution_reason: 'forced',
  });
  results.direct_finalize_match_outcome = { data: directFinalize.data, error: directFinalize.error?.message };

  const staleMove = await fetch(`${url}/functions/v1/submit_game_move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${humanSignIn.session.access_token}`, apikey: anonKey },
    body: JSON.stringify({ match_id: MATCH_ID, from: [5, 0], to: [4, 1], expected_move_number: 999 }),
  });
  results.stale_move_number = await staleMove.json();

  const wrongActor = await fetch(`${url}/functions/v1/submit_game_move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${outsiderSignIn.session.access_token}`, apikey: anonKey },
    body: JSON.stringify({ match_id: MATCH_ID, from: [5, 0], to: [4, 1], expected_move_number: 0 }),
  });
  results.wrong_actor_not_in_match = await wrongActor.json();

  const forgedReceipt = await humanClient.rpc('submit_match_result', {
    p_match_id: MATCH_ID, p_player_id: humanSignIn.user.id,
    p_result: { terminal_position_hash: 'forged-hash', terminal_move_number: 1 },
  });
  results.forged_receipt = { data: forgedReceipt.data, error: forgedReceipt.error?.message };

  console.log(JSON.stringify(results, null, 2));

  await humanClient.auth.signOut();
  await outsiderClient.auth.signOut();
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
