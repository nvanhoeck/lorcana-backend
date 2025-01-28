import {defineState, determineNextActionBasedByCurrentGameState} from "../src/services/mcts-aiManager";
import {Player} from "lorcana-shared/model/Player";
import {createCardCollection, executeAction} from "../src/services";

export const testMCTS = async () => {
    const captainHook = await createCardCollection([{
        id: "001-174", count: 1
    }]);
    const player:Player = {
        activeRow: [...captainHook],
        alreadyInkedThisTurn: false,
        banishedPile: [],
        cardInInkRow: 0,
        deck: [],
        hand: [...captainHook],
        inkTotal: 10,
        loreCount: 0,
        name: "test player",
        waitRow: []
    }
    const hostilePlayer:Player = {
        activeRow: [],
        alreadyInkedThisTurn: false,
        banishedPile: [],
        cardInInkRow: 0,
        deck: [],
        hand: [],
        inkTotal: 10,
        loreCount: 0,
        name: "test player",
        waitRow: []
    }
    // This can only do following actions:
    // INK_CARD
    // QUEST
    // PLAY_CARD
    let nextNode = undefined
    do {
         nextNode = await determineNextActionBasedByCurrentGameState(player, hostilePlayer);
        if (nextNode.action) {
            executeAction(nextNode.action?.action.action, player, hostilePlayer, nextNode.action?.action.cardIdx, nextNode.action.targetIdx)
        } else {
            throw new Error('Action not found for ' + nextNode.serializedState)
        }
    } while ('END_TURN' !== nextNode.action!.action.action)
}

testMCTS()