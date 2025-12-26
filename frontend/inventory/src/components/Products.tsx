import React, { useState } from "react";
import { useProductWebSocket } from "../hooks/useProductWebSocket";
import { useProductApi } from "../hooks/useProductApi";

interface Product {
  productId?: number;
  name?: string;
  quantity?: number;
  categoryId?: number;
  price?: number;
}

const nameRegex = /^[A-Za-z ]*$/;
const numberRegex = /^[0-9]*$/;

export const Products: React.FC = () => {
  const { products, isConnected, error } = useProductWebSocket(
    "ws://localhost:8080/inventory-socket"
  );
  const { sendRequest } = useProductApi();
  const [addProductItem, setAddProductItem] = useState<Product>({
    productId: undefined,
    name: undefined,
    quantity: undefined,
    categoryId: undefined,
    price: undefined,
  });
  const [modifyProductItem, setModifyProductItem] = useState<Product>({
    productId: undefined,
    name: undefined,
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
          name: "",
          quantity: 0,
          categoryId: 0,
          price: 0,
        });
        break;
      case "modify":
        setModifyProductItem({
          productId: 0,
          name: "",
          quantity: 0,
          categoryId: 0,
          price: 0,
        });
        break;
      case "delete":
        setDeleteProductItem({ productId: 0 });
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
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product Name:
              </label>
              <input
                type="text"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (nameRegex.test(value)) {
                    setAddProductItem({ ...addProductItem, name: value });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Quantity:</label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setAddProductItem({
                      ...addProductItem,
                      quantity: Number(value),
                    });
                  }
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
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setAddProductItem({
                      ...addProductItem,
                      categoryId: Number(value),
                    });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Price:</label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={addProductItem.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setAddProductItem({
                      ...addProductItem,
                      price: Number(value),
                    });
                  }
                }}
              />
            </div>
            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={
                !addProductItem.name ||
                !addProductItem.quantity ||
                !addProductItem.categoryId ||
                !addProductItem.price
              }
              onClick={() => handleOnClick("add", addProductItem)}
            >
              Add Product
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Modify Existing Product</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product ID:
              </label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.productId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setModifyProductItem({
                      ...modifyProductItem,
                      productId: Number(value),
                    });
                  }
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
                value={modifyProductItem.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (nameRegex.test(value)) {
                    setModifyProductItem({ ...modifyProductItem, name: value });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Quantity:</label>
              <input
                type="number"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setModifyProductItem({
                      ...modifyProductItem,
                      quantity: Number(value),
                    });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setModifyProductItem({
                      ...modifyProductItem,
                      categoryId: Number(value),
                    });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">Price:</label>
              <input
                type="number"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyProductItem.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setModifyProductItem({
                      ...modifyProductItem,
                      price: Number(value),
                    });
                  }
                }}
              />
            </div>
            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={!modifyProductItem.productId}
              onClick={() => handleOnClick("modify", modifyProductItem)}
            >
              Modify Product
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Delete Product</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Product ID:
              </label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={deleteProductItem.productId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setDeleteProductItem({
                      ...deleteProductItem,
                      productId: Number(value),
                    });
                  }
                }}
              />
            </div>
            <button
              className="!bg-[#DC1C13] text-white p-2 rounded-md w-full 
             disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={!deleteProductItem.productId}
              onClick={() => handleOnClick("delete", deleteProductItem)}
            >
              Delete Product
            </button>
          </div>
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
                    ${product.price.toFixed(2)}
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
