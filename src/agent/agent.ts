import {Player} from "lorcana-shared/model/Player";
import {defineDeckAmountRange, PlayerGameState} from "lorcana-shared/model/ai/State";
import {
    defineFieldState,
    defineHandState,
    defineState,
    determineNextActionBasedByCurrentGameState,
} from "../services/mcts-aiManager";
import {Card} from "lorcana-shared/model/Card";
import {drawCard, readyAllCards} from "../services/playerManager";
import {executeAction, resetInkTotal} from "../services/gameManager";
import {MCTSNode} from "./MCTS-Node";

export class Agent {
    player: Player
    gameState: { player: PlayerGameState, hostilePlayer: PlayerGameState }
    /**
     * Each turn is an array, and in each turn you can do different actions which lead to different states
     */
    turnRootNodes: MCTSNode[][] = []

    explorationRate = 0.1
    discountRate = 0.9
    learningRate = 0.1

    /**
     * record key = serialized string of
     * state and number
     */
        // TODO deprecated
        // qState: Record<string, number> = {}

    getOpposingActiveRow: () => Card[]
    getOpposingBanishedPile: () => Card[]
    defineHostilePlayerState: () => PlayerGameState
    getHostilePlayer: () => Player
    gameHasEnded: () => boolean

    public constructor(player: Player, callbacks: {
                           getOpposingActiveRow: () => Card[],
                           validateWinConditions: () => boolean
                           getOpposingBanishedPile: () => Card[]
                           defineHostilePlayerState: () => PlayerGameState
                           getHostilePlayer: () => Player
                       },
                       // optimalQState: Record<string, number> = {},
                       explorationRate = 0.1, discountRate = 0.9, learningRate = 0.1) {
        // if (!!optimalQState && Object.keys(optimalQState).length > 0) {
        //     Object.entries(optimalQState).forEach(([key, value]) => {
        //         this.qState[key] = value
        //     })
        // }
        this.player = player
        this.explorationRate = explorationRate
        this.discountRate = discountRate
        this.learningRate = learningRate
        this.getOpposingActiveRow = callbacks.getOpposingActiveRow
        this.gameHasEnded = callbacks.validateWinConditions
        this.getOpposingBanishedPile = callbacks.getOpposingBanishedPile
        this.defineHostilePlayerState = callbacks.defineHostilePlayerState
        this.getHostilePlayer = callbacks.getHostilePlayer

        this.gameState = {
            player: {
                // alreadyInked: false,
                deckCount: defineDeckAmountRange(this.player.deck.length),
                fieldState: defineFieldState(this.player.activeRow),
                hand: defineHandState(this.player, []),
                inkTotal: 0,
                loreCount: 0
            },
            hostilePlayer: this.defineHostilePlayerState()
        }
    }

    async doTurnActions(playerState: { player: PlayerGameState, hostilePlayer: PlayerGameState }, hostilePlayerState: {
        player: PlayerGameState,
        hostilePlayer: PlayerGameState
    }, newTurn = false, firstPlayerFirstTurn = false) {
        if (this.gameHasEnded()) {
            executeAction("END_TURN", this.player, this.getHostilePlayer())
            return
        }
        if (newTurn) {
            // TODO how to keep track of nodes and update them accordingly
            this.turnRootNodes.push([])
            resetInkTotal(this.player)
            readyAllCards(this.player.activeRow, this.player.waitRow)
        }
        if (newTurn) {
            if(!firstPlayerFirstTurn) {
                // console.log('DRAWING CARD')
                drawCard(this.player.deck, this.player.hand)
            }
        }
        this.gameState = {
            player: defineState(this.player, this.getOpposingActiveRow()),
            hostilePlayer: this.defineHostilePlayerState()
        };


        const mctsNode = await determineNextActionBasedByCurrentGameState({...this.player}, {...this.getHostilePlayer()});
        this.turnRootNodes[this.turnRootNodes.length - 1].push(mctsNode)
        // console.log('chosen action', mctsNode.action!.action.action)
        if (mctsNode.action) {
            executeAction(mctsNode.action?.action.action, this.player, this.getHostilePlayer(), mctsNode.action?.action.cardIdx, mctsNode.action.action.targetIdx)
            if (mctsNode.action.action.action !== 'END_TURN') {
                const playerGameState = defineState(this.player, this.getOpposingActiveRow())
                const hostilePlayerGameState = defineState(this.getHostilePlayer(), this.player.activeRow)
                await this.doTurnActions({
                    player: playerGameState,
                    hostilePlayer: hostilePlayerGameState
                }, {player: hostilePlayerGameState, hostilePlayer: playerGameState})
            }
        } else {
            throw new Error('Action not found for ' + mctsNode.serializedState)
        }
    }
}