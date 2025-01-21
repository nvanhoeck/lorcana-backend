import {trainAgent} from "./trainAgent";


export const parallelTrainAgent = async () => {
    const iterationCount = 100;

    const tasks = Array.from({ length: iterationCount }, (_, i) => {
        return trainAgent().then();
    });
    await Promise.all(tasks);
    console.log('All iterations complete')
}

parallelTrainAgent().then()