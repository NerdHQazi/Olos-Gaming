import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "./PhaserGame";
import Playersturn from "./players_turn";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div className="bg-white" id="app">
            <PhaserGame ref={phaserRef} />
            <Playersturn />
        </div>
    );
}

export default App;
