import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vehicle_meter_map')
export class VehicleMeterMap {
  @PrimaryColumn()
  vehicleId: string;

  @Column()
  meterId: string;
}
