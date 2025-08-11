// --- FILE: src/components/CartDropdown.tsx (UPDATED) ---
// Deskripsi: Menambahkan prop 'textValue' untuk mengatasi peringatan aksesibilitas.

import React, { useState, useEffect } from "react";
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

  // ... (semua state dan logika hooks lainnya tetap sama) ...
  const {
    isOpen: isOpenFirstModal,
    onOpen: onOpenFirstModal,
    onOpenChange: onOpenChangeFirstModal
  } = useDisclosure();
  const [qrisDataUri, setQrisDataUri] = useState<string>("");
  const [loadingQris, setLoadingQris] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(paymentMethod);
  const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  useEffect(() => {
    if (isOpenFirstModal && selectedPayment === "qris" && totalPrice > 0) {
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
  }, [isOpenFirstModal, selectedPayment, totalPrice]);
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
      onOpenFirstModal();
    }
  };
  const {
    isOpen: isOpenSecondModal,
    onOpen: onOpenSecondModal,
    onOpenChange: onOpenChangeSecondModal
  } = useDisclosure();
  const [selectedCashOption, setSelectedCashOption] = useState<string>("");
  const [inputAmount, setInputAmount] = useState<string>("");
  const handleConfirmOrder = () => {
    onOpenChangeFirstModal(); 
    onOpenSecondModal();
    setSelectedCashOption("");
    setInputAmount("");
  };


  return (
    <>
      {/* ========== Dropdown Keranjang ========== */}
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
          {/* Judul */}
          <DropdownItem key="cart-title" isReadOnly className="py-2" textValue="Shopping Cart">
            <p className="text-lg font-semibold">Shopping Cart</p>
          </DropdownItem>
          <DropdownItem key="divider-1" isReadOnly textValue="Divider">
            <Divider />
          </DropdownItem>
          
          {/* Jika keranjang kosong */}
          {cartItems.length === 0 ? (
            <DropdownItem key="empty-cart" isReadOnly className="py-4" textValue="Your cart is empty">
              <div className="flex flex-col items-center justify-center">
                <Icon icon="lucide:shopping-cart" className="text-3xl text-default-400 mb-2" />
                <p className="text-default-500">Your cart is empty</p>
              </div>
            </DropdownItem>
          ) : (
            <>
              {/* Daftar item */}
              {cartItems.map((item) => (
                <DropdownItem 
                  key={item.product.id} 
                  isReadOnly 
                  className="py-2"
                  // FIX: Menambahkan prop 'textValue' untuk aksesibilitas
                  textValue={`${item.product.name} x ${item.quantity}`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.product.image_url || 'https://placehold.co/48x48/e2e8f0/e2e8f0?text=No-Image'} 
                      alt={item.product.name} 
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-default-500">
                        Rp {item.product.price.toLocaleString('id-ID')} x {item.quantity}
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

              <DropdownItem key="divider-2" isReadOnly textValue="Divider">
                <Divider />
              </DropdownItem>

              {/* Total Harga */}
              <DropdownItem key="total" isReadOnly className="py-2" textValue={`Total: Rp ${totalPrice.toLocaleString('id-ID')}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </DropdownItem>

              {/* Pilih Metode Pembayaran */}
              <DropdownItem key="payment-method" isReadOnly className="py-2" textValue="Payment Method">
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

              {/* Tombol Checkout */}
              <DropdownItem key="checkout" isReadOnly className="py-2" textValue="Checkout">
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

      {/* ... (semua kode untuk Modal tetap sama) ... */}
      <Modal isOpen={isOpenFirstModal} onOpenChange={onOpenChangeFirstModal}>
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
                  onPress={handleConfirmOrder}
                >
                  Confirm Order
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenSecondModal} onOpenChange={onOpenChangeSecondModal}>
        <ModalContent>
          {(onClosePrompt) => (
            <>
              <ModalHeader>Konfirmasi Order</ModalHeader>
              <ModalBody>
                {paymentMethod === "qris" ? (
                  <p>
                    Silahkan konfirmasi orderan Anda. Jika Anda menggunakan QRIS maka lampirkan bukti pembayarannya. 
                    Jika ada pesan yang lainnya, tolong tambahkan setelah mengirim pesan ini.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p>Pilih Pecahan Uang yang akan dibayarkan:</p>
                    <RadioGroup
                      orientation="vertical"
                      value={selectedCashOption}
                      onValueChange={(val) => {
                        setSelectedCashOption(val);
                        if (val !== "input_amount") {
                          setInputAmount("");
                        }
                      }}
                    >
                      <Radio value="100" className="mb-2">
                        Rp. 100.000
                      </Radio>
                      <Radio value="50" className="mb-2">
                        Rp. 50.000
                      </Radio>
                      <Radio value="input_amount" className="mb-2">
                        Input jumlah (masukkan angka)
                      </Radio>
                    </RadioGroup>

                    {selectedCashOption === "input_amount" && (
                      <div className="flex flex-col gap-2">
                        <label htmlFor="inputAmount" className="text-sm font-medium">
                          Masukkan angka:
                        </label>
                        <input
                          id="inputAmount"
                          type="number"
                          min="0"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="border border-default-200 rounded-md p-2"
                          placeholder="Contoh: 20000"
                        />
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="gap-2">
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    onClosePrompt();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  color="primary"
                  isDisabled={
                    paymentMethod === "cash" && (
                      !selectedCashOption ||
                      (selectedCashOption === "input_amount" && !inputAmount)
                    )
                  }
                  onPress={() => {
                    if (paymentMethod === "qris") {
                      const textLines = [
                        ...cartItems.map(item => `${item.product.name} x${item.quantity}`),
                        `Total: Rp.${totalPrice.toFixed(0)}`
                      ];
                      const text = textLines.join("\n");
                      const url = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank");
                      clearCart();
                      onClosePrompt();
                    } else {
                      const itemLines = cartItems.map(item => `${item.product.name} x${item.quantity}`);
                      const totalLine = `Total: Rp.${totalPrice.toFixed(0)}`;

                      let uangLine = "";
                      if (selectedCashOption === "input_amount") {
                        uangLine = `Jumlah Uang yang akan dibayarkan: Rp.${inputAmount}`;
                      } else if (selectedCashOption === "100") {
                        uangLine = `Jumlah Uang yang akan dibayarkan: Rp.100000`;
                      } else if (selectedCashOption === "50") {
                        uangLine = `Jumlah Uang yang akan dibayarkan: Rp.50000`;
                      }

                      const textLines = [
                        ...itemLines,
                        totalLine,
                        uangLine
                      ];
                      const text = textLines.join("\n");
                      const url = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank");
                      clearCart();
                      onClosePrompt();
                    }
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
