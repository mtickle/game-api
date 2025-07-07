-- DROP TABLE IF EXISTS public."gameResults";

CREATE TABLE IF NOT EXISTS public.gameResults
(
    gameNumber bigint,
    gamePlayer character varying COLLATE pg_catalog.default,
	ones bigint,
    twos bigint,
    threes bigint,
    fours bigint,
    fives bigint,
    sixes bigint,
    evens bigint,
    odds bigint,
    onePair bigint,
    twoPair bigint,
    threeOfAKind bigint,
    fourOfAKind bigint,
    fullHouse bigint,
    smallStraight bigint,
    largeStraight bigint,
    yahtzee bigint,
    chance bigint,
    upperTotal bigint,
    upperBonus bigint,
    lowerTotal bigint,
    grandTotal bigint
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."gameResults"
    OWNER to avnadmin;



ALTER TABLE IF EXISTS public."gameResults"
    ADD CONSTRAINT const_gameResults UNIQUE (gamenumber, gamePlayer);






CREATE OR REPLACE PROCEDURE public.addGameResult(
IN p_gameNumber bigint,
IN p_gamePlayer character varying,
IN p_ones bigint,
IN p_twos bigint,
IN p_threes bigint,
IN p_fours bigint,
IN p_fives bigint,
IN p_sixes bigint,
IN p_evens bigint,
IN p_odds bigint,
IN p_onePair bigint,
IN p_twoPair bigint,
IN p_threeOfAKind bigint,
IN p_fourOfAKind bigint,
IN p_fullHouse bigint,
IN p_smallStraight bigint,
IN p_largeStraight bigint,
IN p_yahtzee bigint,
IN p_chance bigint,
IN p_upperTotal bigint,
IN p_upperBonus bigint,
IN p_lowerTotal bigint,
IN p_grandTotal bigint
)
LANGUAGE 'plpgsql'
AS $BODY$
 BEGIN
INSERT INTO
public.gameResults(
    gameNumber, gamePlayer, ones, twos, threes, fours,
    fives, sixes, evens, odds, onePair, twoPair,
    threeOfAKind, fourOfAKind, fullHouse, smallStraight,
    largeStraight, yahtzee, chance, upperTotal, upperBonus,
    lowerTotal, grandTotal)
VALUES
    (
    p_gameNumber,
    p_gamePlayer,
    p_ones,
    p_twos,
    p_threes,
    p_fours,
    p_fives,
    p_sixes,
    p_evens,
    p_odds,
    p_onePair,
    p_twoPair,
    p_threeOfAKind,
    p_fourOfAKind,
    p_fullHouse,
    p_smallStraight,
    p_largeStraight,
    p_yahtzee,
    p_chance,
    p_upperTotal,
    p_upperBonus,
    p_lowerTotal,
    p_grandTotal
    ) ON CONFLICT (
        gameNumber, gamePlayer
    ) DO NOTHING;
END;

$BODY$;
ALTER PROCEDURE public.addGameResult(
    bigint, character varying, bigint, bigint, bigint, bigint,
    bigint, bigint, bigint, bigint, bigint, bigint,
    bigint, bigint, bigint, bigint, bigint, bigint,
    bigint, bigint, bigint, bigint, bigint
)
    OWNER TO avnadmin;
