/**
 * Transfers the last `count` elements from one array to another.
 * @param source - The array to transfer elements from.
 * @param target - The array to transfer elements to.
 * @param count - The number of elements to transfer.
 */
export function transferLastElements<T>(source: T[], target: T[], count: number): void {
    if (count > source.length) {
        throw new Error("Source array does not have enough elements to transfer.");
    }
    const elementsToTransfer = source.splice(-count); // Remove the last `count` elements
    target.push(...elementsToTransfer); // Add them to the target array
}