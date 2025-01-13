import {hasEnded, initializeGame, printGameDetails, setupHandAndShuffleDeck} from "../services/gameManager";
import {readFile} from "../services/fileReader";
import {SimpleDeck} from "../model/domain/PlayableDeck";
import {Agent} from "./agent";
import {Player} from "../model/domain/Player";
import {defineState} from "../services/aiManager";

const doTurn = async (agent: Agent, firstPlayerFirstTurn = false) => {
    await agent.doTurnActions(true, firstPlayerFirstTurn)
};

function setupPlayer(player: Player) {
    const {deck, hand} = setupHandAndShuffleDeck(player.deck, player.hand)
    player.deck = deck
    player.hand = hand
}

export const trainAgent = async () => {
    const playerOne = 'AgentOne'
    const playerTwo = 'AgentTwo'
    const sharedDeck = await readFile(['..', '..', 'GameData', 'Decks', 'FirstChapter-SteelSapphire-StarterDeck.json']) as SimpleDeck
    let optimalQstate = undefined
    try {
        optimalQstate = await readFile(['..', 'data', 'MostOptimal_qstate.json']) as Record<string, number>
    } catch (e) {
        console.warn('Optimal qstate file not found')
    }
    let optimalQStateOne: Record<string, number> | undefined = optimalQstate
    let optimalQStateTwo:  Record<string, number> | undefined = optimalQstate

    for (let i = 0; i < 1; i++) {
        const game = await initializeGame([{
            name: playerOne,
            deck: sharedDeck
        }, {
            name: playerTwo,
            deck: sharedDeck
        }])

        const getAgentOneActiveRow = () => game.playerOne.activeRow
        const getAgentTwoActiveRow = () => game.playerTwo.activeRow
        const getAgentOneBanishedPile = () => game.playerOne.banishedPile
        const getAgentTwoBanishedPile = () => game.playerTwo.banishedPile
        const validateWinConditions = () => hasEnded(game)
        const playerOneState = () => defineState(game.playerOne, getAgentTwoActiveRow())
        const playerTwoState = () => defineState(game.playerTwo, getAgentOneActiveRow())


        const agentOne = new Agent(game.playerOne, {
            getOpposingActiveRow: getAgentTwoActiveRow,
            validateWinConditions,
            getOpposingBanishedPile: getAgentTwoBanishedPile,
            defineHostilePlayerState: playerTwoState
        }, optimalQStateOne, Math.pow(1, i), 0.9, 0.1)
        const agentTwo = new Agent(game.playerTwo, {
            getOpposingActiveRow: getAgentOneActiveRow,
            validateWinConditions,
            getOpposingBanishedPile: getAgentOneBanishedPile,
            defineHostilePlayerState: playerOneState
        }, optimalQStateTwo, Math.pow(1, i), 0.9, 0.1)
        setupPlayer(game.playerOne);
        setupPlayer(game.playerTwo);

        await doTurn(agentOne, true)
        printGameDetails([game.playerOne, game.playerTwo])
        game.playerTurn = playerTwo
        await doTurn(agentTwo)
        printGameDetails([game.playerOne, game.playerTwo])
        game.playerTurn = playerOne
        do {
            await doTurn(agentOne)
            printGameDetails([game.playerOne, game.playerTwo])
            if (hasEnded(game)) {
                break
            }
            game.playerTurn = playerTwo
            await doTurn(agentTwo)
            printGameDetails([game.playerOne, game.playerTwo])
            if (hasEnded(game)) {
                break
            }
            game.playerTurn = playerOne
        } while (!hasEnded(game))

        if (agentOne.player.loreCount >= 20) {
            console.log('LORE WINNING')
        }
        if (agentTwo.player.loreCount >= 20) {
            console.log('LORE WINNING')
        }
        const agentOneScore = (agentOne.player.deck.length === 0 ? -1 : 0) + agentOne.player.loreCount + (agentOne.player.loreCount >= 20 ? 5 : 0) - 19 // -19 is for preventing status quo rewards (didn't loose, but didn't had any lore)
        const agentTwoScore = (agentTwo.player.deck.length === 0 ? -1 : 0) + agentTwo.player.loreCount + (agentTwo.player.loreCount >= 20 ? 5 : 0) - 19

        const newAgentOneQState: Record<string, number> = agentOne.rewardAgent(agentOneScore);
        const newAgentTwoQState: Record<string, number> = agentTwo.rewardAgent(agentTwoScore)
        optimalQStateOne = newAgentOneQState
        optimalQStateTwo = newAgentTwoQState
        console.log('cycle ' + i)

    }
    return {optimalQStateOne, optimalQStateTwo}
}

trainAgent().then()