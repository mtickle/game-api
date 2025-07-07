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




///--- ROAD CONDITIONS
router.post("/postGameResults", async (req, res) => {

    //console.log(req.body);

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

    console.log(query);

    try {
        const result = await pool.query(query);
        res.json(result.rows);
        console.log(res.status)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }

});


export default router;