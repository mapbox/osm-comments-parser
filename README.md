[![CircleCI](https://circleci.com/gh/mapbox/osm-comments-parser.svg?style=svg)](https://circleci.com/gh/mapbox/osm-comments-parser)

### Notes and comments parser

Reads XML files and saves into database.

### Setup

Run `npm install`

Setup database:

    createdb <db_name>
    psql <db_name> < scripts/create_tables.sql
    psql <db_name> < scripts/create_indexes.sql

Setup environment variables required for the project:

    export OSM_COMMENTS_POSTGRES_URL='postgres://<username>@localhost/osm-comments'
    export OSM_COMMENTS_TEST_POSTGRES_URL='postgres://username@localhost/osm-comments-test'


### Run

In a node shell:

    var notesParser = require('./notes');
    notesParser({filename: '/path/to/notes-xml'});

    var changesetParser = require('./changesets');
    changesetParser({filename: '/path/to/changeset-xml'});

From the terminal:

    node index.js <notes|changesets> --filename=/path/to/xml/file


### Test

Run `npm test`

### Initial load of changesets

When starting out with an empty database, there is an optimized way to load the initial backlog of changesets. Create an empty folder called `csv` in the project root and pass the option: `initial=true` changesetParser. After this command is run, run `psql <db_name> < changesets/post_initial.sql` to load the CSVs into the database. FIXME: this should be scripted.
