import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicle_status')
export class VehicleStatus {
  @PrimaryColumn()
  vehicleId: string;

  @Column('float')
  soc: number;

  @Column('float')
  kwhDeliveredDc: number;

  @Column('float')
  batteryTemp: number;

  @Column('timestamp')
  lastTimestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
