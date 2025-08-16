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

export interface DiagramNode {
  id: string;
  type: 'table' | 'view' | 'schema';
  position: { x: number; y: number };
  data: TableData;
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
