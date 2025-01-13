import {Card} from "../model/domain/Card";

export const eligibleTargets = (opposingActiveRow: Card[]) => {
    return opposingActiveRow.filter((r) => !r.readied && r.type === 'Character' || r.type === 'Location');
}