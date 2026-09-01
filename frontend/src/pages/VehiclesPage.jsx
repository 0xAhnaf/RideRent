import {
  ArrowRight,
  CarFront,
  ChevronRight,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiFetch } from "../api";
import "../styles/vehicles-page.css";

const getAvailabilityText = (quantity) => {
  if (quantity === 0) return "Not Available";
  if (quantity === 1) return "Only 1 Available";
  return `${quantity} Available`;
};

const formatCarPrice = (price) => `৳${Number(price).toLocaleString()}`;
const PRICE_STEP = 500;

function VehicleImage({ car }) {
  const imageSource = car.image_url || null;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageSource]);

  if (!imageSource || imageError) {
    return (
      <div className="vehicle-image-fallback">
        <CarFront size={58} />
        <span>Image coming soon</span>
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={`${car.name} available at RideRent`}
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}

function VehiclesPage() {
  const navigate = useNavigate();

  // CHANGE 2: Fetching backend data instead of static import
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeats, setSelectedSeats] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Price States
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [maximumPrice, setMaximumPrice] = useState(0);

  // CHANGE 3: API Fetch logic from Laravel MySQL endpoint
  useEffect(() => {
    apiFetch("/api/cars")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch vehicles.");
        }

        return res.json();
      })
      .then((data) => {
        const formattedData = (Array.isArray(data) ? data : []).map((car) => ({
          ...car,
          price: Number(car.price),
          quantity: Number(car.quantity),
          seats: Number(car.seats),
        }));

        setCars(formattedData);

        if (formattedData.length > 0) {
          const prices = formattedData.map((c) => c.price);
          setMinimumPrice(Math.min(...prices));
          setMaximumPrice(Math.max(...prices));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vehicles:", err);
        setLoading(false);
      });
  }, []);

  const MIN_STARTING_PRICE = useMemo(() => {
    return cars.length ? Math.min(...cars.map((c) => c.price)) : 0;
  }, [cars]);

  const MAX_STARTING_PRICE = useMemo(() => {
    return cars.length ? Math.max(...cars.map((c) => c.price)) : 0;
  }, [cars]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFiltersOpen]);

  const brandOptions = useMemo(() => {
    const uniqueBrands = [...new Set(cars.map((car) => car.brand))];
    return ["All", ...uniqueBrands.sort()];
  }, [cars]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = [...new Set(cars.map((car) => car.category))];
    return ["All", ...uniqueCategories.sort()];
  }, [cars]);

  // RESTORED: Seat options generation
  const seatOptions = useMemo(
    () => [...new Set(cars.map((car) => car.seats))].sort((a, b) => a - b),
    [cars]
  );

  const totalFleetCount = useMemo(
    () => cars.reduce((total, car) => total + car.quantity, 0),
    [cars]
  );

  // RESTORED: Range slider percentage calculation
  const priceRangeSize = Math.max(MAX_STARTING_PRICE - MIN_STARTING_PRICE, 1);
  const minimumPricePercent = ((minimumPrice - MIN_STARTING_PRICE) / priceRangeSize) * 100;
  const maximumPricePercent = ((maximumPrice - MIN_STARTING_PRICE) / priceRangeSize) * 100;

  const handleMinimumPriceChange = (e) => {
    const nextPrice = Number(e.target.value);
    if (!Number.isFinite(nextPrice)) return;
    setMinimumPrice(Math.max(MIN_STARTING_PRICE, Math.min(nextPrice, maximumPrice)));
  };

  const handleMaximumPriceChange = (e) => {
    const nextPrice = Number(e.target.value);
    if (!Number.isFinite(nextPrice)) return;
    setMaximumPrice(Math.min(MAX_STARTING_PRICE, Math.max(nextPrice, minimumPrice)));
  };

  const filteredCars = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const results = cars.filter((car) => {
      const searchableContent = [
        car.name,
        car.brand,
        car.category,
        `${car.seats} seat`,
        `${car.quantity} available`,
        `${car.price} starting price`,
      ].join(" ").toLowerCase();

      const matchesSearch = !normalizedSearch || searchableContent.includes(normalizedSearch);
      const matchesBrand = selectedBrand === "All" || car.brand === selectedBrand;
      const matchesCategory = selectedCategory === "All" || car.category === selectedCategory;
      const matchesSeats = selectedSeats === "All" || String(car.seats) === selectedSeats;
      const matchesPrice = car.price >= minimumPrice && car.price <= maximumPrice;

      return matchesSearch && matchesBrand && matchesCategory && matchesSeats && matchesPrice;
    });

    if (sortOption === "name-ascending") return [...results].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOption === "name-descending") return [...results].sort((a, b) => b.name.localeCompare(a.name));
    if (sortOption === "seats-low-high") return [...results].sort((a, b) => a.seats - b.seats);
    if (sortOption === "seats-high-low") return [...results].sort((a, b) => b.seats - a.seats);
    if (sortOption === "availability-high-low") return [...results].sort((a, b) => b.quantity - a.quantity);
    if (sortOption === "availability-low-high") return [...results].sort((a, b) => a.quantity - b.quantity);
    if (sortOption === "price-low-high") return [...results].sort((a, b) => a.price - b.price);
    if (sortOption === "price-high-low") return [...results].sort((a, b) => b.price - a.price);

    return results;
  }, [cars, searchTerm, selectedBrand, selectedCategory, selectedSeats, minimumPrice, maximumPrice, sortOption]);

  const filteredFleetCount = useMemo(
    () => filteredCars.reduce((total, car) => total + car.quantity, 0),
    [filteredCars]
  );

  const getBrandCount = (brand) => {
    if (brand === "All") return cars.length;
    return cars.filter((car) => car.brand === brand).length;
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedBrand("All");
    setSelectedCategory("All");
    setSelectedSeats("All");
    setMinimumPrice(MIN_STARTING_PRICE);
    setMaximumPrice(MAX_STARTING_PRICE);
    setSortOption("default");
  };

  if (loading) {
    return <div className="vehicles-loading">Loading fleet data...</div>;
  }

  return (
    <>
      <Navbar />

      <main className="vehicles-page">
        <section className="vehicles-hero">
          <div className="vehicles-hero-content">
            <div className="vehicles-breadcrumb">
              <button type="button" onClick={() => navigate("/")}>
                Home
              </button>
              <ChevronRight size={16} />
              <span>Vehicles</span>
            </div>

            <p className="vehicles-hero-label">RideRent Vehicle Collection</p>
            <h1>Find the perfect vehicle for your journey</h1>

            <p className="vehicles-hero-description">
              Browse RideRent cars, SUVs, microbuses and premium vehicles. Choose your preferred vehicle and continue directly to the booking section.
            </p>

            <div className="vehicles-hero-stats">
              <div>
                <strong>{totalFleetCount}</strong>
                <span>Cars in Fleet</span>
              </div>

              <div>
                <strong>{cars.length}</strong>
                <span>Vehicle Models</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Customer Support</span>
              </div>
            </div>
          </div>
        </section>

        <section className="vehicles-catalog-section">
          <div className="vehicles-section-heading">
            <div>
              <p className="vehicles-section-label">Our Fleet</p>
              <h2>Explore RideRent Vehicles</h2>
              <p>Search and filter vehicles by brand, category, seating capacity and starting price.</p>
            </div>

            <button
              type="button"
              className="vehicles-filter-toggle"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal size={19} />
              Filters
              <span>{filteredCars.length}</span>
            </button>
          </div>

          <div className="vehicles-catalog-layout">
            {mobileFiltersOpen && (
              <button
                type="button"
                className="vehicles-filter-backdrop"
                aria-label="Close vehicle filters"
                onClick={() => setMobileFiltersOpen(false)}
              />
            )}

            <aside className={`vehicles-filter-panel ${mobileFiltersOpen ? "is-open" : ""}`}>
              <div className="vehicles-filter-header">
                <div>
                  <SlidersHorizontal size={21} />
                  <h3>Filter Vehicles</h3>
                </div>

                <button
                  type="button"
                  className="vehicles-filter-close"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close vehicle filters"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="vehicles-filter-group">
                <label htmlFor="vehicle-search">Vehicle Name</label>
                <div className="vehicles-search-field">
                  <Search size={18} />
                  <input
                    id="vehicle-search"
                    type="search"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="vehicles-filter-group">
                <label htmlFor="vehicle-category">Vehicle Category</label>
                <select
                  id="vehicle-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* RESTORED: Seating Capacity Filter */}
              <div className="vehicles-filter-group">
                <label htmlFor="vehicle-seats">Seating Capacity</label>
                <select
                  id="vehicle-seats"
                  value={selectedSeats}
                  onChange={(e) => setSelectedSeats(e.target.value)}
                >
                  <option value="All">All Seat Capacities</option>
                  {seatOptions.map((seat) => (
                    <option key={seat} value={seat}>
                      {seat} Seats
                    </option>
                  ))}
                </select>
              </div>

              {/* RESTORED: Price Inputs & Dual Range Slider */}
              <div className="vehicles-filter-group">
                <span className="vehicles-filter-title">Starting Price / Day</span>

                <div className="vehicles-price-inputs">
                  <label htmlFor="minimum-vehicle-price">
                    <span>Minimum</span>
                    <div className="vehicles-price-input-box">
                      <b>৳</b>
                      <input
                        id="minimum-vehicle-price"
                        type="number"
                        min={MIN_STARTING_PRICE}
                        max={maximumPrice}
                        step={PRICE_STEP}
                        value={minimumPrice}
                        onChange={handleMinimumPriceChange}
                      />
                    </div>
                  </label>

                  <label htmlFor="maximum-vehicle-price">
                    <span>Maximum</span>
                    <div className="vehicles-price-input-box">
                      <b>৳</b>
                      <input
                        id="maximum-vehicle-price"
                        type="number"
                        min={minimumPrice}
                        max={MAX_STARTING_PRICE}
                        step={PRICE_STEP}
                        value={maximumPrice}
                        onChange={handleMaximumPriceChange}
                      />
                    </div>
                  </label>
                </div>

                <div className="vehicles-price-slider">
                  <div className="vehicles-price-slider-track" />
                  <div
                    className="vehicles-price-slider-progress"
                    style={{
                      left: `${minimumPricePercent}%`,
                      right: `${100 - maximumPricePercent}%`,
                    }}
                  />
                  <input
                    type="range"
                    aria-label="Minimum starting price"
                    min={MIN_STARTING_PRICE}
                    max={MAX_STARTING_PRICE}
                    step={PRICE_STEP}
                    value={minimumPrice}
                    onChange={handleMinimumPriceChange}
                  />
                  <input
                    type="range"
                    aria-label="Maximum starting price"
                    min={MIN_STARTING_PRICE}
                    max={MAX_STARTING_PRICE}
                    step={PRICE_STEP}
                    value={maximumPrice}
                    onChange={handleMaximumPriceChange}
                  />
                </div>

                <p className="vehicles-selected-price-range">
                  {formatCarPrice(minimumPrice)} – {formatCarPrice(maximumPrice)}
                </p>

                <small className="vehicles-price-filter-note">
                  Body rent starting price for 1 day
                </small>
              </div>

              <div className="vehicles-filter-group">
                <span className="vehicles-filter-title">Filter by Brand</span>
                <div className="vehicles-brand-dropdown">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand === "All" ? "All Brands" : brand} ({getBrandCount(brand)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" className="vehicles-reset-button" onClick={resetFilters}>
                <RotateCcw size={17} />
                Reset Filters
              </button>

              <button
                type="button"
                className="vehicles-mobile-result-button"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {filteredCars.length} Vehicle Models
              </button>
            </aside>

            <div className="vehicles-results">
              <div className="vehicles-results-toolbar">
                <div className="vehicles-results-summary">
                  <p>
                    Showing <strong>{filteredCars.length}</strong> of <strong>{cars.length}</strong> vehicle models
                  </p>
                  <span>{filteredFleetCount} cars available in these results</span>
                </div>

                <div className="vehicles-sort-control">
                  <label htmlFor="vehicle-sort">Sort by</label>
                  <select
                    id="vehicle-sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="default">Recommended</option>
                    <option value="name-ascending">Name: A to Z</option>
                    <option value="name-descending">Name: Z to A</option>
                    <option value="seats-low-high">Seats: Low to High</option>
                    <option value="seats-high-low">Seats: High to Low</option>
                    <option value="availability-high-low">Availability: High to Low</option>
                    <option value="availability-low-high">Availability: Low to High</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {filteredCars.length > 0 ? (
                <div className="vehicles-grid">
                  {filteredCars.map((car, index) => (
                    <motion.article
                      key={car.id}
                      className="vehicle-card"
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(index * 0.04, 0.28),
                      }}
                    >
                      <div className="vehicle-card-image">
                        <VehicleImage car={car} />

                        <span className="vehicle-category-badge">{car.category}</span>

                        <span
                          className={`vehicle-availability-badge ${
                            car.quantity === 1 ? "is-limited" : ""
                          } ${car.quantity === 0 ? "is-unavailable" : ""}`}
                        >
                          {getAvailabilityText(car.quantity)}
                        </span>
                      </div>

                      <div className="vehicle-card-content">
                        <p className="vehicle-card-brand">{car.brand}</p>
                        <h3>{car.name}</h3>

                        <div className="vehicle-card-details">
                          <div>
                            <Users size={18} />
                            <span>{car.seats} Seats</span>
                          </div>

                          <div>
                            <CarFront size={18} />
                            <span>{car.category}</span>
                          </div>
                        </div>

                        {/* RESTORED: RideRent verified vehicle badge */}
                        <div className="vehicle-verification">
                          <ShieldCheck size={18} />
                          <span>RideRent verified vehicle</span>
                        </div>

                        <div className="vehicle-card-footer">
                          <div className="vehicle-price-info">
                            <span>Starting From</span>
                            <strong>
                              {formatCarPrice(car.price)}
                              <em>/ day</em>
                            </strong>
                            <small>Body rent only • 1 day</small>
                          </div>

                          <button
                            type="button"
                            disabled={car.quantity === 0}
                            onClick={() =>
                              navigate("/", {
                                state: {
                                  scrollTo: "booking",
                                  selectedCar: car.name,
                                },
                              })
                            }
                          >
                            {car.quantity === 0 ? "Unavailable" : "Book Now"}
                            {car.quantity > 0 && <ArrowRight size={17} />}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="vehicles-empty-state">
                  <div>
                    <CarFront size={50} />
                  </div>
                  <h3>No vehicles found</h3>
                  <p>Try changing your search or vehicle filters.</p>
                  <button type="button" onClick={resetFilters}>
                    <RotateCcw size={17} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default VehiclesPage;
