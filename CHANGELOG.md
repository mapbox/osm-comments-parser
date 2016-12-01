### Version 2.0.0

 - Significant changes to DB schema: https://github.com/mapbox/osm-comments-parser/issues/21

 - Adds an `is_unreplied` flag to changeset table while parsing, reducing complexity at query-time.

 - Flattened / denormalized DB schema should significantly speed up query times and allow for new use-cases.