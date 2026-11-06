export const products = [
  { pname: 'Apple', description: 'Fresh red apples, 1 kg', price: 2.99, qty: 120 },
  { pname: 'Banana', description: 'Ripe bananas, 1 dozen', price: 1.49, qty: 200 },
  { pname: 'Orange', description: 'Juicy navel oranges, 1 kg', price: 3.25, qty: 150 },
  { pname: 'Mango', description: 'Sweet Alphonso mangoes, 1 kg', price: 5.99, qty: 80 },
  { pname: 'Grapes', description: 'Seedless green grapes, 500 g', price: 4.49, qty: 90 },
  { pname: 'Strawberry', description: 'Fresh strawberries, 250 g', price: 3.99, qty: 60 },
  { pname: 'Watermelon', description: 'Whole seedless watermelon', price: 6.99, qty: 40 },
  { pname: 'Pineapple', description: 'Golden pineapple, each', price: 4.25, qty: 55 },
  { pname: 'Blueberry', description: 'Organic blueberries, 125 g', price: 5.49, qty: 70 },
  { pname: 'Peach', description: 'Ripe peaches, 1 kg', price: 3.75, qty: 85 },
];

export const users = [
  { uname: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
  { uname: 'Bob Smith', email: 'bob@example.com', password: 'password123' },
  { uname: 'Carol Lee', email: 'carol@example.com', password: 'password123' },
  { uname: 'David Kim', email: 'david@example.com', password: 'password123' },
  { uname: 'Eva Martinez', email: 'eva@example.com', password: 'password123' },
  { uname: 'Frank Wilson', email: 'frank@example.com', password: 'password123' },
  { uname: 'Grace Chen', email: 'grace@example.com', password: 'password123' },
  { uname: 'Henry Brown', email: 'henry@example.com', password: 'password123' },
];

export const orders = [
  { userEmail: 'alice@example.com', productName: 'Apple', orderDate: '2026-11-01T09:15:00.000Z' },
  { userEmail: 'bob@example.com', productName: 'Mango', orderDate: '2026-11-02T13:40:00.000Z' },
  {
    userEmail: 'carol@example.com',
    productName: 'Strawberry',
    orderDate: '2026-11-03T18:05:00.000Z',
  },
  {
    userEmail: 'eva@example.com',
    productName: 'Banana',
    orderDate: '2026-11-04T10:30:00.000Z',
  },
  {
    userEmail: 'henry@example.com',
    productName: 'Peach',
    orderDate: '2026-11-05T15:20:00.000Z',
  },
];
