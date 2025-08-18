import { TableData } from '../types';
import { Node } from 'reactflow';

interface ParsedTable {
  name: string;
  schema?: string;
  columns: ParsedColumn[];
  compositePrimaryKey?: string[];
  indexes?: ParsedIndex[];
}

interface ParsedIndex {
  name: string;
  columns: string[];
  isUnique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

interface ParsedColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  checkConstraint?: string;
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
      
      const { columns, compositePrimaryKey } = this.parseColumns(columnDefinitions);
      
      tables.push({
        name: tableName,
        schema,
        columns,
        compositePrimaryKey,
      });
    }
    
    // Parse CREATE INDEX statements and associate them with tables
    this.parseIndexes(sql, tables);
    
    return tables;
  }
  
  private static parseIndexes(sql: string, tables: ParsedTable[]): void {
    // Parse CREATE INDEX statements
    const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(?:(\w+)\.)?(?:"([^"]+)"|(\w+))(?:\s+USING\s+(\w+))?\s*\(([^)]+)\)/gi;
    
    let match;
    while ((match = indexRegex.exec(sql)) !== null) {
      const isUnique = !!match[1];
      const indexName = match[2];
      const schema = match[3];
      const tableName = match[4] || match[5];
      const indexType = match[6]?.toLowerCase() as 'btree' | 'hash' | 'gin' | 'gist' | undefined;
      const columnList = match[7];
      
      const columns = columnList
        .split(',')
        .map(col => col.trim().replace(/["`]/g, ''))
        .filter(col => col.length > 0);
      
      // Find the corresponding table
      const table = tables.find(t => 
        t.name === tableName && 
        ((!schema && !t.schema) || schema === t.schema)
      );
      
      if (table) {
        if (!table.indexes) {
          table.indexes = [];
        }
        
        table.indexes.push({
          name: indexName,
          columns,
          isUnique,
          type: indexType || 'btree'
        });
      }
    }
  }
  
  private static parseColumns(columnDefinitions: string): { columns: ParsedColumn[], compositePrimaryKey?: string[] } {
    const columns: ParsedColumn[] = [];
    let compositePrimaryKey: string[] | undefined;
    
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
        
        // Check for composite primary key
        const upperCurrent = currentColumn.toUpperCase();
        if (upperCurrent.startsWith('PRIMARY KEY')) {
          const pkMatch = currentColumn.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
          if (pkMatch) {
            compositePrimaryKey = pkMatch[1]
              .split(',')
              .map(col => col.trim().replace(/["`]/g, ''))
              .filter(col => col.length > 0);
          }
        } else if (currentColumn && !upperCurrent.startsWith('FOREIGN KEY') && 
                   !upperCurrent.startsWith('CONSTRAINT')) {
          
          const column = this.parseColumn(currentColumn);
          if (column) {
            columns.push(column);
          }
        }
        
        currentColumn = '';
      }
    }
    
    return { columns, compositePrimaryKey };
  }
  
  private static parseColumn(columnDef: string): ParsedColumn | null {
    // Basic column parsing
    const parts = columnDef.trim().split(/\s+/);
    if (parts.length < 2) return null;
    
    const name = parts[0];
    const type = parts[1];
    
    const upperDef = columnDef.toUpperCase();
    const isPrimaryKey = upperDef.includes('PRIMARY KEY');
    const isNullable = !upperDef.includes('NOT NULL');
    const isUnique = upperDef.includes('UNIQUE') && !isPrimaryKey; // Primary keys are inherently unique
    
    // Extract default value
    let defaultValue: string | undefined;
    const defaultMatch = columnDef.match(/DEFAULT\s+([^,\s]+)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1];
    }
    
    // Extract check constraint
    let checkConstraint: string | undefined;
    const checkMatch = columnDef.match(/CHECK\s*\(([^)]+)\)/i);
    if (checkMatch) {
      checkConstraint = checkMatch[1].trim();
    }
    
    return {
      name,
      type: type.toUpperCase(),
      isPrimaryKey,
      isNullable,
      isUnique,
      checkConstraint,
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
      
      // First create the columns
      const columns = table.columns.map((col, colIndex) => ({
        id: `col-${Date.now()}-${index}-${colIndex}`,
        name: col.name,
        type: col.type,
        isPrimaryKey: col.isPrimaryKey,
        isNullable: col.isNullable,
        isUnique: col.isUnique,
        checkConstraint: col.checkConstraint,
        defaultValue: col.defaultValue,
      }));

      const tableData: TableData = {
        id: `table-${Date.now()}-${index}`,
        name: uniqueName,
        schema: table.schema,
        columns,
        indexes: this.convertParsedIndexesToTableIndexes(table.indexes || [], columns),
        foreignKeys: [],
        compositePrimaryKey: table.compositePrimaryKey ? 
          this.mapColumnNamesToIds(table.compositePrimaryKey, columns) : undefined,
      };
      
      return {
        id: tableData.id,
        type: 'table',
        position: { x: index * 300, y: index * 200 },
        data: tableData,
      };
    });
  }
  
  private static convertParsedIndexesToTableIndexes(parsedIndexes: ParsedIndex[], columns: any[]): any[] {
    return parsedIndexes.map((parsedIndex, idx) => ({
      id: `idx-${Date.now()}-${idx}`,
      name: parsedIndex.name,
      columns: parsedIndex.columns.map(colName => {
        const col = columns.find(c => c.name === colName);
        return col?.id || `col-unknown-${colName}`;
      }).filter(id => !id.startsWith('col-unknown')),
      isUnique: parsedIndex.isUnique,
      type: parsedIndex.type || 'btree'
    }));
  }
  
  private static mapColumnNamesToIds(columnNames: string[], columns: any[]): string[] {
    return columnNames.map(colName => {
      const col = columns.find(c => c.name === colName);
      return col?.id || `col-unknown-${colName}`;
    }).filter(id => !id.startsWith('col-unknown'));
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
      
      // Only add individual PRIMARY KEY if there's no composite primary key
      if (col.isPrimaryKey && !table.compositePrimaryKey?.length) {
        def += ' PRIMARY KEY';
      }
      
      // Add UNIQUE constraint
      if (col.isUnique) {
        def += ' UNIQUE';
      }
      
      // Add CHECK constraint
      if (col.checkConstraint) {
        def += ` CHECK (${col.checkConstraint})`;
      }
      
      return def;
    });
    
    // Add composite primary key if defined
    if (table.compositePrimaryKey && table.compositePrimaryKey.length > 0) {
      const pkColumns = table.compositePrimaryKey
        .map(colId => {
          const col = table.columns.find(c => c.id === colId);
          return col?.name;
        })
        .filter(Boolean)
        .join(', ');
      
      if (pkColumns) {
        columnDefinitions.push(`  PRIMARY KEY (${pkColumns})`);
      }
    }
    
    sql += columnDefinitions.join(',\n');
    sql += '\n);';
    
    // Add indexes after table creation
    if (table.indexes && table.indexes.length > 0) {
      sql += '\n';
      table.indexes.forEach(index => {
        const indexColumns = index.columns
          .map(colId => {
            const col = table.columns.find(c => c.id === colId);
            return col?.name;
          })
          .filter(Boolean)
          .join(', ');
        
        if (indexColumns) {
          const indexType = index.isUnique ? 'UNIQUE INDEX' : 'INDEX';
          const indexMethod = index.type && index.type !== 'btree' ? ` USING ${index.type.toUpperCase()}` : '';
          sql += `\nCREATE ${indexType} ${index.name} ON ${table.schema ? `${table.schema}.` : ''}${tableName}${indexMethod} (${indexColumns});`;
        }
      });
    }
    
    // Add simple indexes for columns marked with hasIndex
    const simpleIndexes = table.columns.filter(col => col.hasIndex && col.name);
    simpleIndexes.forEach(col => {
      const indexName = `idx_${tableName}_${col.name}`.toLowerCase();
      sql += `\nCREATE INDEX ${indexName} ON ${table.schema ? `${table.schema}.` : ''}${tableName} (${col.name});`;
    });
    
    return sql;
  }
}
