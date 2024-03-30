import { CharacterEntitySlotsInfos } from "../node_modules/typed-adventureland/dist/src/entities/character-entity";
import { CharacterEntity, TradeSlotType } from "../node_modules/typed-adventureland/dist/src/entity";


let SELL_SPOT = { map: "main", x: -80, y: -50 };
const oneMinuteInMillis = 60 * 1000; // 1 minute in milliseconds
const sixHoursInMillis = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
// test.test_loop()

buy_stuff();
sell_stuff();
async function sell_stuff(){
    let items = character.items;
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (item == null || item == undefined) continue;
        show_json(await sell(i, 9999));
    }
    setTimeout(buy_stuff, 10000);
}

async function buy_stuff() {

    try {
        if(character.x != SELL_SPOT.x || character.y != SELL_SPOT.y){
            await smart_move(SELL_SPOT);
        }
        let entites = Object.values(parent.entities);
        const delay = Math.floor(Math.random() * (sixHoursInMillis - oneMinuteInMillis)) + oneMinuteInMillis;

        for(let entity of entites){
            if(entity.ctype == "merchant"){
                let merchant = <CharacterEntity> entity;
                let slots: CharacterEntitySlotsInfos = merchant.slots;
                for(let key in slots){
                    let slot: TradeSlotType = <TradeSlotType> key; 
                    if (key.startsWith("trade") && slots[slot] != null){
                        let result = await trade_buy(entity, slot, 1)
                        if(result.success){
                            game_log("successfully purchased item :D")
                            game_log("delay until next buy: " + delay)
                            setTimeout(buy_stuff, delay)
                        } else {
                            setTimeout(buy_stuff, 5000)
                        }
                        game_log(show_json(result))
                        return;
                    }
                }
            }
        }


    } catch (e) {
        game_log("error=buy_stuff " + e)
    }
    setTimeout(buy_stuff, 1000);
}

