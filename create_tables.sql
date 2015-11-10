CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY,
    name text
);

CREATE TABLE IF NOT EXISTS notes (
    id integer PRIMARY KEY,
    created_at timestamptz,
    closed_at timestamptz NULL,
    opened_by integer REFERENCES users (id) NULL,
    point geometry(POINT, 4326)
);

CREATE TABLE IF NOT EXISTS note_comments (
    id uuid PRIMARY KEY,
    note_id integer REFERENCES notes (id),
    action text,
    comment text,
    timestamp timestamptz,
    user_id integer REFERENCES users (id) NULL
);

CREATE TABLE IF NOT EXISTS changesets (
    id integer PRIMARY KEY,
    created_at timestamptz,
    closed_at timestamptz NULL,
    is_open boolean,
    user_id integer REFERENCES users (id),
    bbox geometry(POLYGON, 4326),
    num_changes integer
);

CREATE TABLE IF NOT EXISTS changeset_tags (
    id uuid PRIMARY KEY,
    changeset_id integer REFERENCES changesets (id),
    key text,
    value text
);

CREATE TABLE IF NOT EXISTS changeset_comments (
    id uuid PRIMARY KEY,
    changeset_id integer REFERENCES changesets (id),
    user_id integer REFERENCES users (id) NULL,
    timestamp timestamptz,
    comment text 
);