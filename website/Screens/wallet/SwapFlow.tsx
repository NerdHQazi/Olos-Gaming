'use client';

import React, { useState } from 'react';
import { Check, Hourglass, ArrowDown, AlertTriangle } from 'lucide-react';

export default function SwapFlow({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, label: 'Choose Asset' },
    { id: 2, label: 'Confirm Swap' },
    { id: 3, label: 'Processing' },
    { id: 4, label: 'GVT Complete' },
  ];

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-16 relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-gray-800 -z-10" />
        
        {steps.map((s) => {
          const isActive = s.id === step;
          const isCompleted = s.id < step;

          let circleColor = 'bg-[#111827] border border-gray-700 text-gray-500';
          let textColor = 'text-gray-500';

          if (isCompleted) {
            circleColor = 'bg-[#00E58F] text-black border border-[#00E58F]';
            textColor = 'text-[#00E58F]';
          } else if (isActive) {
            circleColor = 'bg-[#00e5ff] text-black border border-[#00e5ff]';
            textColor = 'text-[#00e5ff]';
          }

          return (
            <div key={s.id} className="flex items-center space-x-3 bg-[#050B18] px-2 z-10">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${circleColor}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-sm font-semibold hidden md:block ${textColor}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {step === 1 && <StepChooseAsset onNext={goNext} />}
        {step === 2 && <StepConfirm onNext={goNext} onPrev={goPrev} />}
        {step === 3 && <StepProcessing onNext={goNext} />}
        {step === 4 && <StepSuccess onBack={onBack} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Choose Asset
// ---------------------------------------------------------------------------
function StepChooseAsset({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h2 className="text-3xl font-bold text-white mb-2">Get GVT Tokens</h2>
        <p className="text-gray-400 mb-8 max-w-xl">
          Swap your deposited crypto assets instantly for GVT. Staking GVT allows you to compete on-chain and earn immediate yield payouts.
        </p>

        <div className="bg-[#0B1221] border border-gray-800 rounded-2xl p-6 mb-6">
          {/* YOU PAY */}
          <div className="mb-4 relative">
            <div className="flex justify-between text-xs font-bold text-gray-500 tracking-wider mb-2 uppercase">
              <span>You Pay</span>
              <span>Available Balance: 0.045 BTC</span>
            </div>
            <div className="flex items-center justify-between bg-[#060A13] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 cursor-pointer bg-black px-3 py-1.5 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">B</div>
                <span className="text-white font-bold text-lg">BTC</span>
                <span className="text-gray-500 text-xs">▼</span>
              </div>
              <input 
                type="text" 
                value="0.045" 
                readOnly
                className="bg-transparent text-right text-white font-bold text-2xl w-full outline-none"
              />
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-3 relative z-10">
            <div className="w-10 h-10 bg-[#0B1221] border border-[#00e5ff] rounded-full flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-[#00e5ff]" />
            </div>
          </div>

          {/* YOU RECEIVE */}
          <div className="mt-4 mb-8">
            <div className="flex justify-between text-xs font-bold text-gray-500 tracking-wider mb-2 uppercase">
              <span>You Receive</span>
              <span>Rate: 1 BTC = 60,000 GVT</span>
            </div>
            <div className="flex items-center justify-between bg-[#060A13] border border-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.05)] rounded-xl p-4">
              <div className="flex items-center space-x-3 cursor-pointer px-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">OLOS</span>
                </div>
                <span className="text-white font-bold text-lg">GVT</span>
              </div>
              <input 
                type="text" 
                value="2,700.00" 
                readOnly
                className="bg-transparent text-right text-[#00e5ff] font-bold text-2xl w-full outline-none"
              />
            </div>
          </div>

          {/* Summary Details */}
          <div className="space-y-3 text-sm mb-8 px-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Exchange Rate</span>
              <span className="text-white font-bold">1 BTC ≈ 60,000.00 GVT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network Fee</span>
              <span className="text-white font-bold">0.0001 BTC (~$6.00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Time</span>
              <span className="text-[#00e5ff] font-bold">Instant (~2 minutes)</span>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full bg-[#00e5ff] text-black hover:bg-cyan-400 font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          >
            Swap to GVT
          </button>
        </div>
      </div>

      {/* Right Column - Info */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-2xl p-6 h-fit">
        <h3 className="text-white font-bold text-lg mb-4">Why GVT Power?</h3>
        <ul className="text-sm text-gray-300 space-y-5 list-disc pl-5 marker:text-[#00e5ff]">
          <li>Stake GVT to qualify for all 1v1 arenas, global high-score tournaments, and instant prize drops.</li>
          <li>95% of each game's staked treasury is paid out automatically. 5% is processed securely by EVM smart contracts.</li>
          <li>Maintain your spot in the global top 50 standings to claim extra weekly pool bonuses in GVT.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Confirm Swap
// ---------------------------------------------------------------------------
function StepConfirm({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Review Swap Details</h2>
      <p className="text-gray-400 text-sm mb-10 max-w-2xl">
        Verify your transaction parameters before launching the on-chain trade. Escrow executes immediately upon consensus confirmation.
      </p>

      <div className="bg-[#0B1221] border border-gray-800 rounded-2xl p-8 mb-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-gray-800">
            <span className="text-gray-400 font-medium">You are swapping</span>
            <div className="text-right">
              <span className="text-white font-bold text-lg">0.045 BTC</span>
              <span className="text-gray-500 text-sm ml-2">(~$2,700.00)</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pb-6 border-b border-gray-800">
            <span className="text-gray-400 font-medium">Estimated GVT credit</span>
            <span className="text-[#00e5ff] font-bold text-2xl">2,700.00 GVT</span>
          </div>
        </div>

        <div className="space-y-3 mt-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Protocol Escrow Name</span>
            <span className="text-white font-bold">olos-escrow-btc-v3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Slippage Tolerance</span>
            <span className="text-white font-bold">0.5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Maximum Fee</span>
            <span className="text-white font-bold">1.25 GVT</span>
          </div>
        </div>

        {/* Warning Panel */}
        <div className="mt-8 flex items-start space-x-3 bg-[#1A1500]/50 border border-yellow-600/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed">
            Cryptocurrency rates are subject to volatility. The finalized credited GVT might slightly deviate depending on live block times.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={onNext}
            className="w-full bg-[#00e5ff] text-black hover:bg-cyan-400 font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.2)]"
          >
            Confirm Swap
          </button>
          <button
            onClick={onPrev}
            className="w-full bg-[#111827] hover:bg-gray-800 border border-gray-700 text-white font-bold py-3.5 rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Processing
// ---------------------------------------------------------------------------
function StepProcessing({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-8 bg-[#0B1221] border border-gray-800 rounded-2xl p-10 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border border-[#00e5ff]/50 bg-[#00e5ff]/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,229,255,0.2)] cursor-pointer" onClick={onNext}>
        <Hourglass className="w-10 h-10 text-[#00e5ff]" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-3">Transaction Pending</h2>
      <p className="text-gray-400 text-sm text-center mb-12 max-w-sm">
        Escrow swap instructions transmitted to smart contracts. Please wait until validators settle the state on-chain.
      </p>

      {/* Checklist */}
      <div className="w-full space-y-6 mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Check className="w-4 h-4 text-[#00E58F]" />
            <span className="text-white text-sm font-bold">Confirming BTC Transaction</span>
          </div>
          <span className="text-[#00E58F] text-xs font-bold">Completed</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] ml-1 mr-1" />
            <span className="text-white text-sm font-bold">Executing Escrow Token Swap</span>
          </div>
          <span className="text-[#00e5ff] text-xs font-bold">In Progress</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-gray-600 ml-1 mr-1" />
            <span className="text-gray-500 text-sm font-medium">Crediting GVT Wallet Balances</span>
          </div>
          <span className="text-gray-500 text-xs font-medium">Pending</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-10">
        <div className="w-full bg-[#1A2235] h-2.5 rounded-full overflow-hidden">
          <div className="bg-[#00e5ff] w-[45%] h-full rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
        </div>
        <p className="text-xs text-gray-500 mt-3">Estimated remaining time: ~1 minute</p>
      </div>

      <div className="w-full">
        <p className="text-xs text-gray-400 font-bold mb-4 tracking-wider uppercase">Transaction Metadata</p>
        <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800 text-sm">
          <div className="flex justify-between items-center p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Receiving Token</span>
            <span className="text-white font-bold">2,700.00 GVT</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Transaction Hash</span>
            <div className="flex items-center space-x-3">
              <span className="text-[#00e5ff] font-mono hover:underline cursor-pointer">8f5a89...3c9e</span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-800/50 px-2 py-1 rounded">COPY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Success
// ---------------------------------------------------------------------------
function StepSuccess({ onBack }: { onBack?: () => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-12 bg-[#0B1221] border border-gray-800 rounded-2xl p-10 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border border-[#00E58F]/50 bg-[#00E58F]/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,229,143,0.2)]">
        <Check className="w-10 h-10 text-[#00E58F]" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-3">Swap Successful!</h2>
      <p className="text-gray-400 text-sm text-center mb-10 max-w-sm">
        0.045 BTC was converted to GVT instantly. Your updated balance is secured and ready to power your actions.
      </p>

      <div className="w-full mb-10">
        <p className="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase">Updated Wallet Balance</p>
        <div className="border border-[#00e5ff]/40 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between bg-[#00e5ff]/5 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
          <div className="mb-4 md:mb-0">
            <h3 className="text-white font-bold text-xl mb-1">Total GVT Balance</h3>
            <p className="text-xs text-gray-400">Ready to stake in current active match arenas.</p>
          </div>
          <div className="text-[#00e5ff] font-bold text-3xl tracking-tight">
            2,850.00 GVT
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        <button 
          onClick={onBack}
          className="w-full bg-[#00e5ff] text-black hover:bg-cyan-400 font-bold py-4 rounded-xl transition shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        >
          Stake GVT to Play
        </button>
        <button 
          onClick={onBack}
          className="w-full bg-[#080B13] hover:bg-gray-900 border border-gray-800 text-white font-bold py-4 rounded-xl transition"
        >
          Swap More
        </button>
      </div>
    </div>
  );
}
