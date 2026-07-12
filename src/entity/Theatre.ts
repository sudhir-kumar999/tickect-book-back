import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Seat } from "./Seat";
import { Show } from "./Show";

@Entity("theatres")
export class Theatre{
    @PrimaryGeneratedColumn("uuid")
        id!:string;

    @Column()
        name!:string;

    @Column()
        address!:string;

    @Column("double precision")
        latitude!:number;

    @Column("double precision")
        longitude!:number;

    @CreateDateColumn()
        created_at!:Date;

    @OneToMany(()=>Seat,(seat)=>seat.theatre)
        seat!:Seat[];

    @OneToMany(()=>Show,(show)=>show.theatre)
        show!:Show[];
}