import { CodeMessageEvent } from "../node_modules/typed-adventureland/dist/src/codemessage";
import { TradeSlotType } from "../node_modules/typed-adventureland/dist/src/entity";
import { XOnlineCharacter } from "../node_modules/typed-adventureland/dist/src/parent/index";
import { Logger } from "./Logger";
import { Upgrade } from "./Upgrade";
import { Util } from "./Util";
import { CmAction } from "./enums/CmAction";
import { MerchantStatus } from "./enums/MerchantStatus";
import { MERCHANT_INFO } from "./lib/GlobalLib";
import { SellLib } from "./lib/SellLib";


// character.on("cm", function (m) {
//     if (fighters.includes(data.name)) {
//         //send back the amount of gold currently held
//         if (data.message.action == "sendLocation") {
//             if (merchant.MERCHANT_INFO.status!= "collecting" && merchant.MERCHANT_INFO.status!= "compounding" && character.esize > 4) {
//                 set_message("collecting");
//                 merchant.MERCHANT_INFO.status= "collecting"
//                 // set_merchant(merchant);
//                 game_log("error msg here");
//                 smart_move({ map: data.message.map, x: data.message.x, y: data.message.y });
//                 last_collection = new Date() / 1000; //reset last collection time.
//                 // checked_bank = false;
//             }
//         }
//     }
// })


let last_collection: number = new Date().getTime() / 1000; 
let last_message: CodeMessageEvent<any>; 

export class Merchant {
    private BORED_SPOT = { map: "main", x: -107, y: -50 };
    public timeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private FIGHTERS = this.get_fighters()
    private mpot = G.items.mpot0;
    private hpot = G.items.hpot0;
    private restock_timer = 0; 
    

    constructor(){
        character.on("cm", function (data: CodeMessageEvent<any>) {
            if (data.message.action == CmAction.REQUEST_SUPPLIES) {
                if (MERCHANT_INFO.status != MerchantStatus.COLLECTING && character.esize > 4) {
                    set_message(MerchantStatus.COLLECTING);
                    MERCHANT_INFO.status = MerchantStatus.COLLECTING
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

        if (MERCHANT_INFO.status == MerchantStatus.COLLECTING ){
            try{
                await smart_move({ map: last_message.message.map, x: last_message.message.x, y: last_message.message.y });
                last_collection = new Date().getTime() / 1000; //reset last collection time.
                MERCHANT_INFO.status = MerchantStatus.BORED
                Logger.info("Merchant has arrived at destination")
            } catch (e) {
                Logger.error("error in merchant loop e:" + e)
            }
        }

        if (MERCHANT_INFO.status == MerchantStatus.BORED && !this.at_bored_spot()){
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
                // if (locate_item("staff") == -1) await buy("staff", 1)
                // if (locate_item("blade") == -1) await buy("blade", 1)
                // if (locate_item("coat") == -1) await buy("coat", 1)
                // if (locate_item("gloves") == -1) await buy("gloves", 1)
                if (locate_item("pants") == -1) await buy("pants", 1)
                if (locate_item("shoes") == -1) await buy("shoes", 1)
                // if (locate_item("helmet") == -1) await buy("helmet", 1)
            } catch (e) {
                Logger.error("Error purchasing potions e:")
            }

        }
        //@ts-ignore
        if (!smart.moving && !smart.pathing) {
            // if (merchant.status == "banking") {
            //     checked_bank = go_check_bank(); // run check banking  
            // }
            // if (character.q.compound == undefined && merchant.status != "upgrading" && merchant.status != "banking") {
            //     go_compound();
            // }
            if (character.q.upgrade == undefined && MERCHANT_INFO.status == MerchantStatus.BORED) {
                Upgrade.go_upgrade();
            }

            // if (merchant.status == "Bored!") {
            //     if (!checked_bank) {
            //         go_check_bank();
            //     } else if (character.x != -107 && character.y != -50) {
            //         smart_move({ map: "main", x: -107, y: -50 })
            //     } else {
            //         sellJunk();
            //     }
            // }

        }

        //@ts-ignore
        if (current_time - last_collection > this.restock_timer && !smart.moving && !smart.searching) {
            send_cm("dadio", {action: CmAction.GET_LOCATION})
            this.restock_timer = 600; 
            last_collection = new Date().getTime() / 1000
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

    public async stand_loop(){
        try {
            //@ts-ignore
            if (!character.stand && !smart.moving && !smart.pathing) {
                Logger.info("opening stand")
                await open_stand(locate_item("stand0"));
                MERCHANT_INFO.status = MerchantStatus.BORED;

            //@ts-ignore
            } else if (character.stand != false && (character.moving || smart.moving || smart.pathing)) {
                game_log(character.stand)
                Logger.info("closing stand")
                await close_stand()
            }

        } catch (e) {
            Logger.error("standloop")
            show_json(e)
        }

        this.timeouts.set("stand_loop", setTimeout(() => this.stand_loop(), 1000));
    }

    //todo: make this async.
    public async sell_loop(){
        let items = character.items;
        let slot: TradeSlotType | null; 
        let openSlotFound: boolean = false;

        try {
            if (!character.stand) {
                this.timeouts.set("sell_loop", setTimeout(() => this.sell_loop(), 10000));
                return;
            }


            for (let key in character.slots) {
                slot = <TradeSlotType>key;
                if (key.startsWith("trade") && character.slots[slot] == null) {
                    openSlotFound = true;
                    break;
                }
            }

            if (!openSlotFound) {
                Logger.warn("No more room to sell items");
                this.timeouts.set("sell_loop", setTimeout(() => this.sell_loop(), 10000));
                return;
            }

            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (item == null || item == undefined) continue;
                if (SellLib.items_to_sell.includes(item.name)) {
                    let quantity: number = 1;
                    if (item.q != null && item.q != undefined) quantity = item.q!;
                    try {
                        let result = await trade(i, slot!, G.items[item.name].g * 2, quantity)
                        game_log(result)
                        this.timeouts.set("sell_loop", setTimeout(() => this.sell_loop(), 100));
                        return;
                    } catch (e) { Logger.error("sell_loop") }
                }
            }
        } catch (e) {
            Logger.error("sell_loop");
            show_json(e)
        }

        this.timeouts.set("sell_loop", setTimeout(() => this.sell_loop(), 10000));
    }

}