import { StudioOrderDetail } from "@/components/studio-workspace";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudioOrderDetail orderId={id} />;
}