import {readFile} from "../services/fileReader";
import {writeQstateToFile} from "../services/ql-aiManager";

function defineMostOptimalState(qStates: { state: Record<string, number>; player: string; iteration: string }[]): { state: Record<string, number>; player: string; iteration: string } {
    // Extract the average qValue from each state and compare
    return qStates.reduce((bestAvgState, nextState) => {
        const avgOfCurrentState =
            Object.values(bestAvgState.state).reduce((sum, val) => sum + val, 0);
            Object.values(bestAvgState.state).length;

        const avgOfNextState =
            Object.values(nextState.state).reduce((sum, val) => sum + val, 0) /
            Object.values(nextState.state).length;

        if (avgOfCurrentState < avgOfNextState) {
            return nextState;
        } else {
            return bestAvgState;
        }
    }, qStates[0]!);
}


export const getTheBestQState = async () => {
    const allStates: {state: Record<string, number>, player: string, iteration: string}[] = []
    for (let i = 0; i < 100; i++) {
        allStates.push({state: await readFile(['..','data', i +'-1_qstate.json']) as Record<string, number>, player: '1', iteration: String(i)})
        allStates.push({state: await readFile(['..','data', i +'-2_qstate.json']) as Record<string, number>, player: '2', iteration: String(i)})
    }
    const mostOptimalState = defineMostOptimalState(allStates);
    console.log(mostOptimalState.player, mostOptimalState.iteration)
    writeQstateToFile('MostOptimal', mostOptimalState.state)
}

getTheBestQState().then()