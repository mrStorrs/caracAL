import {Fighter} from "./Fighter"

let test: Fighter = new Fighter("goo");

fight_loop()
respawn_loop()

async function fight_loop() {
    try {
        test.fight_loop()
    } catch (e) {
        // game_log("error=lootLoop")
        // console.error(e)
    }
    setTimeout(fight_loop, 100);
}

async function respawn_loop() {
    try {
        test.try_respawn()
    } catch (e) {
        // game_log("error=fight_loop")
        // console.error(e)
    }
    setTimeout(respawn_loop, 10000);
}