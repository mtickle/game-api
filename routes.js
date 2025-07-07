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
//--- This endpoint is used to post game results to the database
router.post("/postGameResults", async (req, res) => {

    const gameNumber = req.body.scores.gameNumber;
    const gamePlayer = req.body.scores.playerName;
    const ones = req.body.scores.ones;
    const twos = req.body.scores.twos;
    const threes = req.body.scores.threes;
    const fours = req.body.scores.fours;
    const fives = req.body.scores.fives;
    const sixes = req.body.scores.sixes;
    const evens = req.body.scores.evens;
    const odds = req.body.scores.odds;
    const onePair = req.body.scores.onePair;
    const twoPair = req.body.scores.twoPair;
    const threeOfAKind = req.body.scores.threeKind;
    const fourOfAKind = req.body.scores.fourKind;
    const fullHouse = req.body.scores.fullHouse;
    const smallStraight = req.body.scores.smallStraight;
    const largeStraight = req.body.scores.largeStraight;
    const yahtzee = req.body.scores.yahtzee;
    const chance = req.body.scores.chance;
    const upperTotal = req.body.scores.upperSubtotal;
    const upperBonus = req.body.scores.bonus;
    const lowerTotal = req.body.scores.lowerTotal;
    const grandTotal = req.body.scores.grandTotal;

    const query = `CALL public.add_game_result('${gameNumber}', '${gamePlayer}','${ones}', '${twos}', '${threes}', '${fours}', '${fives}', '${sixes}', '${evens}', '${odds}', '${onePair}', '${twoPair}', '${threeOfAKind}', '${fourOfAKind}', '${fullHouse}', '${smallStraight}', '${largeStraight}', '${yahtzee}', '${chance}', '${upperTotal}', '${upperBonus}', '${lowerTotal}', '${grandTotal}');`

    try {
        const result = await pool.query(query);
        res.json(result.rows);
        console.log(res.status)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }

});

router.post("/postGameTurns", async (req, res) => {
    const turns = req.body; // Expecting an array of turn objects

    // Validate that the request body is an array
    if (!Array.isArray(turns)) {
        console.log("Invalid input: Expected an array of turns");
        return res.status(400).json({ message: "Expected an array of turn objects" });
    }

    const results = [];
    const client = await pool.connect();

    try {
        await client.query("BEGIN"); // Start transaction

        for (const turn of turns) {
            const { gameNumber, turnNumber, rollCount, category, score, bonus } = turn;

            // Validate required fields
            if (!gameNumber || !turnNumber || !rollCount || !category || score === undefined || bonus === undefined) {
                console.log(`Invalid turn data: ${JSON.stringify(turn)}`);
                throw new Error("Missing required fields in turn data");
            }

            const query = `CALL public.add_turn_result($1, $2, $3, $4, $5, $6);`;
            const result = await client.query(query, [
                gameNumber,
                turnNumber,
                rollCount,
                category,
                score,
                bonus
            ]);
            results.push(result.rows);
        }

        await client.query("COMMIT"); // Commit transaction
        res.json(results);
        console.log(res.statusCode);

    } catch (error) {
        await client.query("ROLLBACK"); // Rollback on error
        console.log(error);
        res.status(500).json({ message: error.message });
    } finally {
        client.release(); // Release client back to pool
    }
});

// router.post("/postGameTurns", async (req, res) => {
//     const turnLog = req.body.turns;

//     if (!Array.isArray(turnLog)) {
//         return res.status(400).json({ message: "Invalid turn log format" });
//     }

//     try {
//         for (const turn of turnLog) {
//             const {
//                 gameNumber,
//                 turnNumber,
//                 dice,
//                 heldDice,
//                 rollCount,
//                 category,
//                 score,
//                 bonus,
//                 suggestedScores,
//                 timestamp
//             } = turn;

//             const query = `
//                 INSERT INTO public.turn_logs (
//                     game_number,
//                     turn_number,
//                     dice,
//                     held_dice,
//                     roll_count,
//                     category,
//                     score,
//                     bonus,
//                     suggested_scores,
//                     timestamp
//                 ) VALUES (
//                     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
//                 );
//             `;

//             await pool.query(query, [
//                 gameNumber,
//                 turnNumber,
//                 JSON.stringify(dice),
//                 JSON.stringify(heldDice),
//                 rollCount,
//                 category,
//                 score,
//                 bonus,
//                 JSON.stringify(suggestedScores),
//                 timestamp
//             ]);
//         }

//         res.status(200).json({ message: "All turns logged successfully." });
//     } catch (error) {
//         console.error("Error saving turn log:", error);
//         res.status(500).json({ message: "Error saving turn logs." });
//     }
// });


export default router;