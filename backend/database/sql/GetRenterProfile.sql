DROP PROCEDURE IF EXISTS GetRenterProfile;

DELIMITER //

CREATE PROCEDURE GetRenterProfile(IN p_user_id BIGINT)
BEGIN
    SELECT
        id,
        name,
        email,
        phone,
        address
    FROM users
    WHERE id = p_user_id
      AND role = 'renter';
END //

DELIMITER ;