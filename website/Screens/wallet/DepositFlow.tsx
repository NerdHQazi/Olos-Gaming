'use client';

import React, { useState } from 'react';
import { Check, Hourglass, Copy, AlertTriangle } from 'lucide-react';

export default function DepositFlow({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState('BTC');

  const steps = [
    { id: 1, label: 'Choose Asset' },
    { id: 2, label: 'Select Network' },
    { id: 3, label: 'Deposit Address' },
    { id: 4, label: 'Pending Confirmations' },
    { id: 5, label: 'Success' },
  ];

  const goNext = () => setStep((s) => Math.min(5, s + 1));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-16 relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-gray-800 -z-10" />
        
        {steps.map((s, idx) => {
          const isActive = s.id === step;
          const isCompleted = s.id < step;
          const isPending = s.id > step;

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
        {step === 2 && (
          <StepSelectNetwork
            selectedNetwork={selectedNetwork}
            setSelectedNetwork={setSelectedNetwork}
            onNext={goNext}
          />
        )}
        {step === 3 && <StepDepositAddress onNext={goNext} />}
        {step === 4 && <StepPending onNext={goNext} />}
        {step === 5 && <StepSuccess onBack={onBack} />}
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
        <h2 className="text-3xl font-bold text-white mb-2">Deposit Tokens</h2>
        <p className="text-gray-400 mb-8 max-w-xl">
          Fund your OLOS esports account with external crypto assets. Your deposit will remain held in secure smart contracts until you choose to swap or stake.
        </p>

        <div className="bg-[#0B1221] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              {/* Ethereum Diamond Logo */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.9999 0.400024L11.7583 1.22026V16.4831L11.9999 16.7246L19.4674 12.3082L11.9999 0.400024Z" fill="#343434" />
                <path d="M12.0001 0.400024L4.53271 12.3082L12.0001 16.7246V9.06646V0.400024Z" fill="#8C8C8C" />
                <path d="M11.9999 17.962L11.8317 18.1673V23.3644L11.9999 23.854L19.4727 13.5484L11.9999 17.962Z" fill="#3C3C3B" />
                <path d="M12.0001 23.854V17.962L4.52734 13.5484L12.0001 23.854Z" fill="#8C8C8C" />
                <path d="M11.9999 16.7246L19.4674 12.3082L11.9999 8.92212V16.7246Z" fill="#141414" />
                <path d="M4.53271 12.3082L12.0001 16.7246V8.92212L4.53271 12.3082Z" fill="#393939" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Ethereum</h3>
              <p className="text-sm text-gray-400">ETH</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            ERC-20 Ethereum deposits with trustless smart contract escrows.
          </p>
          <button
            onClick={onNext}
            className="w-full bg-[#131B2C] hover:bg-[#1a2333] border border-gray-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Select Token
          </button>
        </div>
      </div>

      {/* Right Column - Balances */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-xl p-6 h-fit">
        <h3 className="text-white font-semibold mb-4">Your Wallet Balances</h3>
        
        <div className="space-y-3">
          {/* GVT */}
          <div className="flex items-center justify-between p-3 border border-gray-800 rounded-lg bg-[#0E1629]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">OLOS</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">GVT (OLOS)</p>
                <p className="text-xs text-[#00e5ff]">Active Power Token</p>
              </div>
            </div>
            <span className="text-[#00e5ff] font-bold">150.00</span>
          </div>

          {/* Others */}
          <BalanceItem icon="B" name="Bitcoin" balance="0.0000" />
          <BalanceItem icon="S" name="Solana" balance="0.00" />
          <BalanceItem icon="B" name="BNB" balance="0.00" />
          <BalanceItem icon="E" name="Ethereum" balance="0.000" />
        </div>

        <button className="w-full mt-6 bg-[#1D1936] hover:bg-[#252044] border border-[#3E347A] text-white font-semibold py-3 rounded-lg transition">
          Join a Match with GVT
        </button>
      </div>
    </div>
  );
}

function BalanceItem({ icon, name, balance }: { icon: string; name: string; balance: string }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#1E2536] text-gray-400 flex items-center justify-center text-sm font-semibold">
          {icon}
        </div>
        <p className="text-white font-medium text-sm">{name}</p>
      </div>
      <span className="text-gray-400 text-sm font-medium">{balance}</span>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Step 2: Select Network
// ---------------------------------------------------------------------------
function StepSelectNetwork({
  selectedNetwork,
  setSelectedNetwork,
  onNext,
}: {
  selectedNetwork: string;
  setSelectedNetwork: (n: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center space-x-4 mb-2">
           <div className="w-10 h-10 bg-[#1E2536] rounded-lg flex items-center justify-center text-gray-400 font-bold">B</div>
           <div>
              <h2 className="text-3xl font-bold text-white">Deposit Bitcoin</h2>
              <p className="text-gray-400 text-sm">Select the network you will use to send your BTC.</p>
           </div>
        </div>
        
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mt-8 mb-4">Select Network</h3>

        <div className="space-y-4 mb-8">
          <NetworkOption
            id="BTC"
            title="Bitcoin Mainnet"
            time="10 - 60 minutes"
            fee="0.0001 BTC (~$6.00)"
            selected={selectedNetwork === 'BTC'}
            onSelect={() => setSelectedNetwork('BTC')}
          />
          <NetworkOption
            id="BSC"
            title="BEP-20 (BSC)"
            time="Under 2 minutes"
            fee="0.00001 BTC (~$0.60)"
            selected={selectedNetwork === 'BSC'}
            onSelect={() => setSelectedNetwork('BSC')}
          />
          <NetworkOption
            id="ERC"
            title="ERC-20 (Ethereum)"
            time="Under 5 minutes"
            fee="0.0002 BTC (~$12.00)"
            selected={selectedNetwork === 'ERC'}
            onSelect={() => setSelectedNetwork('ERC')}
          />
        </div>

        <button
          onClick={onNext}
          className="bg-[#00e5ff] text-black hover:bg-cyan-400 font-bold py-3 px-8 rounded-lg transition"
        >
          Get Deposit Address
        </button>
      </div>
    </div>
  );
}

function NetworkOption({
  id,
  title,
  time,
  fee,
  selected,
  onSelect,
}: {
  id: string;
  title: string;
  time: string;
  fee: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-xl border cursor-pointer flex justify-between items-center transition ${
        selected ? 'bg-[#050B18] border-[#00e5ff]' : 'bg-[#0B1221] border-gray-800 hover:border-gray-600'
      }`}
    >
      <div>
        <h4 className="text-white font-semibold text-lg mb-1">{title}</h4>
        <div className="text-xs text-gray-400 flex space-x-4">
          <span>Est. Arrival: <span className="text-[#00e5ff]">{time}</span></span>
          <span>Est. Fee: {fee}</span>
        </div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#00e5ff]' : 'border-gray-600'}`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff]" />}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Step 3: Deposit Address
// ---------------------------------------------------------------------------
function StepDepositAddress({ onNext }: { onNext: () => void }) {
  const depositAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkf5x0ad6y";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-[#0B1221] border border-gray-800 rounded-2xl p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white mb-2">Bitcoin Deposit Address</h2>
          <p className="text-gray-400 text-center text-sm mb-10 max-w-sm">
            Send your Bitcoin only to this address. Sending any other currency may result in permanent loss.
          </p>

          <div className="bg-white p-4 rounded-xl mb-12 shadow-[0_0_30px_rgba(0,229,255,0.3)] cursor-pointer" onClick={onNext}>
            {/* Fake QR code for mockup purposes, advancing on click to demonstrate flow */}
            <div className="w-48 h-48 bg-black grid grid-cols-8 grid-rows-8 gap-1 p-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={Math.random() > 0.4 ? 'bg-white' : 'bg-black'} />
              ))}
            </div>
          </div>

          <div className="w-full">
            <p className="text-xs text-gray-400 font-bold mb-2 tracking-wider">BTC DEPOSIT ADDRESS</p>
            <div className="flex items-center justify-between border border-gray-800 bg-[#060B16] rounded-lg p-3">
              <span className="text-[#00e5ff] text-sm font-mono truncate mr-4">{depositAddress}</span>
              <button 
                className="text-gray-400 hover:text-white flex items-center space-x-2 text-xs font-bold border border-gray-700 rounded-md px-3 py-1.5 transition"
                onClick={() => navigator.clipboard.writeText(depositAddress)}
              >
                <span>COPY</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-gray-800 rounded-2xl p-6 h-fit">
        <div className="flex items-center space-x-2 text-yellow-500 font-bold mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>IMPORTANT NOTICES</span>
        </div>
        <ul className="text-sm text-gray-300 space-y-4 list-disc pl-5 marker:text-yellow-500">
          <li>Minimum deposit: <span className="font-bold text-white">0.0005 BTC</span>. Deposits below this limit cannot be credited or recovered.</li>
          <li>Requires <span className="font-bold text-white">1 Network Confirmation</span> to credit and 3 to withdraw.</li>
          <li>Address expires in 24 hours. Do not send multiple deposits to this address after expiration.</li>
        </ul>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Step 4: Pending Confirmations
// ---------------------------------------------------------------------------
function StepPending({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-12 bg-[#0B1221] border border-gray-800 rounded-2xl p-8 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border border-orange-500/50 bg-orange-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] cursor-pointer" onClick={onNext}>
        <Hourglass className="w-10 h-10 text-orange-500" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-3">Transaction Pending</h2>
      <p className="text-gray-400 text-sm text-center mb-10 max-w-md">
        Your transaction has been detected on the blockchain. Waiting for full network confirmation.
      </p>

      <div className="w-full mb-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-300">Network Confirmations</span>
          <span className="text-sm font-bold text-yellow-500">2 of 6 confirmations</span>
        </div>
        <div className="w-full bg-[#1A2235] h-2.5 rounded-full overflow-hidden">
          <div className="bg-yellow-500 w-[33%] h-full rounded-full" />
        </div>
        <p className="text-xs text-gray-500 mt-2">Estimated remaining time: ~15 minutes</p>
      </div>

      <div className="w-full">
        <p className="text-xs text-gray-400 font-bold mb-4 tracking-wider uppercase">Transaction Details</p>
        <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800 text-sm">
          <div className="flex justify-between p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Token Received</span>
            <span className="text-white font-bold">0.045 BTC</span>
          </div>
          <div className="flex justify-between p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Network</span>
            <span className="text-white font-bold">Bitcoin Mainnet</span>
          </div>
          <div className="flex justify-between p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Tx Hash</span>
            <span className="text-[#00e5ff] font-mono cursor-pointer hover:underline">8f5a89...3c9e</span>
          </div>
          <div className="flex justify-between p-4 bg-[#050B18]/50">
            <span className="text-gray-400">Escrow Contract</span>
            <span className="text-[#00e5ff] font-mono cursor-pointer hover:underline">olos-escrow-btc-v3</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Step 5: Success
// ---------------------------------------------------------------------------
function StepSuccess({ onBack }: { onBack?: () => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-12 bg-[#0B1221] border border-gray-800 rounded-2xl p-8 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border border-[#00E58F]/50 bg-[#00E58F]/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,143,0.3)]">
        <Check className="w-10 h-10 text-[#00E58F]" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-3">Deposit Successful!</h2>
      <p className="text-gray-400 text-sm text-center mb-10 max-w-md">
        0.045 BTC is now secured in your escrow wallet and ready to power your esports actions.
      </p>

      <div className="w-full mb-8">
        <p className="text-xs text-gray-400 font-bold mb-2 tracking-wider uppercase">Recommended Action</p>
        <div className="border border-[#00e5ff]/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between bg-[#00e5ff]/5">
          <div className="mb-4 md:mb-0">
            <h3 className="text-white font-bold text-lg mb-1">Convert BTC to GVT Tokens</h3>
            <p className="text-sm text-gray-400">Swap your BTC to active GVT tokens instantly to start battling in esports arenas and claiming GVT rewards.</p>
          </div>
          <button className="whitespace-nowrap bg-[#00e5ff] text-black hover:bg-cyan-400 font-bold py-3 px-6 rounded-lg transition">
            SWAP NOW
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-4">
        <button 
          onClick={onBack}
          className="flex-1 bg-transparent border border-gray-700 text-white hover:bg-gray-800 font-bold py-3 rounded-lg transition"
        >
          View My Spot Wallet
        </button>
        <button 
          onClick={onBack}
          className="flex-1 bg-[#1A2235] hover:bg-[#20293f] border border-gray-700 text-white font-bold py-3 rounded-lg transition"
        >
          Back to Arenas
        </button>
      </div>
    </div>
  );
}
