import {Card, CardType} from "lorcana-shared/model/Card";
import {Sphere} from "lorcana-shared/model/Sphere";
import {readFile} from "./fileReader";
import {writeFile} from "./fileWriter";

type InputCard = {
    id: number;
    cost: number;
    inkwell: boolean;
    type: string;
    name: string;
    version: string;
    color: string;
    strength: number;
    willpower: number;
    subtypes: string[];
    lore: number;
    keywordAbilities?: string[];
};


function mapToCard(inputCards: InputCard[], setId: number): Card[] {
    return inputCards.map((card) => ({
        id: '00'+setId+'-'+card.id.toString().padStart(3, '0'),
        setId: setId,
        inkable: card.inkwell || false,
        type: card.type as CardType,
        inkCost: card.cost || 0,
        name: card.name,
        subName: card.version,
        sphere: card.color as Sphere,
        strength: card.strength || 0,
        willpower: card.willpower || 0,
        classification: card.subtypes || [],
        lore: card.lore || 0,
        movement: 0, // Assuming "movement" is not provided in the input
        keywords: card.keywordAbilities || [],
        damage: 0, // Assuming "damage" starts at 0
        readied: true, // Assuming "readied" defaults to false
        canBeReadiedDuringReadyPhase: false
    }));
}

export const mapInputDataToOwnData = async () => {
    let inputData =( await readFile(['..','..','assets','setdata1.json']) as any).cards as InputCard[];
    let cards = mapToCard(inputData, 1);
    await writeFile(['..','data','cards.json'], cards)
}

