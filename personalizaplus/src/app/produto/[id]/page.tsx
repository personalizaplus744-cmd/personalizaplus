import { ProductDetailsView } from "@/components/product-details-view";
import { products } from "@/data/products";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    sellerName?: string;
    sellerPhone?: string;
    sellerLocation?: string;
  }>;
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sellerQuery = await searchParams;
  return <ProductDetailsView id={id} initialProducts={products} sellerQuery={sellerQuery} />;
}
