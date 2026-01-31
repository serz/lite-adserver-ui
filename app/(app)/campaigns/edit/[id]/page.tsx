import CampaignEditForm from "./CampaignEditForm";

interface EditCampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params;
  const campaignId = parseInt(id, 10);
  
  return <CampaignEditForm campaignId={campaignId} />;
}
