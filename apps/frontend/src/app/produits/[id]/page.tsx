import { notFound } from "next/navigation";

import { fetchProductById } from "@/lib/api";
import type { ProduitRead } from "@/lib/api";
import { ProductDetailView } from "./product-detail-view";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product: ProduitRead;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  return <ProductDetailView product={product} />;
}