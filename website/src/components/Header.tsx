import { CiPlay1 } from "react-icons/ci";
import { LuHexagon } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex justify-between gap-3 py-4 px-10 border-b-2 border-[#1E0D47] shadow-sm shadow-[#1E0D47]">
        <div className="flex gap-2">
          <div className="text-white text-4xl font-extrabold">Olos</div>
          <div className=" text-[10px] text-[#20CDED] border-1 border-[#20CDED] rounded-[8px] px-2 flex items-center font-extrabold">
            BETA
          </div>
        </div>

        <div className="flex justify-between gap-5 ml-10">
          <p
            onClick={() => navigate("/gamehub")}
            className="text-[#657294] hover:border-[#20CDED] hover:border-1 rounded-[8px] px-4 py-3 font-extrabold"
          >
            Game
          </p>
          <p
            onClick={() => navigate("/leaderboard")}
            className="text-[#657294] hover:border-[#20CDED] hover:border-1 rounded-[8px] px-4 py-3 font-extrabold"
          >
            LeaderBoard
          </p>
          <a
            onClick={() => navigate("/howto")}
            className="text-[#657294] hover:border-[#20CDED] hover:border-1 rounded-[8px] px-4 py-3 font-extrabold"
          >
            How it works
          </a>
          <a
            onClick={() => navigate("/token")}
            className="text-[#657294] hover:border-[#20CDED] hover:border-1 rounded-[8px] px-4 py-3 font-extrabold"
          >
            Token
          </a>
        </div>
        <div className="flex gap-5">
          <div className="font-extrabold flex items-center gap-1 text-[#f9c12c] border-1 rounded-[8px] bg-[#001d26] border-[#012732] px-4 py-1">
            <LuHexagon /> 250 GVT
          </div>
          <p
            onClick={() => navigate("/gamehub")}
            className="flex items-center gap-1 font-extrabold text-white border-1 rounded-[7px] bg-[#1a0a3c] border-[#4b2194] px-3 py-1"
          >
            <CiPlay1 size={"20px"} color="#8c57e7" /> Play Now
          </p>
        </div>
      </div>
    </>
  );
}
