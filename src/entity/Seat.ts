import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Theatre } from "./Theatre";

@Entity("seats")
export class Seat{
    @PrimaryGeneratedColumn("uuid")
        id!:string;

    @Column()
        seatNumber!:string;

    @Column()
        row!:string;

    @Column({nullable:true})
        price!:number;

    @Column({default:"Regular"})
        seatType!:string;

    @ManyToOne(() => Theatre, (theatre) => theatre.seat)
        theatre!: Theatre;
}