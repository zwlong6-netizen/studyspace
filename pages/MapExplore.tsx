import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Locate, Layers, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { shopsApi, Shop } from '../src/services/api';
import AMapLoader from '../src/utils/AMapLoader';

// Declare AMap on window
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

export const MapExplore: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Load Shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await shopsApi.getShops();
        if (response.success && response.shops.length > 0) {
          setShops(response.shops);
        } else {
          setShops([]);
        }
      } catch (error) {
        console.error('Failed to load shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  // Init AMap
  useEffect(() => {
    if (loading) return; // Wait for layout to be ready

    // IMPORTANT: Replace these with your actual AMAP Key and Security Code
    const AMAP_KEY = '81581a29c5fafe34df86a10e81c7db9f';
    const AMAP_SECURITY_CODE = 'bb159cd677cbc70a52de5336b2cc0ef9';

    AMapLoader(AMAP_KEY, AMAP_SECURITY_CODE).then((AMap) => {
      if (!mapContainerRef.current) {
        console.error("Map container not found!");
        return;
      }

      if (mapInstanceRef.current) return; // Prevent double init

      const map = new AMap.Map(mapContainerRef.current, {
        zoom: 12,
        center: [116.40, 39.96], // [Lng, Lat] for Beijing
        viewMode: '3D', // Use 3D view
        pitch: 40,
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);
      console.log("AMap initialized successfully");

    }).catch(e => {
      console.error('AMap load failed:', e);
    });

    // Cleanup handled by ref check or separate cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // Render Markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.AMap) return;

    const AMap = window.AMap;
    const map = mapInstanceRef.current;

    // Clear existing
    map.remove(markersRef.current);
    markersRef.current = [];

    shops.forEach(shop => {
      if (!shop.latitude || !shop.longitude) return;

      const isSelected = selectedShopId === shop.id;

      // Create Custom Content Marker
      const contentDiv = document.createElement('div');
      contentDiv.className = `flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-110 z-[1000]' : 'opacity-90 hover:opacity-100 hover:scale-105 z-[500]'}`;

      const labelDiv = document.createElement('div');
      labelDiv.className = `${isSelected ? 'bg-brand-green text-white border-white/20' : 'bg-white text-gray-800 border-gray-100'} px-3 py-1 rounded-full shadow-lg text-[12px] font-bold mb-1 border whitespace-nowrap transition-colors`;
      labelDiv.innerText = shop.name.match(/（(.+?)）/)?.[1] || shop.name;

      const iconDiv = document.createElement('div');
      iconDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${isSelected ? '#047857' : 'currentColor'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isSelected ? 'text-brand-green fill-brand-green drop-shadow-md' : 'text-gray-400 fill-gray-400'} transition-colors">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" fill="${isSelected ? 'white' : 'none'}" />
        </svg>
      `;

      contentDiv.appendChild(labelDiv);
      contentDiv.appendChild(iconDiv);

      const marker = new AMap.Marker({
        position: [shop.longitude, shop.latitude], // [Lng, Lat]
        content: contentDiv,
        offset: new AMap.Pixel(-16, -48), // Adjust anchor roughly
        extData: { id: shop.id }
      });

      marker.on('click', () => {
        handleMarkerClick(shop);
      });

      map.add(marker);
      markersRef.current.push(marker);
    });

  }, [isMapReady, shops, selectedShopId]);


  const handleMarkerClick = (shop: Shop) => {
    setSelectedShopId(shop.id);
    if (mapInstanceRef.current && shop.longitude && shop.latitude) {
      mapInstanceRef.current.setZoomAndCenter(15, [shop.longitude, shop.latitude]);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const lowerQuery = searchQuery.toLowerCase();
    const matchedShop = shops.find(s => s.name.toLowerCase().includes(lowerQuery));

    if (matchedShop) {
      handleMarkerClick(matchedShop);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelectShop = () => {
    const selectedShop = shops.find(s => s.id === selectedShopId);
    if (selectedShop) {
      navigate('/', { state: { shop: selectedShop } });
    }
  };

  // Current selected shop object
  const selectedShop = shops.find(s => s.id === selectedShopId);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen max-w-md mx-auto bg-background-light">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light">

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 h-full w-full bg-gray-100"
      >
        {/* Helper text if map fails to load due to missing key */}
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Map Loading... (Ensure API Key is Configured)
          </div>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center gap-3 pointer-events-none">
        <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-800 active:scale-95 transition-transform pointer-events-auto">
          <ChevronLeft size={24} />
        </button>
        <div className="relative flex items-center flex-1 pointer-events-auto">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索店铺"
            className="w-full h-11 pl-11 pr-4 bg-white border-none rounded-full text-[15px] font-medium focus:ring-1 focus:ring-brand-green shadow-xl placeholder-gray-400 text-gray-800"
          />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-28 flex flex-col gap-3 z-10 pointer-events-auto">
        <button
          className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
          onClick={() => {
            // Reset view
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setZoomAndCenter(12, [116.40, 39.96]);
              setSelectedShopId('');
            }
          }}
        >
          <Locate size={24} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform" onClick={() => {
          // AMap usually allows layer switching, but simplifying here
          console.log("Layer switch clicked");
        }}>
          <Layers size={24} />
        </button>
      </div>

      {/* Bottom Store Card */}
      {selectedShop && (
        <div className="absolute bottom-4 left-4 right-4 z-10 animate-in slide-in-from-bottom-4 duration-300 fade-in pointer-events-auto">
          <div className="bg-white rounded-[24px] p-5 shadow-2xl border border-gray-100">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                <img src={selectedShop.image} className="w-full h-full object-cover" alt="store" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-[17px]">{selectedShop.name}</h3>
                  <span className="text-brand-green font-bold text-sm">{selectedShop.distance}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">{selectedShop.address || selectedShop.location}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {selectedShop.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-green-50 text-brand-green px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleSelectShop}
              className="w-full mt-4 bg-brand-green text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-lg shadow-brand-green/20 active:bg-[#255a43] transition-colors"
            >
              选择此店铺
            </button>
          </div>
        </div>
      )}
    </div>
  );
};