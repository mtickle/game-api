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
// router.post("/postGameResults", async (req, res) => {

//     const gameNumber = req.body.scores.gameNumber;
//     const gamePlayer = req.body.scores.playerName;
//     const ones = req.body.scores.ones;
//     const twos = req.body.scores.twos;
//     const threes = req.body.scores.threes;
//     const fours = req.body.scores.fours;
//     const fives = req.body.scores.fives;
//     const sixes = req.body.scores.sixes;
//     const evens = req.body.scores.evens;
//     const odds = req.body.scores.odds;
//     const onePair = req.body.scores.onePair;
//     const twoPair = req.body.scores.twoPair;
//     const threeOfAKind = req.body.scores.threeKind;
//     const fourOfAKind = req.body.scores.fourKind;
//     const fullHouse = req.body.scores.fullHouse;
//     const smallStraight = req.body.scores.smallStraight;
//     const largeStraight = req.body.scores.largeStraight;
//     const yahtzee = req.body.scores.yahtzee;
//     const chance = req.body.scores.chance;
//     const upperTotal = req.body.scores.upperSubtotal;
//     const upperBonus = req.body.scores.bonus;
//     const lowerTotal = req.body.scores.lowerTotal;
//     const grandTotal = req.body.scores.grandTotal;

//     const query = `CALL public.add_game_result('${gameNumber}', '${gamePlayer}','${ones}', '${twos}', '${threes}', '${fours}', '${fives}', '${sixes}', '${evens}', '${odds}', '${onePair}', '${twoPair}', '${threeOfAKind}', '${fourOfAKind}', '${fullHouse}', '${smallStraight}', '${largeStraight}', '${yahtzee}', '${chance}', '${upperTotal}', '${upperBonus}', '${lowerTotal}', '${grandTotal}');`

//     try {
//         const result = await pool.query(query);
//         res.json(result.rows);
//         console.log(res.status)

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }

// });

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
        onePair,
        twoPair,
        threeKind,
        fourKind,
        fullHouse,
        smallStraight,
        largeStraight,
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
        onePair,
        twoPair,
        threeKind,
        fourKind,
        fullHouse,
        smallStraight,
        largeStraight,
        yahtzee,
        chance,
        upperSubtotal,
        bonus,
        lowerTotal,
        grandTotal
    ];

    // console.log(`Executing query for game ${gameNumber}, ${query} with values: ${values}`);

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
                turnNumber,
                rollCount,
                category,
                score,
                bonus
            } = turn;

            // Use parameter placeholders ($1, $2, etc.)
            const query = `
                CALL public.add_turn_result($1, $2, $3, $4, $5, $6);
            `;

            // Provide values in exact order
            const values = [
                gameNumber,
                turnNumber,
                rollCount,
                category,
                score,
                bonus
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


export default router;