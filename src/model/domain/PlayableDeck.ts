import {Sphere} from "./Sphere";

export type SimpleDeck = {
    deckName: string
    firstDeckType:Sphere
    secondDeckType?:Sphere
    cards: {id: string, count: number}[]
}