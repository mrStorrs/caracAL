// import * as functions from "./localhost/793/functions.js"

import { MonsterEntity } from "../node_modules/typed-adventureland/dist/src/entity";
import { XOnlineCharacter } from "../node_modules/typed-adventureland/dist/src/parent/index";
import { Logger } from "./Logger";
import { Target } from "./Target"
import { Util } from "./Util";
import { CmAction } from "./enums/CmAction";

export class Fighter {
  private target_monsters: string[];
  public timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  public party_targets: Map<string, string> = new Map<string, string>();
  private targetFinder: Target; 
  private current_time: number = new Date().getTime() / 1000; 
  private last_collection: number = new Date().getTime() / 1000; 
  private MERCHANT = this.get_merchant()
  private last_sent_items = new Date().getTime() / 1000; 
  private ITEMS_TO_KEEP: string[] = ["mpot0", "hpot0"]

  constructor(target_monsters: string[]){
    this.target_monsters = target_monsters;
    this.targetFinder = new Target(target_monsters);
  }

  public smart_potion_logic() {
    if (character.rip) return;

    if (is_on_cooldown("use_hp")) return;

    function can_consume_fully(pot: string) {
      if ("regen_hp" === pot) return character.max_hp - character.hp >= 50;
      if ("regen_mp" === pot) return character.max_mp - character.mp >= 100;
      if (pot.startsWith("hp")) {
        return character.max_hp - character.hp >= G.items[pot].gives[0][1];
      } else {
        return character.max_mp - character.mp >= G.items[pot].gives[0][1];
      }
    }
    function choose_potion(priorities: Array<string>, fallback: string = "") {
      let using_slot;
      for (let pot of priorities) {
        if (can_consume_fully(pot) && (using_slot = locate_item(pot)) >= 0) {
          equip(using_slot);
          return;
        }
      }
      if (fallback && can_consume_fully(fallback)) use_skill(fallback);
    }
    const hp_critical = character.hp / character.max_hp <= 0.5;
    const mp_critical = character.mp / character.max_mp <= 0.2;
    const priest_present = parent.party_list.some(
      (name) => "priest" === get_player(name)?.ctype,
    );
    if (mp_critical) {
      //force restore mp
      choose_potion(["mpot0", "mpot0"], "regen_mp");
    } else if (hp_critical) {
      //force restore hp
      choose_potion(["hpot0", "hpot0"], "regen_hp");
    } else if (priest_present) {
      //heavily prefer mp
      choose_potion(["mpot0", "mpot0", "hpot0", "hpot0"]);
    } else {
      //prefer hp
      choose_potion(["hpot0", "mpot0", "hpot0", "mpot0"]);
    }
  }

  //todo: move to targeting
  private send_items_to_merchant(){
    if (!this.MERCHANT) {
      this.MERCHANT = this.get_merchant()
      return;
    }

    let entities = Object.values(parent.entities);
    this.current_time = new Date().getTime() / 1000; 

    for(let entity of entities){
      if (entity.name == this.MERCHANT.name && distance(character, entity) < 350){
        Logger.info("you are here sir")
        game_log(this.last_sent_items)
        game_log(this.current_time)

        if(this.current_time - this.last_sent_items > 3){
          this.send_to_merchant(1, this.MERCHANT.name)
          let mp_to_request = Math.min(3000, 9999 - Util.get_num_items("mpot0"))
          let hp_to_request = Math.min(3000, 9999 - Util.get_num_items("hpot0"))
          if(mp_to_request > 100) this.request_from_merchant("mpot0", mp_to_request, this.MERCHANT.name)
          if(hp_to_request > 100) this.request_from_merchant("hpot0", mp_to_request, this.MERCHANT.name)
        }
      }
    }
    this.last_sent_items = new Date().getTime() / 1000
  }

  //todo: move to targeting or util 
  private send_to_merchant(index: number, merchant_name: string) {
    if(character.gold > 10000) send_gold(merchant_name, character.gold);
    for (let i = index; i <= character.isize; i++) {
      if (character.items[i] != null && !this.ITEMS_TO_KEEP.includes(character.items[i].name)) { //make sure slot is not empty.
        send_item(merchant_name, i, 999);
      }
    }
  }

  //todo: move to targeting or util 
  private request_from_merchant(item: string, itemAmount: number, merchant_name: string) {
    let data = {
      "action": CmAction.REQUEST_ITEM,
      "item": item,
      "itemAmount": itemAmount
    }
    Logger.info("Sending request for items: " + data)
    send_cm(merchant_name, data);
  }

  
  public async fight_loop(){
    if (character.rip ) {
      await respawn(); 
    }

    this.request_supplies(); 
    this.smart_potion_logic();
    this.send_items_to_merchant(); 
    loot();

    // const target = get_nearest_monster({ type: this.mon_type });
    // if(!target){
    let target = this.targetFinder.get_target(this.party_targets)

    if (target) {
      if(target.id != character.target){
        Fighter.update_party_target(target.id)
        change_target(target);
      }


      const dist = simple_distance(target, character);
      if (!is_moving(character) && dist > character.range - 10) {
        if (can_move_to(target.real_x, target.real_y)) {
          move(
            (target.real_x + character.real_x) / 2,
            (target.real_y + character.real_y) / 2,
          );
        } else {
          smart_move(target);
        }
      }
    } else if (!is_moving(character) && !smart.searching) {
      await smart_move(this.target_monsters[0]);
    } 
    this.timeouts.set("fight_loop", setTimeout(() => this.fight_loop(), 100))
  }

  //todo: look into promises, maybe this loop can also be an await. 
  public async combat_loop(){
    
    try {
      if (character.target != null && can_attack(parent.entities[character.target])) {
        await attack(parent.entities[character.target])
      } else if (character.target != null && Array.from(this.party_targets.values()).includes(character.target)) {
        this.targetFinder.get_target(this.party_targets)
        // console.log("cannot attack")
        // if(!is_targeted(player.target)){
        // reduce_cooldown("attack", Math.min(...parent.pings))
        // } else {
        // get_new_target(); 
        // }
        /** NOTE: We're now reducing the cooldown based on the ping */
      }
    } catch (e) {
      game_log("error=attackLoop")

      console.error(e)
    }
    this.timeouts.set("combat_loop", setTimeout(() => this.combat_loop(), Math.max(1, Fighter.ms_to_next_skill("attack"))));
  }

  public static ms_to_next_skill(skill: string) {
    const next_skill = parent.next_skill[skill]
    if (next_skill == undefined) return 0
    const ms = next_skill.getTime() - Date.now()
    return ms < 0 ? 0 : ms
  }

  public static update_party_target(target_id: string){
    if (parent.party_list.length > 1) {
      for (let partyMember of parent.party_list) {
        if (partyMember != character.name){
          let data = {
            "action": "update_target",
            "message": target_id
          }
          send_cm(partyMember, data)
        }
      }
    }
  }

  private  request_supplies(){
    if(!this.MERCHANT){
      this.MERCHANT = this.get_merchant()
      return;
    }
    this.current_time = new Date().getTime() / 1000;
    if (this.current_time - this.last_collection > 10 
      && (character.isize - character.esize > 15 || !Util.are_potions_stocked())) {
      let locationResponse = {
        action: CmAction.REQUEST_SUPPLIES,
        map: character.map,
        x: character.x,
        y: character.y
      }
      send_cm(this.MERCHANT.name, locationResponse);
      Logger.info("requesting supplies");
      this.last_collection = new Date().getTime() / 1000;
    }
  }

  private get_merchant(){
    let characters = parent.X.characters;
    let merchant!: XOnlineCharacter;
    for (let character of characters) {
      if (character.online > 0 && character.type == "merchant") {
        merchant = character
      }
    }
    return merchant; 
  }

}
