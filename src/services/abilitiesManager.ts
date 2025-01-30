import {musicalDebut, wellOfSouls} from "lorcana-shared/model/abilities";
import {TriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";

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
        wellOfSoulsChain
    ]
        .forEach((method) => method(player, hostilePlayer, ability))
}


