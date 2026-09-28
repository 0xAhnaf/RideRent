<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\Support\AmbulanceMySqlTestCase;

class AdminAmbulanceManagementTest extends AmbulanceMySqlTestCase
{
    public function test_database_constraints_and_existing_renter_procedure(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/admin/ambulance/drivers', $this->driverData())->assertCreated()->json('driver.id');
        try {
            DB::insert('INSERT INTO ambulance_drivers (name, phone, license_number) VALUES (?, ?, ?)',
                ['Duplicate Test', $this->driverData()['phone'], 'DIFFERENT-LICENSE']);
            $this->fail('The unique phone index must reject a duplicate.');
        } catch (\Illuminate\Database\QueryException $error) {
            $this->assertSame(1062, (int) $error->errorInfo[1]);
        }

        $booking = $this->createBooking();
        try {
            DB::update('UPDATE ambulance_bookings SET ambulance_driver_id = ? WHERE id = ?', [999999, $booking]);
            $this->fail('The ambulance driver foreign key must reject a missing driver.');
        } catch (\Illuminate\Database\QueryException $error) {
            $this->assertSame(1452, (int) $error->errorInfo[1]);
        }

        $this->putJson("/api/admin/ambulance/bookings/{$booking}/driver", ['ambulance_driver_id' => $id])->assertOk();
        try {
            DB::delete('DELETE FROM ambulance_drivers WHERE id = ?', [$id]);
            $this->fail('The driver foreign key must retain booking history.');
        } catch (\Illuminate\Database\QueryException $error) {
            $this->assertSame(1451, (int) $error->errorInfo[1]);
        }

        $this->getJson('/api/admin/ambulance/drivers/not-a-number')->assertNotFound();
        $this->assertSame([], DB::connection('ambulance_source')->select('CALL GetRenterAmbulanceBookings(?)', [0]));
    }

    public function test_session_login_and_admin_authorization_still_work(): void
    {
        $password = bin2hex(random_bytes(16));
        DB::update('UPDATE users SET password = ? WHERE id = ?', [Hash::make($password), 1001]);
        $this->withHeaders(['Origin' => 'http://localhost:5173']);
        $this->postJson('/api/login', ['email' => 'test1001@example.test', 'password' => $password])
            ->assertOk()->assertJsonPath('user.role', 'admin');
        Auth::forgetGuards();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('user.id', 1001);
        $this->getJson('/api/admin/ambulance/drivers')->assertOk();
        $this->postJson('/api/logout')->assertOk();
        Auth::forgetGuards();
        $this->getJson('/api/admin/ambulance/drivers')->assertUnauthorized();
    }

    public function test_admin_routes_require_authentication_and_admin_role(): void
    {
        foreach (['drivers', 'bookings', 'payments', 'payments-summary'] as $path) {
            $this->getJson('/api/admin/ambulance/'.$path)->assertUnauthorized();
        }
        $this->signIn(1002);
        foreach (['drivers', 'bookings', 'payments', 'payments-summary'] as $path) {
            $this->getJson('/api/admin/ambulance/'.$path)->assertForbidden();
        }
        foreach (['post', 'put', 'patch', 'delete'] as $verb) {
            $path = $verb === 'post' ? 'drivers' : 'drivers/1';
            $this->{$verb.'Json'}('/api/admin/ambulance/'.$path, [])->assertForbidden();
        }
        $this->patchJson('/api/admin/ambulance/bookings/1/status', ['status' => 'confirmed'])->assertForbidden();
        $this->putJson('/api/admin/ambulance/bookings/1/driver', ['ambulance_driver_id' => 1])->assertForbidden();
        $this->postJson('/api/admin/ambulance/payments', [])->assertForbidden();
    }

    public function test_renter_booking_contract_ownership_and_validation(): void
    {
        $this->signIn(1002);
        $id = $this->createBooking();
        $this->getJson('/api/ambulance-bookings')->assertOk()->assertJsonCount(1, 'bookings');
        $response = $this->getJson('/api/ambulance-bookings/'.$id)->assertOk()->assertJsonPath('booking.status', 'pending');
        $this->assertArrayNotHasKey('ambulance_driver_id', $response->json('booking'));
        $this->assertStringEndsWith('Z', $response->json('booking.created_at'));
        $this->postJson('/api/ambulance-bookings', [...$this->bookingData(), 'emergency_contact' => 'bad'])->assertUnprocessable()->assertJsonValidationErrors('emergency_contact');
        $this->signIn(1003);
        $this->getJson('/api/ambulance-bookings')->assertJsonCount(0, 'bookings');
        $this->getJson('/api/ambulance-bookings/'.$id)->assertForbidden();
        $this->getJson('/api/ambulance-bookings/999999')->assertNotFound();
        $this->signIn();
        $this->getJson('/api/admin/ambulance/bookings')->assertOk()->assertJsonCount(1, 'bookings');
        $this->getJson('/api/admin/ambulance/bookings/'.$id)->assertOk()->assertJsonPath('booking.customer_name', 'Test User 1002');
    }

    public function test_driver_crud_uniqueness_and_normal_driver_isolation(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/admin/ambulance/drivers', $this->driverData())->assertCreated()->json('driver.id');
        $this->getJson('/api/admin/ambulance/drivers')->assertJsonPath('count', 1);
        $this->getJson('/api/admin/ambulance/drivers/'.$id)->assertOk()->assertJsonPath('driver.name', 'Test Driver 1');
        $this->postJson('/api/admin/ambulance/drivers', $this->driverData())->assertUnprocessable()->assertJsonValidationErrors(['phone', 'license_number']);
        $this->postJson('/api/admin/ambulance/drivers', [...$this->driverData('2'), 'experience_years' => 61])->assertUnprocessable();
        $this->putJson('/api/admin/ambulance/drivers/'.$id, [...$this->driverData(), 'name' => "O'Neil", 'status' => 'inactive'])->assertOk()->assertJsonPath('driver.name', "O'Neil");
        $this->getJson('/api/drivers')->assertOk()->assertJsonPath('count', 0);
        $this->deleteJson('/api/admin/ambulance/drivers/'.$id)->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$id)->assertNotFound();
        $this->deleteJson('/api/admin/ambulance/drivers/'.$id)->assertNotFound();
    }

    public function test_assignment_replacement_completion_and_busy_driver_protection(): void
    {
        $this->signIn();
        $id = $this->createBooking();
        $secondBooking = $this->createBooking();
        $driver = $this->postJson('/api/admin/ambulance/drivers', $this->driverData())->assertCreated()->json('driver.id');
        $replacement = $this->postJson('/api/admin/ambulance/drivers', $this->driverData('2'))->assertCreated()->json('driver.id');
        $this->patchJson("/api/admin/ambulance/bookings/{$id}/status", ['status' => 'confirmed'])->assertUnprocessable();
        $this->putJson("/api/admin/ambulance/bookings/{$id}/driver", ['ambulance_driver_id' => $driver])->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$driver)->assertJsonPath('driver.status', 'busy');
        $this->putJson("/api/admin/ambulance/bookings/{$secondBooking}/driver", ['ambulance_driver_id' => $driver])->assertUnprocessable();
        $this->putJson('/api/admin/ambulance/drivers/'.$driver, $this->driverData())->assertUnprocessable();
        $this->deleteJson('/api/admin/ambulance/drivers/'.$driver)->assertConflict();
        $this->deleteJson("/api/admin/ambulance/bookings/{$id}/driver")->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$driver)->assertJsonPath('driver.status', 'available');
        $this->putJson("/api/admin/ambulance/bookings/{$id}/driver", ['ambulance_driver_id' => $driver])->assertOk();
        $this->patchJson("/api/admin/ambulance/bookings/{$id}/status", ['status' => 'completed'])->assertUnprocessable();
        $this->patchJson("/api/admin/ambulance/bookings/{$id}/status", ['status' => 'confirmed'])->assertOk();
        $this->deleteJson("/api/admin/ambulance/bookings/{$id}/driver")->assertUnprocessable();
        $this->putJson("/api/admin/ambulance/bookings/{$id}/driver", ['ambulance_driver_id' => $replacement])->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$driver)->assertJsonPath('driver.status', 'available');
        $this->patchJson("/api/admin/ambulance/bookings/{$id}/status", ['status' => 'completed'])->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$replacement)->assertJsonPath('driver.status', 'available');
        $this->patchJson("/api/admin/ambulance/bookings/{$id}/status", ['status' => 'pending'])->assertUnprocessable();
        $this->deleteJson('/api/admin/ambulance/drivers/'.$replacement)->assertConflict();
    }

    public function test_payment_lifecycle_and_cancellation_preserve_financial_history(): void
    {
        $this->signIn();
        [$booking, $driver] = $this->confirmedBooking();
        $data = ['ambulance_booking_id' => $booking, 'amount' => '1500.50', 'payment_method' => 'cash', 'payment_status' => 'pending', 'transaction_reference' => 'TEST-REF'];
        $id = $this->postJson('/api/admin/ambulance/payments', $data)->assertCreated()->json('payment.id');
        $this->getJson('/api/admin/ambulance/payments')->assertOk()->assertJsonCount(1);
        $this->postJson('/api/admin/ambulance/payments', $data)->assertUnprocessable();
        $this->putJson('/api/admin/ambulance/payments/'.$id, [...$data, 'amount' => '1800.00'])->assertOk();
        $this->getJson('/api/admin/ambulance/payments/'.$id)->assertJsonPath('payment.amount', '1800.00');
        $this->patchJson("/api/admin/ambulance/bookings/{$booking}/status", ['status' => 'cancelled'])->assertUnprocessable();
        $this->patchJson("/api/admin/ambulance/payments/{$id}/status", ['payment_status' => 'refunded'])->assertUnprocessable();
        $this->patchJson("/api/admin/ambulance/payments/{$id}/status", ['payment_status' => 'paid'])->assertOk();
        $this->getJson('/api/admin/ambulance/payments-summary')->assertJsonPath('summary.total_collected', '1800.00');
        $this->deleteJson('/api/admin/ambulance/payments/'.$id)->assertUnprocessable();
        $this->putJson('/api/admin/ambulance/payments/'.$id, $data)->assertUnprocessable();
        $this->patchJson("/api/admin/ambulance/bookings/{$booking}/status", ['status' => 'cancelled'])->assertUnprocessable();
        $this->patchJson("/api/admin/ambulance/payments/{$id}/status", ['payment_status' => 'refunded'])->assertOk();
        $this->getJson('/api/admin/ambulance/payments-summary')->assertJsonPath('summary.total_refunded', '1800.00');
        $this->patchJson("/api/admin/ambulance/bookings/{$booking}/status", ['status' => 'cancelled'])->assertOk();
        $this->getJson('/api/admin/ambulance/drivers/'.$driver)->assertJsonPath('driver.status', 'available');
        $this->deleteJson('/api/admin/ambulance/payments/'.$id)->assertUnprocessable();
        $this->getJson('/api/payments')->assertOk()->assertJsonCount(0);
    }

    public function test_pending_payment_deletion_validation_and_unique_reference(): void
    {
        $this->signIn();
        $pending = $this->createBooking();
        $data = ['ambulance_booking_id' => $pending, 'amount' => 100, 'payment_method' => 'cash'];
        $this->postJson('/api/admin/ambulance/payments', $data)->assertUnprocessable();
        [$booking] = $this->confirmedBooking();
        $data['ambulance_booking_id'] = $booking;
        $this->postJson('/api/admin/ambulance/payments', [...$data, 'amount' => -1])->assertUnprocessable();
        $this->postJson('/api/admin/ambulance/payments', [...$data, 'payment_method' => 'unknown'])->assertUnprocessable();
        $this->postJson('/api/admin/ambulance/payments', [...$data, 'amount' => '0.001'])->assertUnprocessable();
        $id = $this->postJson('/api/admin/ambulance/payments', [...$data, 'transaction_reference' => 'UNIQUE'])->assertCreated()->json('payment.id');
        [$second] = $this->confirmedBooking();
        $this->postJson('/api/admin/ambulance/payments', [...$data, 'ambulance_booking_id' => $second, 'transaction_reference' => 'UNIQUE'])->assertUnprocessable();
        $this->deleteJson('/api/admin/ambulance/payments/'.$id)->assertOk();
        $this->getJson('/api/admin/ambulance/payments/'.$id)->assertNotFound();
        $this->patchJson("/api/admin/ambulance/bookings/{$booking}/status", ['status' => 'cancelled'])->assertOk();
    }

    public function test_normal_driver_booking_payment_workflow_is_unchanged(): void
    {
        $this->signIn();
        DB::insert('INSERT INTO cars (name, brand, category, seats, quantity, price, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['Test Car', 'Test', 'Sedan', 4, 1, 1000, 'test-car.jpg', 'available']);
        $driver = $this->postJson('/api/drivers', $this->driverData())->assertCreated()->json('driver.id');
        $this->putJson('/api/drivers/'.$driver, [...$this->driverData(), 'name' => 'Updated Driver'])->assertOk();
        $this->postJson('/api/drivers', $this->driverData())->assertUnprocessable();
        $booking = $this->postJson('/api/bookings', ['car_name' => 'Test Car', 'trip_type' => 'One Way',
            'trip_datetime' => '2027-01-01 12:00:00', 'trip_duration' => '1', 'pickup' => 'Dhaka', 'destination' => 'Mirpur'])
            ->assertCreated()->json('booking.b_id');
        $this->getJson('/api/bookings')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/bookings/'.$booking)->assertOk();
        $this->putJson("/api/bookings/{$booking}/driver", ['driver_id' => $driver])->assertOk();
        $this->putJson('/api/bookings/'.$booking, ['booking_status' => 'Confirmed'])->assertOk();
        $payment = $this->postJson('/api/payments', ['booking_id' => $booking, 'amount' => 1000, 'payment_method' => 'cash'])->assertCreated()->json('payment.id');
        $this->getJson('/api/payments')->assertOk()->assertJsonCount(1);
        $this->putJson('/api/payments/'.$payment, ['amount' => 1100, 'payment_method' => 'cash'])->assertOk();
        $this->patchJson("/api/payments/{$payment}/status", ['payment_status' => 'paid'])->assertOk();
        $this->putJson('/api/bookings/'.$booking, ['booking_status' => 'Completed'])->assertOk();
        $this->getJson('/api/drivers/'.$driver)->assertJsonPath('driver.status', 'available');
        $this->patchJson("/api/payments/{$payment}/status", ['payment_status' => 'refunded'])->assertOk();
        $this->deleteJson('/api/payments/'.$payment)->assertUnprocessable();
        $this->getJson('/api/admin/ambulance/drivers')->assertJsonPath('count', 0);
        $this->getJson('/api/admin/ambulance/bookings')->assertJsonCount(0, 'bookings');
        $this->getJson('/api/admin/ambulance/payments')->assertJsonCount(0);
    }
}
