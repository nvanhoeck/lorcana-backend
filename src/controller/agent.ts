import express from 'express';
import {setCorsHeaders} from "../utils/setCorsHeaders";
import {DetermineAgentNextActionRequestBody} from "./dto/DetermineAgentNextActionRequestBody";
import {DetermineAgentNextActionResponseBody} from "./dto/DetermineAgentNextActionResponseBody";
import {determineNextActionBasedByCurrentGameState, optimalChallengeTarget} from "../services/mcts-aiManager";

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
        const chosenNode = await determineNextActionBasedByCurrentGameState({...currentActivePlayer}, {...currentHostilePlayer});
        if (chosenNode.action!.action.action === 'CHALLENGE') {
            const activeRow = game.playerTurn === game.playerOne.name ? game.playerTwo.activeRow : game.playerOne.activeRow;
            optimalChallengeTarget(activeRow, chosenNode.action!.action.card!)
        }

        res.status(200).json({chosenAction: chosenNode.action})
    }
)

export default router