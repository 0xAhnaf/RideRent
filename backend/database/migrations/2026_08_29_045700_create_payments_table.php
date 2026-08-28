<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')
                ->unique()
                ->constrained('bookings', 'b_id')
                ->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', [
                'cash',
                'card',
                'mobile_banking',
            ]);
            $table->enum('payment_status', [
                'pending',
                'paid',
                'refunded',
            ])->default('pending');
            $table->string('transaction_reference', 100)
                ->nullable()
                ->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
