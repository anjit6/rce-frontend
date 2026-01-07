# Complete Subfunctions List

## Total: 50 Subfunctions

### String Functions (STR) - 20 functions

| ID | Name | Function Name | Description |
|----|------|---------------|-------------|
| 2001 | Replace All | STRING_REPLACE_ALL | Replaces all occurrences of a substring inside the string |
| 2002 | Substring | SUB_STRING | Returns substring from start index with length |
| 2003 | To Uppercase | STRING_UPPER | Converts text to uppercase |
| 2004 | To Lowercase | STRING_LOWER | Converts text to lowercase |
| 2005 | Trim | STRING_TRIM | Removes leading and trailing whitespace |
| 2006 | Contains | STRING_CONTAINS | Checks whether text contains a substring |
| 2007 | String Length | STRING_LENGTH | Returns length of string |
| 2008 | Pad Left | STRING_PAD_LEFT | Pads string on left side with given character |
| 2009 | Pad Right | STRING_PAD_RIGHT | Pads string on right side with given character |
| 2010 | Replace by Regex | STRING_REGEX_REPLACE | Replaces text using regex pattern |
| 2011 | Split String | STRING_SPLIT | Splits a string into an array by separator |
| 2012 | Starts With | STRING_STARTS_WITH | Checks if string starts with specified prefix |
| 2013 | Ends With | STRING_ENDS_WITH | Checks if string ends with specified suffix |
| 2014 | Index Of | STRING_INDEX_OF | Returns the index of first occurrence of substring |
| 2015 | Concat Strings | STRING_CONCAT | Concatenates multiple strings together |
| 2016 | Repeat String | STRING_REPEAT | Repeats a string specified number of times |
| 2017 | Reverse String | STRING_REVERSE | Reverses the characters in a string |
| 2018 | Match Regex | STRING_MATCH | Tests if string matches a regex pattern |
| 2019 | Capitalize First | STRING_CAPITALIZE | Capitalizes the first letter of a string |
| 2020 | Remove Whitespace | STRING_REMOVE_SPACES | Removes all whitespace from a string |

### Number Functions (NUM) - 15 functions

| ID | Name | Function Name | Description |
|----|------|---------------|-------------|
| 3001 | Add Numbers | NUM_ADD | Adds two numbers together |
| 3002 | Subtract Numbers | NUM_SUBTRACT | Subtracts second number from first number |
| 3003 | Multiply Numbers | NUM_MULTIPLY | Multiplies two numbers together |
| 3004 | Divide Numbers | NUM_DIVIDE | Divides first number by second number |
| 3005 | Modulo | NUM_MODULO | Returns remainder of division |
| 3006 | Power | NUM_POWER | Raises first number to the power of second number |
| 3007 | Square Root | NUM_SQRT | Returns square root of a number |
| 3008 | Absolute Value | NUM_ABS | Returns absolute value of a number |
| 3009 | Round Number | NUM_ROUND | Rounds a number to nearest integer |
| 3010 | Floor | NUM_FLOOR | Rounds down to nearest integer |
| 3011 | Ceiling | NUM_CEIL | Rounds up to nearest integer |
| 3012 | Maximum | NUM_MAX | Returns the larger of two numbers |
| 3013 | Minimum | NUM_MIN | Returns the smaller of two numbers |
| 3014 | Random Number | NUM_RANDOM | Generates random number between min and max |
| 3015 | To Fixed Decimal | NUM_TO_FIXED | Formats number to fixed decimal places |

### Date Functions (DATE) - 11 functions

| ID | Name | Function Name | Description |
|----|------|---------------|-------------|
| 4001 | Add Months | DATE_ADD_MONTHS | Adds specified number of months to a date |
| 4002 | Format Chinese Date | FORMAT_DATE_CN | Formats date in Chinese format (生产日期：YYYY年MM月DD日) |
| 4003 | Add Days | DATE_ADD_DAYS | Adds specified number of days to a date |
| 4004 | Add Years | DATE_ADD_YEARS | Adds specified number of years to a date |
| 4005 | Format Date | DATE_FORMAT | Formats date to YYYY-MM-DD format |
| 4006 | Get Year | DATE_GET_YEAR | Extracts year from date |
| 4007 | Get Month | DATE_GET_MONTH | Extracts month from date (1-12) |
| 4008 | Get Day | DATE_GET_DAY | Extracts day from date |
| 4009 | Date Difference in Days | DATE_DIFF_DAYS | Calculates difference between two dates in days |
| 4010 | Get Current Date | DATE_NOW | Returns current date and time |
| 4011 | Is Valid Date | DATE_IS_VALID | Checks if value is a valid date |

### Utility Functions (UTIL) - 16 functions

| ID | Name | Function Name | Description |
|----|------|---------------|-------------|
| 5001 | Is Empty | IS_EMPTY | Checks if a value is empty (null, undefined, or empty string) |
| 5002 | Is Null | IS_NULL | Checks if a value is null |
| 5003 | Is Number | IS_NUMBER | Checks if a value is a number |
| 5004 | Is String | IS_STRING | Checks if a value is a string |
| 5005 | Is Boolean | IS_BOOLEAN | Checks if a value is a boolean |
| 5006 | To String | TO_STRING | Converts any value to string |
| 5007 | To Number | TO_NUMBER | Converts value to number |
| 5008 | To Boolean | TO_BOOLEAN | Converts value to boolean |
| 5009 | Default Value | DEFAULT_VALUE | Returns default value if input is empty/null |
| 5010 | Equals | EQUALS | Checks if two values are equal |
| 5011 | Not Equals | NOT_EQUALS | Checks if two values are not equal |
| 5012 | Greater Than | GREATER_THAN | Checks if first value is greater than second |
| 5013 | Less Than | LESS_THAN | Checks if first value is less than second |
| 5014 | Logical AND | AND | Returns true if both values are true |
| 5015 | Logical OR | OR | Returns true if at least one value is true |
| 5016 | Logical NOT | NOT | Returns opposite boolean value |

## Summary by Category

- **String (STR)**: 20 functions
- **Number (NUM)**: 15 functions
- **Date (DATE)**: 11 functions
- **Utility (UTIL)**: 16 functions

**Total**: 50 predefined subfunctions ready for use in the rules engine!

## Usage

```typescript
import { getSubfunctionsByCategory } from '@/utils/subfunctions';

const grouped = getSubfunctionsByCategory();

// Access string functions
console.log(grouped.STR); // Array of 20 string functions

// Access number functions
console.log(grouped.NUM); // Array of 15 number functions

// Access date functions
console.log(grouped.DATE); // Array of 11 date functions

// Access utility functions
console.log(grouped.UTIL); // Array of 16 utility functions
```

See [SUBFUNCTIONS_USAGE.md](SUBFUNCTIONS_USAGE.md) for detailed usage documentation.
