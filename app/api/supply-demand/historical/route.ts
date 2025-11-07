import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { getCached, setCache, CACHE_TTL } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

interface HourlyData {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  sessionVolume: number;
  availableTutors: number;
  activeTutors: number;
  supplyDemandRatio: number;
}

// Generate mock historical data for development
function generateMockHistoricalData(): HourlyData[] {
  const data: HourlyData[] = [];
  const now = new Date();

  // Generate data for the last 30 days, hourly
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(hour, 0, 0, 0);

      const dayOfWeek = timestamp.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPeakHour = hour >= 14 && hour <= 20; // 2 PM - 8 PM

      // Simulate realistic patterns
      let baseVolume = 5;
      if (!isWeekend && isPeakHour) baseVolume = 25;
      else if (!isWeekend) baseVolume = 12;
      else if (isWeekend && isPeakHour) baseVolume = 15;

      const sessionVolume = Math.max(0, baseVolume + Math.floor(Math.random() * 10 - 5));
      const availableTutors = Math.floor(sessionVolume * 0.8) + Math.floor(Math.random() * 5);
      const activeTutors = Math.min(sessionVolume, availableTutors);
      const supplyDemandRatio = availableTutors > 0 ? sessionVolume / availableTutors : 0;

      data.push({
        timestamp: timestamp.toISOString(),
        hour,
        dayOfWeek,
        sessionVolume,
        availableTutors,
        activeTutors,
        supplyDemandRatio
      });
    }
  }

  return data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

    // Check cache first
    const cacheKey = `supply-demand-historical:days:${days}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      const mockResponse = {
        data: generateMockHistoricalData(),
        source: 'mock',
        daysIncluded: days,
        totalDataPoints: generateMockHistoricalData().length
      };
      // Cache mock data too (shorter TTL)
      await setCache(cacheKey, mockResponse, CACHE_TTL.METRICS);
      return NextResponse.json(mockResponse);
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch sessions from Firebase
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      orderBy('created_at', 'asc')
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);

    // Fetch tutors data
    const tutorsQuery = query(collection(db, 'tutors'));
    const tutorsSnapshot = await getDocs(tutorsQuery);

    // Aggregate data by hour
    const hourlyMap = new Map<string, {
      sessionCount: number;
      tutorIds: Set<string>;
    }>();

    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.created_at.toDate();
      const hourKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours()).toISOString();

      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, {
          sessionCount: 0,
          tutorIds: new Set()
        });
      }

      const hourData = hourlyMap.get(hourKey)!;
      hourData.sessionCount++;
      if (data.tutor_id) {
        hourData.tutorIds.add(data.tutor_id);
      }
    });

    // Get total available tutors (simplified - all tutors considered available)
    const totalAvailableTutors = tutorsSnapshot.size;

    // Build historical data array
    const historicalData: HourlyData[] = [];

    for (const [hourKey, hourData] of hourlyMap.entries()) {
      const timestamp = new Date(hourKey);

      historicalData.push({
        timestamp: timestamp.toISOString(),
        hour: timestamp.getHours(),
        dayOfWeek: timestamp.getDay(),
        sessionVolume: hourData.sessionCount,
        availableTutors: totalAvailableTutors,
        activeTutors: hourData.tutorIds.size,
        supplyDemandRatio: totalAvailableTutors > 0 ? hourData.sessionCount / totalAvailableTutors : 0
      });
    }

    // Sort by timestamp
    historicalData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // If we don't have enough data for forecasting (need at least 24 hours), fall back to mock data
    if (historicalData.length < 24) {
      console.log(`Insufficient real data (${historicalData.length} points). Using mock data for forecasting.`);
      const mockResponse = {
        data: generateMockHistoricalData(),
        source: 'mock (insufficient real data)',
        daysIncluded: days,
        totalDataPoints: generateMockHistoricalData().length
      };
      // Cache fallback data (1 hour TTL since it's generated data)
      await setCache(cacheKey, mockResponse, CACHE_TTL.FORECASTS);
      return NextResponse.json(mockResponse);
    }

    const firebaseResponse = {
      data: historicalData,
      source: 'firebase',
      daysIncluded: days,
      totalDataPoints: historicalData.length
    };

    // Cache Firebase data (15 minute TTL)
    await setCache(cacheKey, firebaseResponse, CACHE_TTL.CUSTOMERS);

    return NextResponse.json(firebaseResponse);
  } catch (error) {
    console.error('Error fetching historical supply-demand data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
