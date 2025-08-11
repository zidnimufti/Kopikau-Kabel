import { CartItem } from '../../types';

interface OrderCartProps {
    cart: CartItem[];
    customerName: string;
    onCustomerNameChange: (name: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export const OrderCart = ({ cart, customerName, onCustomerNameChange, onSubmit, isSubmitting }: OrderCartProps) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="bg-white h-full flex flex-col p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Current Order</h2>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => onCustomerNameChange(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500"
                />
            </div>
            <div className="flex-grow overflow-y-auto">
                {cart.length === 0 ? (
                    <p className="text-gray-500">Cart is empty.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {cart.map(item => (
                            <li key={item.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.quantity} x {new Intl.NumberFormat('id-ID').format(item.price)}</p>
                                </div>
                                <p className="font-semibold">{new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg mb-4">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)}</span>
                </div>
                <button
                    onClick={onSubmit}
                    disabled={cart.length === 0 || !customerName || isSubmitting}
                    className="w-full bg-green-600 text-white py-3 rounded-md text-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </button>
            </div>
        </div>
    );
};
