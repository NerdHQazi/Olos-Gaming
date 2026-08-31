import { useState } from "react";
import {
  HiSquares2X2,
  HiTrophy,
  HiWallet,
  HiUser,
  HiQuestionMarkCircle,
  HiChevronLeft,
  HiChevronRight,
  HiArrowDown,
  HiArrowUp,
  HiBell,
  HiStar,
} from "react-icons/hi2";
import { IoGameController, IoFlame } from "react-icons/io5";

// All Games Catalog Data
const allGames = [
  {
    id: 1,
    title: "Snake Battle",
    players: "1.2k playing",
    rating: 4.8,
    category: "Strategy",
    image: "snake.png",
    btnColor: "bg-emerald-500 hover:bg-emerald-400 text-black",
  },
  {
    id: 2,
    title: "Block Blitz",
    players: "850 playing",
    rating: 4.6,
    category: "Puzzle",
    image: "tetris.png",
    btnColor: "bg-purple-600 hover:bg-purple-500 text-white",
  },
  {
    id: 3,
    title: "Jumping Arena",
    players: "2.1k playing",
    rating: 4.9,
    category: "Action",
    image: "jumping-jack.png",
    btnColor: "bg-purple-600 hover:bg-purple-500 text-white",
  },
  {
    id: 4,
    title: "BounceKing",
    players: "410 playing",
    rating: 4.5,
    category: "Arcade",
    image: "bounce.png",
    btnColor: "bg-orange-500 hover:bg-orange-400 text-black",
  },
];

// Continue Playing Data
const continueGames = [
  {
    title: "Snake Battle",
    progress: "75%",
    image: "snake.png",
  },
  {
    title: "Block Blitz",
    progress: "40%",
    image: "tetris.png",
  },
  {
    title: "Jumping Arena",
    progress: "25%",
    image: "jumping-jack.png",
  },
  {
    title: "BounceKing",
    progress: "10%",
    image: "bounce.png",
  },
];

export default function GameHub() {
  const [activeNav, setActiveNav] = useState("Game");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Strategy", "Puzzle", "Action", "Arcade"];

  return (
    <div className="flex min-h-screen w-full bg-[#060812] text-white font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#090c17] p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-blue-500 font-extrabold text-2xl tracking-wider">
              OLOS
            </span>
            <span className="text-[10px] font-semibold bg-purple-900/50 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase">
              BETA
            </span>
          </div>

          <nav className="space-y-2">
            {[
              { name: "Dashboard", icon: <HiSquares2X2 /> },
              { name: "Game", icon: <IoGameController /> },
              { name: "Leaderboard", icon: <HiTrophy /> },
              { name: "Tournaments", icon: <IoFlame /> },
              { name: "Wallet", icon: <HiWallet /> },
              { name: "Profile", icon: <HiUser /> },
              { name: "How it works", icon: <HiQuestionMarkCircle /> },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeNav === item.name
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400">Welcome back! 👋</span>
            <h1 className="text-2xl font-bold">Nafisa</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ready to play, stake and win?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0e1222] border border-slate-800 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Ethereum</span>
            </div>
            <div className="bg-[#0e1222] border border-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              $1,703.345
            </div>
            <button className="p-2.5 bg-[#0e1222] border border-slate-800 rounded-full text-slate-300 hover:text-white">
              <HiBell className="text-lg" />
            </button>
          </div>
        </header>

        {/* Top Balance Stats Bar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0a0e1a] border border-slate-800/80 p-5 rounded-2xl items-center">
            <div>
              <span className="text-xs text-slate-400">GVT Balance</span>
              <p className="text-lg font-bold text-white">2,480.00</p>
              <span className="text-[10px] text-slate-500">$248.00</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">Total Winnings</span>
              <p className="text-lg font-bold text-cyan-400">840.50</p>
              <span className="text-[10px] text-slate-500">$84.05</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">Games Played</span>
              <p className="text-lg font-bold text-white">32</p>
              <span className="text-[10px] text-slate-500">This Month</span>
            </div>
            <div>
              <span className="text-xs text-slate-400">Win Rate</span>
              <p className="text-lg font-bold text-emerald-400">68%</p>
              <span className="text-[10px] text-slate-500">This Month</span>
            </div>
          </div>

          <div className="bg-[#0e1326] border border-purple-500/30 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Balance</span>
              <h2 className="text-xl font-black text-white mt-0.5">
                2,480.00{" "}
                <span className="text-xs font-normal text-slate-400">GVT</span>
              </h2>
              <span className="text-[10px] text-slate-400">$248.00 USD</span>
            </div>

            <div className="flex gap-3 mt-3">
              <button className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                <HiArrowDown /> Deposit
              </button>
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                <HiArrowUp /> Withdraw
              </button>
            </div>
          </div>
        </section>

        {/* Featured Game & Live Leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0d101d] border border-slate-800 rounded-2xl p-6 relative flex items-center justify-between overflow-hidden">
            <div>
              <span className="bg-purple-900/50 border border-purple-500/40 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                Featured Game
              </span>
              <h2 className="text-3xl font-black uppercase tracking-wide mt-3">
                SNAKE BATTLE
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Classic game. On-chain stakes. Epic rewards
              </p>
              <button className="mt-6 bg-purple-600 hover:bg-purple-500 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-purple-600/30">
                Play Now
              </button>
            </div>

            {/* Featured Image */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl absolute"></div>
              <img
                src="/assets/images/snake-battle.png"
                alt="Snake Battle"
                className="w-32 h-32 object-contain z-10"
              />
            </div>

            <button className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 rounded-full text-slate-300 hover:text-white">
              <HiChevronLeft />
            </button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 rounded-full text-slate-300 hover:text-white">
              <HiChevronRight />
            </button>
          </div>

          <div className="bg-[#0a0e1a] border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm mb-3">Live Leaderboard</h3>
            <div className="space-y-2.5">
              {[
                { rank: 1, name: "GreenKing", score: "12,480" },
                { rank: 2, name: "Satoshi12", score: "8,950" },
                { rank: 3, name: "ChainLord", score: "6,700" },
                { rank: 4, name: "BlockMaster", score: "5,210" },
              ].map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/40 border border-slate-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-500">
                      #{user.rank}
                    </span>
                    <span className="font-medium text-slate-200">
                      {user.name}
                    </span>
                  </div>
                  <span className="font-bold text-amber-400">{user.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Continue Playing & Recent Match */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-sm mb-3">Continue Playing</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {continueGames.map((game) => (
                <div
                  key={game.title}
                  className="bg-[#0b0e1a] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between h-36"
                >
                  {/* Image Container replacing stickers */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-xs mb-1.5">{game.title}</h4>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: game.progress }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0e1a] border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-sm mb-3">Recent Match</h3>
            <div className="space-y-2.5">
              {[
                { game: "Snake Battle", change: "+120 GVT", status: "win" },
                { game: "Chess Arena", change: "-80 GVT", status: "loss" },
                { game: "Block Blitz", change: "+95 GVT", status: "win" },
              ].map((match, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/30 border border-slate-800/40"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{match.game}</p>
                    <span className="text-[10px] text-slate-500">2m ago</span>
                  </div>
                  <span
                    className={`font-bold ${
                      match.status === "win"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {match.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Section: All Games Catalog */}
        <section className="space-y-4 pt-4 border-t border-slate-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-lg">All Games</h3>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeCategory === cat
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* All Games Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allGames
              .filter(
                (g) =>
                  activeCategory === "All" || g.category === activeCategory,
              )
              .map((game) => (
                <div
                  key={game.id}
                  className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-purple-500/50 transition duration-200"
                >
                  {/* Game Image Banner replacing icon */}
                  <div className="h-40 bg-slate-900 overflow-hidden relative">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {game.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {game.players}
                      </p>

                      <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <HiStar key={idx} />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1">
                          {game.rating}
                        </span>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition shadow-md ${game.btnColor}`}
                    >
                      Play Now
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
