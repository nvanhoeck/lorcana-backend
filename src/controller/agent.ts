import express from 'express';
import {StartGameRequestBody} from "./dto/StartGameRequestBody";
import {StartGameResponseBody} from "./dto/StartGameResponeBody";
import {createCardCollection, determineNextActionBasedByCurrentGameState, getAllCards, readFile} from "../services";
import {SimpleDeck} from "../model";
import {setCorsHeaders} from "../utils/setCorsHeaders";
import {GetCardsRequestBody} from "./dto/GetCardsRequestBody";
import {GetCardsResponseBody} from "./dto/GetCardsResponseBody";
import {DetermineAgentNextActionRequestBody} from "./dto/DetermineAgentNextActionRequestBody";
import {DetermineAgentNextActionResponseBody} from "./dto/DetermineAgentNextActionResponseBody";

const router = express.Router();

// Determine the next action based on game state
router.post('/determine-action', async (req: express.Request<{}, {}, DetermineAgentNextActionRequestBody>, res: express.Response<DetermineAgentNextActionResponseBody | string>) => {
        setCorsHeaders(res)
        const body = req.body
        if (!body || !body?.game) {
            res.status(400).send('No proper body available')
            return
        }
        const game = body.game
        const currentActivePlayer = game.playerOne.name === game.playerTurn ? game.playerOne : game.playerTwo
        const currentHostilePlayer = game.playerOne.name === game.playerTurn ? game.playerTwo : game.playerOne
        const chosenAction = await determineNextActionBasedByCurrentGameState(currentActivePlayer, currentHostilePlayer);
        res.status(200).json({chosenAction})
    }
)

export default router