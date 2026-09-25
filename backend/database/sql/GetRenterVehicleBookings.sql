DROP PROCEDURE IF EXISTS GetRenterVehicleBookings;

DELIMITER //

CREATE PROCEDURE GetRenterVehicleBookings(IN p_user_id BIGINT)
BEGIN

    SELECT
        b.b_id AS booking_id,

        c.id AS vehicle_id,
        c.name AS vehicle_name,
        c.brand AS vehicle_brand,
        c.category AS vehicle_category,

        b.trip_type,
        b.trip_datetime,
        b.trip_duration,

        b.pickup,
        b.destination,

        b.booking_status,

        p.amount AS total_amount,
        p.payment_status AS payment_status

    FROM bookings b

    INNER JOIN cars c
        ON b.c_id = c.id

    LEFT JOIN payments p
        ON p.booking_id = b.b_id

    WHERE b.u_id = p_user_id

    ORDER BY b.created_at DESC;

END //

DELIMITER ;