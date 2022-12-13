const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
module.exports = app;

//GET PLAYERS
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
  SELECT * FROM player_details;`;
  const array = await db.all(getPlayerQuery);
  let count = 0;
  for (let each of array) {
    let { player_id, player_name } = array[count];
    array[count] = {
      playerId: player_id,
      playerName: player_name,
    };
    count = count + 1;
  }
  response.send(array);
});

//GET PLAYER

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT * FROM player_details where player_id=${playerId};`;
  let playerObject = await db.get(getPlayerQuery);
  let { player_id, player_name } = playerObject;
  playerObject = {
    playerId: player_id,
    playerName: player_name,
  };

  response.send(playerObject);
});

//UPDATE PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
  UPDATE 
   player_details
   SET 
   player_name='${playerName}'
   WHERE player_id=${playerId}`;
  const object = await db.run(updatePlayer);
  response.send("Player Details Updated");
});
//get match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT * FROM match_details WHERE match_id=${matchId};`;
  const array = await db.get(getMatchQuery);
  const finalArray = {
    matchId: array.match_id,
    match: array.match,
    year: array.year,
  };

  response.send(finalArray);
});
//selected player matches
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
  SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id=${playerId}`;
  const array = await db.all(getMatchQuery);
  let count = 0;
  for (let each of array) {
    let { match_id, match, year } = array[count];
    array[count] = {
      matchId: match_id,
      match: match,
      year: year,
    };
    count = count + 1;
  }
  response.send(array);
});
//GET SELECTED PLAYER FROM MATCH

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
  SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId} ;`;
  const array = await db.all(getPlayerQuery);
  let count = 0;
  for (let each of array) {
    let { player_id, player_name } = array[count];
    array[count] = {
      playerId: player_id,
      playerName: player_name,
    };
    count = count + 1;
  }
  response.send(array);
});

//GET SCORES OF PLAYER
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const scoresQuery = `
  SELECT 
  player_id as playerId,
  player_name as playerName,
  sum(score) as totalScore,
  sum(fours) as totalFours,
  sum(sixes) as totalSixes 
  FROM player_match_score 
  NATURAL JOIN player_details 
  GROUP BY player_id
  HAVING player_id=${playerId};`;
  const array = await db.get(scoresQuery);
  response.send(array);
});
