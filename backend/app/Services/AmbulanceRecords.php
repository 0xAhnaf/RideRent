<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AmbulanceRecords
{
    public function bookings(?int $id = null): array
    {
        $sql = <<<'SQL'
            SELECT b.*, u.name AS customer_name, u.email AS customer_email,
                d.name AS driver_name, d.phone AS driver_phone,
                p.id AS payment_id, p.amount AS payment_amount, p.payment_status
            FROM ambulance_bookings b
            LEFT JOIN users u ON u.id = b.user_id
            LEFT JOIN ambulance_drivers d ON d.id = b.ambulance_driver_id
            LEFT JOIN ambulance_payments p ON p.ambulance_booking_id = b.id
        SQL;

        return DB::select(
            $sql.($id === null ? ' ORDER BY b.id DESC' : ' WHERE b.id = ?'),
            $id === null ? [] : [$id],
        );
    }

    public function booking(int $id): object
    {
        return $this->bookings($id)[0] ?? abort(404, 'Ambulance booking not found.');
    }

    public function lockBooking(int $id): object
    {
        return DB::selectOne('SELECT * FROM ambulance_bookings WHERE id = ? FOR UPDATE', [$id])
            ?? abort(404, 'Ambulance booking not found.');
    }

    public function lockDriver(int $id): object
    {
        return DB::selectOne('SELECT * FROM ambulance_drivers WHERE id = ? FOR UPDATE', [$id])
            ?? abort(404, 'Ambulance driver not found.');
    }

    public function driverHasActiveBooking(int $id): bool
    {
        return DB::selectOne(
            "SELECT id FROM ambulance_bookings WHERE ambulance_driver_id = ? AND status IN ('pending', 'confirmed') LIMIT 1",
            [$id],
        ) !== null;
    }

    public function releaseDriver(?int $id): void
    {
        if ($id === null) {
            return;
        }

        $driver = $this->lockDriver($id);

        if ($driver->status === 'busy' && ! $this->driverHasActiveBooking($id)) {
            DB::update("UPDATE ambulance_drivers SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [$id]);
        }
    }

    // Keep the original renter API's fields and Eloquent-style timestamp format.
    public function renterBooking(object $booking): array
    {
        $record = (array) $booking;
        unset($record['ambulance_driver_id']);

        foreach (['created_at', 'updated_at'] as $field) {
            $record[$field] = $record[$field] === null ? null : Carbon::parse($record[$field])->toISOString();
        }

        $record['id'] = (int) $record['id'];
        $record['user_id'] = (int) $record['user_id'];

        return $record;
    }
}
