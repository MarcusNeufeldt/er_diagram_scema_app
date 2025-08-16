import { TableData } from '../types';
import { Node } from 'reactflow';

interface ParsedTable {
  name: string;
  schema?: string;
  columns: ParsedColumn[];
}

interface ParsedColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
}

export class SQLParser {
  static parseCreateTable(sql: string): ParsedTable[] {
    const tables: ParsedTable[] = [];
    
    // Simple regex-based parser for CREATE TABLE statements
    // Handles both quoted and unquoted table names
    const createTableRegex = /CREATE\s+TABLE\s+(?:(\w+)\.)?(?:"([^"]+)"|(\w+))\s*\(([\s\S]*?)\)/gi;
    
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const schema = match[1];
      const tableName = match[2] || match[3]; // match[2] for quoted names, match[3] for unquoted
      const columnDefinitions = match[4]; // Updated to match[4] since we added a group
      
      const columns = this.parseColumns(columnDefinitions);
      
      tables.push({
        name: tableName,
        schema,
        columns,
      });
    }
    
    return tables;
  }
  
  private static parseColumns(columnDefinitions: string): ParsedColumn[] {
    const columns: ParsedColumn[] = [];
    
    // Split by commas, but be careful about commas inside parentheses
    const lines = columnDefinitions.split('\n');
    let currentColumn = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      
      currentColumn += ' ' + trimmed;
      
      // If line ends with comma or is the last line, process the column
      if (trimmed.endsWith(',') || lines.indexOf(line) === lines.length - 1) {
        currentColumn = currentColumn.trim().replace(/,$/, '');
        
        if (currentColumn && !currentColumn.toUpperCase().startsWith('PRIMARY KEY') && 
            !currentColumn.toUpperCase().startsWith('FOREIGN KEY') &&
            !currentColumn.toUpperCase().startsWith('CONSTRAINT')) {
          
          const column = this.parseColumn(currentColumn);
          if (column) {
            columns.push(column);
          }
        }
        
        currentColumn = '';
      }
    }
    
    return columns;
  }
  
  private static parseColumn(columnDef: string): ParsedColumn | null {
    // Basic column parsing
    const parts = columnDef.trim().split(/\s+/);
    if (parts.length < 2) return null;
    
    const name = parts[0];
    const type = parts[1];
    
    const isPrimaryKey = columnDef.toUpperCase().includes('PRIMARY KEY');
    const isNullable = !columnDef.toUpperCase().includes('NOT NULL');
    
    // Extract default value
    let defaultValue: string | undefined;
    const defaultMatch = columnDef.match(/DEFAULT\s+([^,\s]+)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1];
    }
    
    return {
      name,
      type: type.toUpperCase(),
      isPrimaryKey,
      isNullable,
      defaultValue,
    };
  }
  
  static convertToNodes(tables: ParsedTable[]): Node[] {
    // Track used names to handle duplicates
    const usedNames = new Set<string>();
    
    return tables.map((table, index) => {
      // Make table name unique if it's already used
      let uniqueName = table.name;
      let counter = 1;
      while (usedNames.has(uniqueName)) {
        uniqueName = `${table.name}_${counter}`;
        counter++;
      }
      usedNames.add(uniqueName);
      
      const tableData: TableData = {
        id: `table-${Date.now()}-${index}`,
        name: uniqueName,
        schema: table.schema,
        columns: table.columns.map((col, colIndex) => ({
          id: `col-${Date.now()}-${index}-${colIndex}`,
          name: col.name,
          type: col.type,
          isPrimaryKey: col.isPrimaryKey,
          isNullable: col.isNullable,
          defaultValue: col.defaultValue,
        })),
        indexes: [],
        foreignKeys: [],
      };
      
      return {
        id: tableData.id,
        type: 'table',
        position: { x: index * 300, y: index * 200 },
        data: tableData,
      };
    });
  }
}

export class SQLGenerator {
  static generateDDL(nodes: Node[]): string {
    const tableNodes = nodes.filter(node => node.type === 'table');
    
    let ddl = '-- Generated DDL\n\n';
    
    for (const node of tableNodes) {
      const tableData = node.data as TableData;
      ddl += this.generateCreateTable(tableData) + '\n\n';
    }
    
    return ddl;
  }
  
  private static generateCreateTable(table: TableData): string {
    // Quote table names that contain spaces or special characters
    const tableName = table.name.includes(' ') || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table.name) 
      ? `"${table.name}"` 
      : table.name;
    
    let sql = `CREATE TABLE ${table.schema ? `${table.schema}.` : ''}${tableName} (\n`;
    
    const columnDefinitions = table.columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (!col.isNullable) {
        def += ' NOT NULL';
      }
      
      if (col.defaultValue) {
        def += ` DEFAULT ${col.defaultValue}`;
      }
      
      if (col.isPrimaryKey) {
        def += ' PRIMARY KEY';
      }
      
      return def;
    });
    
    sql += columnDefinitions.join(',\n');
    sql += '\n);';
    
    return sql;
  }
}
