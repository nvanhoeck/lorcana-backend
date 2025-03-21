import {Game} from "lorcana-shared/model/Game";
import {writeFile} from "./fileWriter";
import {readFile} from "./fileReader";
import {Card, isActivatedAbility, isTriggeredAbility} from "lorcana-shared/model/Card";
import {v4 as uuidv4} from 'uuid';
import {SimpleDeck} from "lorcana-shared/model/PlayableDeck";
import {Player} from "lorcana-shared/model/Player";
import {Actions} from "lorcana-shared/model/actions";
import {
    banishIfSuccumbed,
    challengeCharacter,
    inkCard,
    playCharacterCard,
    playNonCharacterCard,
    quest
} from "./playerManager";
import {singASongCard} from 'lorcana-shared/utils/singASong'
import {aWonderfulDream, aWonderfulDreamOptimalTarget, support} from 'lorcana-shared/model/abilities'
import {optimalChallengeTarget} from "./mcts-aiManager";
import {reviseAllCardsInPlay, shiftCharacterCard} from "lorcana-shared/utils";
import {runOverAllTriggeredAbilities} from "./abilitiesManager";

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

export const createCard = async (cardId: string) => {
    let card = (await getAllCards()).find((c) => c.id === cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`)
    return card
}

export const createCardCollection = async (cardsIds: { id: string, count: number }[]) => {
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

const inkCardExecution = (player: Player, cardIdx: number | undefined, opposingPlayer: Player) => {
    const result = inkCard(player.hand, cardIdx!, player.inkTotal, player.cardInInkRow);
    player.inkTotal = result.inkwell
    player.cardInInkRow = result.cardInInkRow
    player.alreadyInkedThisTurn = true
    reviseAllCardsInPlay(player, opposingPlayer)
};

const challengeExecution = (opposingPlayer: Player, card: Card, player: Player, cardIdx: number | undefined, targetIndex: number | undefined) => {
    // TODO do not make predefined choices (agent as well?)
    const challengeTarget = optimalChallengeTarget(opposingPlayer.activeRow, card!);
    if (!challengeTarget) {
        throw new Error('Defending character is undefined for challenge')
    }
    challengeCharacter(player.activeRow, cardIdx!, opposingPlayer.activeRow, targetIndex!)
    if (card!.readied) {
        throw new Error('Not properly updated')
    }
    banishIfSuccumbed(cardIdx!, player.activeRow, player.banishedPile)
    banishIfSuccumbed(targetIndex!, opposingPlayer.activeRow, opposingPlayer.banishedPile)
    reviseAllCardsInPlay(player, opposingPlayer)
};

const questExecution = (player: Player, cardIdx: number | undefined, card: Card, opposingPlayer: Player) => {
    quest(player.activeRow, cardIdx!, player)
    if (card!.readied) {
        throw new Error('Not properly updated')
    }
    support(card!, player)
    if (card!.abilities.find((a) => isTriggeredAbility(a))) {
        card.abilities.filter((a) => isTriggeredAbility(a)).forEach((a) => runOverAllTriggeredAbilities(card, player.activeRow, player, opposingPlayer, a, 'QUEST'))
    }
    reviseAllCardsInPlay(player, opposingPlayer)
};

const playerCardExecution = (card: Card, player: Player, cardIdx: number | undefined, opposingPlayer: Player) => {
    if (card!.type === 'Character') {
        player.inkTotal = playCharacterCard(player.hand, player.waitRow, cardIdx!, player.inkTotal, player.activeRow)
    } else if (card!.type === 'Action') {
        player.inkTotal = playNonCharacterCard(player.hand, player.banishedPile, cardIdx!, player.inkTotal)
    } else {
        player.inkTotal = playNonCharacterCard(player.hand, player.activeRow, cardIdx!, player.inkTotal)
    }
    if (card!.abilities.find((a) => isTriggeredAbility(a))) {
        card.abilities.filter((a) => isTriggeredAbility(a)).forEach((a) => runOverAllTriggeredAbilities(card, player.hand, player, opposingPlayer, a, 'PLAY_CARD'))
    }
    reviseAllCardsInPlay(player, opposingPlayer)
};

const singExecution = (card: Card, player: Player, cardIdx: number | undefined, opposingPlayer: Player) => {
    if (card!.type === 'Song') {
        player.inkTotal = singASongCard(player.hand, player.activeRow, cardIdx!, player.inkTotal, player.banishedPile)
    } else {
        throw new Error('Cannot sing a non-song card')
    }
    reviseAllCardsInPlay(player, opposingPlayer)
};

const cardEffectActivation = (card: Card, player: Player, opposingPlayer: Player) => {
    if (card!.abilities.filter((a) => isActivatedAbility(a)).length > 1) {
        throw new Error("Has multiple effects, which is not yet developed")
    } else if (card!.abilities.find((a) => isActivatedAbility(a))) {
        const ability = card!.abilities.find((a) => isActivatedAbility(a))!;
        // TODO when extended, improve code
        if (ability.name === 'A WONDERFUL DREAM') {
            const optimalTarget = aWonderfulDreamOptimalTarget(player.activeRow);
            if (optimalTarget) {
                aWonderfulDream(optimalTarget)
                card!.readied = false
            } else {
                throw new Error("Performing A Wonderfull dream on non legitimate targets")
            }
        }
    } else {
        throw new Error("Trying to trigger a card effect activation where there is none")
    }
    reviseAllCardsInPlay(player, opposingPlayer)
};

export const executeAction = (action: Actions, player: Player, opposingPlayer: Player, cardIdx?: number, targetIndex?: number) => {
    const card = action === 'INK_CARD' || action === 'PLAY_CARD' || action === 'SHIFT' ? player.hand[cardIdx!] : player.activeRow[cardIdx!]
    // console.log(action, card?.name, card?.subName)
    switch (action) {
        case "INK_CARD":
            inkCardExecution(player, cardIdx, opposingPlayer);
            break;
        case "CHALLENGE":
            challengeExecution(opposingPlayer, card, player, cardIdx, targetIndex);
            break;
        case "QUEST":
            questExecution(player, cardIdx, card, opposingPlayer);
            break;
        case "SHIFT": {
            if (card!.type === 'Character') {
                player.inkTotal = shiftCharacterCard(player, player.hand, player.activeRow, player.banishedPile, cardIdx!, targetIndex!, player.inkTotal)
            }
        }
        case "PLAY_CARD":
            playerCardExecution(card, player, cardIdx, opposingPlayer);
            break;
        case "SING":
            singExecution(card, player, cardIdx, opposingPlayer);
            break;
        case "CARD_EFFECT_ACTIVATION":
            cardEffectActivation(card, player, opposingPlayer);
        case "END_TURN":
            // Do nothing
            break;

    }
}