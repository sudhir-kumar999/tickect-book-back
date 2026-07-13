import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique,
    CreateDateColumn,
} from "typeorm";
import { Show } from "./Show";
import { Seat } from "./Seat";
import { User } from "./User";

@Entity("bookings")
@Unique(["show", "seat"]) 
export class Booking {
    @PrimaryGeneratedColumn("uuid")
        id!: string;

    @ManyToOne(() => Show, { onDelete: "CASCADE" })
        show!: Show;

    @ManyToOne(() => Seat, { onDelete: "CASCADE" })
        seat!: Seat;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
        user!: User;

    @Column()
        status!: string;

    @Column({ type: "timestamp", nullable: true })
        heldUntil!: Date;

    @Column({ nullable: true })
        paymentId!: string;

    @Column({ nullable: true })
        paymentStatus!: string;

    @Column({ nullable: true })
        razor_pay_order_id!: string;

    @Column({ nullable: true })
        razor_pay_signature!: string;

    @CreateDateColumn()
        createdAt!: Date;
}
