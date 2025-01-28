import {SimpleDeck} from "lorcana-shared/model/PlayableDeck";

export type StartGameResponseBody = {
    playerOne: {
        deck: SimpleDeck
        name: string
    },
    playerTwo: {
        deck: SimpleDeck
        name: string
    }
}