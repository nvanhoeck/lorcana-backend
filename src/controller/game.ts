import express from 'express';
import {StartGameRequestBody} from "./dto/StartGameRequestBody";
import {StartGameResponseBody} from "./dto/StartGameResponeBody";
import {readFile} from "../services";
import {SimpleDeck} from "lorcana-shared/model/PlayableDeck";
import {setCorsHeaders} from "../utils/setCorsHeaders";

const router = express.Router();

// Start a game
router.post('/', async (req: express.Request<{}, {}, StartGameRequestBody>, res: express.Response<StartGameResponseBody | string>) => {
        setCorsHeaders(res)
        const body = req.body
        if (!body || !body?.playerOne || !body?.playerTwo) {
            res.status(400).send('No body available')
            return
        }
        if (!body.playerOne.name) {
            res.status(400).send('No name available for player one')
            return;
        }
        if (!body.playerTwo.name) {
            res.status(400).send('No name available for player two')
            return;
        }
        if (!body.playerOne.deck) {
            res.status(400).send('No deck available for player one')
            return;
        }
        if (!body.playerTwo.deck) {
            res.status(400).send('No deck available for player two')
            return;
        }
        const sharedDeck = await readFile(['..', '..', 'GameData', 'Decks', 'FirstChapter-SteelSapphire-StarterDeck.json']) as SimpleDeck;


        res.status(200).json({
            playerTwo: {deck: sharedDeck, name: body.playerTwo.name},
            playerOne: {deck: sharedDeck, name: body.playerOne.name}
        })
    }
)

export default router