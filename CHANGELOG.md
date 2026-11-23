# Changelog

This changelog tracks the FleetTrackPRO backend API only. The React frontend is maintained separately and is not included in backend releases.

## [2.0.2] - Prepared, not yet published

### Fixed

- Regenerate stored mission-order PDFs when the template version changes, instead of returning an older MinIO document.
- Store generated PDFs under a template-versioned object key and persist the template version with the trip.

## [2.0.1] - Prepared, not yet published

### Changed

- Redesigned generated mission orders with FleetTrackPRO colors, clear section hierarchy, and tables for mission details, driver, vehicles, and itinerary.
- Added separate signature and validation fields and clearer handling for missing values and dates.
- Included the assigned driver's phone number in mission order data when available.

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
