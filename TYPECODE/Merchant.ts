import { CodeMessageEvent } from "../node_modules/typed-adventureland/dist/src/codemessage";
import { XOnlineCharacter } from "../node_modules/typed-adventureland/dist/src/parent/index";
import { Logger } from "./Logger";
import { Util } from "./Util";
import { CmAction } from "./enums/CmAction";
import { MerchantStatus } from "./enums/MerchantStatus";


// character.on("cm", function (m) {
//     if (fighters.includes(data.name)) {
//         //send back the amount of gold currently held
//         if (data.message.action == "sendLocation") {
//             if (merchant.status != "collecting" && merchant.status != "compounding" && character.esize > 4) {
//                 set_message("collecting");
//                 merchant.status = "collecting"
//                 // set_merchant(merchant);
//                 game_log("error msg here");
//                 smart_move({ map: data.message.map, x: data.message.x, y: data.message.y });
//                 last_collection = new Date() / 1000; //reset last collection time.
//                 // checked_bank = false;
//             }
//         }
//     }
// })

let status: string = MerchantStatus.Bored
let last_collection: number = new Date().getTime() / 1000; 
let last_message: CodeMessageEvent<any>; 

export class Merchant {
    private BORED_SPOT = { map: "main", x: -107, y: -50 };
    public timeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private FIGHTERS = this.get_fighters()
    private mpot = G.items.mpot0;
    private hpot = G.items.hpot0;

    constructor(){
        character.on("cm", function (data: CodeMessageEvent<any>) {
            if (data.message.action == CmAction.REQUEST_SUPPLIES) {
                if (status != MerchantStatus.Collecting && character.esize > 4) {
                    set_message(MerchantStatus.Collecting);
                    status = MerchantStatus.Collecting
                    last_message = data
                    // smart_move({ map: data.message.map, x: data.message.x, y: data.message.y });
                    // last_collection = new Date().getTime() / 1000; //reset last collection time.
                }
            }

            if (data.message.action == CmAction.REQUEST_ITEM) {
                Logger.info("Received request for items")
                let requested_item: string = data.message.item;
                if (Util.get_num_items(requested_item) > 0){
                    Logger.info("Sending requested Item")
                    send_item(data.name, locate_item(requested_item), Math.min(Util.get_num_items(requested_item), data.message.itemAmount))
                }
            }
        });
    }

    public async merchant_loop(){
        let current_time: number = new Date().getTime() / 1000; //convert to seconds

        if (status == MerchantStatus.Collecting ){
            try{
                await smart_move({ map: last_message.message.map, x: last_message.message.x, y: last_message.message.y });
                last_collection = new Date().getTime() / 1000; //reset last collection time.
                status = MerchantStatus.Bored
                Logger.info("Merchant has arrived at destination")
            } catch (e) {
                Logger.error("error in merchant loop e:" + e)
            }
        }

        if (status == MerchantStatus.Bored && !this.at_bored_spot()){
            await smart_move(this.BORED_SPOT)
        }

        if (distance(character, find_npc("newupgrade")) < 200) {
            let mana_potions_count: number = Util.get_num_items("mpot0");
            let health_potions_count: number = Util.get_num_items("hpot0");
            try{
                if (mana_potions_count < 9000) {
                    let buyAmount = 9999 - mana_potions_count; 
                    if(buyAmount * this.mpot.g < character.gold){
                        Logger.info("Purchasing mana potions")
                        await buy(this.mpot.skin, buyAmount);
                    } 
                }
                if (health_potions_count < 9000) {
                    let buyAmount = 9999 - health_potions_count;
                    if (buyAmount * this.hpot.g < character.gold) {
                        Logger.info("Purchasing health potions")
                        await buy(this.hpot.skin, buyAmount);
                    }
                }
            } catch (e) {
                Logger.error("Error purchasing potions e:")
            }

        }


        if (current_time - last_collection > 900 && !smart.moving && !smart.searching) {
            // send_cm(fighters[0], { action: "getLocation" }); //send msg to get location to move too. 
            game_log("need to set up collection")
            send_cm(this.FIGHTERS[0].name, {action: CmAction.GET_LOCATION})
        }
        this.timeouts.set("merchant_loop", setTimeout(() => this.merchant_loop(), 1000));
    }

    public get_fighters(): XOnlineCharacter[]{
        let characters = parent.X.characters;
        let fighters: XOnlineCharacter[] = new Array();
        for (let character of characters) {
            if (character.online > 0 && character.type != "merchant") {
                fighters.push(character)
            }
        }
        return fighters; 
    }

    private at_bored_spot(): boolean{
        if(character.x == this.BORED_SPOT.x && character.y == this.BORED_SPOT.y){
            return true
        } else return false 
    }

}