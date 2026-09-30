const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Scorely API is running ⚽",
  });
});

const transfersCache = new Map();

const TRANSFERS_CACHE_TIME =
  30 * 60 * 1000;

const PORT = process.env.PORT || 3000;

app.get("/api/matches", async (req, res) => {
  try {
    const date =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    const leagueId =
      req.query.league || "501";

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/fixtures/date/${date}`,
      {
        params: {
          api_token:
            process.env.SPORTMONKS_API_TOKEN,

          include:
            "participants;scores;state",

          filters: `fixtureLeagues:${leagueId}`,
        },
      }
    );

    const matches = response.data.data.map(
      (fixture) => {
        const home = fixture.participants?.find(
          (team) =>
            team.meta?.location === "home"
        );

        const away = fixture.participants?.find(
          (team) =>
            team.meta?.location === "away"
        );

        const homeScore = fixture.scores?.find(
          (score) =>
            score.description === "CURRENT" &&
            score.score?.participant === "home"
        );

        const awayScore = fixture.scores?.find(
          (score) =>
            score.description === "CURRENT" &&
            score.score?.participant === "away"
        );

        return {
          id: fixture.id,
          date: fixture.starting_at,

          status:
            fixture.state?.short_name || "NS",

          score: {
            home:
              homeScore?.score?.goals ?? null,

            away:
              awayScore?.score?.goals ?? null,
          },

          homeTeam: {
            id: home?.id,
            name: home?.name,
            logo: home?.image_path,
          },

          awayTeam: {
            id: away?.id,
            name: away?.name,
            logo: away?.image_path,
          },
        };
      }
    );

    res.json(matches);
  } catch (error) {
    console.error(
      "Sportmonks error:",
      error.response?.data ||
        error.message
    );

    res
      .status(error.response?.status || 500)
      .json({
        message: "Failed to fetch matches",
        error:
          error.response?.data ||
          error.message,
      });
  }
});

app.get("/api/matches/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/fixtures/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "participants;scores;state;events.type;lineups;statistics.type",
        },
      }
    );

    const fixture = response.data.data;

    const home = fixture.participants?.find(
      (team) => team.meta?.location === "home"
    );

    const away = fixture.participants?.find(
      (team) => team.meta?.location === "away"
    );

    const homeScore = fixture.scores?.find(
      (score) =>
        score.description === "CURRENT" &&
        score.score?.participant === "home"
    );

    const awayScore = fixture.scores?.find(
      (score) =>
        score.description === "CURRENT" &&
        score.score?.participant === "away"
    );

    const events = (fixture.events || []).map((event) => ({
    id: event.id,
    minute: event.minute,
    extraMinute: event.extra_minute,
    type: event.type?.name || event.type,
    participantId: event.participant_id,
    playerName: event.player_name,
    relatedPlayerName: event.related_player_name,
    result: event.result,
    info: event.info,
    }));

    const lineups = fixture.lineups || [];
    const statistics = (fixture.statistics || []).map((stat) => {
      return {
        id: stat.id,
        participantId: stat.participant_id,
        location: stat.location,
        name: stat.type?.name || "",
        code: stat.type?.code || "",
        value: Number(stat.data?.value ?? 0),
      };
    });

    res.json({
      id: fixture.id,
      seasonId: fixture.season_id,
      date: fixture.starting_at,
      status: fixture.state?.short_name || "NS",
      resultInfo: fixture.result_info,

      score: {
        home: homeScore?.score?.goals ?? null,
        away: awayScore?.score?.goals ?? null,
      },

      homeTeam: {
        id: home?.id,
        name: home?.name,
        logo: home?.image_path,
      },

      awayTeam: {
        id: away?.id,
        name: away?.name,
        logo: away?.image_path,
      },
      events,
      lineups,
      statistics,
      
    });
  } catch (error) {
    console.error(
      "Match details error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch match",
    });
  }
});

app.get("/api/standings", async (req, res) => {
  try {
    const leagueId = Number(req.query.league || 501);

    const seasonIds = {
      501: 28275, // Scottish Premiership 2026/2027
      271: 27897, // Danish Superliga 2026/2027
    };

    const seasonId = seasonIds[leagueId];

    if (!seasonId) {
      return res.status(400).json({
        message: "Unsupported league",
      });
    }

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/standings/seasons/${seasonId}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "participant;details.type",
        },
      }
    );

    res.json(response.data.data);
  } catch (error) {
    console.error(
      "Standings error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch standings",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/teams/:id/fixtures", async (req, res) => {
  try {
    const { id } = req.params;

    // 40 de zile în trecut
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 40);

    // 60 de zile în viitor
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);

    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/fixtures/between/${formatDate(
        startDate
      )}/${formatDate(endDate)}/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "participants;scores;state",
          order: "asc",
          per_page: 50,
        },
      }
    );

    const fixtures = response.data.data.map((fixture) => {
      const home = fixture.participants?.find(
        (team) => team.meta?.location === "home"
      );

      const away = fixture.participants?.find(
        (team) => team.meta?.location === "away"
      );

      const homeScore = fixture.scores?.find(
        (score) =>
          score.description === "CURRENT" &&
          score.score?.participant === "home"
      );

      const awayScore = fixture.scores?.find(
        (score) =>
          score.description === "CURRENT" &&
          score.score?.participant === "away"
      );

      return {
        id: fixture.id,
        date: fixture.starting_at,

        status: fixture.state?.short_name || "NS",

        score: {
          home: homeScore?.score?.goals ?? null,
          away: awayScore?.score?.goals ?? null,
        },

        homeTeam: {
          id: home?.id,
          name: home?.name,
          logo: home?.image_path,
        },

        awayTeam: {
          id: away?.id,
          name: away?.name,
          logo: away?.image_path,
        },
      };
    });

    res.json(fixtures);
  } catch (error) {
    console.error(
      "Team fixtures error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch team fixtures",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/teams/:id/squad", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/squads/teams/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "player;position",
        },
      }
    );

    const squad = response.data.data.map((item) => ({
      id: item.id,

      jerseyNumber: item.jersey_number,

      captain: item.captain,

      position: {
        id: item.position?.id,
        name: item.position?.name,
        code: item.position?.code,
      },

      player: {
        id: item.player?.id,
        name: item.player?.display_name || item.player?.name,
        image: item.player?.image_path,
      },

      contract: {
        start: item.start,
        end: item.end,
      },
    }));

    res.json(squad);
  } catch (error) {
    console.error(
      "Squad error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch squad",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/players/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/players/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "position;nationality",
        },
      }
    );

    const player = response.data.data;

    res.json({
      id: player.id,
      name: player.display_name || player.name,
      fullName: player.name,
      image: player.image_path,

      position: {
        id: player.position?.id,
        name: player.position?.name,
        code: player.position?.code,
      },

      nationality: {
        id: player.nationality?.id,
        name: player.nationality?.name,
        flag: player.nationality?.image_path,
        fifaCode: player.nationality?.fifa_name,
      },

      dateOfBirth: player.date_of_birth,
      height: player.height,
      weight: player.weight,
    });
  } catch (error) {
    console.error(
      "Player details error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch player details",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/players/:id/career", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/players/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include:
            "teams.team;transfers.fromTeam;transfers.toTeam;transfers.type",
        },
      }
    );

    const player = response.data.data;

    // Current domestic clubs from squad/team registrations
    const currentClubs = (player.teams || [])
      .filter(
        (item) =>
          item.team &&
          item.team.type === "domestic" &&
          !item.team.placeholder
      )
      .map((item) => ({
        teamId: item.team.id,
        teamName: item.team.name,
        teamLogo: item.team.image_path,
        teamCode: item.team.short_code,

        start: item.start,
        end: item.end,

        jerseyNumber: item.jersey_number,
        captain: item.captain,

        current: true,
      }));

    // Completed transfers
    const transfers = (player.transfers || [])
      .filter(
        (transfer) =>
          transfer.completed &&
          transfer.toteam &&
          !transfer.toteam.placeholder &&
          transfer.toteam.type === "domestic"
      )
      .map((transfer) => ({
        id: transfer.id,
        date: transfer.date,

        fromTeam:
          transfer.fromteam &&
          !transfer.fromteam.placeholder
            ? {
                id: transfer.fromteam.id,
                name: transfer.fromteam.name,
                logo: transfer.fromteam.image_path,
                code: transfer.fromteam.short_code,
              }
            : null,

        toTeam: {
          id: transfer.toteam.id,
          name: transfer.toteam.name,
          logo: transfer.toteam.image_path,
          code: transfer.toteam.short_code,
        },

        amount: transfer.amount,
        type: transfer.type?.name || "Transfer",
      }))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );

    res.json({
      currentClubs,
      transfers,
    });
  } catch (error) {
    console.error(
      "Player career error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch player career",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/players/:id/statistics", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.sportmonks.com/v3/football/players/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
          include: "statistics.details.type;statistics.season",
        },
      }
    );

    const player = response.data.data;

    const getStat = (details, code) => {
      const stat = details?.find(
        (detail) => detail.type?.code === code
      );

      return Number(stat?.value?.total ?? 0);
    };

    const seasons = (player.statistics || [])
      .filter(
        (statistic) =>
          statistic.has_values &&
          statistic.season
      )
      .map((statistic) => ({
        seasonId: statistic.season.id,
        seasonName: statistic.season.name,
        isCurrent: statistic.season.is_current,

        teamId: statistic.team_id,
        jerseyNumber: statistic.jersey_number,

        statistics: {
          appearances: getStat(
            statistic.details,
            "appearances"
          ),

          starts: getStat(
            statistic.details,
            "lineups"
          ),

          minutes: getStat(
            statistic.details,
            "minutes-played"
          ),

          goals: getStat(
            statistic.details,
            "goals"
          ),

          assists: getStat(
            statistic.details,
            "assists"
          ),

          yellowCards: getStat(
            statistic.details,
            "yellowcards"
          ),

          redCards: getStat(
            statistic.details,
            "redcards"
          ),
        },
      }))
      .sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;

        return b.seasonId - a.seasonId;
      });

    res.json({
      playerId: player.id,
      playerName: player.display_name,
      seasons,
    });
  } catch (error) {
    console.error(
      "Player statistics error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch player statistics",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/teams/:id/transfers", async (req, res) => {
  try {
    const teamId = Number(req.params.id);

    const cached = transfersCache.get(teamId);

    if (
      cached &&
      Date.now() - cached.timestamp <
        TRANSFERS_CACHE_TIME
    ) {
      return res.json(cached.data);
    }

    const foundTransfers = [];

    let page = 1;
    let hasMore = true;

    const MAX_PAGES = 20;

    while (hasMore && page <= MAX_PAGES) {
      const response = await axios.get(
        "https://api.sportmonks.com/v3/football/transfers",
        {
          params: {
            api_token:
              process.env.SPORTMONKS_API_TOKEN,
            include:
              "player;fromTeam;toTeam;type",
            order: "desc",
            per_page: 50,
            page,
          },
        }
      );

      const transfers =
        response.data.data || [];

      foundTransfers.push(
        ...transfers.filter(
          (transfer) =>
            transfer.from_team_id === teamId ||
            transfer.to_team_id === teamId
        )
      );

      hasMore =
        response.data.pagination?.has_more ===
        true;

      page++;
    }

    const transfers = foundTransfers
      .map((transfer) => {
        const direction =
          transfer.to_team_id === teamId
            ? "IN"
            : "OUT";

        const otherTeam =
          direction === "IN"
            ? transfer.fromteam
            : transfer.toteam;

        return {
          id: transfer.id,

          direction,

          date: transfer.date,

          player: transfer.player
            ? {
                id: transfer.player.id,

                name:
                  transfer.player.display_name ||
                  transfer.player.name,

                image:
                  transfer.player.image_path,
              }
            : null,

          otherTeam:
            otherTeam &&
            !otherTeam.placeholder
              ? {
                  id: otherTeam.id,
                  name: otherTeam.name,
                  logo: otherTeam.image_path,
                  code: otherTeam.short_code,
                }
              : null,

          amount: transfer.amount,

          type:
            transfer.type?.name ||
            "Transfer",

          completed: transfer.completed,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );

    const result = {
      teamId,
      transfers,
    };

    transfersCache.set(teamId, {
      timestamp: Date.now(),
      data: result,
    });

    res.json(result);
  } catch (error) {
    console.error(
      "Team transfers error:",
      error.response?.data ||
        error.message
    );

    res.status(
      error.response?.status || 500
    ).json({
      message:
        "Failed to fetch team transfers",

      error:
        error.response?.data ||
        error.message,
    });
  }
});

app.get("/api/teams/:id/info", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Team
    const teamResponse = await axios.get(
      `https://api.sportmonks.com/v3/football/teams/${id}`,
      {
        params: {
          api_token: process.env.SPORTMONKS_API_TOKEN,
        },
      }
    );

    const team = teamResponse.data.data;

    // 2. Venue + Country
    const [venueResponse, countryResponse] =
      await Promise.all([
        team.venue_id
          ? axios.get(
              `https://api.sportmonks.com/v3/football/venues/${team.venue_id}`,
              {
                params: {
                  api_token:
                    process.env.SPORTMONKS_API_TOKEN,
                },
              }
            )
          : Promise.resolve({ data: { data: null } }),

        team.country_id
          ? axios.get(
              `https://api.sportmonks.com/v3/core/countries/${team.country_id}`,
              {
                params: {
                  api_token:
                    process.env.SPORTMONKS_API_TOKEN,
                },
              }
            )
          : Promise.resolve({ data: { data: null } }),
      ]);

    const venue = venueResponse.data.data;
    const country = countryResponse.data.data;

    res.json({
      id: team.id,
      name: team.name,
      shortCode: team.short_code,
      logo: team.image_path,
      founded: team.founded,
      gender: team.gender,

      country: country
        ? {
            id: country.id,
            name: country.name,
            fifaCode: country.fifa_name,
            flag: country.image_path,
          }
        : null,

      venue: venue
        ? {
            id: venue.id,
            name: venue.name,
            image: venue.image_path,
            city: venue.city_name,
            address: venue.address,
            capacity: venue.capacity,
            surface: venue.surface,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Team info error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      message: "Failed to fetch team info",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
      return res.json({
        teams: [],
        players: [],
      });
    }

    const [teamsResponse, playersResponse] =
      await Promise.all([
        axios.get(
          `https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(
            query
          )}`,
          {
            params: {
              api_token:
                process.env.SPORTMONKS_API_TOKEN,
            },
          }
        ),

        axios.get(
          `https://api.sportmonks.com/v3/football/players/search/${encodeURIComponent(
            query
          )}`,
          {
            params: {
              api_token:
                process.env.SPORTMONKS_API_TOKEN,
            },
          }
        ),
      ]);

    const teams = (teamsResponse.data.data || [])
      .filter(
        (team) =>
          !team.placeholder &&
          team.type === "domestic"
      )
      .map((team) => ({
        id: team.id,
        name: team.name,
        shortCode: team.short_code,
        logo: team.image_path,
        countryId: team.country_id,
      }));

    const players = (
      playersResponse.data.data || []
    ).map((player) => ({
      id: player.id,

      name:
        player.display_name ||
        player.name,

      image: player.image_path,

      positionId: player.position_id,

      nationalityId:
        player.nationality_id,

      dateOfBirth:
        player.date_of_birth,
    }));

    res.json({
      teams,
      players,
    });
  } catch (error) {
    console.error(
      "Search error:",
      error.response?.data ||
        error.message
    );

    res
      .status(error.response?.status || 500)
      .json({
        message: "Search failed",
        error:
          error.response?.data ||
          error.message,
      });
  }
});


app.listen(PORT, () => {
  console.log(`Scorely API running on port ${PORT}`);
});