export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  isNullable: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableData {
  id: string;
  name: string;
  schema?: string;
  columns: Column[];
  indexes: string[];
  foreignKeys: ForeignKey[];
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
