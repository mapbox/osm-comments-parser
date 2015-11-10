### Notes and comments parser

Reads XML files and saves into database.

### Setup

Run `npm install`

Setup database:

    createdb <db_name>
    psql <db_name> < create_tables.sql

Setup environment variables required for the project:

    export OSM_COMMENTS_POSTGRES_URL='postgres://<username>@localhost/osm-comments'
    export OSM_COMMENTS_TEST_POSTGRES_URL='postgres://username@localhost/osm-comments-test'


### Run

Currently, in a node shell:

    var notesParser = require('./notes');
    notesParser({filename: '/path/to/notes-xml'});

    var changesetParser = require('./changesets');
    changesetParser({filename: '/path/to/changeset-xml'});


### Test

Run `npm test`
