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
    user_id integer,
    min_lon float NULL,
    min_lat float NULL,
    max_lon float NULL,
    max_lat float NULL,
    bbox geometry(POLYGON, 4326) NULL,
    num_changes integer
);

CREATE TABLE IF NOT EXISTS changeset_tags (
    id uuid PRIMARY KEY,
    changeset_id integer,
    key text,
    value text
);

CREATE TABLE IF NOT EXISTS changeset_comments (
    id uuid PRIMARY KEY,
    changeset_id integer,
    user_id integer NULL,
    timestamp timestamptz,
    comment text 
);
