import { getDateOrDefault } from '../schedule-context-provider';
import { describe, it, expect } from 'vitest';

// Mock the Venue type to avoid browser dependencies
type MockVenue = {
  timeZoneId: string;
  id: string;
  name: string;
  organizationId: string;
  contactEmail: string;
  address: string;
  announcements: string;
  createdAt: Date;
  updatedAt: Date;
  displayStart: number;
  displayEnd: number;
};

describe('getDateOrDefault', () => {
  const mockVenue: MockVenue = {
    timeZoneId: 'America/New_York',
    id: '1',
    name: 'Test Venue',
    organizationId: '1',
    contactEmail: 'test@test.com',
    address: '123 Test St',
    announcements: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    displayStart: 480,
    displayEnd: 1080,
  };

  it('should return midnight in venue timezone when given a date string', () => {
    // March 20th, 2024
    const result = getDateOrDefault('2024-03-20', mockVenue as any);
    
    // Should be March 20th 04:00 UTC (midnight EDT)
    expect(result.toISOString()).toBe('2024-03-20T04:00:00.000Z');
  });

  it('should handle venue in different timezone (Los Angeles)', () => {
    const laVenue: MockVenue = {
      ...mockVenue,
      timeZoneId: 'America/Los_Angeles',
    };
    
    // March 20th, 2024
    const result = getDateOrDefault('2024-03-20', laVenue as any);
    
    // Should be March 20th 07:00 UTC (midnight PDT)
    expect(result.toISOString()).toBe('2024-03-20T07:00:00.000Z');
  });

  it('should handle venue in timezone ahead of UTC (Tokyo)', () => {
    const tokyoVenue: MockVenue = {
      ...mockVenue,
      timeZoneId: 'Asia/Tokyo',
    };
    
    // March 20th, 2024
    const result = getDateOrDefault('2024-03-20', tokyoVenue as any);
    
    // Should be March 19th 15:00 UTC (midnight March 20th JST)
    expect(result.toISOString()).toBe('2024-03-19T15:00:00.000Z');
  });

  it('should handle date near DST transition', () => {
    // US DST starts second Sunday in March
    const result = getDateOrDefault('2024-03-10', mockVenue as any);
    
    // Should be March 10th 04:00 UTC (midnight EDT after DST change)
    expect(result.toISOString()).toBe('2024-03-10T04:00:00.000Z');
  });

  it('should handle null date by using today', () => {
    const result = getDateOrDefault(null, mockVenue as any);
    const now = new Date();
    const expectedDate = new Date(now);
    expectedDate.setHours(4, 0, 0, 0); // 04:00 UTC = midnight EDT
    
    // Should be today at midnight venue time
    expect(result.getUTCHours()).toBe(4);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });
}); 