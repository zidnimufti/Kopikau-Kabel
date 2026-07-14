import { CartItem, PaymentMethod } from "../../types";
type Size = "regular" | "large";

interface OrderCartProps {
  cart: CartItem[];
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onUpdateQuantity: (productId: number, newQuantity: number, size: Size) => void;
  onRemoveItem: (productId: number, size: Size) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  paymentMethod: string;
  onPaymentMethodChange: (method: "" | PaymentMethod) => void;
}

export const OrderCart = ({
  cart,
  customerName,
  onCustomerNameChange,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
  isSubmitting,
  paymentMethod,
  onPaymentMethodChange,
}: OrderCartProps) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-white h-full flex flex-col p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Current Order</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Customer Name
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="e.g., John Doe"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {/* Payment Method */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={() => onPaymentMethodChange("cash")}
            />
            Cash
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="qris"
              checked={paymentMethod === "qris"}
              onChange={() => onPaymentMethodChange("qris")}
            />
            QRIS
          </label>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={`${item.id}-${item.size}`} className="py-3 flex flex-col">
                {/* ✅ Show size next to product name */}
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    {item.name} ({item.size === "large" ? "Large" : "Regular"})
                  </p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat("id-ID").format(
                      item.price * item.quantity
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    {item.size === "large" ? "Large" : "Regular"} -{" "}
                    {new Intl.NumberFormat("id-ID").format(item.price)} x{" "}
                    {item.quantity}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1, item.size)
                      }
                      className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1, item.size)
                      }
                      className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id, item.size)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center font-bold text-lg mb-4">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(total)}
          </span>
        </div>
        <button
          onClick={onSubmit}
          disabled={
            cart.length === 0 || !customerName || !paymentMethod || isSubmitting
          }
          className="w-full bg-green-600 text-white py-3 rounded-md text-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};
