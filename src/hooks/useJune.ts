import { AnalyticsBrowser } from '@june-so/analytics-next';
import { useEffect, useState } from '../lib/teact/teact';

const APP_ENV = process.env.APP_ENV;

export function useJune({ currentUserId }: { currentUserId?: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsBrowser | undefined>(undefined);
  type TTrack = (eventName: string, properties?: Record<string, unknown>) => void;
  const [track, setTrack] = useState<undefined | TTrack>(undefined);

  useEffect(() => {
    const loadAnalytics = () => {
      const response = AnalyticsBrowser.load({
        writeKey: 'vLfuHIHM8CWtzPnZ',
      });
      setAnalytics(response);
      setTrack(() => (eventName: string, properties?: Record<string, unknown>) => {
        response.track(eventName, properties);
      });
    };
    if (APP_ENV === 'development' || APP_ENV === 'staging') {
      setTrack(() => (eventName: string, properties?: Record<string, unknown>) => {
        // eslint-disable-next-line no-console
        console.info('[june mock]', eventName, properties);
      });
    } else {
      loadAnalytics();
    }
  }, []);

  useEffect(() => {
    if (analytics && currentUserId) {
      analytics.identify(currentUserId, {
        email: `user${currentUserId}@ulu.so`,
      });
    }
  }, [analytics, currentUserId]);

  return { analytics, track };
}
