import { SellerPanel } from "@/components/seller-panel";
import { products } from "@/data/products";
import { initialPanelUsers } from "@/data/users";

export default function PanelPage() {
  return <SellerPanel initialUsers={initialPanelUsers} products={products} />;
}
