export type GetCardsRequestBody = {
    cardIdAndCount: {
        id: string,
        count: number
    }[]
}