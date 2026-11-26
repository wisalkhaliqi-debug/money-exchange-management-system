-- List all foreign-key relationships in the current Oracle schema.
-- This is a read-only inspection query; it does not create constraints.
SELECT
    child.table_name      AS child_table,
    child.constraint_name AS foreign_key,
    child_cols.column_name AS child_column,
    parent.table_name     AS parent_table,
    parent_cols.column_name AS parent_column
FROM user_constraints child
JOIN user_cons_columns child_cols
  ON child.constraint_name = child_cols.constraint_name
 AND child.table_name = child_cols.table_name
JOIN user_constraints parent
  ON child.r_constraint_name = parent.constraint_name
JOIN user_cons_columns parent_cols
  ON parent.constraint_name = parent_cols.constraint_name
 AND child_cols.position = parent_cols.position
WHERE child.constraint_type = 'R'
ORDER BY child.table_name, child.constraint_name, child_cols.position;
