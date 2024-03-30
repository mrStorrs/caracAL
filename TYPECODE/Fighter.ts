// import * as functions from "./localhost/793/functions.js"

import { MonsterEntity } from "../node_modules/typed-adventureland/dist/src/entity";
import {Target} from "./Target"

export class Fighter {
  private mon_type!: string;
  private is_attacking: boolean = false; 
  private current_target: MonsterEntity | null = null; 
  public timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  public party_targets: Map<string, string> = new Map<string, string>();
  private targetFinder = new Target(["goo"]); 
  private target = null; 

  constructor(mon_type: string){
    this.mon_type = mon_type;
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
      choose_potion(["mpot1", "mpot0"], "regen_mp");
    } else if (hp_critical) {
      //force restore hp
      choose_potion(["hpot1", "hpot0"], "regen_hp");
    } else if (priest_present) {
      //heavily prefer mp
      choose_potion(["mpot1", "mpot0", "hpot1", "hpot0"]);
    } else {
      //prefer hp
      choose_potion(["hpot1", "mpot1", "hpot0", "mpot0"]);
    }
  }

  public try_respawn() {
    if (character.rip) {
      respawn();
    }
  }

  public async test_loop(){
    console.log("testing")
    this.timeouts.set("test_loop", setTimeout(() => this.test_loop(), 100))
  }
  
  public async fight_loop(){
    if (character.rip) {
      return;
    }

    this.smart_potion_logic();
    loot();

    // const target = get_nearest_monster({ type: this.mon_type });
    // if(!target){
    let target = this.targetFinder.get_target(this.party_targets)


    if (target) {
      if(target.id != character.target && !Array.from(this.party_targets.values()).includes(target.id)){
        Fighter.update_party_target(target.id)
        change_target(target);
      }


      // console.log(can_attack(target))
      // console.log(this.is_attacking)
      // console.log("pow77")
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
    } else if (!is_moving(character)) {
      smart_move(this.mon_type);
    } 
    this.timeouts.set("fight_loop", setTimeout(() => this.fight_loop(), 100))
  }

  //todo: look into promises, maybe this loop can also be an await. 
  public async combat_loop(){
    
    try {
      if (character.target != null && can_attack(parent.entities[character.target]) && !Array.from(this.party_targets.values()).includes(character.target)) {
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

}
