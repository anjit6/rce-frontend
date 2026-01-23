// Type definitions for subfunctions

export type DataType = 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ANY';

export type CategoryId = 'STR' | 'NUM' | 'DATE' | 'UTIL';

export interface InputParam {
  name: string;
  label: string;
  dataType: DataType;
  mandatory: boolean;
  sequence: number;
  default?: any;
}

export interface Subfunction {
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

export interface GroupedSubfunctions {
  [categoryId: string]: Subfunction[];
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}
