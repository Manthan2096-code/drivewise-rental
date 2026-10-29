const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = __dirname;
const database = path.join(root, 'db.json');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};
const sampleVehicles = [
  { id: 'corolla', model: 'Toyota Corolla', category: 'Car', transmission: 'Automatic', seats: 5, pricePerDay: 2499 },
  { id: 'creta', model: 'Hyundai Creta', category: 'Car', transmission: 'Automatic', seats: 5, pricePerDay: 3899 },
  { id: 'classic', model: 'Royal Enfield Classic', category: 'Motorcycle', transmission: 'Manual', seats: 2, pricePerDay: 1799 },
  { id: 'duke', model: 'KTM Duke 390', category: 'Motorcycle', transmission: 'Manual', seats: 2, pricePerDay: 2199 },
  { id: 'activa', model: 'Honda Activa 6G', category: 'Scooter', transmission: 'Automatic', seats: 2, pricePerDay: 699 },
  { id: 'ather', model: 'Ather 450X', category: 'Scooter', transmission: 'Automatic', seats: 2, pricePerDay: 999 }
];

function readDatabase() {
  if (!fs.existsSync(database)) return { bookings: [], vehicles: sampleVehicles };
  const data = JSON.parse(fs.readFileSync(database, 'utf8'));
  if (Array.isArray(data)) return { bookings: data, vehicles: sampleVehicles };
  if (!data || !Array.isArray(data.bookings) || !Array.isArray(data.vehicles)) throw new Error('Database must contain bookings and vehicles arrays.');
  return data;
}

function writeDatabase(data) {
  fs.writeFileSync(database, `${JSON.stringify(data, null, 2)}\n`);
}

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

function validVehicle(vehicle) {
  return vehicle && typeof vehicle.model === 'string' && vehicle.model.trim() &&
    ['Car', 'Motorcycle', 'Scooter'].includes(vehicle.category) &&
    ['Automatic', 'Manual'].includes(vehicle.transmission) &&
    Number.isInteger(vehicle.seats) && vehicle.seats > 0 &&
    Number.isFinite(vehicle.pricePerDay) && vehicle.pricePerDay > 0;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20_000) reject(new Error('Request body is too large.'));
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON body.')); }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');

  // Keep the Flask JWT experiment on the same local origin as DriveWise.
  if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
    const authRequest = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `${url.pathname.slice('/auth'.length) || '/'}${url.search}`,
      method: request.method,
      headers: { ...request.headers, host: '127.0.0.1:5000' },
    }, (authResponse) => {
      response.writeHead(authResponse.statusCode, authResponse.headers);
      authResponse.pipe(response);
    });
    authRequest.on('error', () => {
      if (!response.headersSent) send(response, 502, { error: 'Authentication API is unavailable. Start the project with npm start.' });
    });
    request.pipe(authRequest);
    return;
  }

  // Keep the Spring experiment on the same browser/Postman origin as the site.
  if (url.pathname === '/spring-api' || url.pathname.startsWith('/spring-api/')) {
    const springRequest = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: `/api${url.pathname.slice('/spring-api'.length)}${url.search}`,
      method: request.method,
      headers: { ...request.headers, host: '127.0.0.1:8080' },
    }, (springResponse) => {
      response.writeHead(springResponse.statusCode, springResponse.headers);
      springResponse.pipe(response);
    });
    springRequest.on('error', () => {
      if (!response.headersSent) send(response, 502, { error: 'Spring API is unavailable. Start the project with npm start.' });
    });
    request.pipe(springRequest);
    return;
  }

  const collection = url.pathname === '/api/vehicles';
  const match = url.pathname.match(/^\/api\/vehicles\/([^/]+)$/);
  if (collection || match) {
    try {
      const data = readDatabase();
      const id = match ? decodeURIComponent(match[1]) : null;
      if (request.method === 'GET') {
        if (!id) {
          let vehicles = data.vehicles;
          const category = url.searchParams.get('category');
          const transmission = url.searchParams.get('transmission');
          const maxPrice = Number(url.searchParams.get('maxPrice'));
          if (category) vehicles = vehicles.filter((vehicle) => vehicle.category.toLowerCase() === category.toLowerCase());
          if (transmission) vehicles = vehicles.filter((vehicle) => vehicle.transmission.toLowerCase() === transmission.toLowerCase());
          if (url.searchParams.has('maxPrice') && Number.isFinite(maxPrice)) vehicles = vehicles.filter((vehicle) => vehicle.pricePerDay <= maxPrice);
          return send(response, 200, vehicles);
        }
        const vehicle = data.vehicles.find((item) => item.id === id);
        return vehicle ? send(response, 200, vehicle) : send(response, 404, { error: 'Vehicle not found.' });
      }

      if (request.method === 'POST' && collection) {
        const vehicle = await readBody(request);
        if (!validVehicle(vehicle)) return send(response, 400, { error: 'Provide model, valid category and transmission, positive seats, and positive pricePerDay.' });
        const saved = { id: randomUUID(), model: vehicle.model.trim(), category: vehicle.category, transmission: vehicle.transmission, seats: vehicle.seats, pricePerDay: vehicle.pricePerDay };
        data.vehicles.push(saved);
        writeDatabase(data);
        return send(response, 201, saved);
      }

      if (id && ['PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const index = data.vehicles.findIndex((item) => item.id === id);
        if (index < 0) return send(response, 404, { error: 'Vehicle not found.' });
        if (request.method === 'DELETE') {
          data.vehicles.splice(index, 1);
          writeDatabase(data);
          response.writeHead(204);
          return response.end();
        }
        const changes = await readBody(request);
        const vehicle = request.method === 'PUT' ? changes : { ...data.vehicles[index], ...changes };
        if (!validVehicle(vehicle)) return send(response, 400, { error: 'Provide model, valid category and transmission, positive seats, and positive pricePerDay.' });
        data.vehicles[index] = { id, model: vehicle.model.trim(), category: vehicle.category, transmission: vehicle.transmission, seats: vehicle.seats, pricePerDay: vehicle.pricePerDay };
        writeDatabase(data);
        return send(response, 200, data.vehicles[index]);
      }
      response.setHeader('Allow', collection ? 'GET, POST' : 'GET, PUT, PATCH, DELETE');
      return send(response, 405, { error: 'Method not allowed.' });
    } catch (error) {
      return send(response, error.message === 'Invalid JSON body.' || error.message === 'Request body is too large.' ? 400 : 500, { error: error.message === 'Invalid JSON body.' || error.message === 'Request body is too large.' ? error.message : 'Request could not be completed.' });
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/bookings') {
    try {
      const booking = await readBody(request);
      const required = ['name', 'email', 'phone', 'vehicle', 'pickupLocation', 'pickupDate', 'returnDate', 'pickupTime'];
      if (!booking || required.some((key) => typeof booking[key] !== 'string' || !booking[key].trim())) return send(response, 400, { error: 'Please complete all required booking fields.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) || !/^[0-9+() -]{7,20}$/.test(booking.phone)) return send(response, 400, { error: 'Please enter a valid email and phone number.' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.pickupDate) || !/^\d{4}-\d{2}-\d{2}$/.test(booking.returnDate) || booking.returnDate <= booking.pickupDate) return send(response, 400, { error: 'Return date must be after the pick-up date.' });
      const data = readDatabase();
      const saved = { ...booking, id: randomUUID(), createdAt: new Date().toISOString() };
      data.bookings.push(saved);
      writeDatabase(data);
      return send(response, 201, { id: saved.id, message: 'Booking saved.' });
    } catch (error) {
      return send(response, error.message === 'Invalid JSON body.' || error.message === 'Request body is too large.' ? 400 : 500, { error: error.message === 'Invalid JSON body.' || error.message === 'Request body is too large.' ? error.message : 'Booking could not be saved. Please try again later.' });
    }
  }

  const dist = path.join(root, 'dist');
  const builtIndex = path.join(dist, 'index.html');
  const hasBuiltApp = fs.existsSync(builtIndex);
  const requested = decodeURIComponent(url.pathname.slice(1));
  const file = url.pathname === '/' || url.pathname === '/index.html'
    ? (hasBuiltApp ? builtIndex : path.join(root, 'experiment-1.html'))
    : path.resolve(root, requested);
  const builtFile = path.resolve(dist, requested);
  const selectedFile = fs.existsSync(file) ? file : builtFile;
  if ((!selectedFile.startsWith(`${root}${path.sep}`)) || !types[path.extname(selectedFile)] || !fs.existsSync(selectedFile) || !fs.statSync(selectedFile).isFile()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(selectedFile)] });
  fs.createReadStream(selectedFile).pipe(response);
});

server.listen(process.env.PORT || 3000, () => console.log(`DriveWise is running at http://localhost:${process.env.PORT || 3000}`));
