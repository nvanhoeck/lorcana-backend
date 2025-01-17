export class LinearDecayExploration {
    private initialRate: number;
    private minRate: number;
    private decayRate: number;

    constructor(initialRate: number, minRate: number, decayRate: number) {
        this.initialRate = initialRate;
        this.minRate = minRate;
        this.decayRate = decayRate;
    }

    getRate(iteration: number): number {
        const rate = this.initialRate - this.decayRate * iteration;
        return Math.max(this.minRate, rate);
    }
}

export class ExponentialDecayExploration {
    private initialRate: number;
    private minRate: number;
    private decayFactor: number;

    constructor(initialRate: number, minRate: number, decayFactor: number) {
        this.initialRate = initialRate;
        this.minRate = minRate;
        this.decayFactor = decayFactor;
    }

    getRate(iteration: number): number {
        const rate = this.initialRate * Math.pow(this.decayFactor, iteration);
        return Math.max(this.minRate, rate);
    }
}