# ⚽ Scorely API

![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express-REST%20API-black)
![Tests](https://img.shields.io/badge/API%20Tests-10%20Passing-success)
![CI](https://github.com/lucianbutuc16/scorely-server/actions/workflows/tests.yml/badge.svg)

**Scorely API** is the backend service for the Scorely football mobile application.

It is built with **Node.js and Express** and acts as an intermediary between the Scorely mobile client and the **Sportmonks Football API**.

The backend retrieves external football data, transforms it into a simplified format and exposes REST endpoints used by the mobile application.

---

## 🌐 Live API

The backend is deployed on Render:

[https://scorely-server.onrender.com](https://scorely-server.onrender.com)

Health check:

```http
GET /
```

Example response:

```json
{
  "message": "Scorely API is running ⚽"
}
```

---

## 📱 Mobile Application

This API powers the Scorely React Native mobile application.

Frontend repository:

[Scorely Mobile App](https://github.com/lucianbutuc16/scorely)

Architecture:

```text
┌──────────────────────────┐
│      Scorely Mobile      │
│                          │
│ React Native + Expo      │
│ TypeScript               │
└────────────┬─────────────┘
             │
             │ HTTPS / REST
             ▼
┌──────────────────────────┐
│       Scorely API        │
│                          │
│ Node.js + Express        │
│ Hosted on Render         │
└────────────┬─────────────┘
             │
             │ HTTPS
             ▼
┌──────────────────────────┐
│   Sportmonks Football    │
│           API            │
└──────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express
- Axios
- REST API
- dotenv
- CORS

### Football Data

- Sportmonks Football API

### Testing

- Jest
- Supertest
- Axios mocking
- Regression testing

### CI/CD

- GitHub Actions
- Render

---

## 🔐 Environment Variables

The Sportmonks API token is stored securely using environment variables and is never committed to GitHub.

Create a `.env` file in the project root:

```env
SPORTMONKS_API_TOKEN=your_sportmonks_api_token
PORT=3000
```

The `.env` file is excluded from Git through `.gitignore`.

---

## 🚀 Running Locally

### Requirements

Install:

- Node.js
- npm

Clone the repository:

```bash
git clone https://github.com/lucianbutuc16/scorely-server.git
```

Enter the project:

```bash
cd scorely-server
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

and add:

```env
SPORTMONKS_API_TOKEN=your_sportmonks_api_token
PORT=3000
```

Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

The API will be available locally at:

```text
http://localhost:3000
```

---

# 📡 API Endpoints

## Health Check

```http
GET /
```

Checks whether the Scorely API is running.

---

## ⚽ Matches

### Get Matches

```http
GET /api/matches
```

Query parameters:

```text
date
league
```

Example:

```http
GET /api/matches?date=2026-09-19&league=501
```

Example response:

```json
[
  {
    "id": 12345,
    "date": "2026-09-19 15:00:00",
    "status": "FT",
    "score": {
      "home": 1,
      "away": 1
    },
    "homeTeam": {
      "id": 180,
      "name": "Kilmarnock",
      "logo": "..."
    },
    "awayTeam": {
      "id": 314,
      "name": "Hearts",
      "logo": "..."
    }
  }
]
```

Scheduled matches without a score return:

```json
{
  "home": null,
  "away": null
}
```

instead of incorrectly returning `0 - 0`.

---

### Get Match Details

```http
GET /api/matches/:id
```

Returns detailed information including:

- Teams
- Score
- Match status
- Events
- Lineups
- Statistics

Example:

```http
GET /api/matches/19722785
```

Statistics are transformed into a simplified structure:

```json
{
  "id": 1001,
  "participantId": 180,
  "location": "home",
  "name": "Corners",
  "code": "corners",
  "value": 2
}
```

---

## 🏆 Standings

```http
GET /api/standings
```

Query parameter:

```text
league
```

Example:

```http
GET /api/standings?league=501
```

Supported leagues currently include:

```text
501 → Scottish Premiership
271 → Danish Superliga
```

The backend maps leagues to their corresponding Sportmonks season IDs.

Unsupported leagues return:

```http
400 Bad Request
```

```json
{
  "message": "Unsupported league"
}
```

---

## 🔎 Search

```http
GET /api/search
```

Query parameter:

```text
q
```

Example:

```http
GET /api/search?q=Celtic
```

The endpoint searches both:

- Teams
- Players

Example response:

```json
{
  "teams": [
    {
      "id": 53,
      "name": "Celtic",
      "shortCode": "CEL",
      "logo": "...",
      "countryId": 1161
    }
  ],
  "players": []
}
```

Queries shorter than two characters return empty results without calling the external API.

Placeholder teams are filtered from search results.

---

# 🏟️ Team Endpoints

## Team Fixtures

```http
GET /api/teams/:id/fixtures
```

Returns previous and upcoming fixtures for a team.

Used by:

- Team profiles
- Recent form
- Upcoming matches
- Favorites

---

## Team Squad

```http
GET /api/teams/:id/squad
```

Returns squad information including:

- Player
- Position
- Jersey number
- Captain status
- Contract dates

---

## Team Transfers

```http
GET /api/teams/:id/transfers
```

Returns:

- Incoming transfers
- Outgoing transfers
- Transfer type
- Player
- Previous / destination team
- Transfer status

Transfer results are cached temporarily on the server to reduce unnecessary requests to the external API.

---

## Team Information

```http
GET /api/teams/:id/info
```

Returns club information such as:

- Club name
- Founded year
- Country
- Stadium
- City
- Address
- Capacity
- Playing surface
- Stadium image

---

# 👤 Player Endpoints

## Player Profile

```http
GET /api/players/:id
```

Returns:

- Player name
- Image
- Position
- Nationality
- Date of birth
- Height
- Weight

---

## Player Career

```http
GET /api/players/:id/career
```

Returns:

- Current club
- Club history
- Transfer history
- Contract information

---

## Player Statistics

```http
GET /api/players/:id/statistics
```

Returns seasonal player statistics including:

- Appearances
- Starts
- Minutes
- Goals
- Assists
- Yellow cards
- Red cards

Statistics are grouped by season.

---

# 🧪 Automated Testing

Scorely API includes automated tests using **Jest** and **Supertest**.

Run the test suite:

```bash
npm test
```

Current test suite:

```text
10 automated tests
```

---

## ✅ Current Test Coverage

The automated tests currently validate:

- API health check
- Input validation
- Match response transformation
- Match score transformation
- Scheduled matches without scores
- Sportmonks error handling
- League validation
- Correct season selection
- Team and player search
- Placeholder team filtering
- Match statistics transformation
- Regression protection

---

## 🎭 External API Mocking

Sportmonks requests are mocked during automated testing.

Example flow:

```text
Mock Sportmonks Response
          ↓
    Scorely Backend
          ↓
 Transform Business Logic
          ↓
     Supertest Request
          ↓
      Jest Assertion
```

This allows tests to run without:

- Making real Sportmonks requests
- Consuming API limits
- Depending on internet connectivity
- Depending on Sportmonks availability
- Receiving unpredictable external data

---

## 🐛 Regression Testing

The test suite also protects bugs that have already been fixed.

For example, Sportmonks statistics use:

```text
type.code
type.name
data.value
participant_id
```

Scorely transforms them into:

```text
code
name
value
participantId
```

An automated regression test validates this transformation.

If a future backend change breaks this behavior, the test suite detects it automatically.

---

# 🔄 Continuous Integration

Scorely API uses **GitHub Actions** for continuous integration.

The workflow is located at:

```text
.github/workflows/tests.yml
```

Tests run automatically on:

- Pushes to `main`
- Pull requests targeting `main`

CI pipeline:

```text
Push / Pull Request
        ↓
Checkout Repository
        ↓
Setup Node.js
        ↓
npm ci
        ↓
npm test
        ↓
✅ PASS / ❌ FAIL
```

This helps detect regressions before changes are merged or deployed.

---

## ☁️ Deployment

The API is deployed using **Render**.

Production URL:

[https://scorely-server.onrender.com](https://scorely-server.onrender.com)

The production environment contains the Sportmonks API token as a secure environment variable.

The mobile application communicates with this hosted API through HTTPS.

---

## 🔒 Security

Scorely follows a backend proxy architecture so the external Sportmonks token is never exposed in the React Native application.

```text
Mobile App
    ↓
Scorely Backend
    ↓
Sportmonks
```

The following files are excluded from Git:

```text
node_modules
.env
```

---

## 🚀 Future Improvements

Planned backend improvements include:

- Additional automated test coverage
- More negative test scenarios
- Player endpoint tests
- Team endpoint tests
- Integration testing
- Request validation middleware
- Improved centralized error handling
- API response caching
- Rate-limit protection
- Logging
- Additional football leagues
- Head-to-head endpoint
- Performance improvements

---

## 📌 Project Status

Current backend status:

- ✅ REST API operational
- ✅ Cloud deployment
- ✅ Sportmonks integration
- ✅ Match endpoints
- ✅ Standings
- ✅ Search
- ✅ Team profiles
- ✅ Team squads
- ✅ Team fixtures
- ✅ Team transfers
- ✅ Player profiles
- ✅ Player career
- ✅ Player statistics
- ✅ Automated API tests
- ✅ External API mocking
- ✅ Regression testing
- ✅ GitHub Actions CI
- 🚧 Continued development

---

## 🎯 Project Goals

Scorely API was developed to demonstrate practical experience with:

- REST API development
- Node.js
- Express
- External API integration
- Backend architecture
- Data transformation
- Error handling
- Secure environment variables
- API testing
- Jest
- Supertest
- Mocking
- Regression testing
- Continuous Integration
- Cloud deployment

---

## 👨‍💻 Author

**Lucian Butuc**

Master's student in Information Technologies with an interest in **Software Engineering and QA/Test Automation**.

### Areas of Interest

- Software Engineering
- QA & Test Automation
- REST API Testing
- JavaScript / TypeScript
- Test Automation
- CI/CD
