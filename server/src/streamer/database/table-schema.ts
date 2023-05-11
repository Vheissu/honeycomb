export interface ColumnSchema {
  name: string;
  type: string;
  primaryKey?: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
}

export function jsonSchemaToSql(schema: TableSchema): string {
  const columnsSql = schema.columns.map(column => {
    let columnSql = `${column.name} ${column.type}`;
    if (column.primaryKey) {
      columnSql += " PRIMARY KEY";
    }
    return columnSql;
  }).join(', ');

  return `CREATE TABLE IF NOT EXISTS ${schema.tableName} (${columnsSql});`;
}
