/**
 * MindSync AI — Location & Circadian Timing Service
 * Resolves accurate local time, timezone, GPS geolocation, and circadian greetings.
 */

export interface LocationInfo {
  city: string;
  region?: string;
  country: string;
  displayName: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  source: "gps" | "timezone" | "cached";
}

export interface CircadianInfo {
  timePeriod: "MIDNIGHT" | "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  greeting: string;
  subGreeting: string;
  iconType: "Moon" | "Sunrise" | "Sun" | "Sunset";
  accentColor: string;
  badgeText: string;
  currentTimeStr: string;
  isLateNight: boolean;
}

const CACHE_KEY = "mindsync_user_location_cache";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Mapping of common IANA timezones to standard user-facing metro hubs
const TIMEZONE_TO_METRO: Record<string, { city: string; country: string }> = {
  "Asia/Kolkata": { city: "Delhi", country: "India" },
  "Asia/Calcutta": { city: "Delhi", country: "India" },
  "Asia/Dubai": { city: "Dubai", country: "UAE" },
  "Asia/Singapore": { city: "Singapore", country: "Singapore" },
  "Asia/Tokyo": { city: "Tokyo", country: "Japan" },
  "Asia/Hong_Kong": { city: "Hong Kong", country: "China" },
  "Asia/Bangkok": { city: "Bangkok", country: "Thailand" },
  "Europe/London": { city: "London", country: "UK" },
  "Europe/Paris": { city: "Paris", country: "France" },
  "Europe/Berlin": { city: "Berlin", country: "Germany" },
  "Europe/Amsterdam": { city: "Amsterdam", country: "Netherlands" },
  "America/New_York": { city: "New York", country: "USA" },
  "America/Los_Angeles": { city: "Los Angeles", country: "USA" },
  "America/Chicago": { city: "Chicago", country: "USA" },
  "America/Denver": { city: "Denver", country: "USA" },
  "America/Toronto": { city: "Toronto", country: "Canada" },
  "Australia/Sydney": { city: "Sydney", country: "Australia" },
  "Australia/Melbourne": { city: "Melbourne", country: "Australia" },
};

/**
 * Returns current IANA timezone (e.g. "Asia/Kolkata")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Returns friendly location derived from the browser's native timezone
 */
export function getLocationFromTimezone(): LocationInfo {
  const tz = getUserTimezone();
  const match = TIMEZONE_TO_METRO[tz];
  if (match) {
    return {
      city: match.city,
      country: match.country,
      displayName: `${match.city}, ${match.country}`,
      timezone: tz,
      source: "timezone",
    };
  }

  // Fallback: parse city from IANA format e.g. "Europe/Rome" -> "Rome"
  const parts = tz.split("/");
  const cityRaw = parts[1] || parts[0] || "Local";
  const city = cityRaw.replace(/_/g, " ");
  return {
    city,
    country: parts[0] || "",
    displayName: city,
    timezone: tz,
    source: "timezone",
  };
}

/**
 * Calculates human circadian phase based on exact local hour (0-23)
 */
export function getCircadianInfo(date: Date = new Date()): CircadianInfo {
  const hour = date.getHours();

  // Format current local time e.g. "1:05 AM"
  const currentTimeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // 1. Midnight / Late Night: 00:00 to 04:59
  if (hour >= 0 && hour < 5) {
    return {
      timePeriod: "MIDNIGHT",
      greeting: "Good night",
      subGreeting: "Taking a late-night pause? Review your daily rituals, unwind gently, and rest well.",
      iconType: "Moon",
      accentColor: "text-indigo-400 dark:text-indigo-300",
      badgeText: "Midnight • Rest & Reflect",
      currentTimeStr,
      isLateNight: true,
    };
  }

  // 2. Morning / Dawn: 05:00 to 11:59
  if (hour >= 5 && hour < 12) {
    return {
      timePeriod: "MORNING",
      greeting: "Good morning",
      subGreeting: "Here is your daily overview. Start your morning rituals and set your mindful intentions.",
      iconType: "Sunrise",
      accentColor: "text-amber-500 dark:text-amber-400",
      badgeText: "Morning • Sunrise",
      currentTimeStr,
      isLateNight: false,
    };
  }

  // 3. Afternoon: 12:00 to 16:59
  if (hour >= 12 && hour < 17) {
    return {
      timePeriod: "AFTERNOON",
      greeting: "Good afternoon",
      subGreeting: "Here is your midday overview. Keep up your momentum, stay hydrated, and take a mindful breath.",
      iconType: "Sun",
      accentColor: "text-amber-400 dark:text-amber-300",
      badgeText: "Afternoon • Focus",
      currentTimeStr,
      isLateNight: false,
    };
  }

  // 4. Evening / Twilight: 17:00 to 20:59
  if (hour >= 17 && hour < 21) {
    return {
      timePeriod: "EVENING",
      greeting: "Good evening",
      subGreeting: "Review your daily progress, celebrate small wins, and prepare to power down.",
      iconType: "Sunset",
      accentColor: "text-orange-400 dark:text-orange-300",
      badgeText: "Evening • Twilight",
      currentTimeStr,
      isLateNight: false,
    };
  }

  // 5. Night / Wind-down: 21:00 to 23:59
  return {
    timePeriod: "NIGHT",
    greeting: "Good night",
    subGreeting: "Winding down for the day? Check off your reflections and prepare for restorative sleep.",
    iconType: "Moon",
    accentColor: "text-sky-400 dark:text-sky-300",
    badgeText: "Night • Wind-Down",
    currentTimeStr,
    isLateNight: true,
  };
}

/**
 * Attempts to detect precise location via browser Geolocation API
 * with automatic fallback to timezone and cached values.
 */
export async function detectLocation(forceRefresh = false): Promise<LocationInfo> {
  if (typeof window === "undefined") {
    return getLocationFromTimezone();
  }

  // 1. Check local cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return {
            ...cached.data,
            source: "cached",
          };
        }
      }
    } catch {
      // Ignore cache parse errors
    }
  }

  // Baseline from timezone
  const baseline = getLocationFromTimezone();

  // 2. If geolocation is not available in browser, return baseline
  if (!navigator.geolocation) {
    return baseline;
  }

  // 3. Request geolocation coordinates with 6-second timeout
  return new Promise<LocationInfo>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // Free, anonymous, CORS-enabled reverse geocode client API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );

          if (response.ok) {
            const data = await response.json();
            const city =
              data.city ||
              data.locality ||
              data.principalSubdivision ||
              baseline.city ||
              "Delhi";
            const country = data.countryName || baseline.country || "India";
            const displayName = `${city}, ${country}`;

            const locationInfo: LocationInfo = {
              city,
              region: data.principalSubdivision,
              country,
              displayName,
              timezone: baseline.timezone,
              latitude: lat,
              longitude: lon,
              source: "gps",
            };

            // Cache successfully resolved GPS location
            try {
              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ timestamp: Date.now(), data: locationInfo })
              );
            } catch {}

            resolve(locationInfo);
            return;
          }
        } catch (err) {
          console.warn("Reverse geocode fetch failed, falling back to timezone:", err);
        }

        // Geolocation succeeded but reverse-geocoding failed: return baseline
        resolve(baseline);
      },
      (geoError) => {
        // Geolocation denied or unavailable: seamlessly return timezone baseline
        console.info("Geolocation prompt skipped or denied; using timezone location:", geoError.message);
        resolve(baseline);
      },
      { timeout: 6000, maximumAge: 600000 }
    );
  });
}
