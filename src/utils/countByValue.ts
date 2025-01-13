/**
 * Counts how many objects in an array have a specific value for a given field.
 *
 * @param array - Array of objects to search.
 * @param field - The key of the field to check.
 * @param value - The value to count.
 * @returns The count of objects that match the specified value for the field.
 */
export function countByValue<T>(array: T[], field: keyof T, value: T[keyof T]): number {
    return array.reduce((count, item) => {
        return item[field] === value ? count + 1 : count;
    }, 0);
}
