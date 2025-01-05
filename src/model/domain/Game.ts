import {Player} from "./Player";

export type Game = {
    id: string
    playerOne: Player
    playerTwo: Player
    playerTurn: string
}