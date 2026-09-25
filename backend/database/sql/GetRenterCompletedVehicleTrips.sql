DROP PROCEDURE IF EXISTS GetRenterCompletedVehicleTrips;

DELIMITER //

CREATE PROCEDURE GetRenterCompletedVehicleTrips(IN p_user_id BIGINT)
BEGIN

    SELECT
        b.b_id AS booking_id,

        c.name AS vehicle_name,
        c.brand AS vehicle_brand,
        c.category AS vehicle_category,

        CASE
            WHEN b.trip_type = 'one_way' THEN 'One Way'
            WHEN b.trip_type = 'round_trip' THEN 'Round Trip'
            ELSE b.trip_type
        END AS trip_type,

        b.trip_datetime,
        b.trip_duration,

        b.pickup,
        b.destination,

        COALESCE(p.amount, 0) AS payment_amount,
        COALESCE(p.payment_method, 'N/A') AS payment_method,
        COALESCE(p.payment_status, 'N/A') AS payment_status,

        b.created_at

    FROM bookings b

    INNER JOIN cars c
        ON b.c_id = c.id

    LEFT JOIN payments p
        ON p.booking_id = b.b_id

    WHERE b.u_id = p_user_id
      AND b.booking_status = 'Completed'

    ORDER BY b.trip_datetime DESC;

END //

DELIMITER ;