import {weCanFixItNextState} from "lorcana-shared/model/abilities";
import {Actions} from "lorcana-shared/model/Actions";
import {defineCardAmountRange, defineDeckAmountRange, PlayerGameState} from "lorcana-shared/model/ai/State";
import {Card, TriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";

type ChainedMethodInput = {
    player: Player,
    card: Card
    opposingActiveRow: Card[]
    ability: TriggeredAbility,
    newPlayerGameState: PlayerGameState
    newHostilePlayerGameState: PlayerGameState
    cause: Actions
}
const weCanFixItChain = ({
                             cause,
                             player,
                             card,
                             opposingActiveRow,
                             ability,
                             newPlayerGameState,
                             newHostilePlayerGameState
                         }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'WE CAN FIX IT') {
        return {
            cause,
            player,
            card,
            opposingActiveRow,
            ability,
            newPlayerGameState: weCanFixItNextState(newPlayerGameState, player),
            newHostilePlayerGameState
        }
    }
    return {cause, player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState}
}

const horseKickChain = ({
                            cause,
                            player,
                            card,
                            opposingActiveRow,
                            ability,
                            newPlayerGameState,
                            newHostilePlayerGameState
                        }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'HORSE KICK') {
        return {
            cause,
            player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState: {
                ...newHostilePlayerGameState,
                fieldState: {
                    ...newHostilePlayerGameState.fieldState,
                    totalStrength: newHostilePlayerGameState.fieldState.totalStrength - 2
                }
            }
        }
    }
    return {cause, player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState}
}

const musicalDebutChain = ({
                               cause,
                               player,
                               card,
                               opposingActiveRow,
                               ability,
                               newPlayerGameState,
                               newHostilePlayerGameState
                           }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'MUSICAL DEBUT') {
        return {
            cause,
            player, card, opposingActiveRow, ability, newPlayerGameState: {
                ...newPlayerGameState,
                deckCount: defineDeckAmountRange(player.deck.length - 1),
                hand: {...newPlayerGameState.hand, handSizeRange: defineCardAmountRange(player.hand.length + 1)},
            }, newHostilePlayerGameState
        }
    }
    return {cause, player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState}
}

const wellOfSoulsChain = ({
                              cause,
                              player,
                              card,
                              opposingActiveRow,
                              ability,
                              newPlayerGameState,
                              newHostilePlayerGameState
                          }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'WELL OF SOULS') {
        return {
            cause,
            player, card, opposingActiveRow, ability, newPlayerGameState: {
                ...newPlayerGameState,
                hand: {...newPlayerGameState.hand, handSizeRange: defineCardAmountRange(player.hand.length + 1)},
            }, newHostilePlayerGameState
        }
    }
    return {cause, player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState}
}


export const runOverAllTriggeredAbilitiesForNextState = (player: Player, card: Card, opposingActiveRow: Card[], ability: TriggeredAbility, newPlayerGameState: PlayerGameState, newHostilePlayerGameState: PlayerGameState, cause: Actions) => {
    return weCanFixItChain(horseKickChain(wellOfSoulsChain(musicalDebutChain({
        cause,
        player,
        card,
        opposingActiveRow,
        ability,
        newPlayerGameState,
        newHostilePlayerGameState
    }))))

}


