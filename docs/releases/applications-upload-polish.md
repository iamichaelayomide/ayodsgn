# Applications upload and empty-state polish

Upload now uses a dashed click/drag-and-drop card with an upload icon, supported formats, a 5 MB limit, filename/size after selection, replacement and removal. The submit button stays disabled until a valid single file is chosen. Invalid drops retain any prior valid selection; an invalid chooser selection clears the input. Dropping is ignored during a save. Keyboard focus is visible around the native file input.

The card comes first in the upload dialog. Tracker, category, attachment scope and document type use a compact two-column grid underneath. Private storage and backend validation remain unchanged.

Applications and document-bank empty states use a generated transparent pink/ivory/cobalt 3D folder illustration, optimized to a 25 KB WebP. Search-no-results stays minimal. Mobile and desktop dimensions were checked in Chrome previews, including image load, no horizontal overflow and card visibility. Physical-device file selection is not verified; extension file-access restrictions remain in place.

15 new upload interaction/validation checks, 12 existing Applications checks and 42 PWA checks pass. Module syntax and diff checks pass. Entry cache version is app.js v64, Applications module/style v2 and upload helper v1.

Rollback checkpoint: d54525afe986fafc772ba3cae93607ee250fde87. No schema or planner-data changes.
