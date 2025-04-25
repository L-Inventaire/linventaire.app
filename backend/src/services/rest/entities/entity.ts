export class RestEntity {
  id = "string";
  is_deleted = false;
  revisions = 0;
  restored_from = new Date(); // When restoring, we set the version of the entity we used to restore
  comment_id = "string"; // Comments and events are just revisions of the entity
  client_id = "type:clients";
  created_at = new Date();
  created_by = "type:users";
  updated_at = new Date();
  updated_by = "type:users";
  fields = "string"; // Contain custom fields
  searchable = "string";
  searchable_generated = "string";
  display_name = "string"; // A display name for the entity
}

export class RestEntityColumnsDefinition {
  client_id = "VARCHAR(64)";
  id = "VARCHAR(64)";
  is_deleted = "BOOLEAN";
  revisions = "INTEGER";
  restored_from = "BIGINT";
  comment_id = "VARCHAR(64)";
  created_at = "BIGINT";
  created_by = "VARCHAR(64)";
  updated_at = "BIGINT";
  updated_by = "VARCHAR(64)";
  fields = "JSONB";
  display_name = "TEXT";
  searchable = "TEXT";
  searchable_generated =
    "tsvector GENERATED ALWAYS AS (to_tsvector('simple', immutable_unaccent(searchable)) || to_tsvector('french', immutable_unaccent(searchable)) || to_tsvector('english', immutable_unaccent(searchable))) STORED";
}
