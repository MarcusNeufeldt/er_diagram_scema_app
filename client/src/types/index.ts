export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  hasIndex?: boolean;
  checkConstraint?: string;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface Index {
  id: string;
  name: string;
  columns: string[]; // column IDs
  isUnique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface TableData {
  id: string;
  name: string;
  schema?: string;
  columns: Column[];
  indexes: Index[];
  foreignKeys: ForeignKey[];
  compositePrimaryKey?: string[]; // column IDs that form composite primary key
  backgroundColor?: string;
  borderColor?: string;
}

export interface ForeignKey {
  id: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface StickyNoteData {
  id: string;
  content: string;
  color: string;
  author?: string;
  timestamp?: Date;
  width?: number;
  height?: number;
}

export interface ShapeData {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond';
  title?: string;
  text?: string; // Separate from title
  color: string;
  borderColor: string;
  width: number;
  height: number;
}

export interface DiagramNode {
  id: string;
  type: 'table' | 'view' | 'schema' | 'sticky-note' | 'shape';
  position: { x: number; y: number };
  data: TableData | StickyNoteData | ShapeData;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'foreign-key';
  data?: {
    cardinality: '1:1' | '1:many' | 'many:many';
  };
}
