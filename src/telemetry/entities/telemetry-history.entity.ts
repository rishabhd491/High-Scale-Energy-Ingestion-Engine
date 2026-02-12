import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum TelemetryType {
  METER = 'METER',
  VEHICLE = 'VEHICLE',
}

@Entity('telemetry_history')
@Index(['deviceId', 'timestamp'])
@Index(['timestamp'])
export class TelemetryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TelemetryType,
  })
  type: TelemetryType;

  @Column()
  deviceId: string;

  @Column('jsonb')
  data: any;

  @Column('timestamp')
  timestamp: Date;
}
