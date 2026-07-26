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
import { cars, getCarQuantity } from "../data/cars";
import "../styles/vehicles-page.css";

const carImageModules = import.meta.glob("../assets/RideRentCars/*", {
  eager: true,
  import: "default",
});

const normalizeImageKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

const carImageLookup = Object.entries(carImageModules).reduce(
  (imageMap, [imagePath, imageUrl]) => {
    const fileName =
      imagePath
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";

    imageMap[normalizeImageKey(fileName)] = imageUrl;

    return imageMap;
  },
  {}
);

const getCarImage = (car) => {
  const imageKey = normalizeImageKey(car.imageKey);

  return carImageLookup[imageKey] || null;
};

const getAvailabilityText = (car) => {
  const quantity = getCarQuantity(car);

  if (quantity === 0) {
    return "Not Available";
  }

  if (quantity === 1) {
    return "Only 1 Available";
  }

  return `${quantity} Available`;
};

function VehicleImage({ car }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = getCarImage(car);

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeats, setSelectedSeats] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
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
  }, []);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = [
      ...new Set(cars.map((car) => car.category)),
    ];

    return ["All", ...uniqueCategories.sort()];
  }, []);

  const seatOptions = useMemo(
    () =>
      [...new Set(cars.map((car) => car.seats))].sort(
        (firstSeat, secondSeat) => firstSeat - secondSeat
      ),
    []
  );

  const totalFleetCount = useMemo(
    () =>
      cars.reduce(
        (total, car) => total + getCarQuantity(car),
        0
      ),
    []
  );

  const filteredCars = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const results = cars.filter((car) => {
      const searchableContent = [
        car.name,
        car.brand,
        car.category,
        `${car.seats} seat`,
        `${getCarQuantity(car)} available`,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      const matchesBrand =
        selectedBrand === "All" ||
        car.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === "All" ||
        car.category === selectedCategory;

      const matchesSeats =
        selectedSeats === "All" ||
        String(car.seats) === selectedSeats;

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesSeats
      );
    });

    if (sortOption === "name-ascending") {
      return [...results].sort((firstCar, secondCar) =>
        firstCar.name.localeCompare(secondCar.name)
      );
    }

    if (sortOption === "name-descending") {
      return [...results].sort((firstCar, secondCar) =>
        secondCar.name.localeCompare(firstCar.name)
      );
    }

    if (sortOption === "seats-low-high") {
      return [...results].sort(
        (firstCar, secondCar) =>
          firstCar.seats - secondCar.seats
      );
    }

    if (sortOption === "seats-high-low") {
      return [...results].sort(
        (firstCar, secondCar) =>
          secondCar.seats - firstCar.seats
      );
    }

    if (sortOption === "availability-high-low") {
      return [...results].sort(
        (firstCar, secondCar) =>
          getCarQuantity(secondCar) -
          getCarQuantity(firstCar)
      );
    }

    if (sortOption === "availability-low-high") {
      return [...results].sort(
        (firstCar, secondCar) =>
          getCarQuantity(firstCar) -
          getCarQuantity(secondCar)
      );
    }

    return results;
  }, [
    searchTerm,
    selectedBrand,
    selectedCategory,
    selectedSeats,
    sortOption,
  ]);

  const filteredFleetCount = useMemo(
    () =>
      filteredCars.reduce(
        (total, car) => total + getCarQuantity(car),
        0
      ),
    [filteredCars]
  );

  const getBrandCount = (brand) => {
    if (brand === "All") {
      return cars.length;
    }

    return cars.filter((car) => car.brand === brand).length;
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedBrand("All");
    setSelectedCategory("All");
    setSelectedSeats("All");
    setSortOption("default");
  };

  const goToHome = () => {
    navigate("/");
  };

  const goToBooking = (carName) => {
    navigate("/", {
      state: {
        scrollTo: "booking",
        selectedCar: carName,
      },
    });
  };

  return (
    <>
      <Navbar />

      <main className="vehicles-page">
        <section className="vehicles-hero">
          <div className="vehicles-hero-content">
            <div className="vehicles-breadcrumb">
              <button
                type="button"
                onClick={goToHome}
              >
                Home
              </button>

              <ChevronRight size={16} />

              <span>Vehicles</span>
            </div>

            <p className="vehicles-hero-label">
              RideRent Vehicle Collection
            </p>

            <h1>
              Find the perfect vehicle for your journey
            </h1>

            <p className="vehicles-hero-description">
              Browse RideRent cars, SUVs, microbuses and
              premium vehicles. Choose your preferred vehicle
              and continue directly to the booking section.
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
              <p className="vehicles-section-label">
                Our Fleet
              </p>

              <h2>Explore RideRent Vehicles</h2>

              <p>
                Search and filter vehicles by brand, category
                and seating capacity.
              </p>
            </div>

            <button
              type="button"
              className="vehicles-filter-toggle"
              onClick={() =>
                setMobileFiltersOpen(
                  (previousState) => !previousState
                )
              }
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

            <aside
              className={`vehicles-filter-panel ${
                mobileFiltersOpen ? "is-open" : ""
              }`}
            >
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
                <label htmlFor="vehicle-search">
                  Vehicle Name
                </label>

                <div className="vehicles-search-field">
                  <Search size={18} />

                  <input
                    id="vehicle-search"
                    type="search"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="vehicles-filter-group">
                <label htmlFor="vehicle-category">
                  Vehicle Category
                </label>

                <select
                  id="vehicle-category"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                >
                  {categoryOptions.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vehicles-filter-group">
                <label htmlFor="vehicle-seats">
                  Seating Capacity
                </label>

                <select
                  id="vehicle-seats"
                  value={selectedSeats}
                  onChange={(event) =>
                    setSelectedSeats(event.target.value)
                  }
                >
                  <option value="All">
                    All Seat Capacities
                  </option>

                  {seatOptions.map((seat) => (
                    <option
                      key={seat}
                      value={seat}
                    >
                      {seat} Seats
                    </option>
                  ))}
                </select>
              </div>

              <div className="vehicles-filter-group">
                <span className="vehicles-filter-title">
                  Filter by Brand
                </span>

                <div className="vehicles-brand-list">
                  {brandOptions.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      className={
                        selectedBrand === brand
                          ? "active"
                          : ""
                      }
                      onClick={() => setSelectedBrand(brand)}
                    >
                      <span>
                        {brand === "All"
                          ? "All Brands"
                          : brand}
                      </span>

                      <strong>
                        {getBrandCount(brand)}
                      </strong>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="vehicles-reset-button"
                onClick={resetFilters}
              >
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
                    Showing{" "}
                    <strong>{filteredCars.length}</strong>{" "}
                    of <strong>{cars.length}</strong>{" "}
                    vehicle models
                  </p>

                  <span>
                    {filteredFleetCount} cars available in
                    these results
                  </span>
                </div>

                <div className="vehicles-sort-control">
                  <label htmlFor="vehicle-sort">
                    Sort by
                  </label>

                  <select
                    id="vehicle-sort"
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value)
                    }
                  >
                    <option value="default">
                      Recommended
                    </option>

                    <option value="name-ascending">
                      Name: A to Z
                    </option>

                    <option value="name-descending">
                      Name: Z to A
                    </option>

                    <option value="seats-low-high">
                      Seats: Low to High
                    </option>

                    <option value="seats-high-low">
                      Seats: High to Low
                    </option>

                    <option value="availability-high-low">
                      Availability: High to Low
                    </option>

                    <option value="availability-low-high">
                      Availability: Low to High
                    </option>
                  </select>
                </div>
              </div>

              {filteredCars.length > 0 ? (
                <div className="vehicles-grid">
                  {filteredCars.map((car, index) => {
                    const quantity = getCarQuantity(car);

                    return (
                      <motion.article
                        key={car.id}
                        className="vehicle-card"
                        initial={{
                          opacity: 0,
                          y: 28,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                          amount: 0.15,
                        }}
                        transition={{
                          duration: 0.4,
                          delay: Math.min(
                            index * 0.04,
                            0.28
                          ),
                        }}
                      >
                        <div className="vehicle-card-image">
                          <VehicleImage car={car} />

                          <span className="vehicle-category-badge">
                            {car.category}
                          </span>

                          <span
                            className={`vehicle-availability-badge ${
                              quantity === 1
                                ? "is-limited"
                                : ""
                            } ${
                              quantity === 0
                                ? "is-unavailable"
                                : ""
                            }`}
                          >
                            {getAvailabilityText(car)}
                          </span>
                        </div>

                        <div className="vehicle-card-content">
                          <p className="vehicle-card-brand">
                            {car.brand}
                          </p>

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

                          <div className="vehicle-verification">
                            <ShieldCheck size={18} />

                            <span>
                              RideRent verified vehicle
                            </span>
                          </div>

                          <div className="vehicle-card-footer">
                            <div className="vehicle-price-info">
                              <span>Rental Price</span>
                              <strong>
                                Contact for quote
                              </strong>
                            </div>

                            <button
                              type="button"
                              disabled={quantity === 0}
                              onClick={() =>
                                goToBooking(car.name)
                              }
                            >
                              {quantity === 0
                                ? "Unavailable"
                                : "Book Now"}

                              {quantity > 0 && (
                                <ArrowRight size={17} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              ) : (
                <div className="vehicles-empty-state">
                  <div>
                    <CarFront size={50} />
                  </div>

                  <h3>No vehicles found</h3>

                  <p>
                    Try changing your search or vehicle
                    filters.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                  >
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