import {Card} from "lorcana-shared/model/Card";
import {Actions} from "lorcana-shared/model/actions";

export type DetermineAgentNextActionResponseBody = {
    chosenAction: { id: string; action: { cardIdx?: number; card?: Card; action: Actions; stats?: { power: number } | undefined }, targetIdx?:number } | null
}