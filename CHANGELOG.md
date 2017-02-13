### Version 3.1.0

 - Processes detailed stats for a list of users parsing change files with node-osmium

### Version 3.0.0

 - Adds metadata for users
 - Parses all changesets, not just those with comments

### Version 2.0.0

 - Significant changes to DB schema: https://github.com/mapbox/osm-comments-parser/issues/21

 - Adds an `is_unreplied` flag to changeset table while parsing, reducing complexity at query-time.

 - Flattened / denormalized DB schema should significantly speed up query times and allow for new use-cases.
