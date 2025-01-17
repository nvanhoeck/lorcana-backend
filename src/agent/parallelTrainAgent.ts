import {trainAgent} from "./trainAgent";
import {writeQstateToFile} from "../services/ql-aiManager";


export const parallelTrainAgent = async () => {
    const iterationCount = 100;

    const tasks = Array.from({ length: iterationCount }, (_, i) => {
        return trainAgent().then((response) => {
            writeQstateToFile(i+'-1', response.optimalQStateOne!)
            writeQstateToFile(i+'-2', response.optimalQStateTwo!)
            return response;
        });
    });
    await Promise.all(tasks);
    console.log('All iterations complete')
}

parallelTrainAgent().then()