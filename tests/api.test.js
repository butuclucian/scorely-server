const request = require("supertest");
const app = require("../server");

describe("Scorely API", () => {
  test("GET / should return API status", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Scorely API is running ⚽",
    });
  });

  test("GET /api/search without query should return empty results", async () => {
    const response = await request(app).get("/api/search");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      teams: [],
      players: [],
    });
  });
});