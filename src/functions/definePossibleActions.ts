import {Player} from "lorcana-shared/model/Player";
import {ActivatedAbility, Card, isActivatedAbility} from "lorcana-shared/model/Card";
import {Actions} from "lorcana-shared/model/actions";
import {eligibleTargets} from "lorcana-shared/utils/eligibleTargets";
import {aWonderfulDreamCanBeExecuted, canShift, canSing, shiftCost} from "lorcana-shared/model/abilities";

type PossibleActions = Record<Actions, any[]>; // Create a type where keys are from 'Actions' and values are arrays of any type.

function isLegitimateActivatedAbility(name: ActivatedAbility['name'], player: Player, hostilePlayerActiveRow: Card[]) {
    // TODO debug
    if (name === 'A WONDERFUL DREAM') {
        return aWonderfulDreamCanBeExecuted(player.activeRow)
    } else {
        console.error(name)
        throw new Error("Unhandled card activation")
    }
}

function definePossibleCardEffectActions(activeRow: Card[], player: Player, opposingPlayerActiveRow: Card[]) {
    return activeRow.filter((c) => c.readied && c.abilities.find((a) => isActivatedAbility(a) && isLegitimateActivatedAbility(a.name, player, opposingPlayerActiveRow)))
}

export const definePossibleActionsWithoutEndTurn = (player: Player, opposingPlayerActiveRow: Card[]) => {
    try {
        const possibleActions: PossibleActions = {
            PLAY_CARD: [],
            CHALLENGE: [],
            QUEST: [],
            INK_CARD: [],
            END_TURN: [],
            SING: [],
            CARD_EFFECT_ACTIVATION: [],
            SHIFT: []
        }
        if (!player.alreadyInkedThisTurn) {
            possibleActions.INK_CARD.push(...definePossibleInkableCards(player.hand))
        }
        if (eligibleTargets(opposingPlayerActiveRow).length > 0) {
            possibleActions.CHALLENGE.push(...definePossibleAttackingCards(player.activeRow))
        }
        possibleActions.PLAY_CARD.push(...definePossiblePlayableCards(player.hand, player.inkTotal))
        possibleActions.QUEST.push(...definePossibleQuestingCards(player.activeRow))
        possibleActions.SING.push(...definePossibleSingCards(player.hand))
        possibleActions.CARD_EFFECT_ACTIVATION.push(...definePossibleCardEffectActions(player.activeRow, player, opposingPlayerActiveRow))
        possibleActions.SHIFT.push(...definePossibleShiftableCards(player.hand, player.activeRow, player.inkTotal))

        return possibleActions
    } catch (e) {
        return {
            PLAY_CARD: [],
            CHALLENGE: [],
            QUEST: [],
            INK_CARD: [],
            END_TURN: [],
            SING: [],
            CARD_EFFECT_ACTIVATION: [],
            SHIFT: []
        }
    }
}

// TODO extend checks with abilities, create method that loops over all abilities, properties & disables

const definePossibleInkableCards = (hand: Card[]) => {
    return hand.filter((c) => c.inkable && !c.disabled.includes('INK_CARD'))
}

const definePossibleAttackingCards = (activeRow: Card[]) => {
    return activeRow.filter((c) => c.readied && c.type === 'Character' && !c.disabled.includes('CHALLENGE'))
}

const definePossiblePlayableCards = (hand: Card[], inkTotal: number) => {
    return hand.filter((c) => c.inkCost <= inkTotal && c.type === 'Character' && !c.disabled.includes('PLAY_CARD'))
}

const definePossibleQuestingCards = (activeRow: Card[]) => {
    return activeRow.filter((c) => c.readied && c.type === 'Character' && !c.disabled.includes('QUEST'))
}

const definePossibleSingCards = (hand: Card[]) => {
    return hand.filter((c) => c.type === 'Song' && !c.disabled.includes('SING') && canSing(c))
}
const definePossibleShiftableCards = (hand: Card[], activeRow: Card[], inkTotal: number) => {
    return hand.filter((c) => canShift(c, activeRow) && shiftCost(c) <= inkTotal)
}