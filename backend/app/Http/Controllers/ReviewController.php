<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function index()
    {
        $reviews = DB::select(
            'SELECT
                r.id,
                u.name AS reviewer_name,
                r.rating,
                r.comment,
                r.created_at
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             ORDER BY r.id DESC'
        );

        return response()->json($reviews);
    }

    public function eligibility(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'renter') {
            return response()->json([
                'can_review' => false,
                'reason' => 'admin',
            ]);
        }

        if ($this->hasReview($user->id)) {
            return response()->json([
                'can_review' => false,
                'reason' => 'already_reviewed',
            ]);
        }

        if (!$this->hasCompletedBooking($user->id)) {
            return response()->json([
                'can_review' => false,
                'reason' => 'no_completed_booking',
            ]);
        }

        return response()->json([
            'can_review' => true,
            'reason' => null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'renter') {
            return response()->json([
                'message' => 'Only renters can submit reviews.',
            ], 403);
        }

        $request->merge([
            'comment' => trim((string) $request->input('comment', '')),
        ]);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        if ($this->hasReview($user->id)) {
            return response()->json([
                'message' => 'You have already submitted a review.',
            ], 409);
        }

        if (!$this->hasCompletedBooking($user->id)) {
            return response()->json([
                'message' => 'Complete a car or ambulance booking before reviewing.',
            ], 403);
        }

        try {
            DB::insert(
                'INSERT INTO reviews
                    (user_id, rating, comment, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())',
                [
                    $user->id,
                    $data['rating'],
                    $data['comment'],
                ]
            );
        } catch (QueryException $exception) {
            // Unique key protects against two review requests at once.
            if ((int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'You have already submitted a review.',
                ], 409);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Review submitted successfully.',
        ], 201);
    }

    private function hasReview(int $userId): bool
    {
        $review = DB::selectOne(
            'SELECT id
             FROM reviews
             WHERE user_id = ?
             LIMIT 1',
            [$userId]
        );

        return $review !== null;
    }

    private function hasCompletedBooking(int $userId): bool
    {
        $carBooking = DB::selectOne(
            "SELECT b_id
             FROM bookings
             WHERE u_id = ?
               AND LOWER(TRIM(booking_status)) = 'completed'
             LIMIT 1",
            [$userId]
        );

        if ($carBooking !== null) {
            return true;
        }

        $ambulanceBooking = DB::selectOne(
            "SELECT id
             FROM ambulance_bookings
             WHERE user_id = ?
               AND LOWER(TRIM(status)) = 'completed'
             LIMIT 1",
            [$userId]
        );

        return $ambulanceBooking !== null;
    }
}