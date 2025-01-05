import {mapInputDataToOwnData} from "../services/cardDataImporter";

export const importData = async () => {
    await mapInputDataToOwnData()
}
importData().then(() => console.log('Done'))