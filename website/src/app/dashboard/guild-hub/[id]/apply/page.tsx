import { notFound } from 'next/navigation';
import { getGuildById, mockApplicantStats } from '../../guildHub.mock';
import ApplyForGuildPage from './apply';

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guild = getGuildById(id);

  if (!guild) return notFound();

  return <ApplyForGuildPage guild={guild} applicantStats={mockApplicantStats} />;
}