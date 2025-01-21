import {Actions} from "../data/actions";
import {Card} from "../model/domain/Card";
import {Player} from "../model/domain/Player";
import {
    DeckAmountRange,
    defineCardAmountRange,
    defineDeckAmountRange,
    FieldState,
    HandState,
    PlayerGameState
} from "../model/ai/State";
import {eligibleTargets} from "../utils/eligibleTargets";
import {definePossibleActionsWithoutEndTurn} from "../functions";
import {MCTSNode} from "../agent/MCTS-Node";
import {executeAction} from "./gameManager";

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

const defineRewardByHandSizeDifference = (playerLength: number, hostilePlayerLength: number) => {
    return playerLength - hostilePlayerLength
};

const defineReward = (player: Player, hostilePlayer: Player) => {
    const playerGameState = defineState(player, hostilePlayer.activeRow)
    const loreCount = playerGameState.loreCount
    const deckPenalty = defineDeckPenalty(playerGameState.deckCount)
    const handSizeDifference = defineRewardByHandSizeDifference(player.hand.length, player.hand.length)
    const hostileLoreCountDifference = player.loreCount - hostilePlayer.loreCount
    const activeCards = player.activeRow.length - hostilePlayer.activeRow.length
    const inkDifference = player.inkTotal - hostilePlayer.inkTotal
    // TODO stats difference + readied difference
    return loreCount + deckPenalty + handSizeDifference + hostileLoreCountDifference + activeCards + inkDifference
};

const simulate = (player: Player, hostilePlayer: Player, node: MCTSNode) => {
    let currentNode = node
    let clonedPlayer = {...player}
    let clonedHostilePlayer = {...hostilePlayer}
    if (currentNode.action) {
        while (!currentNode.action) {
            const validActions = flatMapPossibleActions(clonedPlayer, clonedHostilePlayer.activeRow)
            const randomAction = validActions[Math.floor(Math.random() * validActions.length)];
            executeAction(randomAction.action, clonedPlayer, clonedHostilePlayer)
        }
        return defineReward(player, hostilePlayer)
    } else throw new Error('No action for node found')
};

const backPropagate = (node: MCTSNode, reward: number) => {
    let current: MCTSNode | null = node;

    while (current) {
        current.visits += 1;
        current.totalReward += reward;
        current = current.parent;
    }
};

export const determineNextActionBasedByCurrentGameState = async (player: Player, hostilePlayer: Player) => {
    const root = new MCTSNode({
        player: defineState(player, hostilePlayer.activeRow),
        hostilePlayer: defineState(hostilePlayer, player.activeRow)
    })
    // console.log('Root state')
    for (let i = 0; i < 50; i++) {
        // console.log('Selecting...')
        const leaf = select(root, player, hostilePlayer)
        // console.log('Selected leaf:', leaf.action?.action.action);
        // console.log('Simulation')
        const reward = simulate(player, hostilePlayer, leaf)
        // console.log('Back propagate')
        backPropagate(leaf, reward)
    }

    return root.bestChild()
}

const select = (node: MCTSNode, player: Player, hostilePlayer: Player) => {
    let current = node
    if (!current.isFullyExpanded({...player}, [...hostilePlayer.activeRow])) {
        // console.log('Not fully expanded')
        const mctsNode = expand(current, {...player}, {...hostilePlayer});
        // console.log('Selected expanded node:', mctsNode.action?.action.action)
        return mctsNode
    } else {
        // console.log('Fully expanded')
        const bestChild = current.bestChild();
        // console.log('Best child', bestChild.action?.action.action)
        return bestChild;
    }
};

const expand = (node: MCTSNode, player: Player, hostilePlayer: Player) => {
    const allActions = flatMapPossibleActions(player, hostilePlayer.activeRow);
    if (!allActions.find((a) => a.action === 'END_TURN')) {
        throw new Error('No end turn action found')
    }
    const untriedActions = allActions
        .map((action) => {
            if (!action.action) {
                throw new Error("Found action with undefined action type");
            }
            return {
                id: serializeOptimalAction(action),
                action
            };
        })
        .filter((action) => !node.children.has(action.id));


    const action = untriedActions[Math.floor(Math.random() * untriedActions.length)];
    if(!action) {
        const amountOfDuplicateCardsInHand = player.hand.reduce((count, card, index, array) => {
            const duplicates = array.filter((item) => item.id === card.id).length;
            return duplicates > 1 ? count + 1 / duplicates : count;
        }, 0);
        debugger
    }
    // console.log('untriedActions', untriedActions.map((ut) => ut.action.action))
    // console.log('chosen action', action.action.action)
    let newState = defineNextState(action.action, player, hostilePlayer)
    const childNode = new MCTSNode(newState, node, action);
    node.children.set(action.id, childNode);
    return childNode;
};

const defineNextState = (action: {
    card?: Card;
    action: Actions;
    stats?: { power: number } | undefined
}, player: Player, hostilePlayer: Player) => {
    switch (action.action) {
        case "INK_CARD":
            return {
                player: defineNextStatesByInkingCard({...player}, [...hostilePlayer.activeRow]),
                hostilePlayer: defineState({...player}, [...hostilePlayer.activeRow])
            }
        case "CHALLENGE":
            return defineNextStatesByChallengingCards(
                {...player},
                action,
                defineState({...player}, [...hostilePlayer.activeRow]),
                defineState({...hostilePlayer}, [...player.activeRow]),
                hostilePlayer.activeRow)
        case "QUEST":
            return {
                player: defineNextStateByQuesting({...player}, defineState({...player}, [...hostilePlayer.activeRow]), action.card!),
                hostilePlayer: defineState({...hostilePlayer}, [...player.activeRow])
            }
        case "PLAY_CARD":
            return {
                player: defineNextStateByPlayingCard({...player}, action.card!, [...hostilePlayer.activeRow]),
                hostilePlayer: defineState({...hostilePlayer}, [...player.activeRow])
            }
        case "END_TURN":
            return {
                player: defineState(player, hostilePlayer.activeRow),
                hostilePlayer: defineState(hostilePlayer, player.activeRow)
            }
        default:
            throw new Error(`Unhandled action type: ${action.action}`);
    }
}


export const flatMapPossibleActions = (player: Player, opposingActiveRow: Card[]) => {
    const possibleActions = definePossibleActionsWithoutEndTurn(player, opposingActiveRow);

    const allActions: {
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
    ];

    return allActions
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
    return {
        totalReadiedCards: defineCardAmountRange(activeRow.filter((c) => c.readied).length),
        totalLore: activeRow.map((c) => c.lore).reduce((c, n) => c + n, 0),
        totalStrength: activeRow.map((c) => c.strength).reduce((c, n) => c + n, 0),
        totalWillpower: activeRow.map((c) => c.willpower).reduce((c, n) => c + n, 0)
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

export const serializeOptimalAction = (optimalAction: {
    cardIdx?: number,
    card?: Card,
    action: Actions,
    stats?: { power: number } | undefined
}) => {
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
    }, clonedPlayerState: PlayerGameState, clonedHostileState: PlayerGameState, opposingRow: Card[]) {
    if (eligibleTargets(opposingRow)) {
        const target = optimalChallengeTarget(opposingRow, action.card!)!;
        const card = {...action.card!}
        const newPlayerState = {...clonedPlayerState}
        const newHostilePlayerState = {...clonedHostileState}
        if (card.strength >= target.willpower - target.damage) {
            newHostilePlayerState.fieldState = {
                totalLore: newHostilePlayerState.fieldState.totalLore - target.lore,
                totalReadiedCards: target.readied ? defineCardAmountRange(player.activeRow.filter((c) => c.readied).length - 1) : defineCardAmountRange(player.activeRow.filter((c) => c.readied).length),
                totalStrength: newHostilePlayerState.fieldState.totalStrength - target.strength,
                totalWillpower: newHostilePlayerState.fieldState.totalWillpower - target.willpower
            }
        } else {
            newHostilePlayerState.fieldState = {
                ...newHostilePlayerState.fieldState,
                totalWillpower: newHostilePlayerState.fieldState.totalWillpower - card.strength
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
            player: newPlayerState,
            hostilePlayer: newHostilePlayerState
        }
    } else {
        return {player: clonedPlayerState, hostilePlayer: clonedHostileState}
    }
}

export const optimalChallengeTarget = (opposingActiveRow: Card[], attackingCard: Card) => {
    //TODO take into consideration ward, evasive, bodyguard,... (gameMamanger, eligbleTargets)
    const eligibleTarget = eligibleTargets(opposingActiveRow)
    if (eligibleTarget.length === 0) {
        return undefined
    }
    const targetsWhereOwnTargetDies = eligibleTarget.filter((target) => target.strength >= (attackingCard.willpower - attackingCard.damage))
    const targetsWhereYourTargetDoesNotDie = eligibleTarget.filter((target) => target.strength <= (attackingCard.willpower - attackingCard.damage))
    const targetsWhereItDies = eligibleTarget.filter((target) => attackingCard.strength >= (target.willpower - target.damage))
    const targetsWhereItDiesButNotYourCard = targetsWhereItDies.filter((target) => target.strength < (attackingCard.willpower - attackingCard.damage))
    const targetsWhereItDiesAndYourCard = targetsWhereItDies.filter((target) => target.strength >= (attackingCard.willpower - attackingCard.damage))

    if (targetsWhereItDiesButNotYourCard.length > 0) {
        if (targetsWhereItDiesButNotYourCard.length > 1) {
            return targetsWhereItDiesButNotYourCard.reduce((currentCard, nextCard) => {
                if (!currentCard) return nextCard
                if (currentCard.lore < nextCard.lore) return nextCard
                return currentCard
            })
        } else {
            return targetsWhereItDiesButNotYourCard[0]
        }
    } else if (targetsWhereItDiesAndYourCard.length > 0) {
        if (targetsWhereItDiesAndYourCard.length > 1) {
            return targetsWhereItDiesAndYourCard.reduce((currentCard, nextCard) => {
                if (!currentCard) return nextCard
                if (currentCard.lore < nextCard.lore) return nextCard
                return currentCard
            })
        } else {
            return targetsWhereItDiesAndYourCard[0]
        }
    } else if (targetsWhereYourTargetDoesNotDie.length > 0) {
        if (targetsWhereYourTargetDoesNotDie.length > 1) {
            return targetsWhereYourTargetDoesNotDie.reduce((currentCard, nextCard) => {
                if (!currentCard) return nextCard
                if (currentCard.lore < nextCard.lore) return nextCard
                return currentCard
            })
        } else {
            return targetsWhereYourTargetDoesNotDie[0]
        }
    } else {
        return targetsWhereOwnTargetDies.reduce((currentCard, nextCard) => {
            if (!currentCard) return nextCard
            if (currentCard.lore < nextCard.lore) return nextCard
            return currentCard
        }, targetsWhereOwnTargetDies[0])
    }
}

function defineNextStateByQuesting(player: Player, clonedPlayerState: PlayerGameState, card: Card) {
    return {
        ...clonedPlayerState,
        loreCount: clonedPlayerState.loreCount + card.lore,
        fieldState: {
            ...clonedPlayerState.fieldState,
            totalReadiedCards: defineCardAmountRange(player.activeRow.filter(c => c.readied).length - 1)
        }
    }
}

function defineNextStateByPlayingCard(player: Player, card: Card, opposingActiveRow: Card[]): PlayerGameState {
    const clonedPlayerState = defineState(player, opposingActiveRow)
    return {
        ...clonedPlayerState,
        deckCount: defineDeckAmountRange(player.deck.length - 1),
        hand: {...clonedPlayerState.hand, handSizeRange: defineCardAmountRange(player.hand.length - 1)},
        fieldState: {
            ...clonedPlayerState.fieldState,
            totalLore: clonedPlayerState.fieldState.totalLore + card.lore,
            totalWillpower: clonedPlayerState.fieldState.totalWillpower + card.willpower,
            totalStrength: clonedPlayerState.fieldState.totalStrength + card.strength,
            totalReadiedCards: defineCardAmountRange(player.activeRow.filter(c => c.readied).length + 1),
        }
    }
}
