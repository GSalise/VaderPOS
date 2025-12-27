import { Products } from "./components/Products";
import { Category } from "./components/Category";
import { useInventoryWebSocket } from "./hooks/useInventoryWebSocket";

function App() {
  const wsState = useInventoryWebSocket("ws://localhost:8080/inventory-socket");
  return (
    <div className="bg-[#090909] min-h-screen min-w-screen">
      <h1 className="text-2xl font-bold text-center p-5">
        Inventory Management System
      </h1>
      <div className="flex flex-col gap-4 p-5 justify-center">
        <Products wsState={wsState} />
        <Category wsState={wsState} />
      </div>
    </div>
  );
}

export default App;
