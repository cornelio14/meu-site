import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { databases, databaseId, siteConfigCollectionId } from '../services/node_appwrite';

// Define the site config interface
interface SiteConfig {
  $id: string;
  site_name: string;
  paypal_client_id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  telegram_username: string;
  video_list_title?: string;
  crypto?: string[];
}

// Define the context interface
interface SiteConfigContextType {
  siteName: string;
  paypalClientId: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  telegramUsername: string;
  videoListTitle: string;
  cryptoWallets: string[];
  siteConfig: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

// Create the context with default values
const SiteConfigContext = createContext<SiteConfigContextType>({
  siteName: 'VideosPlus',
  paypalClientId: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  telegramUsername: '',
  videoListTitle: 'Available Videos',
  cryptoWallets: [],
  siteConfig: null,
  loading: false,
  error: null,
  refreshConfig: async () => {},
});

// Provider component
export const SiteConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch site configuration
  const fetchSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        siteConfigCollectionId
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0] as unknown as SiteConfig;
        setConfig(config);
      }
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };

  // Fetch config on mount
  useEffect(() => {
    fetchSiteConfig();
  }, []);

  // Context value
  const value = {
    siteName: config?.site_name || 'VideosPlus',
    paypalClientId: config?.paypal_client_id || '',
    stripePublishableKey: config?.stripe_publishable_key || '',
    stripeSecretKey: config?.stripe_secret_key || '',
    telegramUsername: config?.telegram_username || '',
    videoListTitle: config?.video_list_title || 'Available Videos',
    cryptoWallets: config?.crypto || [],
    siteConfig: config,
    loading,
    error,
    refreshConfig: fetchSiteConfig,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

// Custom hook for using the context
export const useSiteConfig = () => useContext(SiteConfigContext);

export default SiteConfigContext; 