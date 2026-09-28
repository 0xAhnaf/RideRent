<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingFareService
{
    public static function rules(): array
    {
        return [
            'car_id' => ['required', 'integer', 'min:1'],
            'pickup_district' => ['required', 'string', 'max:80'],
            'pickup_thana' => ['required', 'string', 'max:100'],
            'destination_district' => ['required', 'string', 'max:80'],
            'destination_thana' => ['required', 'string', 'max:100'],
            'trip_type' => ['required', 'in:One Way,Round Trip'],
            'trip_duration' => ['required', 'in:6 Hours,12 Hours,1 Day,2 Days,3 Days,4 Days,5 Days,6 Days,7 Days,More Than 7 Days'],
            'custom_days' => ['required_if:trip_duration,More Than 7 Days', 'nullable', 'integer', 'min:8', 'max:365'],
        ];
    }

    public function quote(array $input, bool $lockCar = false): array
    {
        $car = DB::selectOne('SELECT id, price FROM cars WHERE id = ?'.($lockCar ? ' FOR UPDATE' : ''), [$input['car_id']]);
        if (!$car) {
            throw ValidationException::withMessages(['car_id' => 'Selected car was not found.']);
        }
        $catalog = json_decode(file_get_contents(resource_path('fare/catalog.json')), true, 512, JSON_THROW_ON_ERROR);
        $fare = $this->calculate($input, (string) $car->price, $catalog);
        $fare['car_id'] = (int) $car->id;
        // Both preview and submission calculate this server-side; client money is never trusted.
        $token = hash_hmac('sha256', json_encode($fare, JSON_THROW_ON_ERROR), (string) config('app.key'));
        return ['fare' => $fare, 'quote_token' => $token];
    }

    public function calculate(array $input, string $dailyPrice, array $catalog): array
    {
        $pd = $input['pickup_district'];
        $pt = $input['pickup_thana'];
        $dd = $input['destination_district'];
        $dt = $input['destination_thana'];
        $a = $catalog['districts'][$pd]['thanas'][$pt] ?? null;
        $b = $catalog['districts'][$dd]['thanas'][$dt] ?? null;
        if (!$a || !$b) {
            throw ValidationException::withMessages(['route' => 'Select a valid district and thana pair from the list.']);
        }
        $round = $input['trip_type'] === 'Round Trip';
        $same = $pd === $dd && $pt === $dt;
        $days = match ($input['trip_duration']) {
            '6 Hours', '12 Hours', '1 Day' => 1,
            'More Than 7 Days' => (int) ($input['custom_days'] ?? 0),
            default => (int) $input['trip_duration'],
        };
        if ($days < 1 || $days > 365 || ($input['trip_duration'] === 'More Than 7 Days' && $days < 8)) {
            throw ValidationException::withMessages(['custom_days' => 'Enter 8 to 365 days for an extended trip.']);
        }
        $distance = null;
        $method = 'same_thana_fixed';
        $coarse = false;
        if (!$same) {
            $key = $pd.'|'.$pt.'>'.$dd.'|'.$dt;
            $reverseKey = $dd.'|'.$dt.'>'.$pd.'|'.$pt;
            $override = $catalog['route_overrides'][$key] ?? $catalog['route_overrides'][$reverseKey] ?? null;
            if ($override !== null) {
                $distance = (float) $override['km'];
                $method = 'reviewed_route_override';
            } elseif ($pd === $dd) {
                $distance = max($catalog['minimum_different_thana_km'], $this->km($a, $b) * $catalog['road_factor']);
                $method = 'local_point_estimate';
            } else {
                $hqA = $catalog['districts'][$pd];
                $hqB = $catalog['districts'][$dd];
                $base = $catalog['district_km'][$pd][$dd] ?? null;
                if ($base === null) {
                    throw ValidationException::withMessages(['route' => 'Distance is unavailable for this route.']);
                }
                $distance = $base + ($this->km($a, $hqA) + $this->km($b, $hqB)) * $catalog['road_factor'];
                $method = 'historical_district_route_plus_offsets';
            }
            $coarse = $override === null && ($a['quality'] === 'district_proxy' || $b['quality'] === 'district_proxy');
            $distance = round($distance, 1);
        }
        // Reverse leg is assumed equal for this offline demo; route charge is once per trip.
        $travelKm = $distance === null ? null : round($distance * ($round ? 2 : 1), 1);
        $dailyPaisa = (int) round((float) $dailyPrice * 100);
        $bodyPaisa = $dailyPaisa * $days;
        $routePaisa = $same ? ($round ? 75000 : 50000) : (int) round($travelKm * 2500);
        $total = $bodyPaisa + $routePaisa;
        if ($dailyPaisa < 0 || $total > 9999999999) {
            throw ValidationException::withMessages(['fare' => 'Fare is outside the supported amount range.']);
        }
        $money = fn (int $paisa): string => number_format($paisa / 100, 2, '.', '');
        return [
            'version' => $catalog['version'],
            'pickup_district' => $pd, 'pickup_thana' => $pt,
            'destination_district' => $dd, 'destination_thana' => $dt,
            'trip_type' => $input['trip_type'], 'trip_duration' => $input['trip_duration'],
            'charged_days' => $days, 'daily_rent' => $money($dailyPaisa),
            'body_rent' => $money($bodyPaisa), 'one_way_km' => $distance,
            'charged_km' => $travelKm, 'per_km_rate' => '25.00',
            'same_thana' => $same, 'distance_method' => $method,
            'coarse_estimate' => $coarse, 'route_charge' => $money($routePaisa),
            'total_fare' => $money($total), 'currency' => 'BDT',
        ];
    }

    private function km(array $a, array $b): float
    {
        $lat = deg2rad($b['lat'] - $a['lat']);
        $lon = deg2rad($b['lon'] - $a['lon']);
        $h = sin($lat / 2) ** 2 + cos(deg2rad($a['lat'])) * cos(deg2rad($b['lat'])) * sin($lon / 2) ** 2;
        return 6371 * 2 * asin(sqrt(min(1, max(0, $h))));
    }
}
