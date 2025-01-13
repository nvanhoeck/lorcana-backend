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

/**
 * Transfers an element from a specified position in one array to another.
 * @param source - The array to transfer the element from.
 * @param target - The array to transfer the element to.
 * @param index - The position of the element to transfer.
 */
export function transferElement<T>(source: T[], target: T[], index: number): void {
    if (index < 0 || index >= source.length) {
        throw new Error("Index out of bounds.");
    }
    const [element] = source.splice(index, 1); // Remove the element at the specified index
    target.push(element); // Add it to the target array
}
