import { Subfunction, Category } from '@/types/subfunction';

/**
 * Hardcoded subfunctions data
 * These are predefined functions that can be used in the rules engine
 */
export const SUBFUNCTIONS: Subfunction[] = [
  // STRING FUNCTIONS
  {
    id: 2001,
    name: "Replace All",
    description: "Replaces all occurrences of a substring inside the string.",
    version: "v1.0",
    functionName: "STRING_REPLACE_ALL",
    categoryId: "STR",
    code: "function STRING_REPLACE_ALL(text, find, replaceWith){ try { const value = text.split(find).join(replaceWith); return { success: true, value }; } catch(e){ return { success:false, error:{code:500,message:e.message}}; } }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "find", dataType: "STRING", mandatory: true, sequence: 2 },
      { name: "replaceWith", dataType: "STRING", mandatory: true, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2002,
    name: "Substring",
    description: "Returns substring from start index with length.",
    version: "v1.1",
    functionName: "SUB_STRING",
    categoryId: "STR",
    code: "function SUB_STRING(inputText, length, start = 0){ try { if(inputText.length < start){ return { success:false, error:{code:400,message:'Start index greater than string length'}};} const value = inputText.substring(start, start + Number(length)); return { success:true, value }; } catch(e){ return { success:false, error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "inputText", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "length", dataType: "NUMBER", mandatory: true, sequence: 2 },
      { name: "start", dataType: "NUMBER", mandatory: false, default: 0, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2003,
    name: "To Uppercase",
    description: "Converts text to uppercase.",
    version: "v1.0",
    functionName: "STRING_UPPER",
    categoryId: "STR",
    code: "function STRING_UPPER(text){ try { return { success:true, value:text.toUpperCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 2004,
    name: "To Lowercase",
    description: "Converts text to lowercase.",
    version: "v1.0",
    functionName: "STRING_LOWER",
    categoryId: "STR",
    code: "function STRING_LOWER(text){ try { return { success:true, value:text.toLowerCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 2005,
    name: "Trim",
    description: "Removes leading and trailing whitespace.",
    version: "v1.0",
    functionName: "STRING_TRIM",
    categoryId: "STR",
    code: "function STRING_TRIM(text){ try { return { success:true, value:text.trim() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 2006,
    name: "Contains",
    description: "Checks whether text contains a substring.",
    version: "v1.0",
    functionName: "STRING_CONTAINS",
    categoryId: "STR",
    code: "function STRING_CONTAINS(text, pattern){ try { return { success:true, value:text.includes(pattern) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "pattern", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 2007,
    name: "String Length",
    description: "Returns length of string.",
    version: "v1.0",
    functionName: "STRING_LENGTH",
    categoryId: "STR",
    code: "function STRING_LENGTH(text){ try { return { success:true, value:text.length }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 2008,
    name: "Pad Left",
    description: "Pads string on left side with given character.",
    version: "v1.0",
    functionName: "STRING_PAD_LEFT",
    categoryId: "STR",
    code: "function STRING_PAD_LEFT(text, length, char){ try { return { success:true, value:String(text).padStart(Number(length), char) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "length", dataType: "NUMBER", mandatory: true, sequence: 2 },
      { name: "char", dataType: "STRING", mandatory: true, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2009,
    name: "Pad Right",
    description: "Pads string on right side with given character.",
    version: "v1.0",
    functionName: "STRING_PAD_RIGHT",
    categoryId: "STR",
    code: "function STRING_PAD_RIGHT(text, length, char){ try { return { success:true, value:String(text).padEnd(Number(length), char) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "length", dataType: "NUMBER", mandatory: true, sequence: 2 },
      { name: "char", dataType: "STRING", mandatory: true, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2010,
    name: "Replace by Regex",
    description: "Replaces text using regex pattern.",
    version: "v1.0",
    functionName: "STRING_REGEX_REPLACE",
    categoryId: "STR",
    code: "function STRING_REGEX_REPLACE(text, pattern, replaceWith){ try { const regex = new RegExp(pattern, 'g'); return { success:true, value:text.replace(regex, replaceWith) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "pattern", dataType: "STRING", mandatory: true, sequence: 2 },
      { name: "replaceWith", dataType: "STRING", mandatory: true, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2011,
    name: "Split String",
    description: "Splits a string into an array by separator.",
    version: "v1.0",
    functionName: "STRING_SPLIT",
    categoryId: "STR",
    code: "function STRING_SPLIT(text, separator){ try { return { success:true, value:text.split(separator) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "separator", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "STRING"
  },
  {
    id: 2012,
    name: "Starts With",
    description: "Checks if string starts with specified prefix.",
    version: "v1.0",
    functionName: "STRING_STARTS_WITH",
    categoryId: "STR",
    code: "function STRING_STARTS_WITH(text, prefix){ try { return { success:true, value:text.startsWith(prefix) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "prefix", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 2013,
    name: "Ends With",
    description: "Checks if string ends with specified suffix.",
    version: "v1.0",
    functionName: "STRING_ENDS_WITH",
    categoryId: "STR",
    code: "function STRING_ENDS_WITH(text, suffix){ try { return { success:true, value:text.endsWith(suffix) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "suffix", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 2014,
    name: "Index Of",
    description: "Returns the index of first occurrence of substring.",
    version: "v1.0",
    functionName: "STRING_INDEX_OF",
    categoryId: "STR",
    code: "function STRING_INDEX_OF(text, searchValue){ try { return { success:true, value:text.indexOf(searchValue) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "searchValue", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 2015,
    name: "Concat Strings",
    description: "Concatenates multiple strings together.",
    version: "v1.0",
    functionName: "STRING_CONCAT",
    categoryId: "STR",
    code: "function STRING_CONCAT(str1, str2, str3){ try { let result = String(str1) + String(str2); if(str3 !== undefined && str3 !== null) result += String(str3); return { success:true, value:result }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "str1", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "str2", dataType: "STRING", mandatory: true, sequence: 2 },
      { name: "str3", dataType: "STRING", mandatory: false, sequence: 3 }
    ],
    returnType: "STRING"
  },
  {
    id: 2016,
    name: "Repeat String",
    description: "Repeats a string specified number of times.",
    version: "v1.0",
    functionName: "STRING_REPEAT",
    categoryId: "STR",
    code: "function STRING_REPEAT(text, count){ try { return { success:true, value:text.repeat(Number(count)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "count", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "STRING"
  },
  {
    id: 2017,
    name: "Reverse String",
    description: "Reverses the characters in a string.",
    version: "v1.0",
    functionName: "STRING_REVERSE",
    categoryId: "STR",
    code: "function STRING_REVERSE(text){ try { return { success:true, value:text.split('').reverse().join('') }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 2018,
    name: "Match Regex",
    description: "Tests if string matches a regex pattern.",
    version: "v1.0",
    functionName: "STRING_MATCH",
    categoryId: "STR",
    code: "function STRING_MATCH(text, pattern){ try { const regex = new RegExp(pattern); return { success:true, value:regex.test(text) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 },
      { name: "pattern", dataType: "STRING", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 2019,
    name: "Capitalize First",
    description: "Capitalizes the first letter of a string.",
    version: "v1.0",
    functionName: "STRING_CAPITALIZE",
    categoryId: "STR",
    code: "function STRING_CAPITALIZE(text){ try { if(!text) return { success:true, value:'' }; return { success:true, value:text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 2020,
    name: "Remove Whitespace",
    description: "Removes all whitespace from a string.",
    version: "v1.0",
    functionName: "STRING_REMOVE_SPACES",
    categoryId: "STR",
    code: "function STRING_REMOVE_SPACES(text){ try { return { success:true, value:text.replace(/\\s+/g, '') }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "text", dataType: "STRING", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },

  // NUMBER FUNCTIONS
  {
    id: 3001,
    name: "Add Numbers",
    description: "Adds two numbers together.",
    version: "v1.0",
    functionName: "NUM_ADD",
    categoryId: "NUM",
    code: "function NUM_ADD(a,b){ try { return { success:true, value:Number(a)+Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3002,
    name: "Subtract Numbers",
    description: "Subtracts second number from first number.",
    version: "v1.0",
    functionName: "NUM_SUBTRACT",
    categoryId: "NUM",
    code: "function NUM_SUBTRACT(a,b){ try { return { success:true, value:Number(a)-Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3003,
    name: "Multiply Numbers",
    description: "Multiplies two numbers together.",
    version: "v1.0",
    functionName: "NUM_MULTIPLY",
    categoryId: "NUM",
    code: "function NUM_MULTIPLY(a,b){ try { return { success:true, value:Number(a)*Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3004,
    name: "Divide Numbers",
    description: "Divides first number by second number.",
    version: "v1.0",
    functionName: "NUM_DIVIDE",
    categoryId: "NUM",
    code: "function NUM_DIVIDE(a,b){ try { if(Number(b) === 0) return { success:false, error:{code:400,message:'Division by zero'}}; return { success:true, value:Number(a)/Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3005,
    name: "Modulo",
    description: "Returns remainder of division.",
    version: "v1.0",
    functionName: "NUM_MODULO",
    categoryId: "NUM",
    code: "function NUM_MODULO(a,b){ try { if(Number(b) === 0) return { success:false, error:{code:400,message:'Modulo by zero'}}; return { success:true, value:Number(a)%Number(b) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3006,
    name: "Power",
    description: "Raises first number to the power of second number.",
    version: "v1.0",
    functionName: "NUM_POWER",
    categoryId: "NUM",
    code: "function NUM_POWER(base,exponent){ try { return { success:true, value:Math.pow(Number(base), Number(exponent)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "base", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "exponent", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3007,
    name: "Square Root",
    description: "Returns square root of a number.",
    version: "v1.0",
    functionName: "NUM_SQRT",
    categoryId: "NUM",
    code: "function NUM_SQRT(num){ try { if(Number(num) < 0) return { success:false, error:{code:400,message:'Cannot calculate square root of negative number'}}; return { success:true, value:Math.sqrt(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3008,
    name: "Absolute Value",
    description: "Returns absolute value of a number.",
    version: "v1.0",
    functionName: "NUM_ABS",
    categoryId: "NUM",
    code: "function NUM_ABS(num){ try { return { success:true, value:Math.abs(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3009,
    name: "Round Number",
    description: "Rounds a number to nearest integer.",
    version: "v1.0",
    functionName: "NUM_ROUND",
    categoryId: "NUM",
    code: "function NUM_ROUND(num){ try { return { success:true, value:Math.round(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3010,
    name: "Floor",
    description: "Rounds down to nearest integer.",
    version: "v1.0",
    functionName: "NUM_FLOOR",
    categoryId: "NUM",
    code: "function NUM_FLOOR(num){ try { return { success:true, value:Math.floor(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3011,
    name: "Ceiling",
    description: "Rounds up to nearest integer.",
    version: "v1.0",
    functionName: "NUM_CEIL",
    categoryId: "NUM",
    code: "function NUM_CEIL(num){ try { return { success:true, value:Math.ceil(Number(num)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3012,
    name: "Maximum",
    description: "Returns the larger of two numbers.",
    version: "v1.0",
    functionName: "NUM_MAX",
    categoryId: "NUM",
    code: "function NUM_MAX(a,b){ try { return { success:true, value:Math.max(Number(a), Number(b)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3013,
    name: "Minimum",
    description: "Returns the smaller of two numbers.",
    version: "v1.0",
    functionName: "NUM_MIN",
    categoryId: "NUM",
    code: "function NUM_MIN(a,b){ try { return { success:true, value:Math.min(Number(a), Number(b)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "a", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "b", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3014,
    name: "Random Number",
    description: "Generates random number between min and max.",
    version: "v1.0",
    functionName: "NUM_RANDOM",
    categoryId: "NUM",
    code: "function NUM_RANDOM(min, max){ try { const minNum = Number(min); const maxNum = Number(max); return { success:true, value:Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "min", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "max", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 3015,
    name: "To Fixed Decimal",
    description: "Formats number to fixed decimal places.",
    version: "v1.0",
    functionName: "NUM_TO_FIXED",
    categoryId: "NUM",
    code: "function NUM_TO_FIXED(num, decimals){ try { return { success:true, value:Number(num).toFixed(Number(decimals)) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "num", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "decimals", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "STRING"
  },

  // DATE FUNCTIONS
  {
    id: 4001,
    name: "Add Months",
    description: "Adds specified number of months to a date.",
    version: "v1.0",
    functionName: "DATE_ADD_MONTHS",
    categoryId: "DATE",
    code: "function DATE_ADD_MONTHS(dateStr, months){ try { const d = new Date(dateStr); d.setMonth(d.getMonth() + Number(months)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateStr", dataType: "DATE", mandatory: true, sequence: 1 },
      { name: "months", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "DATE"
  },
  {
    id: 4002,
    name: "Format Chinese Date",
    description: "Formats date in Chinese format (生产日期：YYYY年MM月DD日).",
    version: "v1.0",
    functionName: "FORMAT_DATE_CN",
    categoryId: "DATE",
    code: "function FORMAT_DATE_CN(dateValue){ try { const d = new Date(dateValue); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return { success:true, value:`生产日期：${yyyy}年${mm}月${dd}日` }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "DATE", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 4003,
    name: "Add Days",
    description: "Adds specified number of days to a date.",
    version: "v1.0",
    functionName: "DATE_ADD_DAYS",
    categoryId: "DATE",
    code: "function DATE_ADD_DAYS(dateStr, days){ try { const d = new Date(dateStr); d.setDate(d.getDate() + Number(days)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateStr", dataType: "DATE", mandatory: true, sequence: 1 },
      { name: "days", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "DATE"
  },
  {
    id: 4004,
    name: "Add Years",
    description: "Adds specified number of years to a date.",
    version: "v1.0",
    functionName: "DATE_ADD_YEARS",
    categoryId: "DATE",
    code: "function DATE_ADD_YEARS(dateStr, years){ try { const d = new Date(dateStr); d.setFullYear(d.getFullYear() + Number(years)); return { success:true, value:d }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateStr", dataType: "DATE", mandatory: true, sequence: 1 },
      { name: "years", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "DATE"
  },
  {
    id: 4005,
    name: "Format Date",
    description: "Formats date to YYYY-MM-DD format.",
    version: "v1.0",
    functionName: "DATE_FORMAT",
    categoryId: "DATE",
    code: "function DATE_FORMAT(dateValue){ try { const d = new Date(dateValue); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return { success:true, value:`${yyyy}-${mm}-${dd}` }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "DATE", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 4006,
    name: "Get Year",
    description: "Extracts year from date.",
    version: "v1.0",
    functionName: "DATE_GET_YEAR",
    categoryId: "DATE",
    code: "function DATE_GET_YEAR(dateValue){ try { const d = new Date(dateValue); return { success:true, value:d.getFullYear() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "DATE", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 4007,
    name: "Get Month",
    description: "Extracts month from date (1-12).",
    version: "v1.0",
    functionName: "DATE_GET_MONTH",
    categoryId: "DATE",
    code: "function DATE_GET_MONTH(dateValue){ try { const d = new Date(dateValue); return { success:true, value:d.getMonth() + 1 }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "DATE", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 4008,
    name: "Get Day",
    description: "Extracts day from date.",
    version: "v1.0",
    functionName: "DATE_GET_DAY",
    categoryId: "DATE",
    code: "function DATE_GET_DAY(dateValue){ try { const d = new Date(dateValue); return { success:true, value:d.getDate() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "DATE", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 4009,
    name: "Date Difference in Days",
    description: "Calculates difference between two dates in days.",
    version: "v1.0",
    functionName: "DATE_DIFF_DAYS",
    categoryId: "DATE",
    code: "function DATE_DIFF_DAYS(date1, date2){ try { const d1 = new Date(date1); const d2 = new Date(date2); const diffTime = Math.abs(d2 - d1); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return { success:true, value:diffDays }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "date1", dataType: "DATE", mandatory: true, sequence: 1 },
      { name: "date2", dataType: "DATE", mandatory: true, sequence: 2 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 4010,
    name: "Get Current Date",
    description: "Returns current date and time.",
    version: "v1.0",
    functionName: "DATE_NOW",
    categoryId: "DATE",
    code: "function DATE_NOW(){ try { return { success:true, value:new Date() }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [],
    returnType: "DATE"
  },
  {
    id: 4011,
    name: "Is Valid Date",
    description: "Checks if value is a valid date.",
    version: "v1.0",
    functionName: "DATE_IS_VALID",
    categoryId: "DATE",
    code: "function DATE_IS_VALID(dateValue){ try { const d = new Date(dateValue); return { success:true, value:!isNaN(d.getTime()) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "dateValue", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },

  // UTILITY FUNCTIONS
  {
    id: 5001,
    name: "Is Empty",
    description: "Checks if a value is empty (null, undefined, or empty string).",
    version: "v1.0",
    functionName: "IS_EMPTY",
    categoryId: "UTIL",
    code: "function IS_EMPTY(value){ return { success:true, value:(value === null || value === undefined || value === '') }; }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5002,
    name: "Is Null",
    description: "Checks if a value is null.",
    version: "v1.0",
    functionName: "IS_NULL",
    categoryId: "UTIL",
    code: "function IS_NULL(value){ return { success:true, value:value === null }; }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5003,
    name: "Is Number",
    description: "Checks if a value is a number.",
    version: "v1.0",
    functionName: "IS_NUMBER",
    categoryId: "UTIL",
    code: "function IS_NUMBER(value){ return { success:true, value:typeof value === 'number' && !isNaN(value) }; }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5004,
    name: "Is String",
    description: "Checks if a value is a string.",
    version: "v1.0",
    functionName: "IS_STRING",
    categoryId: "UTIL",
    code: "function IS_STRING(value){ return { success:true, value:typeof value === 'string' }; }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5005,
    name: "Is Boolean",
    description: "Checks if a value is a boolean.",
    version: "v1.0",
    functionName: "IS_BOOLEAN",
    categoryId: "UTIL",
    code: "function IS_BOOLEAN(value){ return { success:true, value:typeof value === 'boolean' }; }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5006,
    name: "To String",
    description: "Converts any value to string.",
    version: "v1.0",
    functionName: "TO_STRING",
    categoryId: "UTIL",
    code: "function TO_STRING(value){ try { return { success:true, value:String(value) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "STRING"
  },
  {
    id: 5007,
    name: "To Number",
    description: "Converts value to number.",
    version: "v1.0",
    functionName: "TO_NUMBER",
    categoryId: "UTIL",
    code: "function TO_NUMBER(value){ try { const num = Number(value); if(isNaN(num)) return { success:false, error:{code:400,message:'Cannot convert to number'}}; return { success:true, value:num }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "NUMBER"
  },
  {
    id: 5008,
    name: "To Boolean",
    description: "Converts value to boolean.",
    version: "v1.0",
    functionName: "TO_BOOLEAN",
    categoryId: "UTIL",
    code: "function TO_BOOLEAN(value){ try { return { success:true, value:Boolean(value) }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5009,
    name: "Default Value",
    description: "Returns default value if input is empty/null.",
    version: "v1.0",
    functionName: "DEFAULT_VALUE",
    categoryId: "UTIL",
    code: "function DEFAULT_VALUE(value, defaultVal){ try { return { success:true, value:(value === null || value === undefined || value === '') ? defaultVal : value }; } catch(e){ return {success:false,error:{code:500,message:e.message}};} }",
    inputParams: [
      { name: "value", dataType: "ANY", mandatory: true, sequence: 1 },
      { name: "defaultVal", dataType: "ANY", mandatory: true, sequence: 2 }
    ],
    returnType: "ANY"
  },
  {
    id: 5010,
    name: "Equals",
    description: "Checks if two values are equal.",
    version: "v1.0",
    functionName: "EQUALS",
    categoryId: "UTIL",
    code: "function EQUALS(value1, value2){ return { success:true, value:value1 === value2 }; }",
    inputParams: [
      { name: "value1", dataType: "ANY", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "ANY", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5011,
    name: "Not Equals",
    description: "Checks if two values are not equal.",
    version: "v1.0",
    functionName: "NOT_EQUALS",
    categoryId: "UTIL",
    code: "function NOT_EQUALS(value1, value2){ return { success:true, value:value1 !== value2 }; }",
    inputParams: [
      { name: "value1", dataType: "ANY", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "ANY", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5012,
    name: "Greater Than",
    description: "Checks if first value is greater than second.",
    version: "v1.0",
    functionName: "GREATER_THAN",
    categoryId: "UTIL",
    code: "function GREATER_THAN(value1, value2){ return { success:true, value:Number(value1) > Number(value2) }; }",
    inputParams: [
      { name: "value1", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5013,
    name: "Less Than",
    description: "Checks if first value is less than second.",
    version: "v1.0",
    functionName: "LESS_THAN",
    categoryId: "UTIL",
    code: "function LESS_THAN(value1, value2){ return { success:true, value:Number(value1) < Number(value2) }; }",
    inputParams: [
      { name: "value1", dataType: "NUMBER", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "NUMBER", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5014,
    name: "Logical AND",
    description: "Returns true if both values are true.",
    version: "v1.0",
    functionName: "AND",
    categoryId: "UTIL",
    code: "function AND(value1, value2){ return { success:true, value:Boolean(value1) && Boolean(value2) }; }",
    inputParams: [
      { name: "value1", dataType: "BOOLEAN", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "BOOLEAN", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5015,
    name: "Logical OR",
    description: "Returns true if at least one value is true.",
    version: "v1.0",
    functionName: "OR",
    categoryId: "UTIL",
    code: "function OR(value1, value2){ return { success:true, value:Boolean(value1) || Boolean(value2) }; }",
    inputParams: [
      { name: "value1", dataType: "BOOLEAN", mandatory: true, sequence: 1 },
      { name: "value2", dataType: "BOOLEAN", mandatory: true, sequence: 2 }
    ],
    returnType: "BOOLEAN"
  },
  {
    id: 5016,
    name: "Logical NOT",
    description: "Returns opposite boolean value.",
    version: "v1.0",
    functionName: "NOT",
    categoryId: "UTIL",
    code: "function NOT(value){ return { success:true, value:!Boolean(value) }; }",
    inputParams: [
      { name: "value", dataType: "BOOLEAN", mandatory: true, sequence: 1 }
    ],
    returnType: "BOOLEAN"
  }
];

/**
 * Category definitions
 */
export const CATEGORIES: Category[] = [
  {
    id: "STR",
    name: "String Functions",
    description: "Functions for string manipulation and operations"
  },
  {
    id: "NUM",
    name: "Number Functions",
    description: "Functions for numeric calculations and operations"
  },
  {
    id: "DATE",
    name: "Date Functions",
    description: "Functions for date manipulation and formatting"
  },
  {
    id: "UTIL",
    name: "Utility Functions",
    description: "General utility and helper functions"
  }
];
