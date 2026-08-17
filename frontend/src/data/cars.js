export const cars = [
  {
    id: "toyota-axio",
    name: "Toyota Axio",
    brand: "Toyota",
    category: "Sedan",
    seats: 5,
    quantity: 5,
    startingPrice: 3000,
    imageKey: "Toyota Axio",
  },
  {
    id: "toyota-allion",
    name: "Toyota Allion",
    brand: "Toyota",
    category: "Sedan",
    seats: 5,
    quantity: 4,
    startingPrice: 3200,
    imageKey: "Toyota Allion",
  },
  {
    id: "toyota-premio",
    name: "Toyota Premio",
    brand: "Toyota",
    category: "Sedan",
    seats: 5,
    quantity: 4,
    startingPrice: 3500,
    imageKey: "Toyota Premio",
  },
  {
    id: "toyota-corolla",
    name: "Toyota Corolla",
    brand: "Toyota",
    category: "Sedan",
    seats: 5,
    quantity: 6,
    startingPrice: 2500,
    imageKey: "Toyota Corolla",
  },
  {
    id: "toyota-fielder",
    name: "Toyota Fielder",
    brand: "Toyota",
    category: "Hatchback",
    seats: 5,
    quantity: 3,
    startingPrice: 3200,
    imageKey: "Toyota Corolla Fielder",
  },

  {
    id: "toyota-probox",
    name: "Toyota Probox",
    brand: "Toyota",
    category: "Hatchback",
    seats: 5,
    quantity: 6,
    startingPrice: 2600,
    imageKey: "Toyota Probox",
  },

  {
    id: "toyota-noah-old",
    name: "Toyota Noah Old",
    brand: "Toyota",
    category: "MPV",
    seats: 7,
    quantity: 9,
    startingPrice: 4000,
    imageKey: "Toyota Noah Old",
  },
  {
    id: "toyota-noah-new-model",
    name: "Toyota Noah New Model",
    brand: "Toyota",
    category: "MPV",
    seats: 7,
    quantity: 4,
    startingPrice: 6000,
    imageKey: "Toyota Noah",
  },
  {
    id: "toyota-hiace-10-seat",
    name: "Toyota Hiace (10 Seat)",
    brand: "Toyota",
    category: "Microbus",
    seats: 10,
    quantity: 8,
    startingPrice: 5500,
    imageKey: "Toyota Hiace 10 Seater",
  },
  {
    id: "toyota-hiace-12-seat",
    name: "Toyota Hiace (12 Seat)",
    brand: "Toyota",
    category: "Microbus",
    seats: 12,
    quantity: 19,
    startingPrice: 6000,
    imageKey: "Toyota Hiace 12 Seat",
  },
  {
    id: "toyota-hiace-15-seat",
    name: "Toyota Hiace (15 Seat)",
    brand: "Toyota",
    category: "Microbus",
    seats: 15,
    quantity: 6,
    startingPrice: 7000,
    imageKey: "Toyota Hiace 15 Seat Grand",
  },
  {
    id: "toyota-coaster",
    name: "Toyota Coaster",
    brand: "Toyota",
    category: "Bus",
    seats: 25,
    quantity: 2,
    startingPrice: 21000,
    imageKey: "Toyota Coaster",
  },
  {
    id: "toyota-harrier",
    name: "Toyota Harrier",
    brand: "Toyota",
    category: "Premium SUV",
    seats: 5,
    quantity: 1,
    startingPrice: 12000,
    imageKey: "Toyota Harrier",
  },
  {
    id: "honda-vezel",
    name: "Honda Vezel",
    brand: "Honda",
    category: "SUV",
    seats: 5,
    quantity: 2,
    startingPrice: 5000,
    imageKey: "Honda Vezel",
  },
  {
    id: "honda-insight",
    name: "Honda Insight",
    brand: "Honda",
    category: "Premium Sedan",
    seats: 5,
    quantity: 1,
    startingPrice: 4000,
    imageKey: "Honda Insight",
  },
  {
    id: "toyota-prado",
    name: "Toyota Prado",
    brand: "Toyota",
    category: "Premium SUV",
    seats: 7,
    quantity: 1,
    startingPrice: 18000,
    imageKey: "Toyota Prado",
  },
  {
    id: "bmw-x5",
    name: "BMW X5",
    brand: "BMW",
    category: "Luxury Sedan",
    seats: 5,
    quantity: 1,
    startingPrice: 40000,
    imageKey: "BMW X5 M",
  },
  {
    id: "mercedes-benz-e-class",
    name: "Mercedes Benz E-Class",
    brand: "Mercedes Benz",
    category: "Luxury Sedan",
    seats: 5,
    quantity: 1,
    startingPrice: 35000,
    imageKey: "Mercedes Benz E-Class",
  },
];

export const getCarQuantity = (car) => {
  const quantity = Number(car?.quantity ?? 1);

  if (!Number.isFinite(quantity) || quantity < 0) {
    return 1;
  }

  return quantity;
};

export const getCarStartingPrice = (car) => {
  const startingPrice = Number(car?.startingPrice ?? 0);

  if (!Number.isFinite(startingPrice) || startingPrice < 0) {
    return 0;
  }

  return startingPrice;
};

export const formatCarPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return "৳0";
  }

  return `৳${numericPrice.toLocaleString("en-BD")}`;
};
