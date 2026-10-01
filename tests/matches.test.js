jest.mock("axios");

const axios = require("axios");
const request = require("supertest");
const app = require("../server");

describe("Matches API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/matches should return formatted matches", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 12345,
            starting_at: "2026-09-19 15:00:00",

            state: {
              short_name: "FT",
            },

            participants: [
              {
                id: 180,
                name: "Kilmarnock",
                image_path: "https://example.com/kilmarnock.png",
                meta: {
                  location: "home",
                },
              },
              {
                id: 314,
                name: "Hearts",
                image_path: "https://example.com/hearts.png",
                meta: {
                  location: "away",
                },
              },
            ],

            scores: [
              {
                description: "CURRENT",
                score: {
                  participant: "home",
                  goals: 1,
                },
              },
              {
                description: "CURRENT",
                score: {
                  participant: "away",
                  goals: 1,
                },
              },
            ],
          },
        ],
      },
    });

    const response = await request(app).get(
      "/api/matches?date=2026-09-19&league=501",
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        id: 12345,
        date: "2026-09-19 15:00:00",
        status: "FT",

        score: {
          home: 1,
          away: 1,
        },

        homeTeam: {
          id: 180,
          name: "Kilmarnock",
          logo: "https://example.com/kilmarnock.png",
        },

        awayTeam: {
          id: 314,
          name: "Hearts",
          logo: "https://example.com/hearts.png",
        },
      },
    ]);
  });

  test("GET /api/matches should handle Sportmonks errors", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    axios.get.mockRejectedValue({
      response: {
        status: 503,
        data: {
          message: "Service unavailable",
        },
      },
    });

    const response = await request(app).get(
      "/api/matches?date=2026-09-19&league=501",
    );

    expect(response.status).toBe(503);

    expect(response.body).toEqual({
      message: "Failed to fetch matches",
      error: {
        message: "Service unavailable",
      },
    });

    consoleErrorSpy.mockRestore();
  });

  test("GET /api/matches should return null scores for scheduled matches", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 99999,
            starting_at: "2026-10-05 18:00:00",

            state: {
              short_name: "NS",
            },

            participants: [
              {
                id: 180,
                name: "Kilmarnock",
                image_path: "https://example.com/kilmarnock.png",
                meta: {
                  location: "home",
                },
              },
              {
                id: 314,
                name: "Hearts",
                image_path: "https://example.com/hearts.png",
                meta: {
                  location: "away",
                },
              },
            ],

            scores: [],
          },
        ],
      },
    });

    const response = await request(app).get(
      "/api/matches?date=2026-10-05&league=501",
    );

    expect(response.status).toBe(200);

    expect(response.body[0].status).toBe("NS");

    expect(response.body[0].score).toEqual({
      home: null,
      away: null,
    });
  });
});
