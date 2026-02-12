import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TelemetryService } from './telemetry.service';
import { MeterStatus } from './entities/meter-status.entity';
import { VehicleStatus } from './entities/vehicle-status.entity';
import { TelemetryHistory } from './entities/telemetry-history.entity';
import { VehicleMeterMap } from './entities/vehicle-meter-map.entity';

describe('TelemetryService', () => {
  let service: TelemetryService;

  const mockRepository = () => ({
    save: jest.fn(),
    upsert: jest.fn(),
  });

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        { provide: getRepositoryToken(MeterStatus), useValue: mockRepository() },
        { provide: getRepositoryToken(VehicleStatus), useValue: mockRepository() },
        { provide: getRepositoryToken(TelemetryHistory), useValue: mockRepository() },
        { provide: getRepositoryToken(VehicleMeterMap), useValue: mockRepository() },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ingest meter data correctly', async () => {
    const dto = {
      meterId: 'M-1',
      kwhConsumedAc: 100,
      voltage: 230,
      timestamp: new Date().toISOString(),
    };

    await service.ingestMeter(dto);

    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    expect(mockQueryRunner.manager.upsert).toHaveBeenCalledWith(
      MeterStatus,
      expect.objectContaining({ meterId: 'M-1' }),
      ['meterId'],
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('should ingest vehicle data correctly', async () => {
    const dto = {
      vehicleId: 'V-1',
      soc: 80,
      kwhDeliveredDc: 90,
      batteryTemp: 30,
      timestamp: new Date().toISOString(),
    };

    await service.ingestVehicle(dto);

    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    expect(mockQueryRunner.manager.upsert).toHaveBeenCalledWith(
      VehicleStatus,
      expect.objectContaining({ vehicleId: 'V-1' }),
      ['vehicleId'],
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });
});
