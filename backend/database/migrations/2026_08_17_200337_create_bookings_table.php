<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id('b_id');

        // Future foreign keys — no constraints yet
            $table->unsignedBigInteger('u_id');
            $table->foreignId('c_id')->constrained('cars')->cascadeOnDelete();
            $table->string('trip_type');
            $table->dateTime('trip_datetime');
            $table->string('trip_duration');

            $table->string('pickup');
            $table->string('destination');

            $table->enum('booking_status', [
                'Pending',
                'Confirmed',
                'Completed',
             'Cancelled'
            ])->default('Pending');

            $table->timestamp('created_at')->useCurrent();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
