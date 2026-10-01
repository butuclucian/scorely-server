jest.mock("axios");

const axios = require("axios");
const request = require("supertest");
const app = require("../server");

describe("Match Details API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/matches/:id should format match statistics correctly", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: {
          id: 19722785,
          season_id: 28275,
          starting_at: "2026-09-19 15:00:00",
          result_info: "1-1",
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

          events: [],

          lineups: [],

          statistics: [
            {
              id: 1001,
              participant_id: 180,
              location: "home",
              type: {
                name: "Corners",
                code: "corners",
              },
              data: {
                value: 2,
              },
            },
            {
              id: 1002,
              participant_id: 314,
              location: "away",
              type: {
                name: "Corners",
                code: "corners",
              },
              data: {
                value: 6,
              },
            },
          ],
        },
      },
    });

    const response = await request(app).get(
      "/api/matches/19722785"
    );

    expect(response.status).toBe(200);

    expect(response.body.statistics).toEqual([
      {
        id: 1001,
        participantId: 180,
        location: "home",
        name: "Corners",
        code: "corners",
        value: 2,
      },
      {
        id: 1002,
        participantId: 314,
        location: "away",
        name: "Corners",
        code: "corners",
        value: 6,
      },
    ]);
  });
});