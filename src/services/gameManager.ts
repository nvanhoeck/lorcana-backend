import {Game} from "../model/domain/Game";
import {writeFile} from "./fileWriter";
import {readFile} from "./fileReader";
import {Card} from "../model/domain/Card";
import {v4 as uuidv4} from 'uuid';
import {SimpleDeck} from "../model/domain/PlayableDeck";
import {Player} from "../model/domain/Player";
import {shuffleArray} from "../utils/shuffleArray";
import {transferLastElements} from '../utils/transferElements'
import {Actions} from "../data/actions";
import {
    banishIfSuccumbed,
    challengeCharacter,
    inkCard,
    playCharacterCard,
    playNonCharacterCard,
    quest
} from "./playerManager";
import {optimalChallengeTarget} from "./mcts-aiManager";

const ROOT_FILE_PATH = ['..', '..', 'GameData']

export const saveGame = async (game: Game) => {
    await writeFile([...ROOT_FILE_PATH, 'Game', game.id], game)
}

export const loadGame = async (gameID: string) => {
    return await readFile([...ROOT_FILE_PATH, 'Game', gameID]) as Game
}

export const getAllCards = async () => {
    return await readFile(['..', 'data', 'cards.json']) as Card[]
}

const createCard = async (cardId: string) => {
    let card = (await getAllCards()).find((c) => c.id === cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`)
    return card
}

export const createCardCollection = async (cardsIds: {id:string, count: number}[]) => {
    const cards: Card[] = []
    for (const c of cardsIds) {
        for (let i = 0; i < c.count; i++) {
            const card = await createCard(c.id);
            cards.push(card);
        }
    }
    return cards;
}


const initializePlayer = async ({name, deck}: { name: string, deck: SimpleDeck }) => {
    const player: Player = {
        activeRow: [],
        alreadyInkedThisTurn: false,
        banishedPile: [],
        deck: await createCardCollection(deck.cards),
        hand: [],
        inkTotal: 0,
        cardInInkRow: 0,
        loreCount: 0,
        name,
        waitRow: []
    }
    return player
}

export const initializeGame = async (playersAndDecks: { name: string, deck: SimpleDeck }[]) => {
    const game: Game = {
        id: uuidv4(),
        playerOne: await initializePlayer(playersAndDecks[0]),
        playerTwo: await initializePlayer(playersAndDecks[1]),
        playerTurn: playersAndDecks[0].name
    }
    return game
}

export const setupHandAndShuffleDeck = (deck: Card[], hand: Card[]) => {
    let cards = shuffleArray(deck);
    transferLastElements(cards, hand, 6)
    return {deck: cards, hand: hand}
}

export const hasEnded = (game: Game) => {
    return game.playerOne.loreCount >= 20 || game.playerTwo.loreCount >= 20 || game.playerOne.deck.length === 0 || game.playerTwo.deck.length === 0
}

/**
 * Function to print player details in a structured, card game table-like format.
 * @param player The player object to print.
 */
export function printPlayerDetails(player: Player) {
    console.groupCollapsed(`%c=== Player: ${player.name} ===`, 'color: #2E86C1; font-weight: bold;');

    // Stats Table
    console.log(`%c**Stats**`, 'color: #28B463; font-weight: bold;');
    console.table({
        "Ink Total": player.inkTotal,
        "Cards in Ink Row": player.cardInInkRow,
        "Lore Count": player.loreCount,
        "Already Inked This Turn": player.alreadyInkedThisTurn ? 'Yes' : 'No',
        "Deck Count": player.deck.length,
        "Banished Pile Count": player.banishedPile.length,
    });

    // Hand
    console.log(`%c**Hand (${player.hand.length} cards)**`, 'color: #28B463; font-weight: bold;');
    if (player.hand.length > 0) {
        player.hand.forEach((card, index) => {
            console.log(`%c${index + 1}. ${card.name}`, 'color: #F1C40F;');
        });
    } else {
        console.log(`%cEmpty`, 'color: #E74C3C;');
    }

    // Active Row (Upper Row)
    console.log(`%c**Active Row (Upper Row) (${player.activeRow.length} cards)**`, 'color: #28B463; font-weight: bold;');
    if (player.activeRow.length > 0) {
        player.activeRow.forEach((card, index) => {
            console.log(`%c${index + 1}. ${card.name}`, 'color: #F39C12;');
        });
    } else {
        console.log(`%cEmpty`, 'color: #E74C3C;');
    }

    // Waiting Row (Lower Row)
    console.log(`%c**Waiting Row (Lower Row) (${player.waitRow.length} cards)**`, 'color: #28B463; font-weight: bold;');
    if (player.waitRow.length > 0) {
        player.waitRow.forEach((card, index) => {
            console.log(`%c${index + 1}. ${card.name}`, 'color: #F39C12;');
        });
    } else {
        console.log(`%cEmpty`, 'color: #E74C3C;');
    }

    console.groupEnd();
}

/**
 * Function to print the entire game state for all players.
 * @param players Array of players in the game.
 */
export function printGameDetails(players: Player[]) {
    console.groupCollapsed(`%c=== Game State ===`, 'color: #8E44AD; font-size: 16px; font-weight: bold;');
    players.forEach(player => printPlayerDetails(player));
    console.groupEnd();
}

export function resetInkTotal(player: Player) {
    player.inkTotal = player.cardInInkRow
    player.alreadyInkedThisTurn = false
}


export const executeAction = (action: Actions, player: Player, hostilePlayer: Player, card?: Card | undefined) => {
    // console.log(action, card?.name, card?.subName)
    switch (action) {
        case "INK_CARD":
            const result = inkCard(player.hand, card!, player.inkTotal, player.cardInInkRow);
            player.inkTotal = result.inkwell
            player.cardInInkRow = result.cardInInkRow
            player.alreadyInkedThisTurn = true
            break;
        case "CHALLENGE":
            // TODO do not make predefined choices (agent as well?)
            const challengeTarget = optimalChallengeTarget(hostilePlayer.activeRow, card!);
            if (!challengeTarget) {
                throw new Error('Defending character is undefined for challenge')
            }
            challengeCharacter(card!, challengeTarget)
            // TODO not the right place to do this
            banishIfSuccumbed(card!, player.activeRow, player.banishedPile)
            banishIfSuccumbed(challengeTarget, hostilePlayer.activeRow, hostilePlayer.banishedPile)
            break;
        case "QUEST":
            quest(card!, player)
            break;
        case "PLAY_CARD":
            if (card!.type === 'Character') {
                player.inkTotal = playCharacterCard(player.hand, player.waitRow, card!, player.inkTotal)
            } else if (card!.type === 'Action' || card!.type === 'Song') {
                //TODO improve playing a song
                player.inkTotal = playNonCharacterCard(player.hand, player.banishedPile, card!, player.inkTotal)
            } else {
                player.inkTotal = playNonCharacterCard(player.hand, player.activeRow, card!, player.inkTotal)
            }
            break;
        case "END_TURN":
            // Do nothing
            break;
    }
}