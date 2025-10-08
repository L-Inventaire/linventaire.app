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

  // Système de priorité, 4 priorités possibles A A A, B B B, C C, D D D
  searchable_generated = `tsvector GENERATED ALWAYS AS (
  setweight(
    to_tsvector('simple', immutable_unaccent(split_part(searchable, ',', 1))) ||
    to_tsvector('french', immutable_unaccent(split_part(searchable, ',', 1))) ||
    to_tsvector('english', immutable_unaccent(split_part(searchable, ',', 1))),
    'A'
  ) ||
  setweight(
    to_tsvector('simple', immutable_unaccent(split_part(searchable, ',', 2))) ||
    to_tsvector('french', immutable_unaccent(split_part(searchable, ',', 2))) ||
    to_tsvector('english', immutable_unaccent(split_part(searchable, ',', 2))),
    'B'
  ) ||
  setweight(
    to_tsvector('simple', immutable_unaccent(split_part(searchable, ',', 3))) ||
    to_tsvector('french', immutable_unaccent(split_part(searchable, ',', 3))) ||
    to_tsvector('english', immutable_unaccent(split_part(searchable, ',', 3))),
    'C'
  ) ||
  setweight(
    to_tsvector('simple', immutable_unaccent(split_part(searchable, ',', 4))) ||
    to_tsvector('french', immutable_unaccent(split_part(searchable, ',', 4))) ||
    to_tsvector('english', immutable_unaccent(split_part(searchable, ',', 4))),
    'D'
  )
) STORED`;
}
