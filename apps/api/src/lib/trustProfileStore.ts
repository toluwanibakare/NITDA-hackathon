import { normalizeTrustProfile, type TrustProfile } from '@thirdeye/shared';
import { integrationRegistry } from '../integrations/registry.js';
import { isSupabaseConfigured, supabase } from '../supabase.js';

function toTrustProfile(row: any): TrustProfile | null {
  if (!row || !row.id) {
    return null;
  }

  return normalizeTrustProfile({
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    allowedEndpoints: row.allowed_endpoints ?? row.allowedEndpoints ?? [],
    allowedMethods: row.allowed_methods ?? row.allowedMethods ?? ['GET', 'POST'],
    allowedData: row.allowed_data ?? row.allowedData ?? [],
    forbiddenData: row.forbidden_data ?? row.forbiddenData ?? [],
    expectedRequestRate: row.expected_request_rate ?? row.expectedRequestRate ?? 100,
  });
}

function fallbackProfiles(): TrustProfile[] {
  return Object.values(integrationRegistry).map(row => toTrustProfile(row)!).filter(Boolean);
}

export async function getAllTrustProfiles(): Promise<TrustProfile[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('integrations').select('*');
    if (!error && data && data.length > 0) {
      const profiles = data.map(toTrustProfile).filter(Boolean) as TrustProfile[];
      if (profiles.length > 0) return profiles;
    }
  }

  return fallbackProfiles();
}

export async function getTrustProfileById(id: string): Promise<TrustProfile | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return toTrustProfile(data);
    }
  }

  const profile = Object.values(integrationRegistry).find(row => row.id === id);
  return profile ? toTrustProfile(profile) : null;
}
