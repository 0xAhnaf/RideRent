<?php

namespace Tests\Unit;

use App\Services\BookingFareService;
use PHPUnit\Framework\TestCase;

class BookingFareCalculationTest extends TestCase
{
    private function calculate(array $overrides = []): array
    {
        $catalog = json_decode(file_get_contents(__DIR__.'/../../resources/fare/catalog.json'), true, 512, JSON_THROW_ON_ERROR);
        $input = array_merge([
            'pickup_district' => 'Dhaka', 'pickup_thana' => 'Dhanmondi',
            'destination_district' => 'Dhaka', 'destination_thana' => 'Dhanmondi',
            'trip_type' => 'One Way', 'trip_duration' => '1 Day',
        ], $overrides);
        return (new BookingFareService())->calculate($input, '1000.00', $catalog);
    }

    public function test_local_charges_and_daily_body_rent(): void
    {
        $this->assertSame('1500.00', $this->calculate()['total_fare']);
        $this->assertSame('1750.00', $this->calculate(['trip_type' => 'Round Trip'])['total_fare']);
        $this->assertSame('3500.00', $this->calculate(['trip_duration' => '3 Days'])['total_fare']);
        $this->assertSame('1500.00', $this->calculate(['trip_duration' => '6 Hours'])['total_fare']);
        $this->assertSame('1500.00', $this->calculate(['trip_duration' => '12 Hours'])['total_fare']);
        $this->assertSame('8500.00', $this->calculate(['trip_duration' => 'More Than 7 Days', 'custom_days' => 8])['total_fare']);
        $this->assertNull($this->calculate()['charged_km']);
    }

    public function test_distance_rate_round_trip_and_days_are_independent(): void
    {
        $route = ['destination_district' => 'Feni', 'destination_thana' => 'Feni Sadar'];
        $one = $this->calculate($route);
        $round = $this->calculate([...$route, 'trip_type' => 'Round Trip']);
        $twoDays = $this->calculate([...$route, 'trip_duration' => '2 Days']);
        $this->assertGreaterThan(0, $one['charged_km']);
        $this->assertEquals($one['charged_km'] * 25, (float) $one['route_charge']);
        $this->assertEquals($one['charged_km'] * 2, $round['charged_km']);
        $this->assertEquals((float) $one['route_charge'] * 2, (float) $round['route_charge']);
        $this->assertSame($one['route_charge'], $twoDays['route_charge']);
        $this->assertEquals((float) $one['total_fare'] + 1000, (float) $twoDays['total_fare']);
    }

    public function test_different_thanas_and_proxy_points_are_explicit(): void
    {
        $fare = $this->calculate(['destination_thana' => 'Gulshan']);
        $this->assertFalse($fare['same_thana']);
        $this->assertGreaterThan(0, $fare['charged_km']);
        $this->assertTrue($this->calculate(['destination_thana' => 'Banani'])['coarse_estimate']);
    }
}
