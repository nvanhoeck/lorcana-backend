import {Card} from "./Card";

export type Player = {
    name: string
    deck: Card[]
    banishedPile: Card[]
    hand: Card[]
    inkTotal: number
    alreadyInkedThisTurn: boolean
    activeRow: Card[]
    waitRow: Card[]
    loreCount: number
}