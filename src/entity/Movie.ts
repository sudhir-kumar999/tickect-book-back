import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Show } from "./Show";

@Entity("movies")
export class Movie{
    @PrimaryGeneratedColumn("uuid")
        id!:string;

    @Column()
        tmdbId!:string;

    @Column()
        title!:string;

    @Column({nullable:true})
        duration!:number;

    @Column()
        poster!:string;

    @Column({nullable:true})
        releaseDate!:string;

    @Column({type:"float",nullable:true})
        rating!:number;

    @OneToMany(()=>Show,(show)=>show.movie)
        show!:Show[];
}