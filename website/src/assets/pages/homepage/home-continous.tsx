import { HiUserGroup } from "react-icons/hi2";
import { GiGamepad } from "react-icons/gi";

export default function HomeContinous() {
  return (
    <>
      <div>
        <div className="text-[#169EFA] font-extrabold flex flex-col items-center gap-2 ml-15 mt-50">
          Avalaible Games
          <div className="text-white font-extrabold text-2xl">
            Pure Skill. Real Rewards
          </div>
          <div className="text-[#657294] text-sm font-extrabold">
            No luck. No randomness. Only skill determines who wins GVT tokens.
          </div>
        </div>
        <div className="flex mt-12">
          <div className="rounded-[10px] mt-10 ml-15 bg-black w-63 py-2 px-4">
            <div className="text-[#09B600] border-1 border-[#09B600] rounded-[12px] bg-[#032501] px-2 py-1 w-fit font-extrabold">
              Most Popular
            </div>
            <div>
              <img
                src="snake.png"
                alt=""
                className="mt-2 border-1 border-[#09B600] rounded-[22px] w-500 h-70"
              />
            </div>
            <div className="mt-10 flex item-center gap-2">
              <div className="text-[#169EFA] border-[#169EFA] border-1 rounded-[12px] px-2 font-extrabold">
                Solo/1v1
              </div>
              <div className="text-[#657294] font-extrabold border border-[#657294] rounded-[12px] px-2">
                High Scores
              </div>
            </div>
            <div className="mt-10">
              <div className="text-white font-extrabold">Snake Xenzia</div>
              <div className="text-[#657294] font-extrabold">
                Eat, Grow, Outlast, classic snake- <br /> highest score at
                times-up wins <br /> the GVT pot
                <hr className="my-6 border-t-1 border-[#657294] w-58" />
              </div>
              <div className="flex item-center gap-28">
                <div className="flex item-col">
                  <div className="text-[#657294] font-extrabold">
                    Stake Range{" "}
                    <div className="text-[#f9c12c] font-extrabold">
                      5-50 GVT
                    </div>
                  </div>
                </div>
                <div className="flex item-col">
                  <div className="text-[#657294] font-extrabold">
                    Online{" "}
                    <div className="flex items-center gap-2 text-[#09B600] font-extrabold">
                      <HiUserGroup size={"30px"} color="#169EFA" />
                      128
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex mt-20 ml-1">
              <div className="flex items-center justify-center gap-2 font-extrabold bg-[#09B600] rounded-[10px] px-7 py-2 w-60">
                <GiGamepad size={"30px"} />
                Start Playing
              </div>
            </div>
          </div>
          <div className="rounded-[10px] mt-10 ml-15 bg-black w-63 py-2 px-4">
            <div className="text-[#169EFA] border-1 border-[#169EFA] rounded-[12px] bg-[#072A30] px-2 py-1 w-fit font-extrabold">
              Fast Round
            </div>
            <div>
              <img
                src="tetris.png"
                alt=""
                className="mt-2 border-1 border-[#09B600] rounded-[22px] w-500 h-70"
              />
            </div>
            <div className="mt-10 flex item-center gap-2">
              <div className="text-[#169EFA] border-[#169EFA] border-1 rounded-[12px] px-2 font-extrabold">
                Solo/1v1
              </div>
              <div className="text-[#657294] font-extrabold border border-[#657294] rounded-[12px] px-2">
                High Scores
              </div>
            </div>
            <div className="mt-10">
              <div className="text-white font-extrabold">Tetris Blitz</div>
              <div className="text-[#657294] font-extrabold">
                Speed staking under pressure. <br /> Clear more lines than your
                opponent <br />
                to win GVT
                <hr className="my-6 border-t-1 border-[#657294] w-58" />
              </div>
              <div className="flex item-center gap-28">
                <div className="flex item-col">
                  <div className="text-[#657294] font-extrabold">
                    Stake Range{" "}
                    <div className="text-[#f9c12c] font-extrabold">
                      5-50 GVT
                    </div>
                  </div>
                </div>
                <div className="flex item-col">
                  <div className="text-[#657294] font-extrabold">
                    Online{" "}
                    <div className="flex items-center gap-2 text-[#09B600] font-extrabold">
                      <HiUserGroup size={"30px"} color="#169EFA" />
                      84
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex mt-20 ml-1">
              <div className="flex items-center justify-center gap-2 font-extrabold bg-[#169EFA] rounded-[10px] px-7 py-2 w-60">
                <GiGamepad size={"30px"} />
                Start Playing
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="rounded-[10px] mt-10 ml-15 bg-black w-63 py-2 px-4">
              <div className="text-white border-1 border-[#360259] rounded-[12px] bg-[#0C0113] px-2 py-1 w-fit font-extrabold">
                High Staked
              </div>
              <div>
                <img
                  src="jumping-jack.png"
                  alt=""
                  className="mt-2 border-1 border-[#09B600] rounded-[22px] w-500 h-70"
                />
              </div>
              <div className="mt-10 flex item-center gap-2">
                <div className="text-[#169EFA] border-[#169EFA] border-1 rounded-[12px] px-2 font-extrabold">
                  1v1
                </div>
                <div className="text-[#657294] font-extrabold border-[#657294] border-1 rounded-[12px] px-2">
                  Win/Loss
                </div>
              </div>
              <div className="mt-10">
                <div className="text-white font-extrabold">Jumping Jack</div>
                <div className="text-[#657294] font-extrabold">
                  Eat, Grow, Outlast, classic snake- <br /> highest score at
                  times-up wins <br /> the GVT pot
                  <hr className="my-6 border-t-1 border-[#657294] w-58" />
                </div>
                <div className="flex item-center gap-28">
                  <div className="flex item-col">
                    <div className="text-[#657294] font-extrabold">
                      Stake Range{" "}
                      <div className="text-[#f9c12c] font-extrabold">
                        5-50 GVT
                      </div>
                    </div>
                  </div>
                  <div className="flex item-col">
                    <div className="text-[#657294] font-extrabold">
                      Online{" "}
                      <div className="flex items-center gap-2 text-[#09B600] font-extrabold">
                        <HiUserGroup size={"30px"} color="#169EFA" />
                        203
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex mt-20 ml-1">
                <div className="flex items-center justify-center gap-2 font-extrabold bg-[#360259] rounded-[10px] px-7 py-2 w-60">
                  <GiGamepad size={"30px"} />
                  Start Playing
                </div>
              </div>
            </div>
            <div className="rounded-[10px] mt-10 ml-15 bg-black w-63 py-2 px-4">
              <div className="text-[#360259] border-1 border-[#360259] rounded-[12px] bg-[#0C0113] px-2 py-1 w-fit font-extrabold">
                New
              </div>
              <div>
                <img
                  src="bounce.png"
                  alt=""
                  className="mt-2 border-1 border-[#09B600] rounded-[22px] w-500 h-70"
                />
              </div>
              <div className="mt-10 flex item-center gap-2">
                <div className="text-[#169EFA] border-[#169EFA] border-1 rounded-[12px] px-2 font-extrabold">
                  Solo/1v1
                </div>
                <div className="text-[#657294] font-extrabold border border-[#657294] rounded-[12px] px-2">
                  High Scores
                </div>
              </div>
              <div className="mt-10">
                <div className="text-white font-extrabold">Bounce King</div>
                <div className="text-[#657294] font-extrabold">
                  Physics reflex game
                  <br /> keep the ball alive longer <br />
                  than your opponent <br /> to claim <br />
                  the GVT pot
                  <hr className="my-6 border-t-1 border-[#657294] w-58" />
                </div>
                <div className="flex item-center gap-28">
                  <div className="flex item-col">
                    <div className="text-[#657294] font-extrabold">
                      Stake Range{" "}
                      <div className="text-[#f9c12c] font-extrabold">
                        5-50 GVT
                      </div>
                    </div>
                  </div>
                  <div className="flex item-col">
                    <div className="text-[#657294] font-extrabold">
                      Online{" "}
                      <div className="flex items-center gap-2 text-[#09B600] font-extrabold">
                        <HiUserGroup size={"30px"} color="#169EFA" />
                        61
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex mt-20 ml-1">
                <div className="flex items-center justify-center gap-2 font-extrabold bg-[#D06311] rounded-[10px] px-7 py-2 w-60">
                  <GiGamepad size={"30px"} />
                  Start Playing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
