import { useEffect, useReducer, useRef } from "react";

interface Product {
  productId: number;
  productName: string;
  quantity: number;
  categoryId: number;
  price: number;
}

interface Category {
  categoryId: number;
  categoryName: string;
}

interface ProductUpdate {
  type: "productUpdate";
  timestamp: number;
  updateType: "global" | "single";
  products: Product[];
  updatedProduct: Product;
}

interface CategoryUpdate {
  type: "categoryUpdate";
  timestamp: number;
  updateType: "global" | "single";
  categories: Category[];
  updatedCategory: Category;
}

interface State {
  products: Product[];
  categories: Category[];
  isConnected: boolean;
  error: string | null;
}

type Action =
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "ERROR"; message: string }
  | { type: "PRODUCTS_REFRESHED"; products: Product[] }
  | { type: "PRODUCT_UPDATED"; product: Product }
  | { type: "CATEGORIES_REFRESHED"; categories: Category[] }
  | { type: "CATEGORY_UPDATED"; category: Category };

const HEARTBEAT_INTERVAL = 10000; // 10s
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "CONNECTED":
      return {
        ...state,
        isConnected: true,
        error: null,
      };

    case "DISCONNECTED":
      return {
        ...state,
        isConnected: false,
        error: null,
      };

    case "ERROR":
      return {
        ...state,
        isConnected: false,
        error: action.message,
      };

    case "PRODUCTS_REFRESHED":
      return {
        ...state,
        products: action.products,
      };

    case "PRODUCT_UPDATED":
      const productExists = state.products.some(
        (p) => p.productId === action.product.productId
      );
      if (productExists) {
        return {
          ...state,
          products: state.products.map((currentProduct) =>
            currentProduct.productId === action.product.productId
              ? action.product
              : currentProduct
          ),
        };
      } else {
        return {
          ...state,
          products: [...state.products, action.product],
        };
      }

    case "CATEGORIES_REFRESHED":
      return {
        ...state,
        categories: action.categories,
      };

    case "CATEGORY_UPDATED":
      const categoryExists = state.categories.some(
        (c) => c.categoryId === action.category.categoryId
      );
      if (categoryExists) {
        return {
          ...state,
          categories: state.categories.map((currentCategory) =>
            currentCategory.categoryId === action.category.categoryId
              ? action.category
              : currentCategory
          ),
        };
      } else {
        return {
          ...state,
          categories: [...state.categories, action.category],
        };
      }

    default:
      return state;
  }
}

const initialState: State = {
  products: [],
  categories: [],
  isConnected: false,
  error: null,
};

// check if the update type is a productUpdate or categoryUpdate
// if so, check if the updateType is global or single
// for global, replace the entire products list or categories list
// for single, update only the specific product or category in the list

export const useInventoryWebSocket = (wsUrl: string) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = () => {
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      reconnectAttemptsRef.current = 0;
      dispatch({ type: "CONNECTED" });
      startHeartbeat();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "pong") {
        return; // expected heartbeat response from server
      }

      if (data.type === "productUpdate") {
        const update = data as ProductUpdate;

        if (update.updateType === "global") {
          dispatch({ type: "PRODUCTS_REFRESHED", products: update.products });
        } else if (update.updateType === "single") {
          dispatch({
            type: "PRODUCT_UPDATED",
            product: update.updatedProduct,
          });
        }
      }

      if (data.type === "categoryUpdate") {
        const update = data as CategoryUpdate;

        if (update.updateType === "global") {
          dispatch({
            type: "CATEGORIES_REFRESHED",
            categories: update.categories,
          });
        } else if (update.updateType === "single") {
          dispatch({
            type: "CATEGORY_UPDATED",
            category: update.updatedCategory,
          });
        }
      }
    };

    wsRef.current.onerror = () => {
      dispatch({
        type: "ERROR",
        message: "WebSocket error",
      });
    };

    wsRef.current.onclose = () => {
      stopHeartbeat();
      dispatch({ type: "DISCONNECTED" });

      if (shouldReconnectRef.current) {
        scheduleReconnect();
      }
    };
  };

  const scheduleReconnect = () => {
    const attempt = reconnectAttemptsRef.current++;
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, attempt),
      RECONNECT_MAX_DELAY
    );

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      stopHeartbeat();
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsUrl]);

  return state;
};
