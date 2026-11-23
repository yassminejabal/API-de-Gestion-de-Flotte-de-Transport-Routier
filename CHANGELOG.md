# Changelog

This changelog tracks the FleetTrackPRO backend API only. The React frontend is maintained separately and is not included in backend releases.

## [2.0.0] - Prepared, not yet published

### Added

- S3-compatible MinIO storage for mission order PDFs and pre-signed download URLs.
- Version 2 trip endpoints and fleet/tire analytics endpoints.
- OpenAPI documentation and expanded Jest coverage.
- Redis-backed authentication rate limiting with startup ordering that waits for Redis and MongoDB.

### Changed

- Updated the tire model and backend API behavior for the expanded fleet workflows.
- Chauffeur suspension now uses the schema's `isSuspended` field consistently. Suspended accounts cannot log in or be assigned to a trip.
- Added CORS support for API clients hosted separately from the backend.

## [1.0.0] - Existing GitHub release

- Stable initial fleet API for authentication, drivers, trucks, trailers, tires, trips, and maintenance.
