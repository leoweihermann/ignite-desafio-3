import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const findProduct = updatedCart.find(
        (product) => product.id === productId
      );

      const amount = findProduct ? findProduct.amount + 1 : 1;

      const responseStock = await api.get(`/stock/${productId}`);
      const stockAmount = responseStock.data.amount;
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (findProduct) {
        findProduct.amount = amount;
      } else {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;
        const newProduct = {
          ...product,
          amount: 1,
        };
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      if (!newCart.find((product) => product.id === productId)) {
        throw Error();
      }
      const updatedCart = newCart.filter((product) => product.id !== productId);

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const responseStock = await api.get(`/stock/${productId}`);
      const stockAmount = responseStock.data.amount;
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];
      const findProduct = updatedCart.find(
        (product) => product.id === productId
      );
      if (findProduct) {
        findProduct.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
