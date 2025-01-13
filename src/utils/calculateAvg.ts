/**
 * Calculates the average of a specific numeric field in an array of objects.
 *
 * @param array - Array of objects to calculate the average from.
 * @param field - The key of the field to average.
 * @returns The average value of the specified field or `null` if the array is empty.
 */
export function calculateAverage<T>(array: T[], field: keyof T): number | null {
    if (array.length === 0) return null;

    const total = array.reduce((sum, item) => {
        const value = item[field];
        if (typeof value === 'number') {
            return sum + value;
        }
        throw new Error(`Field "${String(field)}" is not a number in one or more objects.`);
    }, 0);

    return total / array.length;
}
