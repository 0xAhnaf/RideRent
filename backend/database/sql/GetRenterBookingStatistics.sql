DROP PROCEDURE IF EXISTS GetRenterBookingStatistics;

DELIMITER //

CREATE PROCEDURE GetRenterBookingStatistics(IN p_user_id BIGINT)
BEGIN
    SELECT
        COUNT(*) AS total_bookings,

        SUM(
            CASE
                WHEN booking_status = 'Completed' THEN 1
                ELSE 0
            END
        ) AS completed_bookings,

        SUM(
            CASE
                WHEN booking_status = 'Cancelled' THEN 1
                ELSE 0
            END
        ) AS cancelled_bookings,

        COALESCE(
            (
                SELECT SUM(p.amount)
                FROM payments p
                INNER JOIN bookings b2
                    ON p.booking_id = b2.b_id
                WHERE b2.u_id = p_user_id
                  AND p.payment_status = 'paid'
            ),
            0
        ) AS total_spent

    FROM bookings
    WHERE u_id = p_user_id;
END //

DELIMITER ;