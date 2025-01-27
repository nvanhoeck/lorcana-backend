import express from 'express';
import {createCardCollection, getAllCards} from "../services";
import {GetCardsRequestBody} from "./dto/GetCardsRequestBody";
import {GetCardsResponseBody} from "./dto/GetCardsResponseBody";
import {setCorsHeaders} from "../utils/setCorsHeaders";

const router = express.Router();

// Get detailed info about a list of cards
// No array means get all cards
router.post('/', async (req: express.Request<{}, {}, GetCardsRequestBody>, res: express.Response<GetCardsResponseBody | string>) => {
        setCorsHeaders(res)
        const body = req.body
        if (!body || !body?.cardIdAndCount) {
            res.status(400).send('No body available')
            return
        }

        if (body.cardIdAndCount.length === 0) {
            const allCards = await getAllCards();
            res.status(200).send({cards: allCards})
        }

        const cards = await createCardCollection(body.cardIdAndCount);
        res.status(200).json({cards})
    }
)

export default router