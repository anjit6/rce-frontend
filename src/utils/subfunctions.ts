import { SUBFUNCTIONS, CATEGORIES } from '../constants/subfunctions';
import { Subfunction, GroupedSubfunctions, Category, CategoryId } from '@/types/subfunction';

/**
 * Get all subfunctions
 * @returns Array of all available subfunctions
 */
export const getAllSubfunctions = (): Subfunction[] => {
  return SUBFUNCTIONS;
};

/**
 * Get all categories
 * @returns Array of all function categories
 */
export const getAllCategories = (): Category[] => {
  return CATEGORIES;
};

/**
 * Get subfunctions grouped by category
 * @returns Object with category IDs as keys and arrays of subfunctions as values
 *
 * @example
 * const grouped = getSubfunctionsByCategory();
 * // Returns:
 * // {
 * //   "STR": [{ id: 2001, name: "Replace All", ... }, ...],
 * //   "NUM": [{ id: 3001, name: "Add Numbers", ... }],
 * //   "DATE": [{ id: 4001, name: "Add Months", ... }, ...],
 * //   "UTIL": [{ id: 5001, name: "Is Empty", ... }]
 * // }
 */
export const getSubfunctionsByCategory = (): GroupedSubfunctions => {
  return SUBFUNCTIONS.reduce((acc, subfunction) => {
    const categoryId = subfunction.categoryId;

    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }

    acc[categoryId].push(subfunction);

    return acc;
  }, {} as GroupedSubfunctions);
};

/**
 * Get subfunctions for a specific category
 * @param categoryId - The category ID to filter by
 * @returns Array of subfunctions in the specified category
 *
 * @example
 * const stringFunctions = getSubfunctionsByCategory('STR');
 * // Returns all string functions
 */
export const getSubfunctionsForCategory = (categoryId: CategoryId): Subfunction[] => {
  return SUBFUNCTIONS.filter(fn => fn.categoryId === categoryId);
};

/**
 * Get a single subfunction by ID
 * @param id - The subfunction ID
 * @returns The subfunction or undefined if not found
 *
 * @example
 * const replaceAll = getSubfunctionById(2001);
 */
export const getSubfunctionById = (id: number): Subfunction | undefined => {
  return SUBFUNCTIONS.find(fn => fn.id === id);
};

/**
 * Get a single subfunction by function name
 * @param functionName - The function name
 * @returns The subfunction or undefined if not found
 *
 * @example
 * const replaceAll = getSubfunctionByName('STRING_REPLACE_ALL');
 */
export const getSubfunctionByName = (functionName: string): Subfunction | undefined => {
  return SUBFUNCTIONS.find(fn => fn.functionName === functionName);
};

/**
 * Search subfunctions by name or description
 * @param searchTerm - The search term
 * @returns Array of matching subfunctions
 *
 * @example
 * const results = searchSubfunctions('replace');
 * // Returns all functions with 'replace' in name or description
 */
export const searchSubfunctions = (searchTerm: string): Subfunction[] => {
  const term = searchTerm.toLowerCase();

  return SUBFUNCTIONS.filter(fn =>
    fn.name.toLowerCase().includes(term) ||
    fn.description.toLowerCase().includes(term) ||
    fn.functionName.toLowerCase().includes(term)
  );
};

/**
 * Get category information by ID
 * @param categoryId - The category ID
 * @returns The category or undefined if not found
 */
export const getCategoryById = (categoryId: CategoryId): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === categoryId);
};

/**
 * Get count of subfunctions per category
 * @returns Object with category IDs as keys and counts as values
 *
 * @example
 * const counts = getSubfunctionCountByCategory();
 * // Returns: { "STR": 10, "NUM": 1, "DATE": 2, "UTIL": 1 }
 */
export const getSubfunctionCountByCategory = (): Record<CategoryId, number> => {
  return SUBFUNCTIONS.reduce((acc, fn) => {
    acc[fn.categoryId] = (acc[fn.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<CategoryId, number>);
};
