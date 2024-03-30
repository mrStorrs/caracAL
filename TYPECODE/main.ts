import { CodeMessageEvent } from "../node_modules/typed-adventureland/dist/src/codemessage";
import {Fighter} from "./Fighter"
import { Merchant } from "./Merchant";
import {Target} from "./Target"

const TARGETS: string[] = ["crab"]
let bot: Fighter = new Fighter(TARGETS);
let bot_merchant: Merchant = new Merchant(); 

// test.test_loop()
if(character.ctype != "merchant"){
    bot.fight_loop()
    bot.combat_loop()
    // respawn_loop()
} else {
    bot_merchant.merchant_loop();
    bot_merchant.sell_loop();
}

// async function respawn_loop() {
//     try {
//         bot.try_respawn()
//     } catch (e) {
//         // game_log("error=fight_loop")
//         // console.error(e)
//     }
//     setTimeout(respawn_loop, 1000);
// }

sleep(1000)

if (character.ctype != "merchant"){
    character.on("cm", function (data: CodeMessageEvent<any>) {
        if (data.message == "party_invite") accept_party_invite(data.name);

        //todo: these should be enums
        if (data.message.action == "update_target") {
            bot.party_targets.set(data.name, data.message.message);
        }
    });
}


if(character.name == "dadio")send_party_requests();
async function send_party_requests() {
    try {
        if (parent.party_list.length < 3 ) {
            let characters = parent.X.characters; 
            for(let c of characters){
                if (c.online > 0 && c.type!= "merchant" && !parent.party_list.includes(c.name) && c.name != character.name) {
                    game_log(c.name);
                    await send_party_invite(c.name, false);
                    send_cm(c.name, "party_invite")
                }   
            }
        }

    } catch (e) {
        game_log("error=slowLoopParty " + e)
    }
    setTimeout(send_party_requests, 1000);
}

