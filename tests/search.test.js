jest.mock("axios");

const axios = require("axios");
const request = require("supertest");
const app = require("../server");

describe("Search API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/search should return formatted teams and players", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 53,
              name: "Celtic",
              short_code: "CEL",
              image_path: "https://example.com/celtic.png",
              country_id: 1161,
              placeholder: false,
              type: "domestic",
            },

            // Echipa aceasta trebuie filtrată
            {
              id: 999,
              name: "Placeholder Team",
              short_code: null,
              image_path: null,
              country_id: 1161,
              placeholder: true,
              type: "domestic",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 37289467,
              display_name: "Nicky Clescenco",
              name: "Nicky Clescenco",
              image_path: "https://example.com/nicky.png",
              position_id: 27,
              nationality_id: 123,
              date_of_birth: "2001-07-23",
            },
          ],
        },
      });

    const response = await request(app).get(
      "/api/search?q=Celtic"
    );

    expect(response.status).toBe(200);

    expect(response.body.teams).toEqual([
      {
        id: 53,
        name: "Celtic",
        shortCode: "CEL",
        logo: "https://example.com/celtic.png",
        countryId: 1161,
      },
    ]);

    expect(response.body.players).toEqual([
      {
        id: 37289467,
        name: "Nicky Clescenco",
        image: "https://example.com/nicky.png",
        positionId: 27,
        nationalityId: 123,
        dateOfBirth: "2001-07-23",
      },
    ]);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("GET /api/search should handle Sportmonks errors", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    axios.get.mockRejectedValue({
      response: {
        status: 500,
        data: {
          message: "Search service unavailable",
        },
      },
    });

    const response = await request(app).get(
      "/api/search?q=Celtic"
    );

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Search failed",
      error: {
        message: "Search service unavailable",
      },
    });

    consoleErrorSpy.mockRestore();
  });
});