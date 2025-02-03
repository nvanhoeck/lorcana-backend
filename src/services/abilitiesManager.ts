import {
    andTwoForTea, andTwoForTeaCondition,
    horseKick,
    musicalDebut,
    weCanFixIt,
    weCanFixItCanBeExecuted, weCanFixItOptimalTarget,
    wellOfSouls
} from "lorcana-shared/model/abilities";
import {Actions} from "lorcana-shared/model/Actions";
import {Card, TriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";

const twoForTeaChain = (card: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    if (ability.name === 'AND TWO FOR TEA!' && cause === 'PLAY_CARD') {
        player.activeRow.filter(andTwoForTeaCondition).forEach(andTwoForTea)
        player.waitRow.filter(andTwoForTeaCondition).forEach(andTwoForTea)
    }
}

const weCanFixItChain = (card: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    if (ability.name === 'WE CAN FIX IT' && cause === 'QUEST') {
        if (weCanFixItCanBeExecuted(player.activeRow, origin.indexOf(card))) {
            weCanFixIt(weCanFixItOptimalTarget(origin.indexOf(card), player.activeRow)!)
        }
    }
}

const horseKickChain = (card: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    if (ability.name === 'HORSE KICK' && cause === 'PLAY_CARD') {
        const stepsAndCondition = horseKick();
        const pickACard = stepsAndCondition[0];
        if (hostilePlayer.activeRow.length > 0) {
            const strongestCard = hostilePlayer.activeRow.reduce((c, n) => {
                if (c.strength + c.statChanges.strength > n.strength + n.statChanges.strength) {
                    return c
                } else {
                    return n
                }
            });
            pickACard(hostilePlayer.activeRow, hostilePlayer.activeRow.indexOf(strongestCard))
        }
    }
}

const musicalDebutChain = (card: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    if (ability.name === 'MUSICAL DEBUT' && cause === 'PLAY_CARD') {
        const stepsAndCondition = musicalDebut(player.deck);
        const revealedCards = stepsAndCondition[0];
        const chosenCard = revealedCards.find(stepsAndCondition.conditionToPick)
        stepsAndCondition[1](revealedCards, player.hand, chosenCard ? revealedCards.indexOf(chosenCard) : -1)
        stepsAndCondition[2](revealedCards, player.deck)
    }
}

const wellOfSoulsChain = (card: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    if (ability.name === 'WELL OF SOULS' && cause === 'PLAY_CARD') {
        const stepsAndCondition = wellOfSouls(player.banishedPile);
        const revealedCards = stepsAndCondition[0];
        const chosenCard = revealedCards.find(stepsAndCondition.conditionToPick)
        stepsAndCondition[1](revealedCards, player.banishedPile, chosenCard ? revealedCards.indexOf(chosenCard) : -1)
        stepsAndCondition[2](revealedCards, player.banishedPile)
    }
}


export const runOverAllTriggeredAbilities = (c: Card, origin: Card[], player: Player, hostilePlayer: Player, ability: TriggeredAbility, cause: Actions) => {
    [
        twoForTeaChain,
        musicalDebutChain,
        wellOfSoulsChain,
        horseKickChain,
        weCanFixItChain
    ]
        .forEach((method) => method(c, origin, player, hostilePlayer, ability, cause))
}


