import {SimpleDeck} from "../model/domain/PlayableDeck";
import {initializeGame, setupHandAndShuffleDeck} from "../services/gameManager";
import {Player} from "../model/domain/Player";
import {readFile} from "../services/fileReader";

export const startGame = async (players: {name: string, deck: SimpleDeck}[]) => {
    let game = await initializeGame(players);
    game.playerOne =  setupDeckAndHandForPlayer(game.playerOne)
    game. playerTwo = setupDeckAndHandForPlayer(game.playerTwo)
    console.log(game)
    console.log(game.playerOne.hand.length)
    console.log(game.playerOne.deck.length)
}

const setupDeckAndHandForPlayer = (player: Player) => {
    const {deck, hand} = setupHandAndShuffleDeck(player.deck, player.hand)
    player.deck = deck;
    player.hand = hand
    return player
}
readFile(['..','..','GameData','Decks','FirstChapter-SteelSapphire-StarterDeck.json']).then((deck: unknown) => {
    startGame([
        {name:'Niko', deck: deck as SimpleDeck},
        {name:'AI', deck: deck as SimpleDeck}
    ]).then()
})
