import {CardType} from "../domain/Card";

export type PlayerGameState = {
    deckCount: number
    hand: HandState
    alreadyInked: boolean
    inkTotal: number
    fieldState: FieldState
    loreCount: number
}

type HandState = {
    amount: number
    amountInkable: number
    avgCardCost: number
    avgStrength: number
    avgWillpower: number
    avgLore: number
    typeCount: {
        'Action': number,
        'Song': number,
        'Item': number,
        'Location': number,
        'Character': number
    }
    amountThatCanBePlayed: number
}

type FieldState = {
    cards: (CharacterCard | ActionCard |  SongCard | ItemCard | LocationCard)[]
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