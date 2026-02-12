import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { TelemetryHistory, TelemetryType } from '../telemetry/entities/telemetry-history.entity';
import { VehicleMeterMap } from '../telemetry/entities/vehicle-meter-map.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let historyRepo: any;
  let mapRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(TelemetryHistory),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(VehicleMeterMap),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    historyRepo = module.get(getRepositoryToken(TelemetryHistory));
    mapRepo = module.get(getRepositoryToken(VehicleMeterMap));
  });

  it('should calculate performance metrics correctly', async () => {
    const vehicleId = 'V-1';
    const meterId = 'M-1';

    mapRepo.findOne.mockResolvedValue({ vehicleId, meterId });

    historyRepo.find.mockImplementation((params: any) => {
      if (params.where.type === TelemetryType.VEHICLE) {
        return Promise.resolve([
          { data: { kwhDeliveredDc: 100, batteryTemp: 25 }, timestamp: new Date() },
          { data: { kwhDeliveredDc: 185, batteryTemp: 35 }, timestamp: new Date() },
        ]);
      } else {
        return Promise.resolve([
          { data: { kwhConsumedAc: 200 }, timestamp: new Date() },
          { data: { kwhConsumedAc: 300 }, timestamp: new Date() },
        ]);
      }
    });

    const result = await service.getVehiclePerformance(vehicleId);

    expect(result.metrics.totalEnergyConsumedAc).toBe(100); // 300 - 200
    expect(result.metrics.totalEnergyDeliveredDc).toBe(85); // 185 - 100
    expect(result.metrics.efficiencyRatio).toBe(0.85); // 85 / 100
    expect(result.metrics.avgBatteryTemp).toBe(30); // (25 + 35) / 2
  });
});
