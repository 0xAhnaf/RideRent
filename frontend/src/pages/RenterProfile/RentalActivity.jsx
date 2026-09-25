import React from "react";

export default function RentalActivity({
  bookingStatistics,
  vehicleBookings,
  completedVehicleTrips,
  ambulanceBookings,
}) {
  return (
    <>
      <h1>Rental Activity</h1>

      {/* BOOKING STATISTICS */}

      <div className="statistics-grid">

        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>
            {bookingStatistics?.total_bookings ?? 0}
          </p>
        </div>

        <div className="stat-card">
          <h3>Completed Rentals</h3>
          <p>
            {bookingStatistics?.completed_bookings ?? 0}
          </p>
        </div>

        <div className="stat-card">
          <h3>Cancelled Rentals</h3>
          <p>
            {bookingStatistics?.cancelled_bookings ?? 0}
          </p>
        </div>

        <div className="stat-card">
          <h3>Total Spent</h3>
          <p>
            ৳{bookingStatistics?.total_spent ?? 0}
          </p>
        </div>

      </div>

      {/* VEHICLE BOOKINGS */}

      <div className="history-card">
        <h2>Vehicle Bookings</h2>

        {vehicleBookings.length === 0 ? (
          <p>No vehicle booking history yet.</p>
        ) : (
          <div className="table-container">
            <table className="rental-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Vehicle</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Trip Type</th>
                  <th>Trip Date</th>
                  <th>Duration</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {vehicleBookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td>{booking.booking_id}</td>
                    <td>{booking.vehicle_name}</td>
                    <td>{booking.vehicle_brand}</td>
                    <td>{booking.vehicle_category}</td>
                    <td>{booking.trip_type}</td>
                    <td>{booking.trip_datetime}</td>
                    <td>{booking.trip_duration}</td>
                    <td>{booking.pickup}</td>
                    <td>{booking.destination}</td>
                    <td>৳{booking.total_amount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLETED VEHICLE TRIPS */}

      <div className="history-card">
        <h2>Completed Vehicle Trips</h2>

        {completedVehicleTrips.length === 0 ? (
          <p>No completed vehicle trips yet.</p>
        ) : (
          <div className="table-container">
            <table className="rental-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Vehicle</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Trip Type</th>
                  <th>Trip Date</th>
                  <th>Duration</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                 
                </tr>
              </thead>

              <tbody>
                {completedVehicleTrips.map((trip) => (
                  <tr key={trip.booking_id}>
                    <td>{trip.booking_id}</td>
                    <td>{trip.vehicle_name}</td>
                    <td>{trip.vehicle_brand}</td>
                    <td>{trip.vehicle_category}</td>
                    <td>{trip.trip_type}</td>
                    <td>{trip.trip_datetime}</td>
                    <td>{trip.trip_duration}</td>
                    <td>{trip.pickup}</td>
                    <td>{trip.destination}</td>
                    <td>{trip.payment_method}</td>
                    <td>
  <span
    className={`status-badge ${
      trip.payment_status?.toLowerCase() === "paid"
        ? "completed"
        : "pending"
    }`}
  >
    {trip.payment_status}
  </span>
</td>
                    <td>৳{trip.payment_amount ?? 0}</td>
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AMBULANCE BOOKINGS */}

      <div className="history-card">
        <h2>Ambulance Bookings</h2>

        {ambulanceBookings.length === 0 ? (
          <p>No ambulance booking history yet.</p>
        ) : (
          <div className="table-container">
            <table className="rental-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Pickup District</th>
                  <th>Pickup Thana</th>
                  <th>Pickup Address</th>
                  <th>Destination District</th>
                  <th>Destination Thana</th>
                  <th>Destination Address</th>
                  <th>Emergency Contact</th>
                  <th>Status</th>
                  <th>Created At</th>
                  
                </tr>
              </thead>

              <tbody>
                {ambulanceBookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td>{booking.booking_id}</td>
                    <td>{booking.pickup_district}</td>
                    <td>{booking.pickup_thana}</td>
                    <td>{booking.pickup_address}</td>
                    <td>{booking.destination_district}</td>
                    <td>{booking.destination_thana}</td>
                    <td>{booking.destination_address}</td>
                    <td>{booking.emergency_contact}</td>
                    <td>
  <span
    className={`status-badge ${
      booking.status?.toLowerCase() === "completed"
        ? "completed"
        : booking.status?.toLowerCase() === "cancelled"
        ? "cancelled"
        : "pending"
    }`}
  >
    {booking.status}
  </span>
</td>
                    <td>{booking.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
