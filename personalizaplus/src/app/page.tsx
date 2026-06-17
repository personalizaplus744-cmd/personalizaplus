import { PublicMarketplace } from "@/components/public-marketplace";
import { products } from "@/data/products";

export default function Home() {
  return <PublicMarketplace initialProducts={products} />;
}
