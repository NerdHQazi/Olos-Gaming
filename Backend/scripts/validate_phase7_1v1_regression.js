// Phase 7 regression: confirm human-vs-human matchmaking/moves/payout are unaffected by PvS work.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.qa.local' });

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

async function signIn(email, password) {
  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, user: data.user, session: data.session };
}

async function main() {
  const c = await signIn(process.env.QA_PLAYER_C_EMAIL, process.env.QA_PLAYER_C_PASSWORD);
  const d = await signIn(process.env.QA_PLAYER_D_EMAIL, process.env.QA_PLAYER_D_PASSWORD);

  const { data: cQueue, error: cQueueError } = await c.client.rpc('find_opponent', { p_user_id: c.user.id, p_game_type: 'chess', p_stake_amount: 10 });
  if (cQueueError) throw cQueueError;
  const { data: dMatch, error: dMatchError } = await d.client.rpc('find_opponent', { p_user_id: d.user.id, p_game_type: 'chess', p_stake_amount: 10 });
  if (dMatchError) throw dMatchError;

  const matchId = dMatch.match_id;
  if (!matchId) {
    console.log(JSON.stringify({ error: 'No match formed', cQueue, dMatch }, null, 2));
    return;
  }

  const { data: matchRow } = await c.client.from('matches').select('id, player1_id, player2_id, status, current_turn, game_move_number').eq('id', matchId).single();
  const mover = matchRow.current_turn === c.user.id ? c : d;

  const moveResp = await fetch(`${url}/functions/v1/submit_game_move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mover.session.access_token}`, apikey: anonKey },
    body: JSON.stringify({ match_id: matchId, from: [6, 4], to: [4, 4], expected_move_number: 0 }),
  });
  const moveResult = await moveResp.json();

  console.log(JSON.stringify({ matchId, matchRow, mover: mover.user.id, moveResult }, null, 2));

  await c.client.auth.signOut();
  await d.client.auth.signOut();
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
