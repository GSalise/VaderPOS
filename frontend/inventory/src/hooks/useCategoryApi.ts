import axios from "axios";
import { useState } from "react";

interface Category {
  categoryId?: number;
  name?: string;
}

export const useCategoryApi = () => {
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = "http://localhost:8080/api/categories";

  const sendRequest = async (category: Category, requestType: string) => {
    try {
      switch (requestType) {
        case "add":
          await axios.post(`${BASE_URL}`, {
            categoryId: category.categoryId,
            categoryName: category.name,
          });
          break;
        case "modify":
          await axios.put(`${BASE_URL}/${category.categoryId}`, {
            categoryName: category.name,
          });
          break;

        case "delete":
          await axios.delete(`${BASE_URL}/${category.categoryId}`);
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
