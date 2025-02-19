// import {Actions} from "../data/actions";
// import {Card} from "lorcana-shared/model//domain/Card";
// import {Player} from "lorcana-shared/model//domain/Player";
// import {defineCardAmountRange, FieldState, HandState, PlayerGameState} from "lorcana-shared/model//ai/State";
// import path from "path";
// import fs from "fs";
// import {eligibleTargets} from "lorcana-shared/utils/eligibleTargets";
// import {readFile} from "./fileReader";
// import {definePossibleActions} from "../functions";
//
// // Reinforcement Learning / DEPRECATED
// export const determineNextActionBasedByCurrentGameState = async (player: Player, opposingPlayer: Player, qState?: Record<string, number>) => {
//     // const currentPlayerState = defineState(player, opposingPlayer.activeRow);
//     // const currentOpposingPlayerState = defineState(opposingPlayer, player.activeRow);
//     // if (!qState) {
//     //     const optimalQstate = await readFile(['..', 'data', 'MostOptimal_qstate.json']) as Record<string, number>
//     //     return defineActionsByOptimalState(player, opposingPlayer.activeRow, 0, {
//     //         player: currentPlayerState,
//     //         hostilePlayer: currentOpposingPlayerState
//     //     }, optimalQstate)
//     // } else {
//     //     return defineActionsByOptimalState(player, opposingPlayer.activeRow, 0, {
//     //         player: currentPlayerState,
//     //         hostilePlayer: currentOpposingPlayerState
//     //     }, qState)
//     // }
//
// // TODO MCTS inserted here
// }
//
// export const defineActionsByOptimalState = (player: Player, opposingActiveRow: Card[], explorationRate: number, gameState: {
//     player: PlayerGameState,
//     hostilePlayer: PlayerGameState
// }, qState: Record<string, number>) => {
//     const possibleActions = definePossibleActions(player, opposingActiveRow);
//
//     const allActions: {
//         card?: Card,
//         action: Actions,
//         stats?: {
//             power: number
//         } | undefined
//     }[] = [{
//         action: "END_TURN" as Actions,
//         stats: undefined,
//     },
//         ...possibleActions.QUEST.map(cardForAction => ({
//             card: cardForAction,
//             action: "QUEST" as Actions,
//         })),
//         ...possibleActions.CHALLENGE.map(cardForAction => ({
//             card: cardForAction,
//             action: "CHALLENGE" as Actions,
//         })),
//         ...possibleActions.INK_CARD.map((cardForAction: Card) => ({
//             card: cardForAction,
//             action: "INK_CARD" as Actions
//         })),
//         ...possibleActions.PLAY_CARD.map(cardForAction => ({
//             card: cardForAction,
//             action: "PLAY_CARD" as Actions,
//         })),
//     ];
//     let chosenAction = undefined
//     // TODO MCTS inserted here
//     // if (Math.random() < explorationRate) {
//     //     chosenAction = chooseOptimalAction(gameState, [allActions[Math.floor(Math.random() * allActions.length)]], qState, opposingActiveRow)
//     // } else {
//     //     const bestAction = chooseOptimalAction(gameState, allActions, qState, opposingActiveRow)
//     //     if (!bestAction) throw new Error('Something went wrong chosing best action')
//     //     else chosenAction = bestAction
//     // }
//     //
//     // if (!chosenAction) throw new Error('Something went wrong chosing best action')
//     //
//     // return chosenAction
// }
//
//
// export const defineState = (player: Player, opposingPlayerActiveRow: Card[]): PlayerGameState => {
//     return {
//         // alreadyInked: player.alreadyInkedThisTurn,
//         // deckCount: player.deck.length,
//         fieldState: defineFieldState(player.activeRow),
//         hand: defineHandState(player, opposingPlayerActiveRow),
//         inkTotal: player.inkTotal,
//         loreCount: player.loreCount
//     }
// }
//
// export const defineFieldState = (activeRow: Card[]): FieldState => {
//     return {
//         totalReadiedCards: activeRow.length,
//         totalLore: activeRow.map((c) => c.lore).reduce((c, n) => c + n, 0),
//         totalStrength: activeRow.map((c) => c.strength).reduce((c, n) => c + n, 0),
//         totalWillpower: activeRow.map((c) => c.willpower).reduce((c, n) => c + n, 0)
//     };
// }
//
// export const defineHandState = (player: Player, opposingPlayerActiveRow: Card[]) => {
//     // let possibleActions = defineOptimalAction(player, opposingPlayerActiveRow);
//     const handState: HandState = {
//         handSizeRange: player.hand.length,
//         // amountInkable: possibleActions.INK_CARD.length,
//         // amountThatCanBePlayed: possibleActions.PLAY_CARD.length,
//         // totalCardCost: player.hand.map((c) => c.inkCost).reduce((current, next) => current + next, 0),
//     }
//     return handState
// }
//
// export const serializeState = (state: { player: PlayerGameState, hostilePlayer: PlayerGameState }): string => {
//     // Convert state to a string key (e.g., using JSON.stringify)
//     return JSON.stringify(state);
// }
//
// export const serializeOptimalAction = (optimalAction: {
//     action: Actions,
//     stats?: { power: number } | undefined
// }) => {
//     if (optimalAction.stats) {
//         return `${optimalAction.action}-${optimalAction.stats.power}`
//     } else {
//         return `${optimalAction.action}`
//     }
// }
//
// export const deserializeOptimalAction = (serializedOptimalAction: string): {
//     action: Actions,
//     stats?: { power: number } | undefined
// } => {
//     const parts = serializedOptimalAction.split('-');
//
//     // Handle cases without stats (no stats means the string ends with '}')
//     if (parts.length === 1) {
//         return {
//             action: parts[0] as Actions
//         };
//     }
//
//     // Extract parts
//     const [action, power] = parts;
//
//     // Parse optional stats (removing the trailing '-' if present)
//     const powerDes = power && power !== '' ? parseInt(power.replace('-', ''), 10) : undefined;
//     return {
//         action: action as Actions,
//         stats: powerDes ? {
//             power: powerDes
//         } : undefined
//     };
// }
//
//
//
// export const chooseOptimalAction = (currentStates: {
//     player: PlayerGameState,
//     hostilePlayer: PlayerGameState
// }, allPossibleActions: {
//     card?: Card,
//     action: Actions
// }[], qState: Record<string, number>, opposingRow: Card[]) => {
//     const clonedPlayerState = {...currentStates.player}
//     const clonedHostileState = {...currentStates.hostilePlayer}
//     const actionsAndTheirNextState: {
//         nextSerializedState: string;
//         action: { card?: Card; action: "INK_CARD" | "CHALLENGE" | "QUEST" | "PLAY_CARD" | "END_TURN" };
//         targetIndex?: number;
//     }[] = allPossibleActions.flatMap((action) => {
//         const clonedAction = {...action};
//         switch (clonedAction.action) {
//             case "INK_CARD": {
//                 const nextPlayerStateByInking = defineNextStatesByInkingCard(clonedPlayerState);
//                 return [{
//                     nextSerializedState: serializeState({
//                         player: nextPlayerStateByInking,
//                         hostilePlayer: clonedHostileState
//                     }),
//                     action: clonedAction
//                 }];
//             }
//             case "CHALLENGE": {
//                 return defineNextStatesByChallengingCards(
//                     clonedAction,
//                     clonedPlayerState,
//                     clonedHostileState,
//                     [...opposingRow]
//                 ).map(state => ({...state, targetIndex: state.targetIndex ?? undefined}));
//             }
//             case "QUEST": {
//                 const nextPlayerStateByQuesting = defineNextStateByQuesting(clonedPlayerState, action.card!);
//                 return [{
//                     nextSerializedState: serializeState({
//                         player: nextPlayerStateByQuesting,
//                         hostilePlayer: clonedHostileState
//                     }),
//                     action: clonedAction
//                 }];
//             }
//             case "PLAY_CARD": {
//                 const nextPlayerStateByPlayingCard = defineNextStateByPlayingCard(clonedPlayerState, action.card!);
//                 return [{
//                     nextSerializedState: serializeState({
//                         player: nextPlayerStateByPlayingCard,
//                         hostilePlayer: clonedHostileState
//                     }),
//                     action: clonedAction
//                 }];
//             }
//             case "END_TURN": {
//                 return [{
//                     nextSerializedState: serializeState({
//                         player: clonedPlayerState,
//                         hostilePlayer: clonedHostileState
//                     }),
//                     action: clonedAction
//                 }];
//             }
//         }
//     });
//     // TODO MCTS inserted here
//     // const actionStateAndQValue = actionsAndTheirNextState.map((actionAndState) => ({
//     //     ...actionAndState,
//     //     qValue: qState[actionAndState.nextSerializedState] === undefined ? 0 : qState[actionAndState.nextSerializedState]
//     // }));
//     //
//     // return actionStateAndQValue.reduce((highest, current) =>
//     //     current.qValue > highest.qValue ? current : highest
//     // );
// }
//
// export const optimalChallengeTarget = (opposingActiveRow: Card[], attackingCard: Card) => {
//     //TODO take into consideration ward, evasive, bodyguard,... (gameMamanger, eligbleTargets)
//     const eligibleTarget = eligibleTargets(opposingActiveRow)
//     if (eligibleTarget.length === 0) {
//         return undefined
//     }
//     const targetsWhereOwnTargetDies = eligibleTarget.filter((target) => target.strength >= (attackingCard.willpower - attackingCard.damage))
//     const targetsWhereYourTargetDoesNotDie = eligibleTarget.filter((target) => target.strength <= (attackingCard.willpower - attackingCard.damage))
//     const targetsWhereItDies = eligibleTarget.filter((target) => attackingCard.strength >= (target.willpower - target.damage))
//     const targetsWhereItDiesButNotYourCard = targetsWhereItDies.filter((target) => target.strength < (attackingCard.willpower - attackingCard.damage))
//     const targetsWhereItDiesAndYourCard = targetsWhereItDies.filter((target) => target.strength >= (attackingCard.willpower - attackingCard.damage))
//
//     if (targetsWhereItDiesButNotYourCard.length > 0) {
//         if (targetsWhereItDiesButNotYourCard.length > 1) {
//             return targetsWhereItDiesButNotYourCard.reduce((currentCard, nextCard) => {
//                 if (!currentCard) return nextCard
//                 if (currentCard.lore < nextCard.lore) return nextCard
//                 return currentCard
//             })
//         } else {
//             return targetsWhereItDiesButNotYourCard[0]
//         }
//     } else if (targetsWhereItDiesAndYourCard.length > 0) {
//         if (targetsWhereItDiesAndYourCard.length > 1) {
//             return targetsWhereItDiesAndYourCard.reduce((currentCard, nextCard) => {
//                 if (!currentCard) return nextCard
//                 if (currentCard.lore < nextCard.lore) return nextCard
//                 return currentCard
//             })
//         } else {
//             return targetsWhereItDiesAndYourCard[0]
//         }
//     } else if (targetsWhereYourTargetDoesNotDie.length > 0) {
//         if (targetsWhereYourTargetDoesNotDie.length > 1) {
//             return targetsWhereYourTargetDoesNotDie.reduce((currentCard, nextCard) => {
//                 if (!currentCard) return nextCard
//                 if (currentCard.lore < nextCard.lore) return nextCard
//                 return currentCard
//             })
//         } else {
//             return targetsWhereYourTargetDoesNotDie[0]
//         }
//     } else {
//         return targetsWhereOwnTargetDies.reduce((currentCard, nextCard) => {
//             if (!currentCard) return nextCard
//             if (currentCard.lore < nextCard.lore) return nextCard
//             return currentCard
//         }, targetsWhereOwnTargetDies[0])
//     }
// }
//
// export function writeQstateToFile(agentName: string, qStateObject: Record<string, number>) {
//     // Write the trends to a JSON file
//     const outputPath = path.join(__dirname, '..', 'data', `${agentName}_qstate.json`);
//     // save data to json files
//     try {
//         fs.mkdirSync(path.dirname(outputPath), {recursive: true}); // Ensure the directory exists
//         fs.writeFileSync(outputPath, JSON.stringify(qStateObject, null, 2), 'utf-8');
//         console.log(`Q-state successfully written to ${outputPath}`);
//     } catch (error: any) {
//         console.error(`Failed to write trends to file: ${error.message}`);
//     }
// }
//
//
// function defineNextStatesByInkingCard(currentState: PlayerGameState): PlayerGameState {
//     return {
//         ...currentState,
//         inkTotal: currentState.inkTotal + 1,
//         hand: {...currentState.hand, handSizeRange: currentState.hand.handSizeRange - 1}
//     }
// }
//
// const defineNextStatesByChallengingCards = (action: {
//     card?: Card,
//     action: Actions
// }, clonedPlayerState: PlayerGameState, clonedHostileState: PlayerGameState, opposingRow: Card[]) => eligibleTargets(opposingRow).map((target, idx) => {
//     const card = {...action.card!}
//     const newPlayerState = {...clonedPlayerState}
//     const newHostilePlayerState = {...clonedHostileState}
//     if (card.strength >= target.willpower - target.damage) {
//         newHostilePlayerState.fieldState = {
//             totalLore: newHostilePlayerState.fieldState.totalLore - target.lore,
//             totalReadiedCards: target.readied ? newHostilePlayerState.fieldState.totalReadiedCards - 1 : newHostilePlayerState.fieldState.totalReadiedCards,
//             totalStrength: newHostilePlayerState.fieldState.totalStrength - target.strength,
//             totalWillpower: newHostilePlayerState.fieldState.totalWillpower - target.willpower
//         }
//     } else {
//         newHostilePlayerState.fieldState = {
//             ...newHostilePlayerState.fieldState,
//             totalWillpower: newHostilePlayerState.fieldState.totalWillpower - card.strength
//         }
//     }
//
//     if (target.strength >= card.willpower - card.damage) {
//         newPlayerState.fieldState = {
//             totalLore: newPlayerState.fieldState.totalLore - card.lore,
//             totalReadiedCards: newPlayerState.fieldState.totalReadiedCards,
//             totalStrength: newPlayerState.fieldState.totalStrength - card.strength,
//             totalWillpower: newPlayerState.fieldState.totalWillpower - card.willpower
//         }
//     } else {
//         newPlayerState.fieldState = {
//             ...newPlayerState.fieldState,
//             totalWillpower: newPlayerState.fieldState.totalWillpower - card.strength
//         }
//     }
//     return {
//         nextSerializedState: serializeState({
//             player: newPlayerState,
//             hostilePlayer: newHostilePlayerState
//         }),
//         action,
//         targetIndex: idx
//     }
// });
//
// function defineNextStateByQuesting(clonedPlayerState: {
//     hand: HandState;
//     inkTotal: number;
//     fieldState: FieldState;
//     loreCount: number;
// }, card: Card) {
//     return {
//         ...clonedPlayerState,
//         loreCount: clonedPlayerState.loreCount + card.lore,
//         fieldState: {
//             ...clonedPlayerState.fieldState,
//             totalReadiedCards: clonedPlayerState.fieldState.totalReadiedCards - 1
//         }
//     }
// }
//
// function defineNextStateByPlayingCard(clonedPlayerState: PlayerGameState, card: Card, player: Player) {
//     return {
//         ...clonedPlayerState,
//         hand: {amount: defineCardAmountRange(player.) - 1},
//         fieldState: {
//             ...clonedPlayerState.fieldState,
//             totalLore: clonedPlayerState.fieldState.totalLore + card.lore,
//             totalWillpower: clonedPlayerState.fieldState.totalWillpower + card.willpower,
//             totalStrength: clonedPlayerState.fieldState.totalStrength + card.strength,
//             totalReadiedCards: clonedPlayerState.fieldState.totalReadiedCards + 1,
//         }
//     }
// }
