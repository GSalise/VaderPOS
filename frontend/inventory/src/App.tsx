import { Products } from "./components/Products";
import { Category } from "./components/Category";

function App() {
  return (
    <div className="bg-[#090909] min-h-screen min-w-screen">
      <h1 className="text-2xl font-bold text-center p-5">
        Inventory Management System
      </h1>
      <div className="flex flex-col gap-4 p-5 justify-center">
        <Products />
        <Category />
      </div>
    </div>
  );
}

export default App;
