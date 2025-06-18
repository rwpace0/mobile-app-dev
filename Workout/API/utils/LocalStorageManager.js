import { v4 as uuid } from 'uuid';

class LocalStorageManager {
  constructor(db) {
    this.db = db;
  }

  async storeEntity(entity, options) {
    const {
      table,
      idField = `${table.slice(0, -1)}_id`,
      fields,
      syncStatus = "synced",
      relations = []
    } = options;

    const now = new Date().toISOString();
    const entityId = entity[idField] || uuid();

    // Prepare base fields
    const baseFields = {
      [idField]: entityId,
      created_at: entity.created_at || now,
      updated_at: entity.updated_at || now,
      sync_status: syncStatus,
      version: entity.version || 1,
      last_synced_at: now,
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field]: entity[field]
      }), {})
    };

    // Create placeholders and values for SQL query
    const fieldNames = Object.keys(baseFields);
    const placeholders = fieldNames.map(() => '?').join(', ');
    const values = fieldNames.map(field => baseFields[field]);

    // Insert or replace main entity
    const query = `INSERT OR REPLACE INTO ${table} (${fieldNames.join(', ')})
                  VALUES (${placeholders})`;
    
    await this.db.execute(query, values);

    // Handle relations
    for (const relation of relations) {
      const {
        table: relationTable,
        data: relationData,
        parentIdField = idField,
        orderField
      } = relation;

      if (Array.isArray(relationData)) {
        // Delete existing relations
        await this.db.execute(
          `DELETE FROM ${relationTable} WHERE ${parentIdField} = ?`,
          [entityId]
        );

        // Insert new relations
        for (const [index, item] of relationData.entries()) {
          const relationId = item[`${relationTable.slice(0, -1)}_id`] || uuid();
          const relationFields = {
            [`${relationTable.slice(0, -1)}_id`]: relationId,
            [parentIdField]: entityId,
            ...(orderField && { [orderField]: index }),
            created_at: item.created_at || now,
            updated_at: item.updated_at || now,
            sync_status: syncStatus,
            version: item.version || 1,
            last_synced_at: now,
            ...item
          };

          const rFieldNames = Object.keys(relationFields);
          const rPlaceholders = rFieldNames.map(() => '?').join(', ');
          const rValues = rFieldNames.map(field => relationFields[field]);

          await this.db.execute(
            `INSERT OR REPLACE INTO ${relationTable} (${rFieldNames.join(', ')})
             VALUES (${rPlaceholders})`,
            rValues
          );
        }
      }
    }

    return entityId;
  }

  async getEntityById(options) {
    const {
      table,
      id,
      idField = `${table.slice(0, -1)}_id`,
      relations = [],
      excludePendingDelete = true
    } = options;

    let query = `SELECT * FROM ${table} WHERE ${idField} = ?`;
    
    if (excludePendingDelete) {
      query += ` AND sync_status != 'pending_delete'`;
    }

    const [entity] = await this.db.query(query, [id]);

    if (!entity) return null;

    // Handle relations
    for (const relation of relations) {
      const {
        table: relationTable,
        parentIdField = idField,
        as = relationTable
      } = relation;

      const relationQuery = `
        SELECT * FROM ${relationTable}
        WHERE ${parentIdField} = ?
        ${excludePendingDelete ? "AND sync_status != 'pending_delete'" : ''}
        ORDER BY created_at DESC
      `;

      const relationData = await this.db.query(relationQuery, [id]);
      entity[as] = relationData;
    }

    return entity;
  }

  async deleteEntity(options) {
    const {
      table,
      id,
      idField = `${table.slice(0, -1)}_id`,
      softDelete = true
    } = options;

    if (softDelete) {
      await this.db.execute(
        `UPDATE ${table} SET sync_status = 'pending_delete'
         WHERE ${idField} = ?`,
        [id]
      );
    } else {
      await this.db.execute(
        `DELETE FROM ${table} WHERE ${idField} = ?`,
        [id]
      );
    }
  }
}

export default LocalStorageManager; 