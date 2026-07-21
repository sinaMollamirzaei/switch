import { supabase } from '../supabase';

// public.items columns: id, name, name_fa, parent_id, user_id, sort_order, created_at
export interface Item {
  id: string;
  name: string;
  parentId: string | null;
  userId: string | null;
}

type ItemRow = {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string | null;
};

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    userId: row.user_id,
  };
}

export const itemsService = {
  /** Load all system items (user_id IS NULL) + the current user's custom items. */
  async list(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, parent_id, user_id')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[items.list] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToItem(r as ItemRow));
  },

  /** Load root items only (parent_id IS NULL). */
  async listRoots(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, parent_id, user_id')
      .is('parent_id', null);

    if (error) {
      console.error('[items.listRoots] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToItem(r as ItemRow));
  },

  /** Load child items for a given parent. */
  async listChildren(parentId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, parent_id, user_id')
      .eq('parent_id', parentId)

    if (error) {
      console.error('[items.listChildren] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToItem(r as ItemRow));
  },

  /** Create a custom user-owned item. */
  async create(item: Pick<Item, 'name' | 'parentId'>): Promise<Item> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated: cannot create item');

    const { data, error } = await supabase
      .from('items')
      .insert({
        name: item.name,
        parent_id: item.parentId,
        user_id: user.id,
      })
      .select('id, name, parent_id, user_id')
      .single();

    if (error) {
      console.error('[items.create] error:', error.message, '| code:', error.code);
      throw error;
    }
    return rowToItem(data as ItemRow);
  },

  /** Delete a user-owned item (system items are protected by RLS). */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      console.error('[items.remove] error:', error.message, '| code:', error.code);
      throw error;
    }
  },
};
