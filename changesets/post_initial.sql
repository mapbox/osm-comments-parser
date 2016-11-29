\COPY changesets(id, created_at, closed_at, is_open, user_id, num_changes, is_unreplied, min_lon, min_lat, max_lon, max_lat) FROM 'csv/changesets.csv' DELIMITERS ',' CSV;

UPDATE changesets SET bbox = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326);

\COPY users(id,name) FROM 'csv/users.csv' DELIMITERS ',' CSV;

\COPY changeset_tags(id, changeset_id, key, value) FROM 'csv/tags.csv' DELIMITERS ',' CSV;

\COPY changeset_comments(id, changeset_id, user_id, timestamp, comment) FROM 'csv/comments.csv' DELIMITERS ',' CSV;
