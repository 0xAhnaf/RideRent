import "../styles/booking-fare.css";

const money = (amount) => `BDT ${Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BookingFareSummary({ fare, loading, error, onRefresh }) {
  return (
    <section className="booking-fare-summary" aria-label="Fare summary" aria-live="polite" aria-busy={loading}>
      <h3>Estimated Fare</h3>
      {loading ? <p>Calculating your fare...</p> : error ? (
        <p role="alert">{error} <button type="button" onClick={onRefresh}>Retry estimate</button></p>
      ) : !fare ? <p>Select your route, vehicle and duration to see the total fare.</p> : (
        <>
          <p>{fare.pickup_thana}, {fare.pickup_district.replaceAll("_", " ")} → {fare.destination_thana}, {fare.destination_district.replaceAll("_", " ")}</p>
          <dl>
            <div><dt>Body rent · {fare.charged_days} day(s) × {money(fare.daily_rent)}</dt><dd>{money(fare.body_rent)}</dd></div>
            <div><dt>{fare.same_thana ? `Same-thana ${fare.trip_type.toLowerCase()} charge` : `Estimated ${fare.charged_km} km × BDT 25`}</dt><dd>{money(fare.route_charge)}</dd></div>
            <div className="booking-fare-total"><dt>Total fare</dt><dd>{money(fare.total_fare)}</dd></div>
          </dl>
          {!fare.same_thana && <small>Thana-to-thana estimate, not address-to-address. {fare.trip_type === "Round Trip" && `Includes return: ${fare.one_way_km} km each way. `}{fare.coarse_estimate ? "Coarse district-centre estimate used for a location without its own map point. " : ""}Actual road distance may differ; tolls, parking and ferry charges are not included.</small>}
          {fare.same_thana && <small>Fixed local trip charge; body rent is charged per day.</small>}
        </>
      )}
    </section>
  );
}
