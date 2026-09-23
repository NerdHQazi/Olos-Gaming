import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const COLUMNS: { title: string; links: string[] }[] = [
  { title: 'Games', links: ['Snake Xenzia', 'Chess Arena', 'Tetris Blitz', 'Bounce King', 'Jumping Jack', 'Checkers Rush'] },
  { title: 'Platform', links: ['Leaderboard', 'Match History', 'GVT Token', 'Smart Contract', 'Security', 'API'] },
  { title: 'Company', links: ['Documentation', 'How It Work', 'FAQ', 'Support', 'Terms', 'Privacy'] },
];

function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.2-9.3L1.5 2h6.9l4.7 6.2L18.9 2z" /></svg>;
}
function DiscordIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 5.5a17 17 0 00-4.3-1.3l-.2.4a12 12 0 013.8 1.4A15.6 15.6 0 0012 4a15.6 15.6 0 00-7.3 1.9 12 12 0 013.8-1.4l-.2-.4A17 17 0 004 5.5C2 9 1.4 12.4 1.7 15.7A16 16 0 006.6 18l.9-1.3a10 10 0 01-1.6-.8l.4-.3a11.4 11.4 0 009.4 0l.4.3a10 10 0 01-1.6.8l.9 1.3a16 16 0 004.9-2.3c.4-3.8-.5-7.2-2-10.2zM9 14c-.8 0-1.5-.8-1.5-1.7S8.2 10.5 9 10.5s1.5.8 1.5 1.8S9.8 14 9 14zm6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.8 1.5-1.8 1.5.8 1.5 1.8-.7 1.7-1.5 1.7z" /></svg>;
}
function TelegramIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 3.5L2.7 11.1c-1.3.5-1.3 1.2-.2 1.6l4.9 1.5 1.9 5.8c.2.6.4.9.9.9.4 0 .6-.2.9-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.7l3-14.1c.3-1.1-.4-1.7-1.6-1.4z" /></svg>;
}

export default function AppFooter() {
  return (
    <footer className="border-t border-white/5 bg-black px-4 md:px-8 pt-12 pb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Image src="/images/olos-logo-header.png" alt="OLOS" width={110} height={34} className="h-7 w-auto" />
          <p className="text-sm text-gray-400 mt-4 leading-relaxed max-w-xs">
            Web3 skill gaming , Compete, Stake and earn -your reputation lives on-chain
          </p>
          <div className="flex items-center gap-2 mt-4">
            {[XIcon, DiscordIcon, TelegramIcon].map((Icon, i) => (
              <button key={i} type="button" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors">
                <Icon />
              </button>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-black text-white mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 mt-10 pt-6 border-t border-white/5 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} OLOS Gaming Platform. All rights reserved</p>
        <p>Powered by GVT Token · EVM Smart Contracts</p>
      </div>
    </footer>
  );
}
