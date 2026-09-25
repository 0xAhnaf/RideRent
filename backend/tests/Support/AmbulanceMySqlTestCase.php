<?php

namespace Tests\Support;

use App\Models\User;
use Dotenv\Dotenv;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

abstract class AmbulanceMySqlTestCase extends TestCase
{
    private static ?string $testDatabase = null;

    private static ?string $sourceDatabase = null;

    private static ?array $cleanupConnection = null;

    protected function setUp(): void
    {
        parent::setUp();

        // These integration tests use real MySQL syntax and an empty, separate schema.
        // Never migrate:fresh or run test writes against the application's database.
        $environment = Dotenv::parse(file_get_contents(base_path('.env')));
        $connection = config('database.connections.mysql');
        $connection['url'] = null;
        $connection['database'] = $environment['DB_DATABASE'];
        config(['database.connections.ambulance_source' => $connection]);

        if (self::$testDatabase === null) {
            self::$sourceDatabase = (string) $environment['DB_DATABASE'];
            self::$cleanupConnection = $connection;
            self::$testDatabase = 'riderent_ambulance_test_'.bin2hex(random_bytes(6));
            DB::connection('ambulance_source')->statement('CREATE DATABASE `'.self::$testDatabase.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            $connection['database'] = self::$testDatabase;
            config(['database.connections.ambulance_test' => $connection]);

            foreach (['users', 'cars', 'drivers', 'bookings', 'payments', 'ambulance_drivers', 'ambulance_bookings', 'ambulance_payments'] as $table) {
                $definition = DB::connection('ambulance_source')->selectOne('SHOW CREATE TABLE `'.$table.'`');
                DB::connection('ambulance_test')->statement($definition->{'Create Table'});
            }
            fwrite(STDOUT, "\nIsolated MySQL test schema: ".self::$testDatabase." (automatic cleanup enabled)\n");
        }

        $connection['database'] = self::$testDatabase;
        config(['database.connections.ambulance_test' => $connection, 'database.default' => 'ambulance_test']);
        DB::purge('ambulance_test');
        DB::beginTransaction();

        foreach ([1001 => 'admin', 1002 => 'renter', 1003 => 'renter'] as $id => $role) {
            DB::insert('INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
                [$id, 'Test User '.$id, 'test'.$id.'@example.test', '0190000'.$id, 'unused-test-value', $role]);
        }
    }

    protected function tearDown(): void
    {
        while (DB::connection('ambulance_test')->transactionLevel() > 0) {
            DB::connection('ambulance_test')->rollBack();
        }
        DB::disconnect('ambulance_test');
        parent::tearDown();
    }

    public static function tearDownAfterClass(): void
    {
        try {
            self::dropTestDatabase();
        } finally {
            parent::tearDownAfterClass();
        }
    }

    private static function dropTestDatabase(): void
    {
        if (self::$testDatabase === null || self::$cleanupConnection === null) {
            return;
        }

        if (
            ! preg_match('/\Ariderent_ambulance_test_[0-9a-f]{12}\z/', self::$testDatabase)
            || self::$testDatabase === self::$sourceDatabase
        ) {
            throw new \RuntimeException('Refusing to drop an unverified test database name.');
        }

        $connection = self::$cleanupConnection;
        $charset = $connection['charset'] ?? 'utf8mb4';
        $socket = $connection['unix_socket'] ?? null;
        $dsn = $socket
            ? "mysql:unix_socket={$socket};charset={$charset}"
            : sprintf(
                'mysql:host=%s;port=%s;charset=%s',
                $connection['host'] ?? '127.0.0.1',
                $connection['port'] ?? '3306',
                $charset,
            );

        $pdo = new \PDO(
            $dsn,
            $connection['username'] ?? null,
            $connection['password'] ?? null,
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION],
        );
        $pdo->exec('DROP DATABASE IF EXISTS `'.self::$testDatabase.'`');
        fwrite(STDOUT, "\nRemoved isolated MySQL test schema: ".self::$testDatabase."\n");

        self::$testDatabase = null;
        self::$sourceDatabase = null;
        self::$cleanupConnection = null;
    }

    protected function signIn(int $id = 1001): void
    {
        Auth::forgetGuards();
        $user = new User;
        $user->forceFill((array) DB::selectOne('SELECT id, name, email, role FROM users WHERE id = ?', [$id]));
        $this->actingAs($user, 'web');
    }

    protected function driverData(string $suffix = '1'): array
    {
        return ['name' => 'Test Driver '.$suffix, 'phone' => '0170000000'.$suffix,
            'license_number' => 'TEST-'.$suffix, 'experience_years' => 4, 'status' => 'available'];
    }

    protected function bookingData(): array
    {
        return ['pickup_district' => 'Dhaka', 'pickup_thana' => 'Dhanmondi', 'pickup_address' => 'Test pickup',
            'destination_district' => 'Dhaka', 'destination_thana' => 'Mirpur', 'destination_address' => 'Test destination',
            'emergency_contact' => '01700000001'];
    }

    protected function createBooking(): int
    {
        return (int) $this->postJson('/api/ambulance-bookings', $this->bookingData())->assertCreated()->json('booking.id');
    }

    protected function confirmedBooking(): array
    {
        $booking = $this->createBooking();
        $driver = $this->postJson('/api/admin/ambulance/drivers', $this->driverData((string) $booking))->assertCreated()->json('driver.id');
        $this->putJson("/api/admin/ambulance/bookings/{$booking}/driver", ['ambulance_driver_id' => $driver])->assertOk();
        $this->patchJson("/api/admin/ambulance/bookings/{$booking}/status", ['status' => 'confirmed'])->assertOk();

        return [$booking, $driver];
    }
}
