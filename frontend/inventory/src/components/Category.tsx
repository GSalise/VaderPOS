import React, { useState } from "react";
import { useCategoryApi } from "../hooks/useCategoryApi";
import { useCategoryWebSocket } from "../hooks/useCategoryWebSocket";

interface Category {
  categoryId?: number;
  name?: string;
}

const nameRegex = /^[A-Za-z ]*$/;
const numberRegex = /^[0-9]*$/;

export const Category: React.FC = () => {
  const { categories, isConnected, error } = useCategoryWebSocket(
    "ws://localhost:8080/inventory-socket"
  );
  const { sendRequest } = useCategoryApi();
  const [addCategoryItem, setAddCategoryItem] = useState<Category>({
    categoryId: undefined,
    name: undefined,
  });
  const [modifyCategoryItem, setModifyCategoryItem] = useState<Category>({
    categoryId: undefined,
    name: undefined,
  });
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<Category>({
    categoryId: undefined,
  });

  const handleOnClick = async (actionType: string, categoryItem: Category) => {
    const result = await sendRequest(categoryItem, actionType);
    if (!result.success) {
      alert(`Error: ${result.error}`);
      return;
    }
    switch (actionType) {
      case "add":
        setAddCategoryItem({
          categoryId: 0,
          name: "",
        });
        break;
      case "modify":
        setModifyCategoryItem({
          categoryId: 0,
          name: "",
        });
        break;
      case "delete":
        setDeleteCategoryItem({ categoryId: 0 });
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-[#202020] p-4 rounded-md flex flex-col gap-4">
      <h2 className="text-2xl text-white">Categories</h2>
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
          <h2 className="text-white text-xl">Add New Category</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={addCategoryItem.categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setAddCategoryItem({
                      ...addCategoryItem,
                      categoryId: Number(value),
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category Name:
              </label>
              <input
                type="text"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={addCategoryItem.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (nameRegex.test(value)) {
                    setAddCategoryItem({ ...addCategoryItem, name: value });
                  }
                }}
              />
            </div>
            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={!addCategoryItem.name}
              onClick={() => handleOnClick("add", addCategoryItem)}
            >
              Add Category
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Modify Existing Category</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyCategoryItem.categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setModifyCategoryItem({
                      ...modifyCategoryItem,
                      categoryId: Number(value),
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category Name:
              </label>
              <input
                type="text"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyCategoryItem.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (nameRegex.test(value)) {
                    setModifyCategoryItem({
                      ...modifyCategoryItem,
                      name: value,
                    });
                  }
                }}
              />
            </div>

            <button
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={!modifyCategoryItem.categoryId}
              onClick={() => handleOnClick("modify", modifyCategoryItem)}
            >
              Modify Category
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Delete Category</h2>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                className="p-2 rounded-md w-full border border-gray-300"
                value={deleteCategoryItem.categoryId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (numberRegex.test(value)) {
                    setDeleteCategoryItem({
                      ...deleteCategoryItem,
                      categoryId: Number(value),
                    });
                  }
                }}
              />
            </div>
            <button
              className="!bg-[#DC1C13] text-white p-2 rounded-md w-full 
             disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
              disabled={!deleteCategoryItem.categoryId}
              onClick={() => handleOnClick("delete", deleteCategoryItem)}
            >
              Delete Category
            </button>
          </div>
        </div>
      </div>
      <div className="border-2 p-4">
        <h2 className="text-white text-xl mb-4">
          Category List ({categories.length})
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b border-gray-600 p-2 text-white">ID</th>
              <th className="border-b border-gray-600 p-2 text-white">Name</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-cebter p-4 text-gray-400">
                  No categories available
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.categoryId} className="hover:bg-gray-800">
                  <td className="border-b border-gray-600 p-2 text-white">
                    {category.categoryId}
                  </td>
                  <td className="border-b border-gray-600 p-2 text-white">
                    {category.categoryName}
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
