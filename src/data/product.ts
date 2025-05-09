import { Product } from "../types/product";

interface RupiahFormatter {
  (number: number): string;
}

const rupiah: RupiahFormatter = (number: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
};

export const products: Product[] = [
  {
    id: 1,
    name: "Kopi Susu",
    description: "Kopi Susu adalah minuman khas Indonesia yang terbuat dari kopi yang dicampur dengan susu. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya dan creamy.",
    price: rupiah(12000),
    discountedPrice: 10.000,
    discount: 0,
    image: "/img/kopisusu.png", // Changed to absolute path for local image
    category: "Kopi",
    text: "Saya ingin membeli Kopi Susu",
    isNew: false,
    inStock: true
  },
  {
    id: 2,
    name: "Kopi Susu Aren",
    description: "Kopi Susu Aren adalah minuman khas Indonesia yang terbuat dari kopi yang dicampur dengan susu dan gula aren. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya dan manis.",
    price: rupiah(13000),
    discountedPrice: 199.99,
    discount: 0,
    image: "/img/kopiaren.png",
    category: "Kopi",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Kopi Susu Aren"
  },
  {
    id: 3,
    name: "Kopi Taro",
    description: "Kopi Taro adalah minuman khas Indonesia yang terbuat dari kopi yang dicampur dengan taro. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya dan manis.",
    price: rupiah(15000),
    discountedPrice: 129.99,
    discount: 0,
    image: "/img/kopitaro.png",
    category: "Kopi",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Kopi Taro"
  },
  {
    id: 4,
    name: "Kopi Matcha",
    description: "Kopi Matcha adalah minuman khas Jepang yang terbuat dari kopi yang dicampur dengan matcha. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya dan manis.",
    price: rupiah(15000),
    discountedPrice: 49.99,
    discount: 0,
    image: "/img/kopimatcha.png",
    category: "Kopi",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Kopi Matcha"
  },
  {
    id: 5,
    name: "Americano",
    description: "Americano adalah minuman kopi yang terbuat dari espresso yang dicampur dengan air panas. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya akan cita rasa.",
    price: rupiah(10000),
    discountedPrice: 89.99,
    discount: 0,
    image: "/img/americano.png",
    category: "Kopi",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Americano"
  },
  {
    id: 6,
    name: "Kopi Vannila",
    description: "Kopi Vannila adalah minuman kopi yang terbuat dari espresso yang dicampur dengan air panas dan vanila. Cocok untuk penggemar kopi. Nikmati cita rasa kopi yang kaya akan cita rasa.",
    price: rupiah(15000),
    discountedPrice: 34.99,
    discount: 0,
    image: "/img/kopivanila.png",
    category: "Kopi",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Kopi Vannila"
  },
  {
    id: 7,
    name: "Manggo Latte",
    description: "Mango Latte adalah minuman yang semakin populer di kalangan pecinta minuman menyegarkan. Kombinasi antara rasa manis dari mangga dan krim yang lembut membuatnya menjadi pilihan sempurna untuk dinikmati kapan saja. ",
    price: rupiah(10000),
    discountedPrice: 24.99,
    discount: 0,
    image: "/img/manggolatte.png",
    category: "Shake And Blanded",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Manggo Latte"
  },
  {
    id: 8,
    name: "Red Velvet Latte",
    description: "Red velvet latte adalah minuman kopi yang disajikan dengan perpaduan rasa red velvet, yaitu perpaduan antara rasa cokelat, vanila, dan sedikit rasa krim keju, serta warna merah yang khas.",
    price: rupiah(10000),
    discountedPrice: 39.99,
    discount: 0,
    image: "/img/redvelvet.png",
    category: "Shake And Blanded",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Red Velvet Latte"
  },
  {
    id: 9,
    name: "Taro Latte",
    description: "Taro latte adalah minuman yang populer, terbuat dari campuran susu, bubuk taro (atau ekstrak talas), dan bahan lainnya seperti gula atau krimer.",
    price: rupiah(10000),
    discountedPrice: 49.99,
    discount: 0,
    image: "/img/tarolatte.png",
    category: "Shake And Blanded",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Taro Latte"
  },
  {
    id: 10,
    name: "Matcha Latte",
    description: "Matcha latte adalah minuman yang terbuat dari campuran bubuk matcha (teh hijau halus) dan susu atau pengganti susu. Minuman ini memiliki rasa lembut, creamy, dan sedikit pahit dari matcha.",
    price: rupiah(10000),
    discountedPrice: 59.99,
    discount: 0,
    image: "/img/matchalatte.png",
    category: "Shake And Blanded",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Matcha Latte"
  },
  {
    id: 11,
    name: "Aren Milk Magic",
    description: "Aren milk magic adalah variasi minuman kopi berbasis susu yang menggunakan gula aren sebagai pemanis, dan biasanya disajikan dengan teknik magic latte.",
    price: rupiah(8000),
    discountedPrice: 129.99,
    discount: 0,
    image: "/img/kosong.png",
    category: "Non Coffee",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Aren Milk Magic"
  },
  {
    id: 12,
    name: "Vanilla Milk",
    description: "Susu vanila adalah susu yang diberi rasa vanila, bisa menggunakan vanila asli atau vanila buatan. Vanila menambah rasa manis dan harum pada susu, membuatnya menjadi minuman yang lezat.",
    price: rupiah(8000),
    discountedPrice: 45.99,
    discount: 0,
    image: "/img/kosong.png",
    category: "Non Coffee",
    isNew: false,
    inStock: true,
    text: "Saya ingin membeli Vanilla Milk"
  }
  /*
  {
    id: 13,
    name: "Kopi Dalgona",
    description: "Kopi Dalgona adalah minuman segar yang terbuat dari kopi yang disajikan dengan es. Cocok untuk penggemar minuman segar. Nikmati cita rasa segar yang menggugah selera.",
    price: rupiah(15000),
    discountedPrice: 99.99,
    discount: 0,
    image: "/img/dalgona.jpg",
    category: "Minuman",
    isNew: false,
    inStock: true
  },
  {
    id: 14,
    name: "Es Campur",
    description: "Es Campur adalah minuman segar yang terbuat dari berbagai jenis buah-buahan dan es. Cocok untuk penggemar minuman segar. Nikmati cita rasa segar yang menggugah selera.",
    price: rupiah(10000),
    discountedPrice: 89.99,
    discount: 0,
    image: "/img/campur.jpeg",
    category: "Minuman",
    isNew: true,
    inStock: true
  },
  {
    id: 15,
    name: "Es Jeruk",
    description: "Es Jeruk adalah minuman segar yang terbuat dari jeruk yang disajikan dengan es. Cocok untuk penggemar minuman segar. Nikmati cita rasa segar yang menggugah selera.",
    price: rupiah(5000),
    discountedPrice: 39.99,
    discount: 0,
    image: "/img/jeruk.jpg",
    category: "Minuman",
    isNew: false,
    inStock: true
  },
  {
    id: 16,
    name: "Es Teler",
    description: "Es Teler adalah minuman segar yang terbuat dari berbagai jenis buah-buahan dan es. Cocok untuk penggemar minuman segar. Nikmati cita rasa segar yang menggugah selera.",
    price: rupiah(10000),
    discountedPrice: 159.99,
    discount: 0,
    image: "/img/teler.webp",
    category: "Minuman",
    isNew: true,
    inStock: true
  }
  */
];
