import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Homepage from "./assets/pages/homepage/home";
import HomeContinous from "./assets/pages/homepage/home-continous";
import HowtoPage from "./assets/pages/homepage/the-how";
import LeaderBoard from "./assets/pages/homepage/Leaderboard";
import GetStarted from "./assets/pages/homepage/get-started";
import StakeToken from "./assets/pages/homepage/stake";
import GameHub from "./profile/gamehub";

function MainLandingPage() {
  return (
    <>
      <Header />
      <Homepage />
      <HomeContinous />
      <HowtoPage />
      <LeaderBoard />
      <StakeToken />
      <GetStarted />
      <GameHub />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLandingPage />} />

        <Route path="/gamehub" element={<GameHub />} />
      </Routes>
    </BrowserRouter>
  );
}
