import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('meter_status')
export class MeterStatus {
  @PrimaryColumn()
  meterId: string;

  @Column('float')
  kwhConsumedAc: number;

  @Column('float')
  voltage: number;

  @Column('timestamp')
  lastTimestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
