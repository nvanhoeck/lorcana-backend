import {Card} from "lorcana-shared/model/Card";
import {transferElement, transferLastElements} from "lorcana-shared/utils/transferElements";
import {Player} from "lorcana-shared/model/Player";
import {isBodyguard} from 'lorcana-shared/model/abilities/index'

export const drawCard = (deck: Card[], hand: Card[]) => {
    transferLastElements(deck, hand, 1)
}

export const readyAllCards = (activeRow: Card[], waitingRow: Card[]) => {
    transferLastElements(waitingRow, activeRow, waitingRow.length)
    activeRow.forEach((c) => {
        if (c.canBeReadiedDuringReadyPhase) {
            c.readied = true
        } else {
            c.canBeReadiedDuringReadyPhase = true
        }
    })

    waitingRow.forEach((c) => {
        if (c.canBeReadiedDuringReadyPhase) {
            c.readied = true
        } else {
            c.canBeReadiedDuringReadyPhase = true
        }
    })

}

export const inkCard = (hand: Card[], cardToBeInkedCardIdx: number, inkwell: number, cardInInkRow: number) => {
    const cardToBeInkedCard = hand[cardToBeInkedCardIdx]
    if (cardToBeInkedCard.inkable) {
        const indexOfCard = hand.findIndex((c) => c.id === cardToBeInkedCard.id)
        hand.splice(indexOfCard, 1)[0];
        return {inkwell: inkwell + 1, cardInInkRow: cardInInkRow + 1}
    } else {
        throw new Error(`Cannot ink ${cardToBeInkedCard.name} ${cardToBeInkedCard.subName}`)
    }
}

export const playCharacterCard = (hand: Card[], waitingRow: Card[], cardToBePlayedIdx: number, inkwell: number, activeRow: Card[]) => {
    const cardToBePlayed = hand[cardToBePlayedIdx]
    if (cardToBePlayed.inkCost <= inkwell) {
        const indexOfCard = hand.findIndex((c) => c.id === cardToBePlayed.id)
        if (isBodyguard(cardToBePlayed)) {
            cardToBePlayed.readied = false
            cardToBePlayed.canBeReadiedDuringReadyPhase = true
            transferElement(hand, activeRow, indexOfCard)
        } else {
            transferElement(hand, waitingRow, indexOfCard)
        }
        return inkwell - cardToBePlayed.inkCost
    } else {
        throw new Error(`Cannot play ${cardToBePlayed.name} ${cardToBePlayed.subName} ${cardToBePlayed.inkCost} from ${inkwell}`)

    }
}

export const playNonCharacterCard = (hand: Card[], banishedPile: Card[], cardToBePlayedIdx: number, inkwell: number) => {
    const cardToBePlayed = hand[cardToBePlayedIdx]
    if (cardToBePlayed.inkCost <= inkwell) {
        const indexOfCard = hand.findIndex((c) => c.id === cardToBePlayed.id)
        transferElement(hand, banishedPile, indexOfCard)
        return inkwell - cardToBePlayed.inkCost
    } else {
        throw new Error(`Cannot play ${cardToBePlayed.name} ${cardToBePlayed.subName} ${cardToBePlayed.inkCost} from ${inkwell}`)

    }
}

export const moveFromWaitingToActiveZone = (waitingZone: Card[], activeZone: Card[]) => {
    transferLastElements(waitingZone, activeZone, waitingZone.length)
}

export const quest = (activeRow: Card[], cardToBeQuestIdx: number, player: Player) => {
    const cardToBeQuest = activeRow[cardToBeQuestIdx]
    if (cardToBeQuest.type === "Character" && cardToBeQuest.readied) {
        player.loreCount += cardToBeQuest.lore
        cardToBeQuest.readied = false
    } else {
        throw new Error(`Character ${cardToBeQuest.name} ${cardToBeQuest.subName} can not quest`)
    }
}

export const challengeCharacter = (attackingActiveRow: Card[], attackingCardIdx: number, defendingActiveRow: Card[], defendingCardIdx: number) => {
    const attackingCard = attackingActiveRow[attackingCardIdx]
    const defendingCard = defendingActiveRow[defendingCardIdx]
    // console.log(attackingCardIdx)
    // console.log(attackingActiveRow.map((c) => c.name))
    // console.log(attackingCard.name, attackingCard.subName)
    // console.log(defendingCardIdx)
    // console.log(defendingActiveRow.map((c) => c.name))
    // console.log(defendingCard.name, defendingCard.subName)
    if (attackingCard.type === 'Character' && defendingCard.type === 'Character') {
        if (attackingCard.readied && !defendingCard.readied) {
            defendingCard.damage += attackingCard.strength
            attackingCard.damage += defendingCard.strength
            attackingCard.readied = false
        }
    } else {
        throw new Error(`${attackingCard.name} ${attackingCard.subName} cannot attack ${defendingCard.name} ${defendingCard.subName}`)
    }
}

export const isSuccumbed = (card: Card) => {
    return card.damage >= card.willpower
}

export const banishIfSuccumbed = (cardIdx: number, originalRow: Card[], banishedPile: Card[]) => {
    const card: Card = originalRow[cardIdx]
    if (card.damage >= card.willpower) {
        const indexOfCard = originalRow.findIndex((c) => c.id === card.id)
        transferElement(originalRow, banishedPile, indexOfCard)
    }
}