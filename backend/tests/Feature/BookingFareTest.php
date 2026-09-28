<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\Support\AmbulanceMySqlTestCase;

class BookingFareTest extends AmbulanceMySqlTestCase
{
    private function car(): int
    {
        DB::insert("INSERT INTO cars (name, brand, category, seats, quantity, price, status) VALUES ('Fare Test', 'Test', 'Sedan', 4, 2, 1000, 'available')");
        return (int) DB::selectOne('SELECT LAST_INSERT_ID() AS id')->id;
    }

    public function test_saved_fare_cannot_be_tampered_and_price_change_requires_review(): void
    {
        $this->signIn(1002);
        $car = $this->car();
        $input = $this->quotedBookingData($car, ['destination_district' => 'Dhaka', 'destination_thana' => 'Mohammadpur', 'trip_type' => 'One Way', 'trip_duration' => '1 Day']);
        $this->postJson('/api/bookings', [...$input, 'quote_token' => str_repeat('0', 64)])->assertUnprocessable()->assertJsonValidationErrors('quote_token');
        $this->assertSame(0, (int) DB::selectOne('SELECT COUNT(*) AS n FROM bookings')->n);
        DB::update('UPDATE cars SET price = 1200 WHERE id = ?', [$car]);
        $this->postJson('/api/bookings', $input)->assertUnprocessable()->assertJsonValidationErrors('quote_token');
        $input = $this->quotedBookingData($car, ['destination_district' => 'Dhaka', 'destination_thana' => 'Mohammadpur', 'trip_type' => 'One Way', 'trip_duration' => '1 Day']);
        $booking = $this->postJson('/api/bookings', [...$input, 'total_fare' => 1])->assertCreated()
            ->assertJsonPath('booking.total_fare', '1700.00')->json('booking.b_id');
        DB::update('UPDATE cars SET price = 9999 WHERE id = ?', [$car]);
        $this->getJson('/api/bookings/'.$booking)->assertOk()->assertJsonPath('total_fare', '1700.00');
        $this->assertSame(2, (int) DB::selectOne('SELECT quantity FROM cars WHERE id = ?', [$car])->quantity);
        $this->signIn();
        DB::update("UPDATE bookings SET booking_status = 'Confirmed' WHERE b_id = ?", [$booking]);
        $this->postJson('/api/payments', ['booking_id' => $booking, 'amount' => 1, 'payment_method' => 'cash'])->assertUnprocessable()->assertJsonValidationErrors('amount');
        $payment = $this->postJson('/api/payments', ['booking_id' => $booking, 'amount' => 1700, 'payment_method' => 'cash'])->assertCreated()->json('payment.id');
        $this->putJson('/api/payments/'.$payment, ['amount' => 1800, 'payment_method' => 'cash'])->assertUnprocessable()->assertJsonValidationErrors('amount');
        $this->putJson('/api/payments/'.$payment, ['amount' => 1700, 'payment_method' => 'cash'])->assertOk();
    }

    public function test_invalid_routes_and_extended_days_are_rejected(): void
    {
        $car = $this->car();
        $valid = $this->quotedBookingData($car);
        foreach ([['pickup_thana' => 'Not a thana'], ['pickup_district' => 'Not a district'], ['car_id' => 999999], ['trip_type' => 'Invalid'], ['trip_duration' => 'More Than 7 Days', 'custom_days' => 7], ['trip_duration' => 'More Than 7 Days', 'custom_days' => 8.5], ['trip_duration' => 'More Than 7 Days', 'custom_days' => 366]] as $override) {
            $this->getJson('/api/booking-fare?'.http_build_query(array_merge($valid, $override)))->assertUnprocessable();
        }
        $this->signIn(1002);
        $input = $this->quotedBookingData($car, ['trip_duration' => 'More Than 7 Days', 'custom_days' => 8]);
        $this->postJson('/api/bookings', $input)->assertCreated()->assertJsonPath('booking.trip_duration', '8 Days')->assertJsonPath('booking.fare.charged_days', 8);
    }

    public function test_legacy_booking_stays_without_fare_and_allows_manual_payment(): void
    {
        $car = $this->car();
        DB::insert("INSERT INTO bookings (u_id,c_id,trip_type,trip_datetime,trip_duration,pickup,destination,booking_status) VALUES (1002,?,'One Way',CURRENT_TIMESTAMP,'1 Day','Dhaka','Feni','Confirmed')", [$car]);
        $id = (int) DB::selectOne('SELECT LAST_INSERT_ID() AS id')->id;
        $this->signIn();
        $this->getJson('/api/admin/bookings/'.$id)->assertOk()->assertJsonPath('fare', null)->assertJsonPath('total_fare', null)->assertJsonPath('customer_name', 'Test User 1002');
        $this->postJson('/api/payments', ['booking_id' => $id, 'amount' => 1234, 'payment_method' => 'cash'])->assertCreated();
    }
}
