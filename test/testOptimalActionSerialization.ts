import {Actions} from "../src/data/actions";
import {deserializeOptimalAction, serializeOptimalAction} from "../src/services/ql-aiManager";

export const testOptimalActionSerialization = () => {
    const testCaseOne: {
        action: Actions,
        stats?: { power: number } | undefined
    }
        = {
        action: 'CHALLENGE',
        stats: {power: 5}
    }
    const resultOne = deserializeOptimalAction(serializeOptimalAction(testCaseOne));
    if (
        testCaseOne.action !== resultOne.action ||
        testCaseOne.stats?.power !== resultOne?.stats?.power
    ) throw new Error(`${JSON.stringify(testCaseOne)} is not similar to ${JSON.stringify(resultOne)}`)

    const testCaseTwo: {
        action: Actions,
        stats?: { power: number } | undefined
    }
        = {
        action: 'INK_CARD',
    }
    const resultTwo = deserializeOptimalAction(serializeOptimalAction(testCaseTwo));
    if (
        testCaseTwo.action !== resultTwo.action
    ) throw new Error(`${JSON.stringify(testCaseTwo)} is not similar to ${JSON.stringify(resultTwo)}`)


    const testCaseThree: {
        action: Actions,
        stats?: { power: number } | undefined
    }
        = {
        action: 'PLAY_CARD',
    }
    const resultThree = deserializeOptimalAction(serializeOptimalAction(testCaseThree));
    if (
        testCaseThree.action !== resultThree.action
    ) throw new Error(`${JSON.stringify(testCaseTwo)} is not similar to ${JSON.stringify(resultTwo)}`)

    const testCaseFour: {
        action: Actions,
        stats?: { power: number } | undefined
    }
        = {
        action: 'END_TURN'
    }
    const resultFour = deserializeOptimalAction(serializeOptimalAction(testCaseFour));
    if (
        testCaseFour.action !== resultFour.action
    ) throw new Error(`${JSON.stringify(testCaseTwo)} is not similar to ${JSON.stringify(resultTwo)}`)

}

testOptimalActionSerialization()