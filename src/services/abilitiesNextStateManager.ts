import {defineCardAmountRange, defineDeckAmountRange, PlayerGameState} from "lorcana-shared/model/ai/State";
import {Card, TriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";

type ChainedMethodInput = {
    player: Player,
    card: Card
    opposingActiveRow: Card[]
    ability: TriggeredAbility,
    newPlayerGameState: PlayerGameState
}
const musicalDebutChain = ({
                               player,
                               card,
                               opposingActiveRow,
                               ability,
                               newPlayerGameState
                           }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'MUSICAL DEBUT') {
        return {
            player, card, opposingActiveRow, ability, newPlayerGameState: {
                ...newPlayerGameState,
                deckCount: defineDeckAmountRange(player.deck.length - 1),
                hand: {...newPlayerGameState.hand, handSizeRange: defineCardAmountRange(player.hand.length + 1)},
            }
        }
    }
    return {player, card, opposingActiveRow, ability, newPlayerGameState}
}

const wellOfSoulsChain = ({
                              player,
                              card,
                              opposingActiveRow,
                              ability,
                              newPlayerGameState
                          }: ChainedMethodInput): ChainedMethodInput => {
    if (ability.name === 'WELL OF SOULS') {
        return {
            player, card, opposingActiveRow, ability, newPlayerGameState: {
                ...newPlayerGameState,
                hand: {...newPlayerGameState.hand, handSizeRange: defineCardAmountRange(player.hand.length + 1)},
            }
        }
    }
    return {player, card, opposingActiveRow, ability, newPlayerGameState}
}


export const runOverAllTriggeredAbilitiesForNextState = (player: Player, card: Card, opposingActiveRow: Card[], ability: TriggeredAbility, newPlayerGameState: PlayerGameState) => {
    return wellOfSoulsChain(musicalDebutChain({player, card, opposingActiveRow, ability, newPlayerGameState}))

}


