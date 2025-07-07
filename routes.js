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

    const gameNumber = req.body.gameNumber;
    const gamePlayer = req.body.gamePlayer;
    const ones = req.body.ones;
    const twos = req.body.twos;
    const threes = req.body.threes;
    const fours = req.body.fours;
    const fives = req.body.fives;
    const sixes = req.body.sixes;
    const evens = req.body.evens;
    const odds = req.body.odds;    
    const onePair = req.body.onePair;
    const twoPair = req.body.twoPair;
    const threeOfAKind = req.body.threeOfAKind;
    const fourOfAKind = req.body.fourOfAKind;
    const fullHouse = req.body.fullHouse;
    const smallStraight = req.body.smallStraight;
    const largeStraight = req.body.largeStraight;
    const yahtzee = req.body.yahtzee;
    const chance = req.body.chance;
    const upperTotal = req.body.upperTotal;
    const upperBonus = req.body.upperBonus;
    const lowerTotal = req.body.lowerTotal;
    const grandTotal = req.body.grandTotal;

    const query = `CALL public.add_game_results('${gameNumber}', '${gamePlayer}','${ones}', '${twos}', '${threes}', '${fours}', '${fives}', '${sixes}', '${evens}', '${odds}', '${onePair}', '${twoPair}', '${threeOfAKind}', '${fourOfAKind}', '${fullHouse}', '${smallStraight}', '${largeStraight}', '${yahtzee}', '${chance}', '${upperTotal}', '${upperBonus}', '${lowerTotal}', '${grandTotal}');`
 
    try {
        const result = await pool.query(query);
        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});