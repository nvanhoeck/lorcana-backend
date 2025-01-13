import {CardType} from "../domain/Card";

export type PlayerGameState = {
    // deckCount: number
    hand: HandState
    // alreadyInked: boolean
    inkTotal: number
    // TODO better???
    fieldState: FieldState
    loreCount: number
}

export type HandState = {
    amount: number
    // amountInkable: number
    // totalCardCost: number
    // amountThatCanBePlayed: number
}

export type FieldState = {
    totalReadiedCards: number
    totalStrength: number
    totalWillpower: number
    totalLore: number
}

type DefaultCardType = {
    readied: boolean
    type: CardType
}

type CharacterCard = DefaultCardType & {
    strength: number
    willpower: number
    lore: number
    // TODO classification
    // TODO movement
    keywords: number
}

type ActionCard = DefaultCardType
type SongCard = DefaultCardType
type ItemCard = DefaultCardType
type LocationCard = DefaultCardType