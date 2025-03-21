import {Actions} from "lorcana-shared/model/actions";
import {Card, isActivatedAbility, isTriggeredAbility} from "lorcana-shared/model/Card";
import {Player} from "lorcana-shared/model/Player";
import {
    DeckAmountRange,
    defineCardAmountRange,
    defineDeckAmountRange,
    FieldState,
    HandState,
    PlayerGameState
} from "lorcana-shared/model/ai/State";
import {eligibleTargets} from "lorcana-shared/utils/eligibleTargets";
import {findOptimalSinger} from "lorcana-shared/utils/optimalSinger";
import {definePossibleActionsWithoutEndTurn} from "../functions";
import {MCTSNode} from "../agent/MCTS-Node";
import {executeAction} from "./gameManager";
import {sumByProperty} from "../functions/sumByProperty";
import {deepClone} from "../functions/deepClone";
import {
    aWonderfulDreamNextState,
    aWonderfulDreamOptimalTarget,
    defineNextStateByShifting,
    isBodyguard
} from "lorcana-shared/model/abilities";
import {reviseAllCardsInPlay} from "lorcana-shared/utils";
import {runOverAllTriggeredAbilitiesForNextState} from "./abilitiesNextStateManager";

const defineLoreCountRangeReward = (loreCount: number) => {
    if (loreCount > 0 && loreCount < 5) {
        return loreCount
    }
    if (loreCount >= 5 && loreCount < 10) {
        return loreCount * 2
    }
    if (loreCount >= 10 && loreCount < 15) {
        return loreCount * 3
    }
    if (loreCount >= 15 && loreCount < 20) {
        return loreCount * 4
    }
    if (loreCount >= 20) {
        return loreCount * 10
    } else {
        return loreCount
    }
};


const defineDeckPenalty = (deckCount: DeckAmountRange) => {
    switch (deckCount) {
        case "0-1":
            return -5
        case "2-5":
            return -4
        case "6-10":
            return -3
        case "11-20":
            return -2
        case "21-30":
            return -1
        case "30+":
            return 0
    }
};

const defineReward = (player: Player, hostilePlayer: Player) => {
    const playerGameState = defineState(player, hostilePlayer.activeRow)
    const loreCount = defineLoreCountRangeReward(playerGameState.loreCount)
    const deckPenalty = defineDeckPenalty(playerGameState.deckCount)
    const inkDifference = player.cardInInkRow - hostilePlayer.cardInInkRow
    const playerStatTotal = sumByProperty(player.activeRow, 'lore') + sumByProperty(player.activeRow, 'willpower') + sumByProperty(player.activeRow, 'strength') + sumByProperty(player.waitRow, 'lore') + sumByProperty(player.waitRow, 'willpower') + sumByProperty(player.waitRow, 'strength')
    const hostilePlayerStatTotal = sumByProperty(hostilePlayer.activeRow, 'lore') + sumByProperty(hostilePlayer.activeRow, 'willpower') + sumByProperty(hostilePlayer.activeRow, 'strength') + sumByProperty(hostilePlayer.waitRow, 'lore') + sumByProperty(hostilePlayer.waitRow, 'willpower') + sumByProperty(hostilePlayer.waitRow, 'strength')
    const activeCards = player.activeRow.length + player.waitRow.length - hostilePlayer.activeRow.length - hostilePlayer.waitRow.length

    return loreCount + deckPenalty + inkDifference + playerStatTotal + activeCards - hostilePlayerStatTotal;
};

const simulate = (player: Player, hostilePlayer: Player, node: MCTSNode) => {
    // console.log('Simulating...')
    if (node.action) {
        executeAction(node.action!.action.action, player, hostilePlayer, node.action?.action.cardIdx, node.action.action.targetIdx)
    } else throw new Error('No action for node found')
};

const backPropagate = (node: MCTSNode, reward: number) => {
    let current: MCTSNode | null = node;

    // console.log(node.action?.action.action, reward)

    while (current) {
        current.visits += 1;
        current.totalReward += reward;
        current = current.parent;
    }
};

export const determineNextActionBasedByCurrentGameState = async (player: Player, hostilePlayer: Player) => {
    // console.log('Root')
    const root = new MCTSNode({
        player: defineState(player, hostilePlayer.activeRow),
        hostilePlayer: defineState(hostilePlayer, player.activeRow)
    })
    // We select the best option
    select(root, player, hostilePlayer, 0)
    // console.log(root.visits)
    const bestChild = root.bestChild();
    return bestChild
}

const select = (node: MCTSNode, player: Player, hostilePlayer: Player, level: number) => {
    // console.log('Selecting...')
    if(level > 100) {
        console.log('threshold breached')
    }
    let current = node
    // We iterate over all the options available and simulate them
    // By expanding, we add all options as children to the current node
    // console.log(level + 1)
    expand(current, player, hostilePlayer, level + 1)
    // Once this is done, we return the best child
    return current.bestChild()
};

const expand = (node: MCTSNode, player: Player, hostilePlayer: Player, level: number) => {
    // console.log('Expanding...')
    // We get all the actions
    const allActions = flatMapPossibleActions(player, hostilePlayer.activeRow);
    if (!allActions.find((a) => a.action === 'END_TURN')) {
        throw new Error('No end turn action found')
    }
    // For each of the actions, except for end_turn, we simulate and we select again. We picked end_turn, the reward is defined and backpropagated
    allActions
        .filter((a) => a.action !== 'END_TURN')
        .forEach((action) => {
            const actionWithId = {
                id: serializeOptimalAction(action),
                action,
            }
            // We apply the action to simulate the result
            let newState = defineNextState(action, player, hostilePlayer)
            const childNode = new MCTSNode(newState, node, actionWithId);
            node.children.set(actionWithId.id, childNode);
            const clonedPlayer = deepClone(player)
            const clonedHostilePlayer = deepClone(hostilePlayer)
            simulate(clonedPlayer, clonedHostilePlayer, childNode)
            // Now we select and expand all the children of the next node
            select(childNode, clonedPlayer, clonedHostilePlayer, level)
        })

    // console.log('All actions performed, doing an end_turn')
    const endTurnAction = allActions.find((a) => a.action === 'END_TURN')!;
    const actionWithId = {
        id: serializeOptimalAction(endTurnAction),
        action: endTurnAction
    }
    // We do an end turn, which triggers a reward and backpropagation
    let newState = defineNextState(endTurnAction, player, hostilePlayer)
    const childNode = new MCTSNode(newState, node, actionWithId);
    node.children.set(actionWithId.id, childNode);
    const clonedPlayer = deepClone(player)
    const clonedHostilePlayer = deepClone(hostilePlayer)
    simulate(clonedPlayer, clonedHostilePlayer, childNode)
    backPropagate(childNode, defineReward(clonedPlayer, clonedHostilePlayer))
    if (node.parent === null) {
        // console.log('Finished on root')
        // debugger
    }
};

function defineNextStateBasedByStats(playerGameState: PlayerGameState, player: Player, hostilePlayer: Player): PlayerGameState {
    reviseAllCardsInPlay(player, hostilePlayer)
    const totalLore = player.activeRow.map((c) => c.statChanges.lore + c.lore).reduce((c, n) => c + n, 0) + player.waitRow.map((c) => c.statChanges.lore + c.lore).reduce((c, n) => c + n, 0)
    const totalWillpower = player.activeRow.map((c) => c.statChanges.willpower + c.willpower).reduce((c, n) => c + n, 0) + player.waitRow.map((c) => c.statChanges.willpower + c.willpower).reduce((c, n) => c + n, 0)
    const totalStrength = player.activeRow.map((c) => c.statChanges.strength + c.strength).reduce((c, n) => c + n, 0) + player.waitRow.map((c) => c.statChanges.strength + c.strength).reduce((c, n) => c + n, 0)
    return {
        ...playerGameState,
        fieldState: {
            ...playerGameState.fieldState,
            totalLore,
            totalWillpower,
            totalStrength
        }
    }
}

const defineNextState = (action: {
    card?: Card;
    cardTarget?: Card;
    action: Actions;
    stats?: { power: number } | undefined
}, player: Player, hostilePlayer: Player) => {
    switch (action.action) {
        case "INK_CARD":
            return {
                player: defineNextStateBasedByStats(defineNextStatesByInkingCard(deepClone(player), deepClone(hostilePlayer.activeRow)), player, hostilePlayer),
                hostilePlayer: defineNextStateBasedByStats(defineState(deepClone(player), deepClone(hostilePlayer.activeRow)), player, hostilePlayer)
            }
        case "CHALLENGE":
            return defineNextStatesByChallengingCards(
                deepClone(player),
                action,
                defineState(deepClone(player), deepClone(hostilePlayer.activeRow)),
                defineState(deepClone(hostilePlayer), deepClone(player.activeRow)),
                deepClone(hostilePlayer))
        case "SHIFT":
            return {
                player: defineNextStateBasedByStats(defineNextStateByShifting(action.card!, action.cardTarget!, player, defineState(deepClone(player), deepClone(hostilePlayer.activeRow))), player, hostilePlayer),
                hostilePlayer: defineNextStateBasedByStats(defineState(deepClone(hostilePlayer), deepClone(player.activeRow)), player, hostilePlayer)
            }
        case "QUEST":
            const newStateAfterQuesting = defineNextStateByQuesting(deepClone(player), deepClone(hostilePlayer), defineState(deepClone(player), hostilePlayer.activeRow), action.card!)
            return {
                player: defineNextStateBasedByStats(newStateAfterQuesting.player, player, hostilePlayer),
                hostilePlayer: defineNextStateBasedByStats(newStateAfterQuesting.hostilePlayer, player, hostilePlayer)
            }
        case "PLAY_CARD":
            return defineNextStateByPlayingCard(player, action.card!, hostilePlayer)
        case "END_TURN":
            return {
                player: defineNextStateBasedByStats(defineState(player, hostilePlayer.activeRow), player, hostilePlayer),
                hostilePlayer: defineNextStateBasedByStats(defineState(hostilePlayer, player.activeRow), player, hostilePlayer)
            }
        case "SING":
            return {
                player: defineNextStateBasedByStats(defineNextStateBySingingCard(deepClone(player), action.card!, deepClone(hostilePlayer.activeRow)), player, hostilePlayer),
                hostilePlayer: defineNextStateBasedByStats(defineState(deepClone(hostilePlayer), deepClone(player.activeRow)), player, hostilePlayer)
            }
        case "CARD_EFFECT_ACTIVATION":
            if (action.card!.abilities.filter((a) => isActivatedAbility(a)).length > 1) {
                throw new Error("Has multiple effects, which is not yet developed")
            } else if (action.card!.abilities.find((a) => isActivatedAbility(a))) {
                const ability = action.card!.abilities.find((a) => isActivatedAbility(a))!;
                // TODO when extended, improve code
                if (ability.name === 'A WONDERFUL DREAM') {
                    const optimalTarget = aWonderfulDreamOptimalTarget(player.activeRow);
                    if (optimalTarget) {
                        const clonedNextActiveRowState = deepClone(player.activeRow)
                        clonedNextActiveRowState.find((c) => c.id === action.card?.id)!.readied = false
                        return {
                            player: defineNextStateBasedByStats(aWonderfulDreamNextState(defineState(player, hostilePlayer.activeRow), deepClone(player)), player, hostilePlayer),
                            hostilePlayer: defineNextStateBasedByStats(defineState(deepClone(hostilePlayer), deepClone(clonedNextActiveRowState)), player, hostilePlayer)
                        }
                    } else {
                        throw new Error("Performing A Wonderfull dream on non legitimate targets")
                    }
                }
            } else {
                throw new Error("Trying to trigger a card effect activation where there is none")
            }
        default:
            throw new Error(`Unhandled action type: ${action.action}`);
    }
}


export const flatMapPossibleActions = (player: Player, opposingActiveRow: Card[]) => {
    try {
        const possibleActions = definePossibleActionsWithoutEndTurn(player, opposingActiveRow);

        const allActions: {
            targetIdx?: number
            card?: Card,
            cardIdx?: number,
            action: Actions,
            stats?: {
                power: number
            } | undefined
        }[] = [{
            action: "END_TURN" as Actions,
            stats: undefined,
        },
            ...possibleActions.QUEST.map(cardForAction => ({
                cardIdx: player.activeRow.indexOf(cardForAction),
                card: cardForAction,
                action: "QUEST" as Actions,
            })),
            ...possibleActions.CHALLENGE.map(cardForAction => ({
                cardIdx: player.activeRow.indexOf(cardForAction),
                card: cardForAction,
                action: "CHALLENGE" as Actions,
                targetIdx: opposingActiveRow.indexOf(optimalChallengeTarget(opposingActiveRow, cardForAction)!)
            })),
            ...possibleActions.INK_CARD.map((cardForAction: Card) => ({
                cardIdx: player.hand.indexOf(cardForAction),
                card: cardForAction,
                action: "INK_CARD" as Actions
            })),
            ...possibleActions.PLAY_CARD.map(cardForAction => ({
                cardIdx: player.hand.indexOf(cardForAction),
                card: cardForAction,
                action: "PLAY_CARD" as Actions,
            })),
            ...possibleActions.CARD_EFFECT_ACTIVATION.map((cardForAction) => ({
                cardIdx: player.activeRow.indexOf(cardForAction),
                card: cardForAction,
                action: "CARD_EFFECT_ACTIVATION" as Actions,
            })),
            ...possibleActions.SHIFT.map((cardForAction) => ({
                cardIdx: player.hand.indexOf(cardForAction),
                targetIdx: player.activeRow.indexOf(player.activeRow.find((c) => c.name === (cardForAction as Card).name)!),
                card: cardForAction,
                action: "SHIFT" as Actions,
            }))
        ];

        return allActions
    } catch (e) {
        console.log('reached catch endpoint')
        return [{
            action: "END_TURN" as Actions,
            stats: undefined,
        }]
    }
}


export const defineState = (player: Player, opposingPlayerActiveRow: Card[]): PlayerGameState => {
    return {
        // alreadyInked: player.alreadyInkedThisTurn,
        deckCount: defineDeckAmountRange(player.deck.length),
        fieldState: defineFieldState(player.activeRow),
        hand: defineHandState(player, opposingPlayerActiveRow),
        inkTotal: player.inkTotal,
        loreCount: player.loreCount
    }
}

export const defineFieldState = (activeRow: Card[]): FieldState => {
    // console.log('active', activeRow.length)
    // console.log('readied', activeRow.filter((c) => c.readied).length)
    return {
        totalReadiedCards: defineCardAmountRange(activeRow.filter((c) => c.readied).length),
        totalLore: activeRow.map((c) => c.lore + c.statChanges.lore).reduce((c, n) => c + n, 0),
        totalStrength: activeRow.map((c) => c.strength + c.statChanges.strength).reduce((c, n) => c + n, 0),
        totalWillpower: activeRow.map((c) => c.willpower + c.statChanges.willpower).reduce((c, n) => c + n, 0)
    };
}

export const defineHandState = (player: Player, opposingPlayerActiveRow: Card[]) => {
    // let possibleActions = defineOptimalAction(player, opposingPlayerActiveRow);
    const handState: HandState = {
        handSizeRange: defineCardAmountRange(player.hand.length),
        // amountInkable: possibleActions.INK_CARD.length,
        // amountThatCanBePlayed: possibleActions.PLAY_CARD.length,
        // totalCardCost: player.hand.map((c) => c.inkCost).reduce((current, next) => current + next, 0),
    }
    return handState
}

export const serializeState = (state: { player: PlayerGameState, hostilePlayer: PlayerGameState }): string => {
    // Convert state to a string key (e.g., using JSON.stringify)
    return JSON.stringify(state);
}

//TODO in the future add different targets as additional actions of challenge
export const serializeOptimalAction = (optimalAction: {
    cardIdx?: number,
    card?: Card,
    action: Actions,
    stats?: { power: number } | undefined
}) => {
    if (optimalAction.action === 'CARD_EFFECT_ACTIVATION') {
        return `${optimalAction.action}-${optimalAction.card!.id}-${optimalAction.cardIdx}`
    }
    if (optimalAction.stats && optimalAction.card?.id) {
        return `${optimalAction.action}-${optimalAction.card.id}-${optimalAction.cardIdx}-${optimalAction.stats.power}`
    } else if (optimalAction.stats) {
        return `${optimalAction.action}-${optimalAction.stats.power}`
    } else if (optimalAction.card?.id) {
        return `${optimalAction.action}-${optimalAction.card.id}-${optimalAction.cardIdx}`
    } else {
        return `${optimalAction.action}`
    }
}

function defineNextStatesByInkingCard(player: Player, opposingActiveRow: Card[]): PlayerGameState {
    const playerGameState = defineState(player, opposingActiveRow);
    return {
        ...playerGameState,
        inkTotal: playerGameState.inkTotal + 1,
        hand: {...playerGameState.hand, handSizeRange: defineCardAmountRange(player.hand.length - 1)}
    }


}

function defineNextStatesByChallengingCards(
    player: Player,
    action: {
        card?: Card,
        action: Actions
    }, clonedPlayerState: PlayerGameState, clonedHostileState: PlayerGameState, hostilePlayer: Player) {
    const opposingRow = hostilePlayer.activeRow
    if (eligibleTargets(opposingRow)) {
        const target = optimalChallengeTarget(opposingRow, action.card!)!;
        const card = deepClone(action.card!)
        const newPlayerState = deepClone(clonedPlayerState)
        const newHostilePlayerState = deepClone(clonedHostileState)
        if (card.strength + card.statChanges.strength >= target.willpower + target.statChanges.willpower - target.damage) {
            newHostilePlayerState.fieldState = {
                totalLore: -newHostilePlayerState.fieldState.totalLore - target.lore - target.statChanges.lore,
                totalReadiedCards: target.readied ? defineCardAmountRange(player.activeRow.filter((c) => c.readied).length - 1) : defineCardAmountRange(player.activeRow.filter((c) => c.readied).length),
                totalStrength: -newHostilePlayerState.fieldState.totalStrength - target.strength - target.statChanges.strength,
                totalWillpower: -newHostilePlayerState.fieldState.totalWillpower - target.willpower - target.statChanges.willpower
            }
        } else {
            newHostilePlayerState.fieldState = {
                ...newHostilePlayerState.fieldState,
                totalWillpower: newHostilePlayerState.fieldState.totalWillpower - card.strength - card.statChanges.strength
            }
        }

        if (target.strength >= card.willpower - card.damage) {
            newPlayerState.fieldState = {
                totalLore: newPlayerState.fieldState.totalLore - card.lore,
                totalReadiedCards: newPlayerState.fieldState.totalReadiedCards,
                totalStrength: newPlayerState.fieldState.totalStrength - card.strength,
                totalWillpower: newPlayerState.fieldState.totalWillpower - card.willpower
            }
        } else {
            newPlayerState.fieldState = {
                ...newPlayerState.fieldState,
                totalWillpower: newPlayerState.fieldState.totalWillpower - card.strength
            }
        }
        return {
            player: defineNextStateBasedByStats(newPlayerState, player, hostilePlayer),
            hostilePlayer: defineNextStateBasedByStats(newHostilePlayerState, hostilePlayer, player)
        }
    } else {
        return {player: clonedPlayerState, hostilePlayer: clonedHostileState}
    }
}

// TODO index based
export const optimalChallengeTarget = (opposingActiveRow: Card[], attackingCard: Card) => {
    try {
        //TODO take into consideration ward, evasive, bodyguard,... (gameMamanger, eligbleTargets)
        const eligibleTarget = eligibleTargets(opposingActiveRow)
        if (eligibleTarget.length === 0) {
            return undefined
        }
        const targetsWhereOwnTargetDies = eligibleTarget.filter((target) => target.strength + target.statChanges.strength >= (attackingCard.willpower + attackingCard.statChanges.willpower - attackingCard.damage))
        const targetsWhereYourTargetDoesNotDie = eligibleTarget.filter((target) => target.strength + target.statChanges.strength <= (attackingCard.willpower + attackingCard.statChanges.willpower - attackingCard.damage))
        const targetsWhereItDies = eligibleTarget.filter((target) => attackingCard.strength + attackingCard.statChanges.strength >= (target.willpower + target.statChanges.willpower - target.damage))
        const targetsWhereItDiesButNotYourCard = targetsWhereItDies.filter((target) => target.strength + target.statChanges.strength < (attackingCard.willpower + attackingCard.statChanges.willpower - attackingCard.damage))
        const targetsWhereItDiesAndYourCard = targetsWhereItDies.filter((target) => target.strength + target.statChanges.strength >= (attackingCard.willpower + attackingCard.statChanges.willpower - attackingCard.damage))

        if (targetsWhereItDiesButNotYourCard.length > 0) {
            if (targetsWhereItDiesButNotYourCard.length > 1) {
                return targetsWhereItDiesButNotYourCard.reduce((currentCard, nextCard) => {
                    if (!currentCard) return nextCard
                    if (currentCard.lore + currentCard.statChanges.lore < nextCard.lore + nextCard.statChanges.lore) return nextCard
                    return currentCard
                })
            } else {
                return targetsWhereItDiesButNotYourCard[0]
            }
        } else if (targetsWhereItDiesAndYourCard.length > 0) {
            if (targetsWhereItDiesAndYourCard.length > 1) {
                return targetsWhereItDiesAndYourCard.reduce((currentCard, nextCard) => {
                    if (!currentCard) return nextCard
                    if (currentCard.lore + currentCard.statChanges.lore < nextCard.lore + nextCard.statChanges.lore) return nextCard
                    return currentCard
                })
            } else {
                return targetsWhereItDiesAndYourCard[0]
            }
        } else if (targetsWhereYourTargetDoesNotDie.length > 0) {
            if (targetsWhereYourTargetDoesNotDie.length > 1) {
                return targetsWhereYourTargetDoesNotDie.reduce((currentCard, nextCard) => {
                    if (!currentCard) return nextCard
                    if (currentCard.lore + currentCard.statChanges.lore < nextCard.lore + nextCard.statChanges.lore) return nextCard
                    return currentCard
                })
            } else {
                return targetsWhereYourTargetDoesNotDie[0]
            }
        } else {
            return targetsWhereOwnTargetDies.reduce((currentCard, nextCard) => {
                if (!currentCard) return nextCard
                if (currentCard.lore + currentCard.statChanges.lore < nextCard.lore + nextCard.statChanges.lore) return nextCard
                return currentCard
            }, targetsWhereOwnTargetDies[0])
        }
    } catch (e) {
        console.log('reached catch endpoint')
    }
}

function defineNextStateByQuesting(player: Player, hostilePlayer: Player, clonedPlayerState: PlayerGameState, card: Card) {
    const clonedHostilePlayerState = deepClone(defineState(hostilePlayer, player.activeRow))
    const newState = {
        ...clonedPlayerState,
        loreCount: clonedPlayerState.loreCount + card.lore,
        fieldState: {
            ...clonedPlayerState.fieldState,
            totalReadiedCards: defineCardAmountRange(player.activeRow.filter(c => c.readied).length - 1)
        }
    }
    return cardEffectWrapperByAction('QUEST', player, card, hostilePlayer.activeRow, newState, clonedHostilePlayerState);
}

function cardEffectWrapperByAction(action: Actions, player: Player, card: Card, opposingActiveRow: Card[], newPlayerGameState: PlayerGameState, newHostilePlayerGameState: PlayerGameState) {
    if (card.abilities.find((a) => isTriggeredAbility(a))) {
        if (card.abilities.filter((a) => isTriggeredAbility(a)).length > 1) {
            throw new Error('Found multiple trigger abilities which has not been implemented')
        }
        const ability = card.abilities.find((a) => isTriggeredAbility(a))!;
        const resultAfterAllAbilitiyChecks = runOverAllTriggeredAbilitiesForNextState(player, card, opposingActiveRow, ability, newPlayerGameState, newHostilePlayerGameState, action);
        return {
            player: resultAfterAllAbilitiyChecks.newPlayerGameState,
            hostilePlayer: resultAfterAllAbilitiyChecks.newHostilePlayerGameState
        }
    } else {
        return {player: newPlayerGameState, hostilePlayer: newHostilePlayerGameState}
    }
}

// TODO card effect
function defineNextStateByPlayingCard(player: Player, card: Card, hostilePlayer: Player): {
    player: PlayerGameState,
    hostilePlayer: PlayerGameState
} {
    const clonedPlayerState = defineState(player, hostilePlayer.activeRow)
    const clonedHostilePlayerState = defineState(player, hostilePlayer.activeRow)
    const newPlayerState: PlayerGameState = {
        ...clonedPlayerState,
        hand: {...clonedPlayerState.hand, handSizeRange: defineCardAmountRange(player.hand.length - 1)},
        fieldState: {
            ...clonedPlayerState.fieldState,
            totalLore: clonedPlayerState.fieldState.totalLore + card.lore + card.statChanges.lore,
            totalWillpower: clonedPlayerState.fieldState.totalWillpower + card.willpower + card.statChanges.willpower,
            totalStrength: clonedPlayerState.fieldState.totalStrength + card.strength + card.statChanges.strength,
            totalReadiedCards: defineCardAmountRange(player.activeRow.filter(c => c.readied).length + (isBodyguard(card) ? 0 : 1)),
        }
    }
    return cardEffectWrapperByAction('PLAY_CARD', player, card, hostilePlayer.activeRow, newPlayerState, clonedHostilePlayerState);
}

function defineNextStateBySingingCard(player: Player, card: Card, opposingActiveRow: Card[]): PlayerGameState {
    const clonedPlayerState = defineState(player, opposingActiveRow)
    const optimalSingerIdx = findOptimalSinger(player.activeRow, card.inkCost)
    return {
        ...clonedPlayerState,
        hand: {...clonedPlayerState.hand, handSizeRange: defineCardAmountRange(player.hand.length - 1)},
        fieldState: {
            ...clonedPlayerState.fieldState,
            totalReadiedCards: defineCardAmountRange(player.activeRow.filter(c => c.readied).length - (optimalSingerIdx >= 0 ? 1 : 0))
        }
    }
}