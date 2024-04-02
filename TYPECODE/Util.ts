import { Logger } from "./Logger";
import { BOT } from "./lib/GlobalLib";

export class Util {
    public static get_num_items(item: string): number {
        var itemCount = character.items.filter(i => i != null && i.name == item)
            .reduce(function (a, b) { return a + (b["q"] || 1); }, 0);
        return itemCount;
    }

    public static are_potions_stocked(): boolean {
        if (this.get_num_items("mpot0") < 100) {
            Logger.warn("Low on mana potions.")
            return false
        }
        else if (this.get_num_items("hpot0") < 100) {
            Logger.warn("Low on health potions.")
            return false
        }
        else return true
    }

    public static set_status(statusMessage: string){
        set_message(statusMessage);
        BOT.status = statusMessage;

    }
}

