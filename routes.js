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


export default router;
