DROP PROCEDURE IF EXISTS GetRenterAmbulanceBookings;

DELIMITER //

CREATE PROCEDURE GetRenterAmbulanceBookings(IN p_user_id BIGINT)
BEGIN
    SELECT
        id AS booking_id,
        pickup_district,
        pickup_thana,
        pickup_address,
        destination_district,
        destination_thana,
        destination_address,
        emergency_contact,
        status,
        created_at
    FROM ambulance_bookings
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END //

DELIMITER ;