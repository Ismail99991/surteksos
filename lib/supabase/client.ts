// Mock Supabase Client for development
export const supabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (col: string, val: any) => Promise.resolve({ data: [], error: null }),
      ilike: (col: string, pattern: string) => Promise.resolve({ data: [], error: null }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      order: (column: string, options: { ascending: boolean }) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => Promise.resolve({ data: [data], error: null }),
    update: (data: any) => ({
      eq: () => Promise.resolve({ data: [data], error: null })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: [], error: null })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ 
      data: { 
        user: { 
          id: 'mock-user', 
          email: 'mock@example.com' 
        } 
      }, 
      error: null 
    })
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} })
  })
};

export default supabase;
