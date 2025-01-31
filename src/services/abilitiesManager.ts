import {horseKick, musicalDebut, wellOfSouls} from "lorcana-shared/model/abilities";
import {TriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";

const horseKickChain = (player: Player, hostilePlayer: Player, ability: TriggeredAbility) => {
    if (ability.name === 'HORSE KICK') {
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

const musicalDebutChain = (player: Player, hostilePlayer: Player, ability: TriggeredAbility) => {
    if (ability.name === 'MUSICAL DEBUT') {
        const stepsAndCondition = musicalDebut(player.deck);
        const revealedCards = stepsAndCondition[0];
        const chosenCard = revealedCards.find(stepsAndCondition.conditionToPick)
        stepsAndCondition[1](revealedCards, player.hand, chosenCard ? revealedCards.indexOf(chosenCard) : -1)
        stepsAndCondition[2](revealedCards, player.deck)
    }
}

const wellOfSoulsChain = (player: Player, hostilePlayer: Player, ability: TriggeredAbility) => {
    if (ability.name === 'WELL OF SOULS') {
        const stepsAndCondition = wellOfSouls(player.banishedPile);
        const revealedCards = stepsAndCondition[0];
        const chosenCard = revealedCards.find(stepsAndCondition.conditionToPick)
        stepsAndCondition[1](revealedCards, player.banishedPile, chosenCard ? revealedCards.indexOf(chosenCard) : -1)
        stepsAndCondition[2](revealedCards, player.banishedPile)
    }
}


export const runOverAllTriggeredAbilities = (player: Player, hostilePlayer: Player, ability: TriggeredAbility) => {
    [
        musicalDebutChain,
        wellOfSoulsChain,
        horseKickChain
    ]
        .forEach((method) => method(player, hostilePlayer, ability))
}


