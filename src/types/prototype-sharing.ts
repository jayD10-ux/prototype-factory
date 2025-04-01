
export interface PrototypeShare {
  id: string;
  prototype_id: string;
  shared_by: string;
  email: string | null;
  permission: 'view' | 'edit' | 'admin';
  is_link_share: boolean;
  is_public: boolean;
  created_at: string;
  accessed_at: string | null;
}

export interface ShareFormData {
  email: string;
  permission: 'view' | 'edit' | 'admin';
}

export interface LinkShareOptions {
  is_public: boolean;
  permission: 'view' | 'edit' | 'admin';
}
