import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service } from '../types/database';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default function ProductDetails() {
  const { t, currentLanguage } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<Service[]>([]);

  // New state to control fade-out of previous image
  const [prevOpacity, setPrevOpacity] = useState(1);

  // Add two states to control image transitions
  const [currentTransform, setCurrentTransform] = useState('translateX(0)');
  const [prevTransform, setPrevTransform] = useState('translateX(0)');

  // Use a separate index for the previous image
  const [prevImageIndexState, setPrevImageIndexState] = useState<number | null>(null);
  // Control the transition state (to ensure no repetition or conflict of transitions)
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (id) {
      fetchService(id);
      fetchSuggested();
    }
  }, [id]);

  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Product not found');

      setService(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch other products (without category condition)
  const fetchSuggested = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .neq('id', id)
      .limit(10);
    setSuggested(data || []);
  };

  const handleContact = () => {
    if (!service) return;
    const productUrl = window.location.href;
    const message = `Inquiry about product: ${service.title}\nProduct link: ${productUrl}`;
    window.open(`https://wa.me/201557777587?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Automatic image cycling for the main product only
  const images: string[] = [
    service?.image_url || '',
    ...(Array.isArray(service?.gallery) ? service.gallery : [])
  ].filter(Boolean);

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4500); // 4500 milliseconds (4.5 seconds) period
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    setCurrentImage(0);
  }, [service?.id]);

  // Use usePrevious to save the previous image index
  const previousImageIndex = usePrevious(currentImage);

  // Extracted background styles for reuse
  const backgroundStyles = {
    background: 'var(--background-gradient, var(--background-color, #232526))',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  // Modify the transition effect to be slower: increase transition duration to 3500ms, with a 1000ms delay at the start of movement
  useEffect(() => {
    // Start moving the new image from the left
    setCurrentTransform('translateX(-100%)');
    // The previous image starts from its current position
    setPrevTransform('translateX(0)');
    const timer = setTimeout(() => {
      // The new image moves to its final position
      setCurrentTransform('translateX(0)');
      // The previous image slides out to the right
      setPrevTransform('translateX(100%)');
    }, 1000); // 1000ms delay
    return () => clearTimeout(timer);
  }, [currentImage]);

  // When the image changes, save the previous index before the change
  useEffect(() => {
    setPrevImageIndexState(currentImage);
  }, [currentImage]);

  // Image transition: The new image starts from the right and enters, and the previous image exits to the left
  useEffect(() => {
    // Transition settings
    const DURATION = 1800; // Actual transition duration (ms)
    const DELAY = 0; // No need for additional delay

    // Start transition only if there is no ongoing transition
    setIsTransitioning(true);
    setCurrentTransform('translateX(100%)'); // The new image starts off-screen to the right
    setPrevTransform('translateX(0)');      // The previous image in its place

    // Use requestAnimationFrame to ensure the transition is applied after redraw
    let raf = requestAnimationFrame(() => {
      setCurrentTransform('translateX(0)');     // The new image enters its place
      setPrevTransform('translateX(-100%)');    // The previous image exits to the left
    });

    // After the transition ends, remove the previous image from display
    const cleanup = setTimeout(() => {
      setPrevImageIndexState(null);
      setIsTransitioning(false);
    }, DURATION);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cleanup);
    };
  }, [currentImage]);

  // Correctly determine the product thumbnail (priority: image_url then default screenshot)
  const defaultScreenshot = '/screenshot.jpg'; // Make sure this image is available in the public folder
  const ogImage =
    service?.image_url && service.image_url.trim() !== ''
      ? service.image_url
      : defaultScreenshot;

  if (isLoading) {
    // Added pt-24 here as well for consistency with the main view
    return (
      <div
        className="min-h-screen flex items-center justify-center pt-24"
        style={backgroundStyles}
      >
        <div className="text-xl text-secondary">Loading...</div>
      </div>
    );
  }

  if (error || !service) {
    // Added pt-24 here as well for consistency with the main view
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24"
        style={backgroundStyles}
      >
        <div className="text-xl text-secondary">{error || 'Product not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="bg-secondary text-primary px-6 py-2 rounded-md hover:bg-opacity-90"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
      {/* وسوم Open Graph لعرض صورة المنتج عند مشاركة الرابط (واتساب وغيره) */}
      <Helmet>
        <meta property="og:title" content={service?.title || ''} />
        <meta
          property="og:description"
          content={(currentLanguage === 'en' && service?.description_en && service.description_en.trim())
            ? service.description_en.slice(0, 200)
            : (service?.description || '').slice(0, 200)}
        />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="product" />
        <meta property="og:locale" content={currentLanguage === 'ar' ? 'ar_AR' : 'en_US'} />
        {/* دعم تويتر أيضاً */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={service?.title || ''} />
        <meta
          name="twitter:description"
          content={(currentLanguage === 'en' && service?.description_en && service.description_en.trim())
            ? service.description_en.slice(0, 200)
            : (service?.description || '').slice(0, 200)}
        />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div className="min-h-screen flex flex-col pt-24" style={backgroundStyles}>
        {/* This div centers the product card and grows */}
        <div className="flex items-center justify-center flex-grow py-8">
          <div className="container mx-auto px-4 max-w-4xl lg:max-w-5xl">
            <div className="rounded-md shadow-lg overflow-hidden glass">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="w-full aspect-[4/3] bg-gray-200 relative rounded-t-md md:rounded-none md:rounded-s-md overflow-hidden">
                    {prevImageIndexState !== null && prevImageIndexState !== currentImage && (
                      <img
                        src={images[prevImageIndexState]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          transform: prevTransform,
                          zIndex: 10,
                          transition: isTransitioning
                            ? 'transform 1800ms cubic-bezier(.4,0,.2,1)'
                            : 'none',
                          willChange: 'transform',
                        }}
                        draggable={false}
                      />
                    )}
                    <img
                      src={images[currentImage] || ''}
                      alt={service.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        transform: currentTransform,
                        zIndex: 5,
                        transition: isTransitioning
                          ? 'transform 1800ms cubic-bezier(.4,0,.2,1)'
                          : 'none',
                        willChange: 'transform',
                      }}
                      draggable={false}
                    />
                    {images.length > 1 && (
                      <>
                        {/* مؤشرات الصور */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                          {images.map((img, idx) => (
                            <button
                              key={img + idx}
                              className={`w-2 h-2 rounded-md border-none transition-colors ease-in-out duration-500 ${
                                currentImage === idx ? 'bg-white' : 'bg-white/30'
                              }`}
                              onClick={() => setCurrentImage(idx)}
                              aria-label={`عرض الصورة رقم ${idx + 1}`}
                              type="button"
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <h1 className="text-3xl font-bold mb-4 text-secondary">{service.title}</h1>
                  <p className="text-white mb-6 text-lg leading-relaxed">
                    {(currentLanguage === 'en' && service.description_en && service.description_en.trim()) 
                      ? service.description_en 
                      : service.description}
                  </p>
                  <div className="border-t border-gray-700 pt-6 mb-6">
                    <div className="text-2xl font-bold text-accent mb-6">
                      {service.price}
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleContact}
                        className="flex-1 bg-[#25D366] text-white py-3 px-6 rounded-md font-bold hover:bg-opacity-90 flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-5 w-5" />
                        تواصل معنا للطلب
                      </button>
                      {/* زر مشاركة رابط المنتج مباشرة على واتساب */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`شاهد هذا المنتج: ${service.title}\n${window.location.href}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#128C7E] text-white py-3 px-6 rounded-md font-bold hover:bg-opacity-90 flex items-center justify-center gap-2"
                        style={{ textDecoration: 'none' }}
                      >
                        <MessageCircle className="h-5 w-5" />
                        مشاركة المنتج على واتساب
                      </a>
                      {/* نص توضيحي للمشاركة */}
                      <p className="text-xs text-secondary mt-2 text-center w-full">يمكنك مشاركة رابط المنتج مع أصدقائك على واتساب وسيظهر لهم صورة المنتج تلقائيًا</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* المنتجات المقترحة */}
        {suggested.length > 0 && (
          <div className="container mx-auto px-4 max-w-4xl lg:max-w-5xl mb-8">
            <h2 className="text-xl font-bold text-secondary mb-4">{t('products.alsoAvailable')}</h2>
            <div
              className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {suggested.map((item) => {
                // فقط أول صورة (بدون تقليب تلقائي)
                const images: string[] = [
                  item.image_url || '',
                  ...(Array.isArray(item.gallery) ? item.gallery : [])
                ].filter(Boolean);
                const imageUrl = images[0] || '';

                return (
                  <div
                    key={item.id}
                    className="
                      min-w-[160px] max-w-[180px]
                      md:min-w-[220px] md:max-w-[260px]
                      bg-white/10 rounded-md shadow p-2 flex-shrink-0 cursor-pointer hover:scale-105 transition
                    "
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-24 md:h-40 object-cover rounded"
                    />
                    <div className="mt-2 text-sm md:text-base font-bold text-secondary truncate">{item.title}</div>
                    <div className="text-xs md:text-sm text-accent">{item.price}</div>
                  </div>
                );
              })}
            </div>
            {/* إضافة ستايل لإخفاء الشريط وتفعيل التمرير التلقائي */}
            <style>{`
              .hide-scrollbar {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        )}

        {/* This div contains the "Back to Home" button and is placed below the centered content */}
        <div className="flex justify-center pb-8">
          <button
            onClick={() => navigate('/')}
            className="text-secondary hover:text-accent px-4 py-2 rounded-md border border-secondary hover:border-accent" // Added border for better visibility
          >
            ← العودة للرئيسية
          </button>
        </div>
      </div>
    </>
  );
}