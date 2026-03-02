# Contracts: Branch Setup & Surgical Removals

No new API contracts are introduced by this spec.

This spec is purely subtractive (removing work-attendance) and editorial (branding updates, deprecation comments). No new endpoints, services, or data interfaces are created.

## Removed Contracts

The following service interfaces are removed along with the work-attendance feature:

- `workAttendanceService.checkIn(input: CheckinInput)` — Teacher GPS check-in
- `workAttendanceService.checkOut(input: CheckoutInput)` — Teacher GPS check-out
- `workAttendanceService.getCheckins(filters)` — Query teacher check-in records
- `workAttendanceService.getWorkSchedules(schoolId)` — Query teacher work schedules
- `workAttendanceService.upsertWorkSchedule(input)` — Create/update work schedules
- `locationService.calculateDistance(coords1, coords2)` — GPS distance calculation
- `wifiService.getCurrentSSID()` — WiFi SSID detection

These are internal service methods, not exposed APIs. Their removal has no external impact.
