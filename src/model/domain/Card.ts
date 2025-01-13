import {Sphere} from "./Sphere";
export type CardType = 'Character' | 'Action' | 'Song' | 'Item' | 'Location'
export type Card = {
    id: string
    setId: number
    inkable: boolean
    type: CardType
    inkCost: number
    name: string
    subName: string
    sphere: Sphere
    strength: number
    willpower: number
    classification: string[]
    lore: number
    movement: number
    keywords: string[]
    damage: number
    readied: boolean
    canBeReadiedDuringReadyPhase: boolean
}