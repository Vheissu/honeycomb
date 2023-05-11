export interface ColumnSchema {
  name: string;
  type: string;
  primaryKey?: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
}

export function jsonSchemaToSqlite(schema: TableSchema): string {
  // SQLite specific conversion logic
  const columnsSql = schema.columns.map(column => {
    let columnSql = `${column.name} ${column.type}`;
    if (column.primaryKey) {
      columnSql += " PRIMARY KEY";
    }
    return columnSql;
  }).join(', ');

  return `CREATE TABLE IF NOT EXISTS ${schema.tableName} (${columnsSql});`;
}

export function jsonSchemaToMysql(schema: TableSchema): string {
  const columnsSql = schema.columns.map(column => {
    let columnSql = `${column.name} ${column.type}`;
    if (column.primaryKey) {
      columnSql += " PRIMARY KEY";
    }
    return columnSql;
  }).join(', ');

  return `CREATE TABLE IF NOT EXISTS ${schema.tableName} (${columnsSql}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
}

export function jsonSchemaToPostgresql(schema: TableSchema): string {
  const columnsSql = schema.columns.map(column => {
    let columnSql = `${column.name} ${column.type}`;
    if (column.primaryKey) {
      columnSql += " PRIMARY KEY";
    }
    return columnSql;
  }).join(', ');

  return `CREATE TABLE IF NOT EXISTS ${schema.tableName} (${columnsSql});`;
}

export function jsonSchemaToMssql(schema: TableSchema): string {
  const columnsSql = schema.columns.map(column => {
    let columnSql = `${column.name} ${column.type}`;
    if (column.primaryKey) {
      columnSql += " PRIMARY KEY";
    }
    return columnSql;
  }).join(', ');

  return `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${schema.tableName}' AND xtype='U')
          CREATE TABLE ${schema.tableName} (${columnsSql});
          `;
}
