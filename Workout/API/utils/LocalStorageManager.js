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

    console.log('[LocalStorageManager] Storing entity:', { table, entity, fields });

    const now = new Date().toISOString();
    const entityId = entity[idField] || uuid();

    // Prepare base fields
    const baseFields = {
      [idField]: entityId,
      created_at: entity.created_at || now,
      updated_at: entity.updated_at || now,
      sync_status: syncStatus,
      version: entity.version || 1,
      // Explicitly set last_synced_at based on sync status
      // This overrides any database DEFAULT values
      last_synced_at: syncStatus === 'synced' ? now : null
    };

    // Add the specified fields from the entity
    fields.forEach(field => {
      baseFields[field] = entity[field];
    });

    console.log('[LocalStorageManager] Prepared fields:', baseFields);

    // Create placeholders and values for SQL query
    const fieldNames = Object.keys(baseFields);
    const placeholders = fieldNames.map(() => '?').join(', ');
    const values = fieldNames.map(field => baseFields[field]);

    // Insert or replace main entity
    const query = `INSERT OR REPLACE INTO ${table} (${fieldNames.join(', ')})
                  VALUES (${placeholders})`;
    
    console.log('[LocalStorageManager] Executing query:', query);
    console.log('[LocalStorageManager] With values:', values);

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
          // Special case for workout_exercises table
          const relationIdField = relationTable === 'workout_exercises' ? 'workout_exercises_id' : `${relationTable.slice(0, -1)}_id`;
          const relationId = item[relationIdField] || uuid();
          const relationFields = {
            [relationIdField]: relationId,
            [parentIdField]: entityId,
            ...(orderField && { [orderField]: index }),
            created_at: item.created_at || now,
            updated_at: item.updated_at || now,
            sync_status: syncStatus,
            version: item.version || 1,
            // Explicitly set last_synced_at based on sync status for relations
            // This overrides any database DEFAULT values
            last_synced_at: syncStatus === 'synced' ? now : null,
            ...item
          };

          const rFieldNames = Object.keys(relationFields);
          const rplaceholders = rFieldNames.map(() => '?').join(', ');
          const rValues = rFieldNames.map(field => relationFields[field]);

          await this.db.execute(
            `INSERT OR REPLACE INTO ${relationTable} (${rFieldNames.join(', ')})
             VALUES (${rplaceholders})`,
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