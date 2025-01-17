import {hasEnded, initializeGame, printGameDetails, setupHandAndShuffleDeck} from "../services/gameManager";
import {readFile} from "../services/fileReader";
import {SimpleDeck} from "../model/domain/PlayableDeck";
import {Agent} from "./agent";
import {Player} from "../model/domain/Player";
import {defineState} from "../services/ql-aiManager";
import {ExponentialDecayExploration, LinearDecayExploration} from "./exploration-rate";

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
    let optimalQStateTwo: Record<string, number> | undefined = optimalQstate
    const linearDecayExploration = new LinearDecayExploration(1, 0.01, 1 / 100);
    const exponentionalDecayExploration = new ExponentialDecayExploration(1, 0.01, 1 / 100);

    for (let i = 0; i < 100; i++) {
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
            defineHostilePlayerState: playerTwoState,
            getHostilePlayer: () => game.playerTwo
        }, optimalQStateOne, linearDecayExploration.getRate(i), 0.9, 0.1)
        const agentTwo = new Agent(game.playerTwo, {
            getOpposingActiveRow: getAgentOneActiveRow,
            validateWinConditions,
            getOpposingBanishedPile: getAgentOneBanishedPile,
            defineHostilePlayerState: playerOneState,
            getHostilePlayer: () => game.playerOne
        }, optimalQStateTwo, exponentionalDecayExploration.getRate(i), 0.9, 0.1)
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
                console.log(game)
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
        const agentOneScore = (agentOne.player.deck.length === 0 ? -5 : 0) + (agentOne.player.loreCount >= 20 ? +5 : 0)
        const agentTwoScore = (agentTwo.player.deck.length === 0 ? -5 : 0) + (agentOne.player.loreCount >= 20 ? +5 : 0)

        const newAgentOneQState: Record<string, number> = agentOne.rewardAgent(agentOneScore);
        const newAgentTwoQState: Record<string, number> = agentTwo.rewardAgent(agentTwoScore)
        optimalQStateOne = newAgentOneQState
        optimalQStateTwo = newAgentTwoQState
        console.log('cycle ' + i)

    }
    return {optimalQStateOne, optimalQStateTwo}
}

trainAgent().then()