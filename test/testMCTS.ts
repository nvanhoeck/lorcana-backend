import {defineState, determineNextActionBasedByCurrentGameState} from "../src/services/mcts-aiManager";
import {Player} from "lorcana-shared/model/Player";
import {createCard, createCardCollection, executeAction} from "../src/services";
import {deepClone} from "../src/functions/deepClone";

export const testMCTS = async () => {
    const captainHookDeck = await createCardCollection([{
        id: "001-174", count: 10
    }]);

    const captainHook = await createCard("001-174");
    const moana14 = await createCard("001-014");

    const player: Player = {
        activeRow: [deepClone({...moana14, readied: false})],
        alreadyInkedThisTurn: false,
        banishedPile: [],
        cardInInkRow: 5,
        deck: [...captainHookDeck],
        hand: [],
        inkTotal: 0,
        loreCount: 1,
        name: "test player",
        waitRow: [deepClone(moana14)]
    }
    const hostilePlayer: Player = {
        activeRow: [deepClone(captainHook), deepClone(captainHook), deepClone(captainHook)],
        alreadyInkedThisTurn: false,
        banishedPile: [deepClone(moana14), deepClone(moana14), deepClone(captainHook), deepClone(captainHook)],
        cardInInkRow: 4,
        deck: [...captainHookDeck],
        hand: [],
        inkTotal: 3,
        loreCount: 9,
        name: "test player",
        waitRow: [deepClone(captainHook)]
    }
    // This can only do following actions:
    // INK_CARD
    // QUEST
    // PLAY_CARD
    let nextNode = undefined
    do {
        nextNode = await determineNextActionBasedByCurrentGameState(hostilePlayer, player);
        if (nextNode.action) {
            executeAction(nextNode.action?.action.action, hostilePlayer, player, nextNode.action?.action.cardIdx, nextNode.action?.action.targetIdx)
        } else {
            throw new Error('Action not found for ' + nextNode.serializedState)
        }
        console.log(nextNode.action)
    } while ('END_TURN' !== nextNode.action!.action.action)
}

testMCTS()