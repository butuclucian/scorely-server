jest.mock("axios");

const axios = require("axios");
const request = require("supertest");
const app = require("../server");

describe("Standings API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/standings should use the correct season for Scottish Premiership", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            position: 1,
            points: 20,
            participant: {
              id: 53,
              name: "Celtic",
            },
            details: [],
          },
        ],
      },
    });

    const response = await request(app).get(
      "/api/standings?league=501"
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual([
      {
        id: 1,
        position: 1,
        points: 20,
        participant: {
          id: 53,
          name: "Celtic",
        },
        details: [],
      },
    ]);

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.sportmonks.com/v3/football/standings/seasons/28275",
      expect.objectContaining({
        params: expect.objectContaining({
          include: "participant;details.type",
        }),
      })
    );
  });

  test("GET /api/standings should reject unsupported leagues", async () => {
    const response = await request(app).get(
      "/api/standings?league=999"
    );

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Unsupported league",
    });

    expect(axios.get).not.toHaveBeenCalled();
  });
});