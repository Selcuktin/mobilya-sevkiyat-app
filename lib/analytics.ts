// Google Analytics 4 implementation

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID) return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA_TRACKING_ID || !window.gtag) return;

  window.gtag('config', GA_TRACKING_ID, {
    page_title: title || document.title,
    page_location: url,
  });
};

// Track events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!GA_TRACKING_ID || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Business-specific tracking events
export const trackBusinessEvents = {
  // Product events
  productView: (productId: string, productName: string, category: string) => {
    trackEvent('view_item', 'ecommerce', `${productName} (${productId})`, 1);
    
    window.gtag?.('event', 'view_item', {
      currency: 'TRY',
      value: 0,
      items: [{
        item_id: productId,
        item_name: productName,
        item_category: category,
        quantity: 1
      }]
    });
  },

  productAdd: (productId: string, productName: string, price: number) => {
    trackEvent('add_product', 'inventory', productName, 1);
    
    window.gtag?.('event', 'add_to_cart', {
      currency: 'TRY',
      value: price,
      items: [{
        item_id: productId,
        item_name: productName,
        price: price,
        quantity: 1
      }]
    });
  },

  // Customer events
  customerAdd: (customerId: string) => {
    trackEvent('customer_add', 'crm', customerId, 1);
  },

  customerView: (customerId: string) => {
    trackEvent('customer_view', 'crm', customerId, 1);
  },

  // Shipment events
  shipmentCreate: (shipmentId: string, value: number, itemCount: number) => {
    trackEvent('shipment_create', 'logistics', shipmentId, value);
    
    window.gtag?.('event', 'purchase', {
      transaction_id: shipmentId,
      currency: 'TRY',
      value: value,
      items: [{
        item_id: shipmentId,
        item_name: 'Shipment',
        quantity: itemCount,
        price: value
      }]
    });
  },

  shipmentStatusUpdate: (shipmentId: string, status: string) => {
    trackEvent('shipment_status_update', 'logistics', `${shipmentId}-${status}`, 1);
  },

  // Report events
  reportGenerate: (reportType: string, format: string) => {
    trackEvent('report_generate', 'reports', `${reportType}-${format}`, 1);
  },

  reportDownload: (reportType: string, format: string) => {
    trackEvent('report_download', 'reports', `${reportType}-${format}`, 1);
  },

  // Search events
  search: (query: string, resultsCount: number) => {
    trackEvent('search', 'navigation', query, resultsCount);
    
    window.gtag?.('event', 'search', {
      search_term: query,
      results_count: resultsCount
    });
  },

  // User engagement
  sessionStart: () => {
    trackEvent('session_start', 'engagement', 'user_session', 1);
  },

  featureUse: (featureName: string) => {
    trackEvent('feature_use', 'engagement', featureName, 1);
  },

  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error_occurred', 'errors', `${errorType}: ${errorMessage}`, 1);
  }
};

// Enhanced ecommerce tracking
export const trackEcommerce = {
  viewItemList: (items: any[], listName: string) => {
    if (!window.gtag) return;
    
    window.gtag('event', 'view_item_list', {
      item_list_name: listName,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1
      }))
    });
  },

  selectItem: (item: any, listName: string) => {
    if (!window.gtag) return;
    
    window.gtag('event', 'select_item', {
      item_list_name: listName,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price
      }]
    });
  }
};

// User properties
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  if (!window.gtag) return;
  
  window.gtag('config', GA_TRACKING_ID, {
    user_id: userId,
    custom_map: properties
  });
};

// Conversion tracking
export const trackConversion = (conversionId: string, value?: number) => {
  if (!window.gtag) return;
  
  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value: value,
    currency: 'TRY'
  });
};