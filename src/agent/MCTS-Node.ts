import {Card, Player, PlayerGameState} from "../model";
import {Actions} from "../data/actions";
import {definePossibleActionsWithoutEndTurn} from "../functions";
import {serializeState} from "../services/mcts-aiManager";

export class MCTSNode {
    state: {
        player: PlayerGameState,
        hostilePlayer: PlayerGameState
    }
    serializedState: string;
    parent: MCTSNode | null;
    children: Map<string, MCTSNode>;
    visits: number;
    totalReward: number;
    action: { id: string; action: { card?: Card; action: Actions; stats?: { power: number } | undefined } } | null

    constructor(playerState: {
        player: PlayerGameState,
        hostilePlayer: PlayerGameState
    }, parent: MCTSNode | null = null, action: {
        id: string;
        action: { card?: Card; action: Actions; stats?: { power: number; } | undefined; };
    } | null = null) {
        this.state = playerState
        this.serializedState = serializeState(playerState);
        this.parent = parent;
        this.children = new Map();
        this.visits = 0;
        this.totalReward = 0;
        this.action = action;
    }

    isFullyExpanded(player: Player, hostilePlayerActiveRow: Card[]): boolean {
        const allPossibleActions = definePossibleActionsWithoutEndTurn(player, hostilePlayerActiveRow);
        let amountOfPossibleActions = 0
        Object.keys(allPossibleActions).forEach((key) => {
            amountOfPossibleActions += allPossibleActions[key as keyof typeof allPossibleActions].length
        })
        if (amountOfPossibleActions === 0) {
            // console.log('Ran out of possible actions')
            // console.log(allPossibleActions)
        }
        const addTurnIncrementMissing = 1;
        if (amountOfPossibleActions + addTurnIncrementMissing === this.children.size) {
            // console.log('Amount of children matches amount of possible actions')
            // console.log(allPossibleActions)
            // console.log(amountOfPossibleActions)
        }
        // console.log(this.children.size, amountOfPossibleActions + addTurnIncrementMissing)
        return this.children.size === amountOfPossibleActions + addTurnIncrementMissing;
    }

    bestChild(explorationParam = Math.sqrt(2)): MCTSNode {
        return Array.from(this.children.values()).reduce((best, child) => {
            const uctValue =
                child.totalReward / child.visits +
                explorationParam * Math.sqrt(Math.log(this.visits) / child.visits);
            return uctValue > (best.uct || -Infinity)
                ? {node: child, uct: uctValue}
                : best;
        }, {node: null, uct: -Infinity} as { node: MCTSNode | null; uct: number }).node!;
    }
}