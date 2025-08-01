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

router.get("/getAllGameResults", async (req, res) => {
    console.log(`Fetching all game results`);

    const query = `
        SELECT 
            game_id,
            game_timestamp,
            winner,
            json_agg(
                json_build_object(
                    'playerIndex', player_index,
                    'score', score
                ) ORDER BY player_index
            ) AS final_scores,
            turn_history
        FROM card_game.game_summary
        GROUP BY game_id, game_timestamp, winner, turn_history
        ORDER BY game_timestamp DESC;
    `;

    try {
        const result = await pool.query(query);
        // Transform the result to match the expected JSON structure
        const formattedResult = result.rows.map(row => ({
            gameId: row.game_id,
            timestamp: row.game_timestamp,
            winner: row.winner,
            finalScores: row.final_scores.map(score => score.score),
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
