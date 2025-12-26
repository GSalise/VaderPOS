import { useEffect, useReducer, useRef } from "react";

interface Product {
  productId: number;
  productName: string;
  quantity: number;
  categoryId: number;
  price: number;
}

interface ProductUpdate {
  type: "productUpdate";
  timestamp: number;
  updateType: "global" | "single";
  products: Product[];
  updatedProduct: Product;
}

interface State {
  products: Product[];
  isConnected: boolean;
  error: string | null;
}

type Action =
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "ERROR"; message: string }
  | { type: "PRODUCTS_REFRESHED"; products: Product[] }
  | { type: "PRODUCT_UPDATED"; product: Product };

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
      const exists = state.products.some(
        (p) => p.productId === action.product.productId
      );
      if (exists) {
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

    default:
      return state;
  }
}

const initialState: State = {
  products: [],
  isConnected: false,
  error: null,
};

// check if the update type is a productUpdate
// if so, check if the updateType is global or single
// for global, replace the entire products list
// for single, update only the specific product in the list

export const useProductWebSocket = (wsUrl: string) => {
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
        return; // heartbeat response
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
