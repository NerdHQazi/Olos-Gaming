import { useState, useEffect } from "react";
import { FaUserAstronaut } from "react-icons/fa";
import { LuBot } from "react-icons/lu";
import { EventBus } from "./game/EventBus";

export default function Playersturn() {
    const [turn, setTurn] = useState<"player" | "Bot">("player");
    const [playerScore, setPlayerScore] = useState(0);
    const [botScore, setBotScore] = useState(0);

    useEffect(() => {
        const changePlayer = (data: any) => {
            setTurn(data.turn);
            setPlayerScore(data.playerscore);
            setBotScore(data.botscore);
        };

        EventBus.on("change-player", changePlayer);

        return () => {
            EventBus.off("change-player", changePlayer);
        };
    }, []);
    return (
        <>
            <div className="flex mb-130 gap-3 items-center ">
                <div
                    className={
                        turn === "player"
                            ? "flex flex-col items-center bg-amber-800 text-white px-5 py-5 rounded-sm"
                            : "flex flex-col items-center bg-gray-200 text-red-500 px-5 py-5 rounded-sm"
                    }
                >
                    <FaUserAstronaut size={30} />
                    <p className="text-red-500">Player</p>
                    <p>{playerScore}</p>
                </div>
                <div
                    className={
                        turn === "Bot"
                            ? "mr-2 flex-col flex items-center bg-amber-800 text-white px-5 py-4 rounded-sm"
                            : "mr-2 flex-col flex items-center bg-gray-200 text-red-500 px-5 py-4 rounded-sm"
                    }
                >
                    <LuBot size={40} />
                    <p className="text-blue-500">Bot</p>
                    <p>{botScore}</p>
                </div>
            </div>
        </>
    );
}

