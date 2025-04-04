
export interface Prototype {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
  creator_avatar?: string | null;
  url: string;
  preview_url: string | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image: string | null;
  deployment_status: 'pending' | 'processing' | 'deployed' | 'completed' | 'failed';
  deployment_url: string | null;
  file_path: string | null;
  processed_at: string | null;
  bundle_path: string | null;
  status: string | null;
  figma_url: string | null;
  sandbox_config: Record<string, unknown> | null;
  type: 'upload' | 'figma' | 'external' | null;
}

export interface Collection {
  id: string;
  name: string;
  color: string;  // Making this required to match usage in components
  created_at: string;
  created_by: string;
  prototypeCount?: number;
}

export interface CollectionWithCount extends Collection {
  prototypeCount: number;
}
