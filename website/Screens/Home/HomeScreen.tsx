'use client';

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

import heroImage from "../../public/OLOS-land-hero.png"
import { useEffect, useState } from "react";


export default function HomeScreen() {
  const { needsUsername, completeUsername } = useAuth();
  const [ stakeAmount, setStakeAmount ] = useState<number>(0);

  return (
    <div className="min-h-screen bg-[#02040A] text-white selection:bg-olos-blue/30 overflow-x-hidden">

      <Navbar />
      <BackToTop />
      
      {/* Hero Section */}
      <section className="relative mx-auto mt-20.75 flex items-center justify-between pt-32 pb-10 pl-24 pr-12 overflow-hidden">
        {/* mt-[83px] h-[633px] px-[79px] */}
        {/* Background Image Layer */}
        {/* <div className="absolute inset-0 z-0 bg-[url('/olos-logo-3d.png')] bg-[length:contain] bg-[position:65%_center] bg-no-repeat scale-110 -translate-y-8 opacity-80" /> */}
        {/* Overlay Layer */}
        <div className="absolute inset-0 z-0 bg-[#030711]/10" />
        
        <div className="relative z-10 w-full h-full flex gap-10 items-center justify-between -translate-y-8">
          {/* max-w-[1567px] */}
          
          {/* Left Column: Text & Buttons */}
          <div className="flex flex-col gap-7 items-start text-left z-10 animate-fade-in order-2 lg:order-1 lg:max-w-110 lg:max-h-140 -mt-16">

            <div className="flex gap-2 items-center border px-3 py-2 rounded-2xl border-[#7034D7]/80">
              <div className="w-2 h-2 bg-[#00FF87] rounded-4xl"></div>
              <h3 className="text-[11px] inter-bold">SECURE CRYPTO ESPORTS PLATFORM</h3>
            </div>

            <p className="text-[62px] inter-bold leading-16">Play Skill <span className="text-[#00D3FE]">Games.</span> Stake Tokens. <span className="text-[#FFB800]">Win On Chain.</span></p>

            <p className="text-[16px] pr-12 leading-7 text-[#A4B7EB]">Compete in lightning-fast, skill-based mini-games. Stake GVT tokens and battle head-to-head. Zero randomness, pure competition, settled instantly by audited smart contracts.</p>

            <div className="flex gap-4">
              <Link
                href=""
                className="px-8 py-1 rounded-lg text-[#02040A] bg-[#00D3FE] hover:bg-[#00D3FE]/60 text-[14px] font-bold transition-all active:scale-95 inter-bold flex items-center gap-1"
              >
                <Image src='/padIcon.png' alt="pad icon" width={32} height={32} />
                {/* <span className="text-[32px]">🎮</span> */}
                <h3 className="mt-1">Start Playing</h3>
              </Link>
              <Link
                href=""
                className="px-10 py-2.5 rounded-lg text-white border border-white hover:border-0 hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 inter-extralight flex items-center gap-2"
              >
                <Image src='/play-button.svg' alt="pad icon" width={20} height={20} />
                Watch Demo
              </Link>
            </div>

          </div>
          
          {/* Right Column: Text & Buttons */}
          <div className="flex flex-col items-start text-left z-10 animate-fade-in order-2 lg:order-1 lg:min-w-150 -mt-16">
            <Image src={ heroImage } alt="Hero" width={750} height={500} />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      {/* <section className="relative z-10 pt-20 pb-24 bg-[#020617]/50">
        <div className="max-w-[1567px] mx-auto px-8 lg:px-16">
          <h2 className="text-[#00d2ff] text-[15px] font-black uppercase tracking-[0.4em] mb-20 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <Step 
              number="1"
              title="Play Free"
              description="Practice any game without signing up, no wallet needed."
            />
            <Step 
              number="2"
              title="Stake & Complete"
              description="Create an account, stake GVT tokens, and challenge real players."
            />
            <Step 
              number="3"
              title="Win Rewards"
              description="Beat your opponent and collect the pot (minus 5% platform fee)."
            />
          </div>
        </div>
      </section> */}
      <section className="relative z-10 py-12 px-24 bg-[#060A16] border border-foreground/10 font-bold flex items-center justify-between">
        <div className="flex flex-col bg-[#0B0F19] py-4 pl-5 pr-36 border border-foreground/10 rounded-2xl gap-1">
          <h3 className="text-[#6B7280] text-[11px] ">ACTIVE COMPETITORS</h3>
          <h2 className="text-[#00D3FE] text-[31px] ">15,843</h2>  
        </div>
        <div className="flex flex-col bg-[#0B0F19] py-4 pl-5 pr-36 border border-foreground/10 rounded-2xl gap-1">
          <h3 className="text-[#6B7280] text-[11px] ">TOTAL GVT STAKED</h3>
          <h2 className="text-[#FFB800] text-[31px] ">4,210,950</h2>  
        </div>
        <div className="flex flex-col bg-[#0B0F19] py-4 pl-5 pr-36 border border-foreground/10 rounded-2xl gap-1">
          <h3 className="text-[#6B7280] text-[11px] ">ON-CHAIN MATCHES</h3>
          <h2 className="text-[#7034D7] text-[31px] ">534,296</h2>  
        </div>
        <div className="flex flex-col bg-[#0B0F19] py-4 pl-5 pr-36 border border-foreground/10 rounded-2xl gap-1">
          <h3 className="text-[#6B7280] text-[11px] ">TOTAL YIELD SETTLED</h3>
          <h2 className="text-[#00FF87] text-[31px] ">$2.1M+</h2>  
        </div>
      </section>

      {/* Featured Games Section */}
      {/* <section className="py-32">
        <div className="max-w-[1567px] mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between mb-16 px-2">
            <h2 className="text-4xl md:text-[32px] font-black tracking-tight uppercase text-white font-sans">Featured Games</h2>
            <Link href="/games" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors font-bold text-sm group">
              View All
              <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                <svg className="w-3.5 h-3.5 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg>
              </span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <GameCard 
              image="/snake.png"
              title="Snake"
              description="Classic snake game. Eat food, grow longer, avoid walls!"
            />
            <GameCard 
              image="/jumping-jack.png"
              title="Jumping Jack"
              description="Jump between platforms. How high can you climb?"
            />
            <GameCard 
              image="/bounce.png"
              title="Bounce"
              description="Keep the ball bouncing. Avoid obstacles!"
            />
            <GameCard 
              image="/tetris.png"
              title="Tetris"
              description="Stack blocks, clear lines, beat your score!"
            />
          </div>
        </div>
      </section> */}
      <section className="py-28 flex flex-col gap-6 items-center inter-bold">
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-[13px] text-[#00D3FE]">FEATURED ARENAS</h4>
          <h3 className="text-[38px]">Battle On-Chain, Claim The Pot</h3>
          <p className="text-[15px] text-[#A4B7EB] inter-extralight">High-fidelity game environments engineered for absolute fairness. No luck, no algorithms. Just pure skill.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-24 gap-6 mt-6 w-full">
            <NewGameCard 
              image="/snakeGameImage.png"
              title="Hyper-Snake Protocol"
              description="Eat, grow, and trap opponents in high-speed retro battle mode. Most points wins the staked treasury."
              liveNumber={1204}
              minStake={10}
              volatility="Low"
              color="#00D3FE"
            />
            <NewGameCard 
              image="/chessGameImage.png"
              title="Quantum Chess Arena"
              description="Classic chess with blockchain permanence. Put GVT on your strategic genius in 1v1 rated matches."
              liveNumber={842}
              minStake={25}
              volatility="Medium"
              color="#7034D7"
            />
            <NewGameCard 
              image="/tetrisGameImage.png"
              title="Neon Tetris Blitz"
              description="High-octane block staging mechanics. Compete with custom multipliers to burn up the highest score."
              liveNumber={2500}
              minStake={50}
              volatility="High"
              color="#FFB800"
            />
        </div>
      </section>

      <section className="relative z-10 p-24 bg-[#060A16] inter-bold flex flex-col gap-10 items-center">
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-[13px] text-[#00D3FE]">SYSTEM BLUEPRINT</h4>
          <h3 className="text-[38px]">Four Steps to Absolute Victory</h3>
          <p className="text-[15px] text-[#A4B7EB] inter-extralight">Connecting developers, gamers, and stakeholders on a trustless execution protocol.</p>
        </div>
        <div className="flex items-center justify-between w-full gap-10">
          <div className="flex flex-col bg-[#0B0F19] py-8 px-5 border border-foreground/10 rounded-2xl  w-full gap-3 min-h-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#7034D7] text-[27px]">01</h3>
              <Image src='/pearIcon.png' alt="pear icon" width={44} height={44} />  
            </div>
            <h3 className="text-[19px] ">Connect Wallet</h3>
            <p className="text-[#A4B7EB] pr-8 inter-extralight text-[13px] ">Link MetaMask, Coinbase, or any EVM wallet. Your keys control your identity.</p>  
          </div>
          <div className="flex flex-col bg-[#0B0F19] py-8 px-5 border border-foreground/10 rounded-2xl  w-full gap-3 min-h-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#7034D7] text-[27px]">02</h3>
              <Image src='/padIcon.png' alt="pad icon" width={44} height={44} />  
            </div>
            <h3 className="text-[19px] ">Select Match</h3>
            <p className="text-[#A4B7EB] pr-8 inter-extralight text-[13px] ">Choose from 1v1 arenas, tournaments, or high-score sprints.</p>  
          </div>
          <div className="flex flex-col bg-[#0B0F19] py-8 px-5 border border-foreground/10 rounded-2xl  w-full gap-3 min-h-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#7034D7] text-[27px]">03</h3>
              <Image src='/hexaIcon.png' alt="hexacon icon" width={44} height={44} />  
            </div>
            <h3 className="text-[19px] ">Stake GVT</h3>
            <p className="text-[#A4B7EB] pr-8 inter-extralight text-[13px] ">Lock equal token values in secure escrow smart contracts.</p>  
          </div>
          <div className="flex flex-col bg-[#0B0F19] py-8 px-5 border border-foreground/10 rounded-2xl  w-full gap-3 min-h-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#7034D7] text-[27px]">04</h3>
              <Image src='/trophyIcon.png' alt="trophy icon" width={44} height={44} />  
            </div>
            <h3 className="text-[19px] ">Win instant pot</h3>
            <p className="text-[#A4B7EB] pr-8 inter-extralight text-[13px] ">Secure victory and receive instant token payouts to your address.</p>  
          </div>
          
        </div>
      </section>

      <section className="p-24 flex items-center inter-bold justify-between">
        <div className="">
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[13px] text-[#00D3FE]">ON-CHAIN STANDINGS</h4>
            <h3 className="text-[38px]">Your Rank Lives Forever</h3>
            <p className="text-[15px] text-[#A4B7EB] inter-extralight">Our database is the blockchain. Climb the global rankings, claim top spot <br /> rewards, and build a permanent Web3 gaming identity.</p>
          </div>
            <button
              className="px-6 py-5 rounded-lg text-white border border-[#20CEEE80] hover:border-0 hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 flex items-center gap-4 mt-10"
            >
              <Image src='/trophyIcon.png' alt="pad icon" width={36} height={36} />
              View Full Standings
            </button>
        </div>
        <div className="min-w-160 p-10 bg-[#0B0F19] border border-foreground/10 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
            <h3 className="text-[19px]">Global Top Competitors</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500">
              </div>
              <h3 className="text-[11px] text-[#00FF87] inter-extralight">LIVE UPDATE</h3>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-foreground/10">
            <UserRanking
              Ranking={1}
              username="CryptoKing.eth"
              userIcon="/crownIcon.png"
              userWins={234}
              userPoints={12450}
              color="#FFB800"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-foreground/10">
            <UserRanking
              Ranking={2}
              username="SnakeMstr.sol"
              userIcon="/snakeIcon.png"
              userWins={189}
              userPoints={9820}
              color="#FFB800"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-foreground/10">
            <UserRanking
              Ranking={3}
              username="ChessGod.eth"
              userIcon="/chessUpIcon.png"
              userWins={172}
              userPoints={8100}
              color="#FFB800"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-foreground/10">
            <UserRanking
              Ranking={4}
              username="Ainaf_G"
              userIcon="/starIcon.png"
              userWins={132}
              userPoints={5430}
              color="#FFB800"
            />
          </div>
        </div>
      </section>

      <section className="p-24 bg-[#060A16] flex items-center inter-bold justify-between gap-20">
        <div className="min-w-160 p-10 bg-[#0B0F19] border border-foreground/10 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Image src='/padlockIcon.png' alt="flash icon" width={22} height={22} />
            <h3 className="text-[21px]">Stake Calculator</h3>
          </div>
          <h3 className="inter-extralight text-[#A4B7EB] text-[11px]">SELECT ENTRY AMOUNT (GVT)</h3>
          <div className="flex items-center gap-2 text-[13px]">
            <button onClick={() => setStakeAmount(10)} className={`${stakeAmount === 10 ? 'bg-[#00D3FE1F] text-[#00D3FE] border-[#00D3FE] border-2' : 'bg-transparent border-foreground/10'} px-3 py-1.5 border  cursor-pointer rounded-lg`}>10</button>
            <button onClick={() => setStakeAmount(25)}  className={`${stakeAmount === 25 ? 'bg-[#00D3FE1F] text-[#00D3FE] border-[#00D3FE] border-2' : 'bg-transparent border-foreground/10'} px-3 py-1.5 border  cursor-pointer rounded-lg`}>25</button>
            <button onClick={() => setStakeAmount(50)}  className={`${stakeAmount === 50 ? 'bg-[#00D3FE1F] text-[#00D3FE] border-[#00D3FE] border-2' : 'bg-transparent border-foreground/10'} px-3 py-1.5 border cursor-pointer rounded-lg`}>50</button>
            <button onClick={() => setStakeAmount(100)}  className={`${stakeAmount === 100 ? 'bg-[#00D3FE1F] text-[#00D3FE] border-[#00D3FE] border-2' : 'bg-transparent border-foreground/10'} px-3 py-1.5 border cursor-pointer rounded-lg`}>100</button>
            <button onClick={() => setStakeAmount(250)}  className={`${stakeAmount === 250 ? 'bg-[#00D3FE1F] text-[#00D3FE] border-[#00D3FE] border-2' : 'bg-transparent border-foreground/10'} px-3 py-1.5 border cursor-pointer rounded-lg`}>250</button>
          </div>
          <div className="w-full h-0.5 bg-foreground/10"></div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[#A4B7EB] text-[13px] inter-extralight">Your locked stake</h3>
              <h3>{stakeAmount} GVT</h3>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-[#A4B7EB] text-[13px] inter-extralight">Pool fee (5%)</h3>
              <h3>{stakeAmount * 0.05} GVT</h3>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-[#A4B7EB] text-[13px] inter-extralight">You Win If Victorious</h3>
              <h3 className="text-[#00FF87]">{stakeAmount * 2 - (stakeAmount * 0.1)} GVT</h3>
            </div>
          </div>
          <button className="px-6 py-3 rounded-lg text-[#02040A] bg-[#00D3FE] border border-[#20CEEE80] hover:shadow-lg hover:shadow-[#00D3FE4D] shadow cursor-pointer text-[14px] max-w-30 transition-all active:scale-95 flex items-center gap-4">
            Play Now
          </button>
        </div>
        <div className="">
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[13px] text-[#00D3FE]">ECONOMIC MODEL</h4>
            <h3 className="text-[38px]">Dual-Stake Escrow. Winner Takes All.</h3>
            <p className="text-[15px] text-[#A4B7EB] inter-extralight">Our smart contracts lock identical deposits from both players. Platform takes a 5% Platform Fee. Rest goes instantly to the victor.</p>
          </div>
          <div className="flex flex-col gap-4 mt-8">
            <div className='flex items-center gap-4'>
              <Image src='/flashIcon.png' alt="flash icon" width={22} height={22} />
              <div className="flex flex-col">
                <h3 className="text-[15px] text-white">Escrow Secure</h3>
                <p className="text-[#6B7280] text-[13px] inter-extralight">No trust required. Funds are stored programmatically.</p>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Image src='/flashIcon.png' alt="flash icon" width={22} height={22} />
              <div className="flex flex-col">
                <h3 className="text-[15px] text-white">Instant Payouts</h3>
                <p className="text-[#6B7280] text-[13px] inter-extralight">Instantly claim rewards back to your Web3 wallet.</p>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Image src='/flashIcon.png' alt="flash icon" width={22} height={22} />
              <div className="flex flex-col">
                <h3 className="text-[15px] text-white">Anti-Cheat Protection</h3>
                <p className="text-[#6B7280] text-[13px] inter-extralight">Advanced match state checking prevents sybil validation attacks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 flex flex-col gap-6 items-center inter-bold">
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-[13px] text-[#00D3FE]">TRUSTED REVIEWS</h4>
          <h3 className="text-[38px]">Endorsed by Top Players</h3>
          <p className="text-[15px] text-[#A4B7EB] inter-extralight">Discover what professional cyber athletes and protocol validators are saying about OLOS.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 px-24 gap-6 mt-6 w-full">
          <div className="flex flex-col gap-4 py-7 pl-8 pr-24 bg-[#0B0F19] border border-foreground/10 rounded-2xl">
            <div className="flex items-center gap-0.5">
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
            </div>
            <p className="text-[15px] inter-extralight">"The GVT smart contracts are incredibly elegant. 1v1 execution settled under 2 seconds. Truly institutional grade."</p>
            <div className="flex items-center gap-4 mt-4">
              <Image src='/userUIcon.png' alt="user icon" width={44} height={44} />
              <div className="flex flex-col">
                <h3 className="text-[15px] text-white">Alex_Breaker</h3>
                <p className="text-[#6B7280] text-[13px] inter-extralight">Security Engineer & Validator</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 py-7 pl-8 pr-24 bg-[#0B0F19] border border-foreground/10 rounded-2xl">
            <div className="flex items-center gap-0.5">
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
              <Image src='/starIcon.png' alt="star icon" width={20} height={20} />
            </div>
            <p className="text-[15px] inter-extralight">"I've made over 400 GVT in hyper-snake this month. Absolute zero lag on my key inputs. A game changer."</p>
            <div className="flex items-center gap-4 mt-4">
              <Image src='/userUIcon.png' alt="user icon" width={44} height={44} />
              <div className="flex flex-col">
                <h3 className="text-[15px] text-white">SnakeGod99</h3>
                <p className="text-[#6B7280] text-[13px] inter-extralight">Top 50 Rank Competitor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 p-24 bg-[#060A16] inter-bold flex flex-col gap-10 items-center">
        <div className="flex flex-col items-center gap-2">
          <h4 className="text-[13px] text-[#00D3FE]">WHY OLOS?</h4>
          <h3 className="text-[38px]">Built for Real-Time Competitive Gaming</h3>
          <p className="text-[15px] text-[#A4B7EB] inter-extralight">Technical specs running the engine behind OLOS's zero-trust execution system.</p>
        </div>
        <div className="flex flex-col items-center w-full gap-3">
          <div className="py-5 px-6 bg-[#0B0F19] border border-foreground/10 rounded-lg flex items-center w-full">
            <h3 className='text-[#00D3FE] text-[15px] min-w-80'>Latency Tolerance</h3>
            <p className="text-[13px] text-[#A4B7EB] inter-extralight">Sub-100ms state engine replication between multi-nodes.</p>
          </div>
          <div className="py-5 px-6 bg-[#0B0F19] border border-foreground/10 rounded-lg flex items-center w-full">
            <h3 className='text-[#00D3FE] text-[15px] min-w-80'>Fair Play & Instant Settlement</h3>
            <p className="text-[13px] text-[#A4B7EB] inter-extralight">Off-chain speed with on-chain payout security.</p>
          </div>
            <div className="py-5 px-6 bg-[#0B0F19] border border-foreground/10 rounded-lg flex items-center w-full">
              <h3 className='text-[#00D3FE] text-[15px] min-w-80'>Multi-Chain Support</h3>
              <p className="text-[13px] text-[#A4B7EB] inter-extralight">Connect with Ethereum, Arbitrum, Base, or Polygon.</p>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 text-center flex flex-col items-center gap-10 inter-bold">
        <div className=" border-white/5">
        <h2 className="text-4xl md:text-[42px] font-black mb-4 text-white">Ready to Prove Your Skills?</h2>
        <p className="text-[#A4B7EB] mb-12 text-[15px] inter-extralight">No email or registration required. Connect your wallet to stake, or practice completely free.</p>
        
        <div className="flex justify-center gap-4">
              <Link
                href=""
                className="px-8 py-3 rounded-lg text-[#02040A] bg-[#00D3FE] hover:bg-[#00D3FE]/60 text-[14px] font-bold transition-all active:scale-95 inter-bold flex items-center gap-1"
              >
                <Image src='/padIcon.png' alt="pad icon" width={32} height={32} />
                <h3 className="mt-1">Connect Wallet & Play</h3>
              </Link>
              <Link
                href=""
                className="px-10 py-3 rounded-lg text-white border border-[#20CEEE80] hover:border-0 hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 flex items-center gap-2"
              >
                <Image src='/trophyIcon.png' alt="pad icon" width={32} height={32} />
                Read Whitepaper
              </Link>
            </div>
        </div>
      </section>

      <footer className="py-24 px-20 bg-[#010101] inter-normal">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Image src='/OLOS_logo.svg' alt="logo" width={140} height={48} />
            <p className="text-[#A4B7EB] text-[16px] leading-8">
              Web3 skill gaming , Compete,<br /> Stake and earn -your reputation <br /> lives on-chain
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Link
                href=""
                className="px-5 py-2 rounded-lg text-white border border-foreground/10 hover:border-[#A4B7EB] hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 flex items-center gap-2"
              >
                <Image src='/Xlogo.png' alt="twitter icon" width={12} height={12} />
              </Link>
              <Link
                href=""
                className="px-5 py-2 rounded-lg text-white border border-foreground/10 hover:border-[#A4B7EB] hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 flex items-center gap-2"
              >
                <Image src='/devicon_slack.png' alt="discord icon" width={12} height={12} />
              </Link>
              <Link
                href=""
                className="px-5 py-2 rounded-lg text-white border border-foreground/10 hover:border-[#A4B7EB] hover:bg-gray-800 text-[14px] font-bold transition-all active:scale-95 flex items-center gap-2"
              >
                <Image src='/logos_telegram.png' alt="telegram icon" width={12} height={12} />
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <ul>
              <h3 className="inter-extrabold text-[19px]">Games</h3>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Snake Xenzia
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Chess Arena
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Tetris Blitz
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Bounce King
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Jumping Jack
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Checkers Rush
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col">
            <ul>
              <h3 className="inter-extrabold text-[19px]">Platform</h3>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Leaderboard
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Match History
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  GVT Token
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Smart Contract
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Security
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col">
            <ul>
              <h3 className="inter-extrabold text-[19px]">Company</h3>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Documentation
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  How It Works
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  FAQ
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Support
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Terms
                </Link>
              </li>
              <li className="mt-2">
                <Link href="" className="text-[15px] text-[#A4B7EB]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="w-full flex items-center justify-between mt-10 pr-60">
          <p className="text-[14px] text-[#A4B7EB]">© 2026 OLOS Gaming Platform. All rights reserved</p>
          <p className="text-[14px] text-[#A4B7EB]">Powered by GVT Token · EVM Smart Contracts</p>
        </div>
      </footer>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full bg-olos-blue flex items-center justify-center text-white text-xl font-black mb-8">
        {number}
      </div>
      <h3 className="text-lg font-black mb-4 text-white uppercase tracking-wider">{title}</h3>
      <p className="text-gray-500 font-bold leading-relaxed max-w-[200px] text-center text-sm">{description}</p>
    </div>
  );
}

function UserRanking({ Ranking, username, userIcon, userWins, userPoints, color }: { Ranking: number; username: string; userIcon: string; userWins: number; userPoints: number,color: string }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h3 style={{color: color}} className="text-[15px]">#{Ranking}</h3>
        <div className="flex items-center">
          <Image src={userIcon} alt="user icon" width={44} height={54} className="rounded-full" />
          <div className='flex flex-col ml-4'>
            <h4 className="text-white text-[15px]">{username}</h4>
            <p className="text-[#6B7280] text-[11px]">{userWins} wins</p>
          </div>
        </div>
      </div>
      <h3 className="text-[#FFB800]">{userPoints} GVT</h3>
    </div>
  );
}

function GameCard({ image, title, description }: { image: string; title: string; description: string }) {
  return (
    <div className="flex flex-col bg-[#0a0f1e] rounded-3xl border border-blue-500/10 overflow-hidden group hover:border-blue-500/30 transition-all hover:translate-y-[-4px]">
      <div className="aspect-[1.4] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-xs font-bold leading-relaxed mb-6 line-clamp-2 flex-1">{description}</p>
        <div className="flex gap-2">
          <button className="px-5 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">Solo</button>
          <button className="px-5 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">1v1</button>
        </div>
      </div>
    </div>
  );
}

function NewGameCard({ image, title, description, liveNumber, minStake, volatility, color }: { image: string; title: string; description: string; liveNumber: number; minStake: number; volatility: string; color: string }) {
  return (
    <div className="flex flex-col bg-[#0a0f1e] rounded-3xl border border-blue-500/10 overflow-hidden group hover:border-blue-500/30 transition-all hover:translate-y-[-4px]">
      <div className="aspect-[1.4] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover transition-all border-[#A4B7EB] border-l-2 border-2 duration-300" />
        {/* <img src={image} alt={title} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" /> */}
      </div>
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] text-white">{title}</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <h3 className="text-[9px] text-[#00FF87]">{liveNumber} Live</h3>
          </div>
        </div>
        <p className="text-[#A4B7EB] text-xs inter-extralight leading-relaxed mb-6 line-clamp-2 flex-1">{description}</p>
        <div className="w-full h-0.5 border border-foreground/10"></div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="text-[9px] text-[#6B7280] uppercase inter-extralight">Min Stake</h3>
            <h3 className="text-[14px] text-white">{minStake} GVT</h3>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[9px] text-[#6B7280] uppercase inter-extralight">Volatility</h3>
            <h3 className="text-[14px]" style={{ color }}>{volatility}</h3>
          </div>
        </div>
        <button className="px-5 py-3 rounded-lg text-[11px] text-[#02040A] uppercase transition-all cursor-pointer" style={{ backgroundColor: color }}>Enter Arena</button>
        {/* <div className="flex gap-2">
          <button className="px-5 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">1v1</button>
        </div> */}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[48px] md:text-[56px] font-black text-white tracking-tighter leading-none">{value}</div>
      <div className="text-[12px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#0B0F19] border border-[#20CEEE80] text-[#00D3FE] shadow-lg shadow-[#00D3FE1A] transition-all duration-300 cursor-pointer hover:bg-[#00D3FE] hover:text-[#02040A] ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}