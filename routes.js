//--- Helpers
import dotenv from 'dotenv';
import { Router } from "express";
import fs from 'fs';
import pg from 'pg';
const router = Router();

//--- PostgreSQL configuration
dotenv.config()

const pool = new pg.Pool({
    user: process.env.DATABASE_USERNAME,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs.readFileSync("ca.pem").toString(),
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

router.post("/postBlackjackGames", async (req, res) => {
    const gamesBatch = req.body; // Expects an array of game result objects directly in the body

    // --- Validation ---
    // 1. Check if the body is a non-empty array
    if (!Array.isArray(gamesBatch) || gamesBatch.length === 0) {
        console.log("Invalid input: Expected a non-empty array of game results.");
        return res.status(400).json({ message: "Request body must be a non-empty array of game results." });
    }

    // 2. Perform a structural check on the first game object to ensure it has the required fields.
    // A full production implementation might loop through every object for complete validation.
    const sampleGame = gamesBatch[0];
    const requiredKeys = [
        'gameId', 'timestamp', 'result', 'betAmount', 'netWinnings',
        'playerWallet_start', 'playerWallet_end', 'playerHands', 'dealerHand'
    ];
    const missingKey = requiredKeys.find(key => !(key in sampleGame));

    if (missingKey) {
        console.log(`Invalid input: Game result objects are missing the required field: "${missingKey}".`);
        return res.status(400).json({ message: `Each game result object must include all required fields. Missing: ${missingKey}` });
    }

    console.log(`Received batch of ${gamesBatch.length} Blackjack games to save.`);

    // --- Database Query ---
    // This query calls a PostgreSQL function that takes the entire JSON array
    // and processes the batch insert within a single transaction.
    const query = `
        SELECT blackjack.save_game_batch($1::jsonb);
    `;

    const values = [
        JSON.stringify(gamesBatch)
    ];

    try {
        await pool.query(query, values);
        res.status(200).json({ message: `Successfully saved batch of ${gamesBatch.length} Blackjack games.` });
    } catch (error) {
        console.error("Error saving Blackjack game batch:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "An error occurred while saving the game data.", error: error.message });
        }
    }
});

router.post("/postTicTacToeGames", async (req, res) => {
    const gamesBatch = req.body; // Expect an array of game result objects

    // --- Validation ---
    // 1. Check if the body is a non-empty array
    if (!Array.isArray(gamesBatch) || gamesBatch.length === 0) {
        console.log("Invalid input: Expected a non-empty array of game results.");
        return res.status(400).json({ message: "Request body must be a non-empty array of game results." });
    }

    // 2. Check the structure of the first object in the array for validity.
    // (A full implementation would loop and check every object)
    const sampleGame = gamesBatch[0];
    if (!sampleGame || typeof sampleGame !== 'object' || !sampleGame.id || !sampleGame.outcome || typeof sampleGame.totalMoves !== 'number' || !Array.isArray(sampleGame.finalBoardState) || !Array.isArray(sampleGame.moves) || !sampleGame.finishedAt) {
        console.log("Invalid input: Game result objects are missing required fields.");
        return res.status(400).json({ message: "Each game result object must include id, outcome, totalMoves, finalBoardState, moves, and finishedAt." });
    }

    console.log(`Received batch of ${gamesBatch.length} Tic-Tac-Toe games to save.`);

    // --- Database Query ---
    // This query assumes you have a PostgreSQL function that can take a JSON array
    // of game data and process it, likely inserting each object into a table.
    // This is more efficient than sending one query per game.
    const query = `
        SELECT tic_tac_toe.save_game_batch($1::jsonb);
    `;

    const values = [
        JSON.stringify(gamesBatch)
    ];

    try {
        await pool.query(query, values);
        res.status(200).json({ message: `Successfully saved batch of ${gamesBatch.length} games.` });
    } catch (error) {
        console.error("Error saving Tic-Tac-Toe game batch:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});


router.get("/getTicTacToeGames", async (req, res) => {
    // This query selects all fields from the games table.
    // It orders them by the finished_at timestamp in descending order (most recent first)
    // and limits the result to the latest 100 games to avoid sending huge amounts of data.
    const query = `
        SELECT 
            id,
            outcome,
            total_moves,
            final_board_state,
            moves,
            finished_at
        FROM 
            tic_tac_toe.games
        ORDER BY 
            finished_at DESC
        LIMIT 100;
    `;

    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving Tic-Tac-Toe games:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});



///--- GAME RESULTS ENDPOINT
router.post("/postGameResults", async (req, res) => {
    const {
        gameNumber,
        playerName,
        ones,
        twos,
        threes,
        fours,
        fives,
        sixes,
        evens,
        odds,
        onepair,
        twopair,
        threeofakind,
        fourofakind,
        fullhouse,
        smallstraight,
        largestraight,
        yahtzee,
        chance,
        upperSubtotal,
        bonus,
        lowerTotal,
        grandTotal
    } = req.body.scores;

    const query = `
        CALL public.add_game_result(
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23
        );
    `;



    const values = [
        gameNumber,
        playerName,
        ones,
        twos,
        threes,
        fours,
        fives,
        sixes,
        evens,
        odds,
        onepair,
        twopair,
        threeofakind,
        fourofakind,
        fullhouse,
        smallstraight,
        largestraight,
        yahtzee,
        chance,
        upperSubtotal,
        bonus,
        lowerTotal,
        grandTotal
    ];

    //console.log(`Executing query for game ${gameNumber}, ${query} with values: ${values}`);

    try {
        await pool.query(query, values);
        res.status(200).json({ message: "Game result saved successfully." });
    } catch (error) {
        console.error("Error saving game result:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

router.post("/postGameTurns", async (req, res) => {
    const turns = req.body;

    if (!Array.isArray(turns)) {
        console.log("Invalid input: Expected an array of turns");
        return res.status(400).json({ message: "Expected an array of turn objects" });
    }

    try {
        for (const turn of turns) {
            const {
                gameNumber,
                playerName,
                turnNumber,
                rollCount,
                category,
                score,
                bonus,
                dice
            } = turn;

            // Use parameter placeholders ($1, $2, etc.)
            const query = `
                CALL public.add_turn_result($1, $2, $3, $4, $5, $6, $7, $8);
            `;

            // Provide values in exact order
            const values = [
                gameNumber,
                playerName,
                turnNumber,
                rollCount,
                category,
                score,
                bonus,
                dice
            ];

            //console.log(`Executing query for game ${gameNumber}, turn ${turnNumber}: ${query} with values: ${values}`);

            await pool.query(query, values);
        }

        res.status(200).json({ message: "All turns saved successfully." });

    } catch (error) {
        console.error("Error saving turn logs:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

router.get("/getAllGameResults/:_gameplayer", async (req, res) => {

    console.log(`Fetching game results for player: ${req.params._gameplayer}`);

    const query = `
        SELECT * FROM public.gameresults
        where gameplayer = $1
        ORDER BY gamenumber DESC;
    `;
    const values = [req.params._gameplayer];

    try {
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching game results:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

router.get('/getAllTurnResults/:gameplayer', async (req, res) => {

    const query = `
SELECT gamenumber, gameplayer, turnnumber, rollcount, category, score, COALESCE(bonus, 0) AS bonus, dice
FROM public.turnresults
WHERE gameplayer = $1
ORDER BY gamenumber DESC, turnnumber ASC;
    `;

    const values = [req.params.gameplayer];

    try {
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`Error fetching TURN results for ${req.params.gameplayer}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

router.get('/getGameAverages/', async (req, res) => {
    const query = `SELECT * from public.get_game_averages();`;

    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`Error fetching game averages:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});


router.get('/getTurnsByGame/:gameplayer/:gamenumber', async (req, res) => {

    const query = `
    SELECT gamenumber, gameplayer, turnnumber, rollcount, category, score, COALESCE(bonus, 0) AS bonus, dice
    FROM public.turnresults
   WHERE gameplayer = $1 AND gamenumber = $2::BIGINT
    ORDER BY turnnumber ASC;
      `;

    console.log('Fetching turns for:', {
        player: req.params.gameplayer,
        gamenumber: req.params.gamenumber,
        gamenumberType: typeof req.params.gamenumber
    });

    const values = [req.params.gameplayer, req.params.gamenumber];

    console.log(query)

    try {
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`Error fetching TURN results for ${req.params.gameplayer}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

//--- STAR SYSTEM ENDPOINT
router.post("/postStarSystem", async (req, res) => {
    const starSystem = req.body; // Expect the entire star system JSON as the body

    // Validate that the request body is a valid object
    if (!starSystem || typeof starSystem !== 'object') {
        console.log("Invalid input: Expected a star system JSON object");
        return res.status(400).json({ message: "Expected a star system JSON object" });
    }

    const query = `
        SELECT star_system.upsert_star_system($1::jsonb);
    `;

    const values = [starSystem];

    // console.log(`Executing query for star system ${starSystem.starId}: ${query} with values: ${JSON.stringify(values)}`);

    try {
        await pool.query(query, values);
        res.status(200).json({ message: "Star system saved successfully." });
    } catch (error) {
        console.error("Error saving star system:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

// CARD GAME ENDPOINT
router.post("/postCardGame", async (req, res) => {
    const gameData = req.body; // Expect the entire card game JSON as the body

    // Validate that the request body is a valid object with required fields
    if (!gameData || typeof gameData !== 'object' || !gameData.gameId || !gameData.timestamp || !gameData.winner || !Array.isArray(gameData.finalScores) || !Array.isArray(gameData.turnHistory)) {
        console.log("Invalid input: Expected a card game JSON object with gameId, timestamp, winner, finalScores, and turnHistory");
        return res.status(400).json({ message: "Expected a card game JSON object with gameId, timestamp, winner, finalScores, and turnHistory" });
    }

    const query = `
        SELECT card_game.save_game($1::uuid, $2::bigint, $3::varchar, $4::integer[], $5::json);
    `;

    const values = [
        gameData.gameId,
        gameData.timestamp,
        gameData.winner,
        gameData.finalScores,
        JSON.stringify(gameData.turnHistory)
    ];

    try {
        await pool.query(query, values);
        res.status(200).json({ message: "Card game saved successfully." });
    } catch (error) {
        console.error("Error saving card game:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

// In your routes.js file

router.get("/getAllCardGames", async (req, res) => {
    console.log(`Fetching all game results`);

    // UPDATED QUERY: Replaced MAX() with a more explicit way to select the JSON data
    const query = `
        SELECT 
            g.game_id,
            g.game_timestamp,
            g.winner,
            json_agg(
                json_build_object(
                    'playerIndex', g.player_index,
                    'score', g.score
                ) ORDER BY g.player_index
            ) AS final_scores,
            (array_agg(g.turn_history))[1] AS turn_history
        FROM card_game.game_summary g
        GROUP BY g.game_id, g.game_timestamp, g.winner
        ORDER BY g.game_timestamp DESC;
    `;

    try {
        const result = await pool.query(query);
        // Transform the result to match the expected JSON structure
        const formattedResult = result.rows.map(row => ({
            gameId: row.game_id,
            timestamp: row.game_timestamp,
            winner: row.winner,
            finalScores: row.final_scores.map(scoreObj => scoreObj.score),
            turnHistory: row.turn_history
        }));
        res.status(200).json(formattedResult);
    } catch (error) {
        console.error("Error fetching game results:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

export default router;
