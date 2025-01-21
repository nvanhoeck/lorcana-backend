import {Card} from "../../model";
import {Actions} from "../../data/actions";

export type DetermineAgentNextActionResponseBody = {
    chosenAction: { id: string; action: { cardIdx?: number; card?: Card; action: Actions; stats?: { power: number } | undefined }, targetIdx?:number } | null
}