"use client";
import { useRouter } from "next/navigation";
import { GiGamepad } from "react-icons/gi";
import Header from "./header";
import HomeContinous from "./home-continous";
import Howto from "./thehow";
import GetStarted from "./getstarted";
import StakeWallet from "./stakewallet";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <>
      <Header />
      <div>
        <div className="flex items-center gap-10">
          <div>
            <div className="text-[#20CDED] mt-15 ml-25">
              <div className="font-extrabold flex items-center gap-2 rounded-full bg-[#001D26]/20 w-fit py-1 px-4 border-1 border-[#20CDED] px-12">
                <div className=" w-4 h-4 rounded-full bg-[#00FF87]"></div>
                Web3 skill Gaming.Beta Live
              </div>
            </div>
            <div className="flex items-center gap-2 mt-10 ml-15">
              <div className="text-7xl text-white font-extrabold">
                Play Skill
              </div>
              <br />
              <div className="text-7xl text-[#8c57e7] font-extrabold">
                Games
              </div>
            </div>
            <div className="flex items-center gap-2 mt-10 ml-15">
              <div className="text-7xl text-white font-extrabold">
                Stake Tokens.
              </div>
              <div className="text-7xl text-[#f9c12c] font-extrabold">Win</div>
            </div>
            <div className="text-7xl text-[#f9c12c] font-extrabold mt-10 ml-15">
              On Chain
            </div>
            <p className="text-[#657294] mt-10 ml-15 font-extrabold">
              Complete in Skill-based mini-games. <br />
              Stake GVT tokens. Winner takes the <br />
              spot. Your record lives permanent on-chain
            </p>
            <div className="ml-15 flex items-center gap-5 mt-10">
              <div
                onClick={() => router.push("/gamehub")}
                className="flex items-center gap-2 font-extrabold bg-[#169EFA] rounded-[10px] px-7 py-2"
              >
                <GiGamepad size={"30px"} />
                Start Playing
              </div>
              <div
                onClick={() => router.push("/leaderboard")}
                className="font-extrabold flex items-center gap-2 text-white border-[#169EFA] border-1 rounded-[10px] px-7 py-2"
              >
                🏆 Leaderboard
              </div>
            </div>
            <div className="flex items-center mt-10">
              <div className="ml-15 ">
                <div className="text-[#169EFA] font-extrabold">12,480</div>
                <p className="text-white font-extrabold text-sm">
                  Active Players
                </p>
              </div>
              <div className="ml-15">
                <div className="text-[#169EFA] font-extrabold">840,000+</div>
                <p className="text-white font-extrabold text-sm">GVT in Play</p>
              </div>
              <div className="ml-15">
                <div className="text-[#169EFA] font-extrabold">6</div>
                <p className="text-white font-extrabold text-sm">Kill Games</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 mt-10">
            <div className="flex item-center gap-5">
              <img
                src="snake.png"
                alt=""
                className="border-1 border-[#20CDED] rounded-[22px]"
              />
              <img
                src="tetris.png"
                alt=""
                className="border-1 border-[#20CDED] rounded-[22px]"
              />
            </div>
            <div className="flex item-center gap-5">
              <img
                src="jumping-jack.png"
                alt=""
                className="border-1 border-[#20CDED] rounded-[22px]"
              />
              <img
                src="bounce.png"
                alt=""
                className="border-1 border-[#20CDED] rounded-[22px]"
              />
            </div>
          </div>
        </div>
      </div>
      <HomeContinous />
      <Howto />
      <StakeWallet />
      <GetStarted />
    </>
  );
}
