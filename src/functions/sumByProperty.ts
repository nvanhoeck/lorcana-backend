type PropertyOf<T> = keyof T;

/**
 * Calculates the sum of a specific numeric property in an array of objects.
 * @param arr - Array of objects to process.
 * @param property - The property name to sum.
 * @returns The sum of the specified property.
 */
export const sumByProperty = <T>(arr: T[], property: PropertyOf<T>): number => arr.reduce((sum, obj) => {
    const value = obj[property];
    if (typeof value === 'number') {
        return sum + value;
    }
    return sum; // Ignore non-numeric values
}, 0);