
export type PlayerGameState = {
    deckCount: DeckAmountRange
    hand: HandState
    // alreadyInked: boolean
    inkTotal: number
    // TODO better???
    fieldState: FieldState
    loreCount: number
}

export type CardAmountRange = '0' | '1-2' | '3-4' | '5-7' | '8+'

export const defineCardAmountRange = (amount: number): CardAmountRange => {
    switch (amount) {
        case 0:
            return '0'
        case 1:
        case 2:
            return '1-2'
        case 3:
        case 4:
            return '3-4'
        case 5:
        case 6:
        case 7:
            return '5-7'
        default:
            return '8+'
    }
}

export type DeckAmountRange = '0-1' | '2-5' | '6-10' | '11-20' | '21-30' | '30+'

export const defineDeckAmountRange = (amount: number): DeckAmountRange => {
    if (amount > 30) return '30+'
    else if (amount >= 21 && amount <= 30) return '21-30'
    else if (amount >= 11 && amount <= 20) return '11-20'
    else if (amount >= 6 && amount <= 10) return '6-10'
    else if (amount >= 2 && amount <= 5) return '2-5'
    else return '0-1'
}

export type HandState = {
    handSizeRange: CardAmountRange
    // amountInkable: number
    // totalCardCost: number
    // amountThatCanBePlayed: number
}

export type FieldState = {
    totalReadiedCards: CardAmountRange
    totalStrength: number
    totalWillpower: number
    totalLore: number
}