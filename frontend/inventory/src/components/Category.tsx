import React, { useState } from "react";
import { useCategoryApi } from "../hooks/useCategoryApi";

interface Category {
  categoryId?: number;
  categoryName?: string;
}

interface WsState {
  products: unknown[]; // not gonna use this here
  categories: Category[];
  isConnected: boolean;
  error: string | null;
}

export const Category: React.FC<{ wsState: WsState }> = ({ wsState }) => {
  const { categories, isConnected, error } = wsState;
  const { sendRequest } = useCategoryApi();
  const [addCategoryItem, setAddCategoryItem] = useState<Category>({
    categoryId: undefined,
    categoryName: undefined,
  });
  const [modifyCategoryItem, setModifyCategoryItem] = useState<Category>({
    categoryId: undefined,
    categoryName: undefined,
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
          categoryName: "",
        });
        break;
      case "modify":
        setModifyCategoryItem({
          categoryId: 0,
          categoryName: "",
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
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("add", addCategoryItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={addCategoryItem.categoryId ?? ""}
                onChange={(e) =>
                  setAddCategoryItem({
                    ...addCategoryItem,
                    categoryId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category Name:
              </label>
              <input
                type="text"
                required
                pattern="[A-Za-z ]+"
                title="Only letters and spaces are allowed"
                className="p-2 rounded-md w-full border border-gray-300"
                value={addCategoryItem.categoryName ?? ""}
                onChange={(e) =>
                  setAddCategoryItem({
                    ...addCategoryItem,
                    categoryName: e.target.value,
                  })
                }
              />
            </div>
            <button
              type="submit"
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full
    disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
            >
              Add Category
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Modify Existing Category</h2>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("modify", modifyCategoryItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyCategoryItem.categoryId ?? ""}
                onChange={(e) => {
                  setModifyCategoryItem({
                    ...modifyCategoryItem,
                    categoryId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
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
                pattern="[A-Za-z ]+"
                title="Only letters and spaces are allowed"
                className="p-2 rounded-md w-full border border-gray-300"
                value={modifyCategoryItem.categoryName}
                onChange={(e) => {
                  setModifyCategoryItem({
                    ...modifyCategoryItem,
                    categoryName: e.target.value,
                  });
                }}
              />
            </div>
            <button
              type="submit"
              className="!bg-[#0052FF] text-white p-2 rounded-md w-full  disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
            >
              Modify Category
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full lg:w-1/3">
          <h2 className="text-white text-xl">Delete Category</h2>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleOnClick("delete", deleteCategoryItem);
            }}
          >
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-white whitespace-nowrap">
                Category ID:
              </label>
              <input
                type="number"
                required
                min={1}
                className="p-2 rounded-md w-full border border-gray-300"
                value={deleteCategoryItem.categoryId ?? ""}
                onChange={(e) => {
                  setDeleteCategoryItem({
                    ...deleteCategoryItem,
                    categoryId:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  });
                }}
              />
            </div>
            <button
              type="submit"
              className="!bg-[#DC1C13] text-white p-2 rounded-md w-full 
             disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50"
            >
              Delete Category
            </button>
          </form>
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
