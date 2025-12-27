import axios from "axios";
import { useState } from "react";

interface Product {
  productId?: number;
  productName?: string;
  quantity?: number;
  categoryId?: number;
  price?: number;
}

export const useProductApi = () => {
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = "http://localhost:8080/api/products";

  const sendRequest = async (product: Product, requestType: string) => {
    try {
      switch (requestType) {
        case "add":
          await axios.post(`${BASE_URL}`, {
            productName: product.productName,
            quantity: product.quantity,
            categoryId: product.categoryId,
            price: product.price,
          });
          break;
        case "modify":
          await axios.put(`${BASE_URL}/${product.productId}`, {
            productName: product.productName,
            quantity: product.quantity,
            categoryId: product.categoryId,
            price: product.price,
          });
          break;

        case "delete":
          await axios.delete(`${BASE_URL}/${product.productId}`);
          break;

        default:
          break;
      }
      setError(null);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return { error, sendRequest };
};
