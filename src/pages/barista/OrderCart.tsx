import { CartItem } from '../../types';

// Ikon untuk tombol hapus (inline SVG agar tidak butuh dependensi)
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09c-1.18 0-2.09.954-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

// FIX: Memastikan interface ini menerima semua props yang dibutuhkan
interface OrderCartProps {
    cart: CartItem[];
    customerName: string;
    onCustomerNameChange: (name: string) => void;
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export const OrderCart = ({ cart, customerName, onCustomerNameChange, onUpdateQuantity, onRemoveItem, onSubmit, isSubmitting }: OrderCartProps) => {
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
                            <li key={item.id} className="py-3 flex flex-col">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="font-semibold">{new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-sm text-gray-500">{new Intl.NumberFormat('id-ID').format(item.price)} x {item.quantity}</p>
                                    <div className="flex items-center gap-2">
                                        {/* Counter Buttons */}
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold">-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold">+</button>
                                        {/* Remove Button */}
                                        <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700 ml-2">
                                            <TrashIcon />
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
