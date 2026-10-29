# DriveWise

A responsive vehicle rental site built with semantic HTML, CSS, browser JavaScript, and a small Node.js backend. The backend stores confirmed booking requests in `db.json`; it does not take payments.

## Run locally

1. Install Node.js 18 or newer, Java 21 or newer, and Maven.
2. From this folder run `npm install` once, then `npm start`.
3. Wait for the website and Spring Boot messages in that terminal, then open <http://localhost:3000>. Press Ctrl+C in the same terminal to stop both.

Use the search panel to filter the fleet and the booking form to submit a request. A successful booking is written to `db.json`; the success popup appears only after the server confirms the save. Keep the server running while using the site.

## Experiment 2: REST API with Postman

The API supports CRUD operations for DriveWise vehicles:

| Method | Endpoint | Action |
| --- | --- | --- |
| GET | `/api/vehicles` | List vehicles; optional filters: `category`, `transmission`, `maxPrice` |
| GET | `/api/vehicles/:id` | Read one vehicle |
| POST | `/api/vehicles` | Create a vehicle |
| PUT | `/api/vehicles/:id` | Replace a vehicle |
| PATCH | `/api/vehicles/:id` | Update selected fields |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

In Postman, choose **Import → Files** and select `postman/DriveWise REST API - Six Vehicle CRUD.postman_collection.json` to test all six models shown on the website. Keep the server running and run the collection in order. It checks the three website categories (Car, Motorcycle, Scooter), then creates, replaces, updates, and deletes one temporary record per model. The DELETE requests target only IDs returned by the matching POST requests. Do not import `http://localhost:3000/`; that is the website address, not a Postman collection or API specification.

Vehicle records and bookings are stored in the local `db.json`. If the file is absent, the server starts with the six sample vehicles and no bookings, then creates `db.json` when the first vehicle or booking is saved. The local database is ignored by Git so customer contact details are not uploaded. Back up that file before manually editing or replacing it.

## Code tour

- `experiment-1.html` preserves the original HTML/CSS/JavaScript site, including the search, six vehicle cards, booking form, and contact sections.
- `index.html` is the React entry page used by Vite; after `npm run build`, the Node server serves the compiled React app at `/`.
- `style.css` contains the color and type variables, responsive layouts, card and form styling, and keyboard focus states.
- `script.js` runs the original static site's interactions and booking form.
- `src/App.jsx` and `src/components/` implement the React catalog and booking interface.
- `server.js` serves the static files, booking endpoint, and vehicle CRUD API.
- `db.json` stores local vehicle records and bookings. It is ignored by Git to keep customer details private; back it up before clearing or replacing it.
- `postman/DriveWise REST API - Six Vehicle CRUD.postman_collection.json` contains the website-aligned Experiment 2 requests.
- `spring-api/` contains the Spring Boot REST API used in Experiment 7.

Vehicle images load from Unsplash and Google Fonts load from Google Fonts, so those visuals need internet access. Booking storage itself is local.

## Experiment 7: Spring Boot REST API and CRUD

Experiment 7 applies the Spring Boot, JPA, and H2 CRUD pattern to DriveWise vehicles. Use `http://localhost:3000/spring-api/vehicles` for the Spring API's POST, GET-all, GET-by-ID, PUT, PATCH, and DELETE operations. The Node server forwards this path to Spring internally, so the site, its existing `/api` endpoints, and the Spring experiment share port 3000. Spring uses an in-memory H2 database that resets when the app stops; it does not replace or modify the existing `db.json` used by Experiments 1–4.

Run `npm start` once to build the React site and start both the Node website/API and Spring API in one terminal. Open the site at <http://localhost:3000> and import `postman/DriveWise Experiment 7 - Spring Boot CRUD.postman_collection.json` to run the Spring requests through <http://localhost:3000/spring-api/vehicles>. For a screenshot, capture the successful Postman responses and the Spring startup message. Stop both services with Ctrl+C.

## Experiment 8: Flask JWT Authentication

Experiment 8 adds a small Flask API using Werkzeug password hashing and PyJWT. It provides `POST /register`, `POST /login`, and a protected `GET /dashboard` on Flask port 5000, matching the lab setup. The Node server also forwards `/auth/...` requests through port 3000, keeping the website, existing APIs, and experiment on one origin. The API does not alter `db.json` or the Spring vehicle database. Accounts are held in memory like the lab exercise and disappear when the service stops.

Run `npm start` once; it builds the site and launches Node, Flask, and Spring Boot from the same terminal. This needs Node.js, Python 3 with Flask and PyJWT, Java 21, and Maven. Install the Python packages once with `python -m pip install -r auth-api/requirements.txt` if needed. In Postman, import `postman/DriveWise Experiment 8 - JWT Authentication.postman_collection.json` and run its three requests in order. Register creates the demo account, login saves the returned JWT as a collection variable, and the dashboard request sends it as a Bearer token. Capture the three successful responses for the experiment evidence. The built-in JWT secret is only for local coursework; set `DRIVEWISE_JWT_SECRET` to a private value before using this outside your machine.

## Experiment 3: React components and state

Experiment 3 uses the same DriveWise project, vehicle API, and `db.json`. The React catalog reads the current vehicle list from the Experiment 2 API and submits its booking form to the Experiment 1 booking API. Search, category and stock filters, and the cart use React state. The original static site is preserved at <http://localhost:3000/experiment-1.html>.

The main run command serves Experiment 3 (React) at <http://localhost:3000> with the same API and `db.json` used by Experiments 1 and 2. For React development with hot reload, run `npm start` and `npm run dev` in two terminals and open <http://localhost:5173>. If port 3000 is already in use, stop the old server in its terminal with Ctrl+C, then start again.

`src/App.jsx` manages application state and loads vehicles; `src/components/` contains reusable React UI; `src/data/mockData.js` stores the static user and presentation details; `src/components/BookingForm.jsx` sends confirmed bookings to the existing API.

## Experiment 4: React Context, form handling, and validation

The React booking flow uses a shared `BookingProvider` and `useBookings` hook to keep successfully saved bookings available across components. The booking form is controlled with React state and checks name, email, phone, location, and rental dates before it calls the existing API. Successful responses appear in a confirmation card and a booking table for the current browser session; the API remains the source that saves records to `db.json`.

## Experiment 9: Deploy Spring Boot with Docker

Experiment 9 extends the existing Spring API with a simple `GET /` confirmation message and a multi-stage Dockerfile. It uses the same Spring project as Experiment 7, so the vehicle CRUD API and in-memory H2 database remain available. The server reads Render's `PORT` environment variable when deployed and uses port 8080 locally.

To verify locally, run `npm start` from this project folder and open <http://localhost:8080>. The Spring endpoint should display `Spring Boot Application Deployed Successfully`; the React DriveWise site remains at <http://localhost:3000>.

For Render, push this project to a GitHub repository, create a Render Web Service connected to that repository, set its Root Directory to `spring-api`, choose Docker as the runtime, and create the service. Render will build `spring-api/Dockerfile`; open the URL Render provides to see the confirmation message. No payment or cloud database is configured. Repository publishing and Render account setup must be completed in your own accounts.

