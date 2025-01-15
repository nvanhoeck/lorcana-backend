export type StartGameRequestBody = {
    playerOne: {
        name: string
        deck: string
        agent: boolean
    },
    playerTwo: {
        name: string
        deck: string
        agent: boolean
    }
}