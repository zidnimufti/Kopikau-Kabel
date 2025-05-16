import React, { useState,useEffect } from "react";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Button, 
  Badge,
  Divider,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCart, PaymentMethod } from "../components/CartContext";
import { generateQrisBase64 } from "@/components/qris";




export const CartDropdown: React.FC = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    totalItems, 
    totalPrice,
    paymentMethod,
    setPaymentMethod,
    clearCart
  } = useCart();

  const {
   isOpen: isPromptOpen,
   onOpen: onPromptOpen,
   onOpenChange: onPromptChange
 } = useDisclosure();
  
  // state untuk menyimpan data URI QRIS
  const [qrisDataUri, setQrisDataUri] = useState<string>("");
  // loading indicator
  const [loadingQris, setLoadingQris] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(paymentMethod);

  // Generate QRIS setiap modal dibuka dan payment QRIS dipilih
  useEffect(() => {
    if (isOpen && selectedPayment === "qris" && totalPrice > 0) {
      setLoadingQris(true);
      generateQrisBase64(totalPrice, 300)
        .then((dataUri) => {
          setQrisDataUri(dataUri);
        })
        .catch((err) => {
          console.error("Gagal generate QRIS:", err);
        })
        .finally(() => setLoadingQris(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedPayment, totalPrice]);

  const handleQuantityChange = (productId: number, change: number) => {
    const item = cartItems.find(item => item.product.id === productId);
    if (item) {
      updateQuantity(productId, item.quantity + change);
    }
  };

  const handlePaymentChange = (value: string) => {
    setSelectedPayment(value as PaymentMethod);
  };

  const handleCheckout = () => {
    if (selectedPayment) {
      setPaymentMethod(selectedPayment);
      onOpen();
    }
  };

  const handleConfirmOrder = () => {
  // tutup modal checkout pertama
   onOpenChange();
   // buka modal prompt konfirmasi
   onPromptOpen();
   // (jangan clearCart di sini supaya user bisa lihat order-nya di prompt)
 };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button 
            isIconOnly 
            variant="light" 
            aria-label="Shopping Cart"
            className="relative"
          >
            <Icon icon="lucide:shopping-cart" className="text-xl" />
            {totalItems > 0 && (
              <Badge 
                color="danger" 
                shape="circle" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="Cart Items" 
          className="w-80"
          disallowEmptySelection
        >
          <DropdownItem key="cart-title" isReadOnly className="py-2">
            <p className="text-lg font-semibold">Shopping Cart</p>
          </DropdownItem>
          <DropdownItem key="divider-1" isReadOnly>
            <Divider />
          </DropdownItem>
          
          {cartItems.length === 0 ? (
            <DropdownItem key="empty-cart" isReadOnly className="py-4">
              <div className="flex flex-col items-center justify-center">
                <Icon icon="lucide:shopping-cart" className="text-3xl text-default-400 mb-2" />
                <p className="text-default-500">Your cart is empty</p>
              </div>
            </DropdownItem>
          ) : (
            <>
              {cartItems.map((item) => (
                <DropdownItem key={item.product.id} isReadOnly className="py-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-default-500">
                        {item.product.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="flat" 
                        onPress={() => handleQuantityChange(item.product.id, -1)}
                      >
                        <Icon icon="lucide:minus" style={{ fontSize: 14 }} />
                      </Button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="flat" 
                        onPress={() => handleQuantityChange(item.product.id, 1)}
                      >
                        <Icon icon="lucide:plus" style={{ fontSize: 14 }} />
                      </Button>
                    </div>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      variant="light" 
                      color="danger"
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <Icon icon="lucide:trash-2" style={{ fontSize: 14 }} />
                    </Button>
                  </div>
                </DropdownItem>
              ))}
              
              <DropdownItem key="divider-2" isReadOnly>
                <Divider />
              </DropdownItem>
              
              <DropdownItem key="total" isReadOnly className="py-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">Rp. {totalPrice.toFixed(0)}</span>
                </div>
              </DropdownItem>
              
              <DropdownItem key="payment-method" isReadOnly className="py-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Payment Method:</p>
                  <RadioGroup 
                    orientation="horizontal" 
                    value={selectedPayment || ""} 
                    onValueChange={handlePaymentChange}
                  >
                    <Radio value="cash">Cash</Radio>
                    <Radio value="qris">QRIS</Radio>
                  </RadioGroup>
                </div>
              </DropdownItem>
              
              <DropdownItem key="checkout" isReadOnly className="py-2">
                <Button 
                  color="primary" 
                  className="w-full" 
                  isDisabled={!selectedPayment}
                  onPress={handleCheckout}
                >
                  Checkout
                </Button>
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {paymentMethod === "qris" ? "Scan QR Code to Pay" : "Cash Payment"}
              </ModalHeader>
              <ModalBody>
                {paymentMethod === "qris" ? (
                  <div className="flex flex-col items-center">
                    <div className="border border-default-200 p-4 rounded-lg mb-4">
                      {loadingQris ? (
                        <p>Memuat QRIS…</p>
                      ) : (
                        <img
                          src={qrisDataUri}
                          alt={`QRIS untuk Rp${totalPrice.toLocaleString("id-ID")}`}
                          className="w-64 h-64 object-contain"
                        />
                      )}
                    </div>
                    <p className="text-center text-default-500">
                      Scan kode di atas untuk membayar Rp{totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Icon icon="lucide:banknote" className="text-6xl text-success mb-4" />
                    <p className="text-center text-default-500">
                      Silahkan siapkan uang sebesar Rp.{totalPrice.toFixed(0)} untuk pembayaran
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleConfirmOrder}>
                  Confirm Order
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={isPromptOpen} onOpenChange={onPromptChange}>
        <ModalContent>
         {(onClosePrompt) => (
          <>
            <ModalHeader>Konfirmasi Order</ModalHeader>
            <ModalBody>
              <p>Silahkan konfirmasi orderan Anda. Jika anda menggunakan QRIS maka lampirkan bukti pembayarannya. Jika ada pesan yang lainnya, tolong tambahkan setelah mengirim pesan ini.</p>
            </ModalBody>
            <ModalFooter className="gap-2">
              <Button
                color="primary"
                onPress={() => {
                // ganti URL ini sesuai tujuanmu
                const text = cartItems
                  .map(item => `${item.product.name} x${item.quantity}`)
                  .join(", ") + ` | Total: Rp.${totalPrice.toFixed(0)}`;
                const url = `https://api.whatsapp.com/send/?phone=%2B6285955005269&text=${encodeURIComponent(text)}`;
                window.open(url, "_blank");
                // baru clear cart setelah user diarahkan
                clearCart();
                onClosePrompt();
              }}
          >
            Konfirmasi
          </Button>
        </ModalFooter>
      </>
       )}
        </ModalContent>
      </Modal>
    </>
  );
};