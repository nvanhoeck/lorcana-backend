import {Game} from "../model/domain/Game";
import {writeFile} from "./fileWriter";
import {readFile} from "./fileReader";
import {Card} from "../model/domain/Card";
import {v4 as uuidv4} from 'uuid';
import {SimpleDeck} from "../model/domain/PlayableDeck";
import {Player} from "../model/domain/Player";
import {shuffleArray} from "../utils/shuffleArray";
import {transferLastElements} from '../utils/transferElements'

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

const createDeck = async (deck: SimpleDeck) => {
    const cards: Card[] = []
    for (const c of deck.cards) {
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
        deck: await createDeck(deck),
        hand: [],
        inkTotal: 0,
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
        playerTwo: await initializePlayer(playersAndDecks[0]),
        playerTurn: playersAndDecks[0].name
    }
    return game
}

export const setupHandAndShuffleDeck = (deck: Card[], hand: Card[]) => {
    let cards = shuffleArray(deck);
    transferLastElements(cards, hand, 6)
    return {deck: cards, hand: hand}
}