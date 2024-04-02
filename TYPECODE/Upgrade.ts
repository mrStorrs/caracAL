import { Logger } from "./Logger";
import { Merchant } from "./Merchant";
import { Util } from "./Util";
import { MerchantStatus } from "./enums/MerchantStatus";
import { MERCHANT_INFO } from "./lib/GlobalLib";
import { UpgradeLib } from "./lib/UpgradeLib";

let UPGRADE_SPOT = { map: "main", x: -208, y: -159 };

export class Upgrade {
    public static upgrade_item(item_index: number, cur_lev: number, rarity: number, itemName: string) {
        if (distance(character, find_npc("newupgrade")) > 200) {
            if (!smart.moving) {
                // game_log('test');
                smart_move(UPGRADE_SPOT); //move to upgrade loc
            }
        } else { //upgrade

            try{
                //check if need basic scrolls
                if (Util.get_num_items("scroll0") < 10 && character.gold > 50000) {
                    buy('scroll0', 5);
                }
                if (Util.get_num_items("scroll1") < 10 && character.gold > 500000) {
                    buy('scroll1', 1);
                }
                if (Util.get_num_items("scroll2") < 10 && character.gold > 100000000) {
                    buy('scroll2', 1);
                }

                if (!is_on_cooldown("massproduction") && character.mp > 50 && character.level >= 30) {
                    use("massproduction")
                }
                //check if rarity and level matches
                if (rarity == 1) {
                    if (cur_lev > 8) {
                        this.getUpgradeChance(item_index, locate_item("scroll2"), itemName);
                    }
                    if (cur_lev > 6) { //max level for first scroll is 6
                        this.getUpgradeChance(item_index, locate_item("scroll1"), itemName);
                    } else {
                        this.getUpgradeChance(item_index, locate_item("scroll0"), itemName);
                    }
                }

                if (rarity == 2) {
                    if (cur_lev > 4) {
                        this.getUpgradeChance(item_index, locate_item("scroll1"), itemName);

                        // upgrade(item_index, locate_item("scroll1"));
                    } else {
                        // upgrade(item_index, locate_item("scroll0"));
                        this.getUpgradeChance(item_index, locate_item("scroll0"), itemName);

                    }
                }

                if (rarity == 3) {
                    if (cur_lev > 7) {
                        // upgrade(item_index, locate_item("scroll2"));
                        this.getUpgradeChance(item_index, locate_item("scroll2"), itemName);

                    } else {
                        // upgrade(item_index, locate_item("scroll1"));
                        this.getUpgradeChance(item_index, locate_item("scroll1"), itemName);

                    }
                }

                //will eventually want to add primordial essence here. 
                if (rarity == 4) {
                    this.getUpgradeChance(item_index, locate_item("scroll2"), itemName);
                }
            } catch (e) {
                Logger.error("upgradeitem");
                game_log(e);
            }

        }
        return null;
    }

    public static go_upgrade() {
        try {
            let items = character.items; //set items (easier to type)
            let items_to_upgrade = UpgradeLib.items_to_upgrade;

            //check if any items in inventory need upgrading
            //starts at 1 because I keep scrolls from 0-1. change as needed.
            var upgrading = false;
            for (let i = 1; i < items.length; i++) {
                if (items[i] == null) continue; //check if item present in inv slot.

                //check if needs to be upgraded.
                if (items[i].name in items_to_upgrade
                    && items_to_upgrade[items[i].name][0] > items[i].level!) {

                    if (items[i].p == undefined) {
                        var upgrading = true;
                        set_message("upgrading")
                        Util.set_status(MerchantStatus.UPGRADING)
                        //call upgrade item function
                        this.upgrade_item(i, items[i].level!,
                            items_to_upgrade[items[i].name][1], items[i].name); //upgrade
                    }
                    break; //end  when item found
                }
            }
            // if (upgrading) {
            //     // game_log("upgrading")
            //     set_message("upgrading");
            //     BOT.status = MerchantStatus.UPGRADING
            // } else {
            //     set_message("bored!");
            //     BOT.status = MerchantStatus.BORED
            // }
        } catch (e){
            Logger.error("go_upgrade")
            game_log("error")
        }
    }

//can be implemented to send back chance. 
    private static async getUpgradeChance(itemIndex: number, scrollIndex: number, itemName: string) {
        try {
            if(itemIndex < 0 || scrollIndex < 0){
                // Logger.warn("no item or scrolls aborting upgrade")
                Util.set_status(MerchantStatus.BORED)
                return;
            }
            const resultChance = await upgrade(itemIndex, scrollIndex, null, true); //getting the chance hence the true at the end
            const result = await upgrade(itemIndex, scrollIndex, null, false)
            game_log("character=" + character.name
                + " action=upgrade"
                //@ts-ignore
                + " upgradeItem=" + resultChance.item.name
                + " upgradeItemLevel=" + result.level
                + " upgradeResult=" + result.success
                + " upgradeChance=" + resultChance.chance
                //@ts-ignore
                + " upgradeScroll=" + resultChance.scroll)
            Util.set_status(MerchantStatus.BORED)
        } catch (e) {
            Util.set_status(MerchantStatus.BORED)
            game_log("error=this.getUpgradeChance")
            game_log(show_json(e))
        }

        return;
    }   
}