import { CharacterEntity, Entity, MonsterEntity } from "../node_modules/typed-adventureland/dist/src/entity";
import { Logger } from "./Logger";

export class Target {
    private targets: string[];
    //move this to a constructor
    private TANK: string = "keos";
    private TANK_ENTITY!: CharacterEntity | null; 

    constructor(targets: string[]) {
        this.targets = targets;
    }

    public get_target(party_targets: Map<string,string>): any {
        // if (character.target != null && parent.entities[character.target] && !parent.entities[character.target].dead) return parent.entities[character.target];
        for(let target of this.targets){
            let entities = Object.values(parent.entities);
            let potential_targets = []

            if(!entities) return null; 

            for(let entity of entities){
                if(entity.mtype == target){
                    potential_targets.push(entity)
                }
                if(entity.name == this.TANK){
                    this.TANK_ENTITY = <CharacterEntity>entity;
                }

            }
            potential_targets.sort(function (current, next) {

                if (Array.from(party_targets.values()).includes(current.id)) {
                    return 1; // move party targets back in the list
                }

                var d_curr = distance(character, current);
                var d_next = distance(character, next);

                if (d_curr < d_next) {
                    return -1;
                } else if (d_curr > d_next) {
                    return 1;
                } else {
                    return 0;
                }
            });
            
            // let found_target = get_nearest_monster({ type: target });
            // if (found_target) {
                // return found_target;
            // }
            let finalTarget: MonsterEntity = <MonsterEntity>potential_targets[0]
            // if(finalTarget && finalTarget.hp > 500 && character.name != this.TANK){
            //     if(parent.party_list.includes(this.TANK)){
            //         if(this.TANK_ENTITY != null && this.TANK_ENTITY.target){
            //             Logger.info("Ganging up")
            //             return parent.entities[this.TANK_ENTITY.target]
            //         } else return null; 
            //     }
            // }
            if (finalTarget) return finalTarget;
        }
        return null; 
    }

}
