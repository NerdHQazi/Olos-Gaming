// PvS Phase 5 scripted full-game validation: submits the terminal move through the
// real submit_game_move Edge Function, then the result receipt through submit_match_result.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.qa.local' });

const MATCH_ID = process.argv[2];
if (!MATCH_ID) throw new Error('Usage: node validate_phase5_full_game.js <match_id> [fromRow fromCol toRow toCol expectedMoveNumber]');
const FROM = process.argv[3] ? [Number(process.argv[3]), Number(process.argv[4])] : [1, 2];
const TO = process.argv[5] ? [Number(process.argv[5]), Number(process.argv[6])] : [1, 1];
const EXPECTED_MOVE_NUMBER = process.argv[7] ? Number(process.argv[7]) : 0;

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const qaEmail = process.env.QA_PLAYER_C_EMAIL;
const qaPassword = process.env.QA_PLAYER_C_PASSWORD;
if (!url || !anonKey || !qaEmail || !qaPassword) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_ANON_KEY/QA_PLAYER_C_EMAIL/QA_PLAYER_C_PASSWORD');
}

async function main() {
  const authClient = createClient(url, anonKey);
  const { data: signIn, error: signInError } = await authClient.auth.signInWithPassword({ email: qaEmail, password: qaPassword });
  if (signInError) throw signInError;

  const moveResponse = await fetch(`${url}/functions/v1/submit_game_move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${signIn.session.access_token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ match_id: MATCH_ID, from: FROM, to: TO, expected_move_number: EXPECTED_MOVE_NUMBER }),
  });
  const moveResult = await moveResponse.json();

  let receiptResult = null;
  if (moveResult.terminal_reason) {
    const { data, error } = await authClient.rpc('submit_match_result', {
      p_match_id: MATCH_ID,
      p_player_id: signIn.user.id,
      p_result: { terminal_position_hash: moveResult.terminal_position_hash, terminal_move_number: moveResult.move_number },
    });
    if (error) throw error;
    receiptResult = data;

    const { data: retryData, error: retryError } = await authClient.rpc('submit_match_result', {
      p_match_id: MATCH_ID,
      p_player_id: signIn.user.id,
      p_result: { terminal_position_hash: moveResult.terminal_position_hash, terminal_move_number: moveResult.move_number },
    });
    if (retryError) throw retryError;
    console.log(JSON.stringify({ moveResult, receiptResult, retryReceiptResult: retryData }, null, 2));
  } else {
    console.log(JSON.stringify({ moveResult }, null, 2));
  }

  await authClient.auth.signOut();
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
