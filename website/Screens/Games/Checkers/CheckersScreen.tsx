"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CheckersNavbar from "@/components/checkers/CheckersNavbar";
import TacticalCheckersLobby from "@/components/checkers/TacticalCheckersLobby";
import CheckersPvPArena from "@/components/checkers/CheckersPvPArena";
import CheckersPracticeEngine from "@/components/checkers/CheckersPracticeEngine";
import AppFooter from "@/components/app/AppFooter";
import { ScreenView } from "@/components/checkers/types";

function CheckersContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const viewParam = searchParams.get("view");
  const stakeParam = searchParams.get("stake");

  const [currentView, setCurrentView] = useState<ScreenView>("lobby");
  const [selectedStake, setSelectedStake] = useState<number>(25);

  useEffect(() => {
    if (stakeParam) {
      const parsed = parseInt(stakeParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedStake(parsed);
      }
    }

    if (modeParam === "1v1" || viewParam === "pvp") {
      setCurrentView("pvp");
    } else if (
      modeParam === "practice" ||
      modeParam === "system" ||
      modeParam === "Solo" ||
      viewParam === "practice"
    ) {
      setCurrentView("practice");
    } else {
      setCurrentView("lobby");
    }
  }, [modeParam, viewParam, stakeParam]);

  const handleLaunchPvP = (stake: number) => {
    setSelectedStake(stake);
    setCurrentView("pvp");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLaunchPractice = () => {
    setCurrentView("practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToLobby = () => {
    setCurrentView("lobby");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#03060d] text-white flex flex-col justify-between selection:bg-[#00f0ff] selection:text-black">
      {/* ── Top Navbar matching design ── */}
      <CheckersNavbar />

      {/* ── Main View ── */}
      <main className="flex-1 w-full pb-16">
        {currentView === "lobby" && (
          <TacticalCheckersLobby
            initialStake={selectedStake}
            onLaunchPvP={handleLaunchPvP}
            onLaunchPractice={handleLaunchPractice}
          />
        )}

        {currentView === "pvp" && (
          <CheckersPvPArena
            stake={selectedStake}
            onBackToLobby={handleBackToLobby}
            onForfeit={handleBackToLobby}
          />
        )}

        {currentView === "practice" && (
          <CheckersPracticeEngine
            onBackToLobby={handleBackToLobby}
            onForfeit={handleBackToLobby}
          />
        )}
      </main>

      {/* ── App Footer matching design ── */}
      <AppFooter />
    </div>
  );
}

export default function CheckersScreen() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#03060d] flex items-center justify-center text-[#00f0ff] font-mono text-sm">
          Loading Checkers Arena...
        </div>
      }
    >
      <CheckersContent />
    </Suspense>
  );
}
