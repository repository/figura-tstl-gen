export interface FDocs {
  globals: FDClass;
  math: FDClass;
  lists: FDList[];
}

export interface FDBase {
  name: string;
  description: string;
}

export interface FDField extends FDBase {
  type: string;
  editable: boolean;

  children: FDClass[];
}

export interface FDClass extends FDBase {
  parent?: string;

  methods: FDMethod[];
  fields: FDField[];
}

export interface FDMethod extends FDBase {
  aliases: string[];

  parameters: FDParameter[][];
  returns: string[];

  children: unknown[];
  static: boolean;
}

export interface FDParameter {
  name: string;
  type: string;
}

export interface FDList extends FDBase {
  entries: string[];
}
