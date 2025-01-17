import express from 'express';
import game from './controller/game'
import cors from 'cors'
import card from "./controller/card";
import agent from "./controller/agent";
const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use("/game", game);
app.use("/card", card);
app.use("/agent", agent);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
