import {
    ActivatedAbility,
    Card,
    CardType, isActivatedAbility, isKeywordAbility, isStaticAbility, isTriggeredAbility,
    KeywordAbility,
    Keywords,
    StaticAbility,
    TriggeredAbility
} from "lorcana-shared/model/Card";
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
    abilities?: (KeywordAbility | StaticAbility | TriggeredAbility | ActivatedAbility)[];
};


function mapAbilities(card: InputCard): (KeywordAbility | StaticAbility | TriggeredAbility | ActivatedAbility)[] {
    if (card.abilities) {
        return card.abilities.map((ability) => {
            switch (true) {
                case isActivatedAbility(ability):
                    return {
                        name: ability.name,
                        type: 'activated'
                    };
                case isTriggeredAbility(ability):
                    return {
                        name: ability.name,
                        type: 'triggered'
                    }
                case isStaticAbility(ability):
                    return {
                        name: ability.name,
                        type: 'static'
                    }
                case isKeywordAbility(ability):
                    return {
                        keyword: ability.keyword,
                        keywordValueNumber: ability.keywordValueNumber,
                        type: 'keyword'
                    }
                default:
                    throw new Error("No keyword found for " + (ability as any).type)
            }
        })
    } else {
        return []
    }
}

function mapToCard(inputCards: InputCard[], setId: number): Card[] {
    return inputCards.map((card) => ({
        id: '00' + setId + '-' + card.id.toString().padStart(3, '0'),
        setId: setId,
        inkable: card.inkwell || false,
        type: card.subtypes && card.subtypes.find((s) => s === 'Song') ? 'Song' : card.type as CardType,
        inkCost: card.cost || 0,
        name: card.name,
        subName: card.version,
        sphere: card.color as Sphere,
        strength: card.strength || 0,
        willpower: card.willpower || 0,
        classification: card.subtypes || [],
        lore: card.lore || 0,
        movement: 0,
        keywords: (card.keywordAbilities || []) as Keywords[],
        damage: 0,
        readied: true,
        canBeReadiedDuringReadyPhase: false,
        abilities: mapAbilities(card)
    }));
}

export const mapInputDataToOwnData = async () => {
    let inputData = (await readFile(['..', '..', 'assets', 'setdata1.json']) as any).cards as InputCard[];
    let cards = mapToCard(inputData, 1);
    await writeFile(['..', 'data', 'cards.json'], cards)
}

