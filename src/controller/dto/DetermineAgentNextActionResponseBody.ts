import {Card} from "../../model";

export type DetermineAgentNextActionResponseBody = {
    chosenAction: {
        qValue: number,
        nextSerializedState: string,
        action: { card?: Card, action: "INK_CARD" | "CHALLENGE" | "QUEST" | "PLAY_CARD" | "END_TURN" },
        targetIndex?: number
    }
}