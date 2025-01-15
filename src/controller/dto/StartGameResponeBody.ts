import {SimpleDeck} from "../../model";

export type StartGameResponseBody = {
    playerOne: {
        deck: SimpleDeck
        qState: Record<string, number>
        name: string
    },
    playerTwo: {
        deck: SimpleDeck
        qState: Record<string, number>
        name: string
    }
}