# Ambulance management verification

Run from `backend` after applying the three `2026_09_26` ambulance migrations:

```powershell
php artisan test
```

The integration suite requires the configured local MySQL server and permission to
create a database. It creates a uniquely named `riderent_ambulance_test_*` schema
and copies table definitions only. Test records are inserted using raw SQL in a
transaction and rolled back after each test. The application's tables receive no
test writes. The temporary schema name is strictly validated and the schema is
automatically dropped after the test class finishes.

These tests use MySQL because SQLite cannot verify the application's `FOR UPDATE`,
`LAST_INSERT_ID()`, enum and foreign-key behavior accurately. No existing migration
or teammate database routine is rewritten for the test suite. The existing renter
ambulance procedure receives a read-only call for user ID zero.

Coverage includes admin authorization, session login/logout, driver CRUD and unique
phone/license validation, renter ownership and response fields, booking assignment,
status transitions, driver availability, payment validation/edit/pay/refund/delete,
financial-history protection, database constraints, and the normal vehicle booking,
driver and payment workflow.

Manual browser checks:

- Open `/admin/ambulance` from the shared sidebar and the Add/Edit Vehicle sidebars.
- Switch among Drivers, Bookings and Payments on desktop and mobile.
- Submit a renter ambulance request and check its history entry.
- Assign a driver, confirm a booking, add a payment, mark it paid, and complete the trip.
- Verify another active booking cannot use the busy driver.
- Refund before cancellation; remove a pending payment explicitly before cancellation.
- Check loading, empty, validation and server-error states, and refresh a section URL.

The ambulance driver UI reuses `AdminDriversPage` with optional props. Its defaults
continue to use `/api/drivers` and the normal Driver Management page.

The three ambulance schema migrations use raw MySQL DDL through `DB::statement`.

## Implementation file inventory

Modified:

- `backend/app/Http/Controllers/AmbulanceBookingController.php`
- `backend/routes/api.php`
- `frontend/src/App.jsx`
- `frontend/src/components/AmbulanceSection.jsx`
- `frontend/src/components/admin/AdminSidebar.jsx`
- `frontend/src/pages/AddVehiclePage.jsx` (Ambulance navigation line only)
- `frontend/src/pages/EditVehiclePage.jsx` (Ambulance navigation line only)
- `frontend/src/pages/AdminDashboard.jsx` (ambulance data only)
- `frontend/src/pages/AdminDriversPage.jsx` (optional reuse props; existing defaults preserved)
- `frontend/src/pages/RenterProfile/RentalActivity.jsx` (missing date heading)

Created:

- `backend/app/Http/Controllers/AdminAmbulanceBookingController.php`
- `backend/app/Http/Controllers/AmbulanceDriverController.php`
- `backend/app/Http/Controllers/AmbulancePaymentController.php`
- `backend/app/Services/AmbulanceRecords.php`
- `backend/database/migrations/2026_09_26_000001_create_ambulance_drivers_table.php`
- `backend/database/migrations/2026_09_26_000002_add_ambulance_driver_id_to_ambulance_bookings_table.php`
- `backend/database/migrations/2026_09_26_000003_create_ambulance_payments_table.php`
- `backend/tests/Feature/AdminAmbulanceManagementTest.php`
- `backend/tests/Support/AmbulanceMySqlTestCase.php`
- `backend/tests/AMBULANCE_TESTS.md`
- `frontend/src/pages/AdminAmbulancePage.jsx`
- `frontend/src/components/admin/ambulance/AmbulanceDriversSection.jsx`
- `frontend/src/components/admin/ambulance/AmbulanceBookingsSection.jsx`
- `frontend/src/components/admin/ambulance/AmbulancePaymentsSection.jsx`
- `frontend/src/components/admin/ambulance/ambulanceApi.js`
- `frontend/src/styles/admin-ambulance-page.css`
