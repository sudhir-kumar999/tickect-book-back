import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./Movie";
import { Theatre } from "./Theatre";

@Entity("shows")
export class Show{
    @PrimaryGeneratedColumn("uuid")
        id!:string;

    @Column()
        showName!:string;

    @Column()
        showDate!:string;

    @Column()
        showStartTime!:string;

    @Column()
        showEndTime!:string;

    @Column()
        total_seat!:number;

    @Column()
        reg_Price!:number;

    @Column()
        prem_Price!:number;

    @Column({default: false})
        isCancel!: boolean;

    @ManyToOne(()=>Movie,(movie)=>movie.show)
        movie!:Movie;

    @ManyToOne(()=>Theatre,(theatre)=>theatre.show)
        theatre!:Theatre;
}