# Subfunctions Module - Usage Guide

This document explains how to use the subfunctions module in the RCE Frontend application.

## Overview

The subfunctions module provides a collection of predefined functions that can be used in the rules engine. These functions are organized by category (String, Number, Date, Utility) and include utilities to fetch and filter them.

## File Structure

```
src/
├── types/
│   ├── subfunction.ts      # TypeScript type definitions
│   └── index.ts            # Type exports
├── constants/
│   ├── subfunctions.ts     # Hardcoded subfunctions data
│   └── index.ts            # Constant exports
└── utils/
    ├── subfunctions.ts     # Utility functions to work with subfunctions
    └── index.ts            # Utility exports
```

## Types

### `Subfunction`

Represents a single subfunction with all its metadata.

```typescript
interface Subfunction {
  id: number;
  name: string;
  description: string;
  version: string;
  functionName: string;
  categoryId: CategoryId;
  code: string;
  inputParams: InputParam[];
  returnType: DataType;
}
```

### `Category`

Represents a function category.

```typescript
interface Category {
  id: CategoryId;
  name: string;
  description: string;
}
```

### Other Types

- `DataType`: `'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ANY'`
- `CategoryId`: `'STR' | 'NUM' | 'DATE' | 'UTIL'`
- `GroupedSubfunctions`: `{ [categoryId: string]: Subfunction[] }`

## Available Functions

### Get All Subfunctions

```typescript
import { getAllSubfunctions } from '@/utils/subfunctions';

const allFunctions = getAllSubfunctions();
// Returns: Array of all 14 subfunctions
```

### Get Subfunctions Grouped by Category

This is the main function to fetch functions organized by category as shown in the mockup.

```typescript
import { getSubfunctionsByCategory } from '@/utils/subfunctions';

const grouped = getSubfunctionsByCategory();
// Returns:
// {
//   "STR": [
//     { id: 2001, name: "Replace All", ... },
//     { id: 2002, name: "Substring", ... },
//     // ... 8 more string functions
//   ],
//   "NUM": [
//     { id: 3001, name: "Add Numbers", ... }
//   ],
//   "DATE": [
//     { id: 4001, name: "Add Months", ... },
//     { id: 4002, name: "Format Chinese Date", ... }
//   ],
//   "UTIL": [
//     { id: 5001, name: "Is Empty", ... }
//   ]
// }
```

### Get Subfunctions for a Specific Category

```typescript
import { getSubfunctionsForCategory } from '@/utils/subfunctions';

const stringFunctions = getSubfunctionsForCategory('STR');
// Returns: Array of all 10 string functions
```

### Get All Categories

```typescript
import { getAllCategories } from '@/utils/subfunctions';

const categories = getAllCategories();
// Returns: Array of 4 categories with names and descriptions
```

### Get Single Subfunction by ID

```typescript
import { getSubfunctionById } from '@/utils/subfunctions';

const replaceAll = getSubfunctionById(2001);
// Returns: The "Replace All" subfunction object
```

### Get Single Subfunction by Name

```typescript
import { getSubfunctionByName } from '@/utils/subfunctions';

const replaceAll = getSubfunctionByName('STRING_REPLACE_ALL');
// Returns: The "Replace All" subfunction object
```

### Search Subfunctions

```typescript
import { searchSubfunctions } from '@/utils/subfunctions';

const results = searchSubfunctions('replace');
// Returns: All functions with 'replace' in name, description, or function name
```

### Get Category Information

```typescript
import { getCategoryById } from '@/utils/subfunctions';

const stringCategory = getCategoryById('STR');
// Returns: { id: "STR", name: "String Functions", description: "..." }
```

### Get Subfunction Count by Category

```typescript
import { getSubfunctionCountByCategory } from '@/utils/subfunctions';

const counts = getSubfunctionCountByCategory();
// Returns: { "STR": 10, "NUM": 1, "DATE": 2, "UTIL": 1 }
```

## Usage Examples

### Example 1: Display Functions in a Sidebar (Like Mockup)

```typescript
import { getSubfunctionsByCategory, getAllCategories } from '@/utils/subfunctions';

function SubfunctionsSidebar() {
  const categories = getAllCategories();
  const groupedFunctions = getSubfunctionsByCategory();

  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <ul>
            {groupedFunctions[category.id]?.map(fn => (
              <li key={fn.id}>
                {fn.name} - {fn.description}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Filter Functions by Category

```typescript
import { getSubfunctionsForCategory } from '@/utils/subfunctions';

function StringFunctionsPanel() {
  const stringFunctions = getSubfunctionsForCategory('STR');

  return (
    <div>
      <h2>String Functions ({stringFunctions.length})</h2>
      {stringFunctions.map(fn => (
        <div key={fn.id}>
          <strong>{fn.functionName}</strong>
          <p>{fn.description}</p>
          <code>{fn.code}</code>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Search Functionality

```typescript
import { searchSubfunctions } from '@/utils/subfunctions';
import { useState } from 'react';

function SubfunctionSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const results = searchSubfunctions(searchTerm);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search functions..."
      />
      <div>
        {results.map(fn => (
          <div key={fn.id}>
            {fn.name} - {fn.description}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Display Function Details

```typescript
import { getSubfunctionById } from '@/utils/subfunctions';

function FunctionDetails({ functionId }: { functionId: number }) {
  const fn = getSubfunctionById(functionId);

  if (!fn) return <div>Function not found</div>;

  return (
    <div>
      <h2>{fn.name}</h2>
      <p><strong>Version:</strong> {fn.version}</p>
      <p><strong>Description:</strong> {fn.description}</p>
      <p><strong>Function Name:</strong> {fn.functionName}</p>
      <p><strong>Return Type:</strong> {fn.returnType}</p>

      <h3>Parameters</h3>
      <ul>
        {fn.inputParams.map(param => (
          <li key={param.name}>
            <strong>{param.name}</strong> ({param.dataType})
            {param.mandatory ? ' - Required' : ' - Optional'}
            {param.default !== undefined && ` - Default: ${param.default}`}
          </li>
        ))}
      </ul>

      <h3>Code</h3>
      <pre><code>{fn.code}</code></pre>
    </div>
  );
}
```

## Available Subfunctions

### String Functions (STR) - 10 functions
- **Replace All** - Replaces all occurrences of a substring
- **Substring** - Returns substring from start index with length
- **To Uppercase** - Converts text to uppercase
- **To Lowercase** - Converts text to lowercase
- **Trim** - Removes leading and trailing whitespace
- **Contains** - Checks whether text contains a substring
- **String Length** - Returns length of string
- **Pad Left** - Pads string on left side with given character
- **Pad Right** - Pads string on right side with given character
- **Replace by Regex** - Replaces text using regex pattern

### Number Functions (NUM) - 1 function
- **Add Numbers** - Adds two numbers together

### Date Functions (DATE) - 2 functions
- **Add Months** - Adds specified number of months to a date
- **Format Chinese Date** - Formats date in Chinese format

### Utility Functions (UTIL) - 1 function
- **Is Empty** - Checks if a value is empty

## Notes for Developers

1. **Type Safety**: All functions are fully typed with TypeScript for better IDE support and type checking.

2. **Immutable Data**: The constants are read-only. All utility functions return new arrays/objects without modifying the originals.

3. **Performance**: All utility functions use efficient filtering and grouping methods suitable for the current dataset size (14 functions).

4. **Extensibility**: To add new functions, simply add them to the `SUBFUNCTIONS` array in `src/constants/subfunctions.ts` following the existing structure.

5. **Path Aliases**: The module uses `@/` path alias which maps to `src/`. Make sure your build tool is configured correctly.

6. **No External Dependencies**: The module only depends on the project's TypeScript configuration and doesn't require any external packages.

## Integration Points

This module is designed to be used by:
- Rule Builder UI components
- Function selector/picker components
- Rule validation logic
- Code editor autocomplete features
- Function documentation displays
- Search and filter interfaces

Refer to the project mockups and requirements documents for the specific UI implementations.
