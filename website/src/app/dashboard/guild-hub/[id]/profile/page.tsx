import { notFound } from 'next/navigation';
import {
  getGuildById,
  getMembersByGuildId,
  getChatPreviewByGuildId,
  getUpcomingBattlesByGuildId,
  getActiveWarByGuildId,
  getGuildWarBattlesByGuildId,
  getBattleHistoryByGuildId,
  getIncomeBreakdownByGuildId,
  getTreasuryTransactionsByGuildId,
} from '../../guildHub.mock';

import GuildProfilePage from './GuildProfilePage';

export default async function GuildProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guild = getGuildById(id);

  if (!guild) return notFound();

  return (
    <GuildProfilePage
      guild={guild}
      members={getMembersByGuildId(id)}
      chatPreview={getChatPreviewByGuildId(id)}
      upcomingBattles={getUpcomingBattlesByGuildId(id)}
      activeWar={getActiveWarByGuildId(id)}
      guildWarBattles={getGuildWarBattlesByGuildId(id)}
      battleHistory={getBattleHistoryByGuildId(id)}
      incomeBreakdown={getIncomeBreakdownByGuildId(id)}
      treasuryTransactions={getTreasuryTransactionsByGuildId(id)}
    />
  );
}