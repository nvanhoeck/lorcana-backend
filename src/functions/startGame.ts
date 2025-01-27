import {SimpleDeck} from "lorcana-shared/model/PlayableDeck";
import {initializeGame} from "../services/gameManager";
import {Player} from "lorcana-shared/model/Player";
import {setupHandAndShuffleDeck} from 'lorcana-shared/utils'

export const startGame = async (players: {name: string, deck: SimpleDeck}[]) => {
    let game = await initializeGame(players);
    game.playerOne =  setupDeckAndHandForPlayer(game.playerOne)
    game. playerTwo = setupDeckAndHandForPlayer(game.playerTwo)
}

const setupDeckAndHandForPlayer = (player: Player) => {
    const {deck, hand} = setupHandAndShuffleDeck(player.deck, player.hand)
    player.deck = deck;
    player.hand = hand
    return player
}
