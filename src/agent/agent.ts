import {Player} from "../model/domain/Player";
import {PlayerGameState} from "../model/ai/State";
import {definePossibleActions} from "../functions/definePossibleActions";
import {
    chooseOptimalAction,
    defineFieldState,
    defineHandState,
    defineState, determineNextActionBasedByCurrentGameState,
    optimalChallengeTarget,
} from "../services/ql-aiManager";
import {Actions} from "../data/actions";
import {Card} from "../model/domain/Card";
import {
    banishIfSuccumbed,
    challengeCharacter,
    drawCard,
    inkCard, isSuccumbed,
    playCharacterCard,
    playNonCharacterCard,
    quest,
    readyAllCards
} from "../services/playerManager";
import {resetInkTotal} from "../services/gameManager";

export class Agent {
    player: Player
    gameState: { player: PlayerGameState, hostilePlayer: PlayerGameState }
    /**
     * Each turn is an array, and in each turn you can do different actions which lead to different states
     */
    playedStates: string[][] = []

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
                       optimalQState: Record<string, number> = {},
                       explorationRate = 0.1, discountRate = 0.9, learningRate = 0.1) {
        if (!!optimalQState && Object.keys(optimalQState).length > 0) {
            Object.entries(optimalQState).forEach(([key, value]) => {
                this.qState[key] = value
            })
        }
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
                // deckCount: this.player.deck.length,
                fieldState: defineFieldState(this.player.activeRow),
                hand: defineHandState(this.player, []),
                inkTotal: 0,
                loreCount: 0
            },
            hostilePlayer: this.defineHostilePlayerState()
        }
    }

    async doTurnActions(newTurn = false, firstPlayerFirstTurn = false) {
        if (this.gameHasEnded()) {
            this.executeAction("END_TURN")
            return
        }
        if (newTurn) {
            this.playedStates.push([])
            resetInkTotal(this.player)
            readyAllCards(this.player.activeRow, this.player.waitRow)
        }
        if (!(firstPlayerFirstTurn && newTurn)) {
            drawCard(this.player.deck, this.player.hand)
        }
        this.gameState = {
            player: defineState(this.player, this.getOpposingActiveRow()),
            hostilePlayer: this.defineHostilePlayerState()
        };
        const chosenAction = await determineNextActionBasedByCurrentGameState(this.player, this.getHostilePlayer(), this.qState)

        // Execute the chosen action
        this.playedStates[this.playedStates.length - 1].push(chosenAction.nextSerializedState)
        this.executeAction(chosenAction.action.action, chosenAction.action.card);
        // Continue turn or end
        if (chosenAction.action.action !== "END_TURN") {
            await this.doTurnActions(); // Recursive call for the next action within the turn
        }
    }

    private executeAction(action: Actions, card?: Card | undefined) {
        // console.log(action, card?.name, card?.subName)
        switch (action) {
            case "INK_CARD":
                const result = inkCard(this.player.hand, card!, this.player.inkTotal, this.player.cardInInkRow);
                this.player.inkTotal = result.inkwell
                this.player.cardInInkRow = result.cardInInkRow
                this.player.alreadyInkedThisTurn = true
                break;
            case "CHALLENGE":
                // TODO do not make predefined choices (agent as well?)
                const challengeTarget = optimalChallengeTarget(this.getOpposingActiveRow(), card!);
                if (!challengeTarget) {
                    throw new Error('Defending character is undefined for challenge')
                }
                challengeCharacter(card!, challengeTarget)
                // TODO not the right place to do this
                banishIfSuccumbed(card!, this.player.activeRow, this.player.banishedPile)
                banishIfSuccumbed(challengeTarget, this.getOpposingActiveRow(), this.getOpposingBanishedPile())
                break;
            case "QUEST":
                quest(card!, this.player)
                break;
            case "PLAY_CARD":
                if (card!.type === 'Character') {
                    this.player.inkTotal = playCharacterCard(this.player.hand, this.player.waitRow, card!, this.player.inkTotal)
                } else if (card!.type === 'Action' || card!.type === 'Song') {
                    //TODO improve playing a song
                    this.player.inkTotal = playNonCharacterCard(this.player.hand, this.player.banishedPile, card!, this.player.inkTotal)
                } else {
                    this.player.inkTotal = playNonCharacterCard(this.player.hand, this.player.activeRow, card!, this.player.inkTotal)
                }
                break;
            case "END_TURN":
                // Do nothing
                break;
        }
    }

    rewardAgent = (score: number): Record<string, number> => {
        this.playedStates.reverse().forEach((turnActions, turnIndex) => {
            const discountFactor = Math.pow(this.discountRate, turnIndex); // Discount based on how far the action is
            turnActions.reverse().forEach((serializedState) => {
                let currentQ = 0
                if (this.qState[serializedState] !== undefined) {
                    currentQ = this.qState[serializedState]
                }
                const newQ = currentQ + this.learningRate * (score + discountFactor * currentQ);
                this.qState[serializedState] = newQ
            })
        })
        return this.qState
    }
}