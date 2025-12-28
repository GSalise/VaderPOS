import React, { useState } from "react";
import { useProductApi } from "../hooks/useProductApi";

interface Product {
  productId?: number;
  productName?: string;
  quantity?: number;
  categoryId?: number;
  price?: number;
}

interface WsState {
  products: Product[];
  categories: unknown[]; // not gonna use this here
  isConnected: boolean;
  error: string | null;
}

export const Products: React.FC<{ wsState: WsState }> = ({ wsState }) => {
  const { products, isConnected, error } = wsState;
  const { sendRequest } = useProductApi();
  const [addProductItem, setAddProductItem] = useState<Product>({
    productId: undefined,
    productName: undefined,
    quantity: undefined,
    categoryId: undefined,
    price: undefined,
  });
  const [modifyProductItem, setModifyProductItem] = useState<Product>({
    productId: undefined,
    productName: undefined,
    quantity: undefined,
    categoryId: undefined,
    price: undefined,
  });
  const [deleteProductItem, setDeleteProductItem] = useState<Product>({
    productId: undefined,
  });

  const handleOnClick = async (actionType: string, productItem: Product) => {
    const result = await sendRequest(productItem, actionType);
    if (!result.success) {
      alert(`Error: ${result.error}`);
      return;
    }
    switch (actionType) {
      case "add":
        setAddProductItem({
          productName: undefined,
          quantity: undefined,
          categoryId: undefined,
          price: undefined,
        });
        break;
      case "modify":
        setModifyProductItem({
          productId: undefined,
          productName: undefined,
          quantity: undefined,
          categoryId: undefined,
          price: undefined,
        });
        break;
      case "delete":
        setDeleteProductItem({ productId: undefined });
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-[#202020] p-4 rounded-md flex flex-col gap-4">
      <h2 className="text-2xl text-white">Products</h2>
      <div className="flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        <span className="text-white text-sm">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-2 rounded-md">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 ">
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Add New Product</h2>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("add", addProductItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product Name:
              </label>
              <input
                type="text"
                required
                pattern="[A-Za-z ]+"
                title="Only letters and spaces are allowed"
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.productName}
                onChange={(e) => {
                  setAddProductItem({
                    ...addProductItem,
                    productName: e.target.value,
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Quantity:</label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.quantity ?? ""}
                onChange={(e) => {
                  setAddProductItem({
                    ...addProductItem,
                    quantity:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.categoryId ?? ""}
                onChange={(e) => {
                  setAddProductItem({
                    ...addProductItem,
                    categoryId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Price:</label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.price ?? ""}
                onChange={(e) => {
                  setAddProductItem({
                    ...addProductItem,
                    price:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>
            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              type="submit"
            >
              Add Product
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Modify Existing Product</h2>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("modify", modifyProductItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.productId ?? ""}
                onChange={(e) => {
                  setModifyProductItem({
                    ...modifyProductItem,
                    productId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product Name:
              </label>
              <input
                type="text"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.productName}
                onChange={(e) => {
                  setModifyProductItem({
                    ...modifyProductItem,
                    productName: e.target.value,
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Quantity:</label>
              <input
                type="number"
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.quantity ?? ""}
                onChange={(e) => {
                  setModifyProductItem({
                    ...modifyProductItem,
                    quantity:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.categoryId ?? ""}
                onChange={(e) => {
                  setModifyProductItem({
                    ...modifyProductItem,
                    categoryId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Price:</label>
              <input
                type="number"
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.price}
                onChange={(e) => {
                  setModifyProductItem({
                    ...modifyProductItem,
                    price:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>
            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              type="submit"
            >
              Modify Product
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Delete Product</h2>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("delete", deleteProductItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={deleteProductItem.productId}
                onChange={(e) => {
                  setDeleteProductItem({
                    ...deleteProductItem,
                    productId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>
            <button
              className="!bg-[#DC1C13] text-white p-2 rounded-md w-full 
             disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              type="submit"
            >
              Delete Product
            </button>
          </form>
        </div>
      </div>
      <div className="border-2 p-4">
        <h2 className="text-white text-xl mb-4">
          Product List ({products.length})
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b border-gray-600 p-2 text-white">ID</th>
              <th className="border-b border-gray-600 p-2 text-white">Name</th>
              <th className="border-b border-gray-600 p-2 text-white">
                Quantity
              </th>
              <th className="border-b border-gray-600 p-2 text-white">
                Category ID
              </th>
              <th className="border-b border-gray-600 p-2 text-white">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-cebter p-4 text-gray-400">
                  No products available
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-800">
                  <td className="border-b border-gray-600 p-2 text-white">
                    {product.productId}
                  </td>
                  <td className="border-b border-gray-600 p-2 text-white">
                    {product.productName}
                  </td>
                  <td className="border-b border-gray-600 p-2 text-white">
                    {product.quantity}
                  </td>
                  <td className="border-b border-gray-600 p-2 text-white">
                    {product.categoryId}
                  </td>
                  <td className="border-b border-gray-600 p-2 text-white">
                    ₱{product.price?.toFixed(2) ?? "0.00"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
