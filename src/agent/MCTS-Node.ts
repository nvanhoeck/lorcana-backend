import {Card} from "lorcana-shared/model/Card";
import {PlayerGameState} from "lorcana-shared/model/ai/State";
import {Actions} from "lorcana-shared/model/actions";
import {serializeState} from "../services/mcts-aiManager";


type SerializedMCTSNode = {
    state: {
        player: PlayerGameState;
        hostilePlayer: PlayerGameState;
    };
    serializedState: string;
    // parent: string | null; // References the serializedState of the parent node
    children: {
        key: string;
        child: SerializedMCTSNode;
    }[];
    visits: number;
    totalReward: number;
    action: {
        id: string;
        action: {
            cardIdx?: number;
            card?: Card;
            action: Actions;
            stats?: { power: number } | undefined;
            targetIdx?: number;
        };
    } | null;
};

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
    action: {
        id: string;
        action: {
            cardIdx?: number;
            card?: Card;
            action: Actions;
            stats?: { power: number } | undefined;
            targetIdx?: number
        };
    } | null

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

    toJSON(): SerializedMCTSNode {
        return {
            state: this.state,
            serializedState: this.serializedState,
            // parent: this.parent ? this.parent.serializedState : null, // Prevent circular reference
            children: Array.from(this.children.entries()).map(([key, child]) => ({
                key,
                child: child.toJSON() // Recursively serialize children
            })),
            visits: this.visits,
            totalReward: this.totalReward,
            action: this.action
        }
    }
}