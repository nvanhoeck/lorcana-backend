import {Card} from "../model/domain/Card";
import {transferElement, transferLastElements} from "../utils/transferElements";
import {Player} from "../model/domain/Player";

export const drawCard = (deck: Card[], hand: Card[]) => {
    transferLastElements(deck, hand, 1)
}

export const readyAllCards = (activeRow: Card[], waitingRow: Card[]) => {
    activeRow.forEach((c) => {
        if(c.canBeReadiedDuringReadyPhase) {
            c.readied = true
        } else {
            c.canBeReadiedDuringReadyPhase = true
        }
    })

    waitingRow.forEach((c) => {
        if(c.canBeReadiedDuringReadyPhase) {
            c.readied = true
        } else {
            c.canBeReadiedDuringReadyPhase = true
        }
    })

    transferLastElements(waitingRow, activeRow, waitingRow.length)
}

export const inkCard = (hand: Card[], cardToBeInkedCard: Card, inkwell: number, cardInInkRow: number) => {
    if(cardToBeInkedCard.inkable) {
        const indexOfInkedCard = hand.indexOf((cardToBeInkedCard))
        hand.splice(indexOfInkedCard, 1)[0];
        return {inkwell: inkwell +1, cardInInkRow: cardInInkRow +1}
    } else {
        throw new Error(`Cannot ink ${cardToBeInkedCard.name} ${cardToBeInkedCard.subName}`)
    }
}

export const playCharacterCard = (hand: Card[], waitingRow: Card[], cardToBePlayed: Card, inkwell: number) => {
    if(cardToBePlayed.inkCost <= inkwell) {
        const indexOfCard = hand.indexOf(cardToBePlayed)
        transferElement(hand, waitingRow, indexOfCard)
        return inkwell - cardToBePlayed.inkCost
    } else {
        throw new Error(`Cannot play ${cardToBePlayed.name} ${cardToBePlayed.subName} ${cardToBePlayed.inkCost} from ${inkwell}`)

    }
}

export const playNonCharacterCard = (hand: Card[], banishedPile: Card[], cardToBePlayed: Card, inkwell: number) => {
    if(cardToBePlayed.inkCost <= inkwell) {
        const indexOfCard = hand.indexOf(cardToBePlayed)
        transferElement(hand, banishedPile, indexOfCard)
        return inkwell - cardToBePlayed.inkCost
    } else {
        throw new Error(`Cannot play ${cardToBePlayed.name} ${cardToBePlayed.subName} ${cardToBePlayed.inkCost} from ${inkwell}`)

    }
}

export const moveFromWaitingToActiveZone = (waitingZone: Card[], activeZone: Card[]) => {
    transferLastElements(waitingZone, activeZone, waitingZone.length)
}

export const quest = (card: Card, player: Player) => {
    if(card.type === "Character" && card.readied) {
        player.loreCount += card.lore
        card.readied = false
    } else {
        throw new Error(`Character ${card.name} ${card.subName} can not quest`)
    }
}

export const challengeCharacter = (attackingCard: Card, defendingCard: Card) => {
       if(attackingCard.type === 'Character' && defendingCard.type === 'Character') {
        if(attackingCard.readied && !defendingCard.readied) {
            defendingCard.damage += attackingCard.strength
            attackingCard.damage += defendingCard.strength
        }
    } else {
        throw new Error(`${attackingCard.name} ${attackingCard.subName} cannot attack ${defendingCard.name} ${defendingCard.subName}`)
    }
}

export const banishIfSuccumbed = (card: Card, originalRow: Card[], banishedPile: Card[]) => {
    if(card.damage >= card.willpower) {
        const indexOfCard = originalRow.indexOf(card)
        transferElement(originalRow, banishedPile, indexOfCard)
    }
}