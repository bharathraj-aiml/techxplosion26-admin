import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage key constants
const STORAGE_KEY_REGS = 'tx26_registrations_v1';
const STORAGE_KEY_QUERIES = 'tx26_contact_queries_v1';
const STORAGE_KEY_SEQ = 'tx26_sequence_v1';

// Initial seed data for admin demonstration
const INITIAL_DEMO_REGS = [
  {
    id: 'demo-reg-1',
    registration_number: 'TX26-0001',
    full_name: 'Aravind Swamy',
    college_name: 'Thiagarajar College of Engineering',
    department: 'Computer Science and Engineering',
    year_of_study: '3rd Year',
    email: 'aravind.s@tce.edu',
    phone: '9876543210',
    whatsapp: '9876543210',
    track: ['Track 1', 'Track 2'],
    events_selected: ['Prompt War', 'Code Jigsaw', 'AI Hackathon'],
    is_team: false,
    team_members: [],
    amount_due: 250,
    amount_paid: 250,
    payment_status: 'paid',
    payment_reference: 'MOCK_PAY_8849201',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'demo-reg-2',
    registration_number: 'TX26-0002',
    full_name: 'Priya Dharshini',
    college_name: 'SRM MCET Madurai',
    department: 'Artificial Intelligence & Data Science',
    year_of_study: '2nd Year',
    email: 'priya.d@srmmcet.edu.in',
    phone: '9123456789',
    whatsapp: '9123456789',
    track: ['Track 1'],
    events_selected: ['Clash of Code', 'IPL Auction'],
    is_team: true,
    team_members: [
      { name: 'Karthik Raja', email: 'karthik@srmmcet.edu.in' }
    ],
    amount_due: 500,
    amount_paid: 500,
    payment_status: 'paid',
    payment_reference: 'MOCK_PAY_9910482',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'demo-reg-3',
    registration_number: null,
    full_name: 'Venkatesh K',
    college_name: 'Mepco Schlenk Engineering College',
    department: 'Information Technology',
    year_of_study: '4th Year',
    email: 'venkat.k@mepco.ac.in',
    phone: '9443109876',
    whatsapp: '9443109876',
    track: ['Track 2'],
    events_selected: ['AI Hackathon'],
    is_team: true,
    team_members: [
      { name: 'Subhash M', email: 'subhash@mepco.ac.in' },
      { name: 'Ganesh P', email: 'ganesh@mepco.ac.in' }
    ],
    amount_due: 750,
    amount_paid: 0,
    payment_status: 'pending',
    payment_reference: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const INITIAL_DEMO_QUERIES = [
  {
    id: 'query-1',
    name: 'Senthil Kumar',
    email: 'senthil.k@gmail.com',
    message: 'Are accommodation facilities available for outstation participants on 29th Sep night?',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Helper to access LocalStorage
function getLocalRegs() {
  const stored = localStorage.getItem(STORAGE_KEY_REGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_REGS, JSON.stringify(INITIAL_DEMO_REGS));
    return INITIAL_DEMO_REGS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_DEMO_REGS;
  }
}

function setLocalRegs(regs) {
  localStorage.setItem(STORAGE_KEY_REGS, JSON.stringify(regs));
}

function getNextSequentialNumber() {
  let seq = parseInt(localStorage.getItem(STORAGE_KEY_SEQ) || '3', 10);
  seq += 1;
  localStorage.setItem(STORAGE_KEY_SEQ, seq.toString());
  const numStr = seq.toString().padStart(4, '0');
  return `TX26-${numStr}`;
}

function getLocalQueries() {
  const stored = localStorage.getItem(STORAGE_KEY_QUERIES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_QUERIES, JSON.stringify(INITIAL_DEMO_QUERIES));
    return INITIAL_DEMO_QUERIES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_DEMO_QUERIES;
  }
}

function setLocalQueries(queries) {
  localStorage.setItem(STORAGE_KEY_QUERIES, JSON.stringify(queries));
}

/**
 * 1. Create a new registration row in pending status
 */
export async function createRegistration(data) {
  const newId = 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const record = {
    id: newId,
    registration_number: null,
    full_name: data.full_name,
    college_name: data.college_name,
    department: data.department,
    year_of_study: data.year_of_study,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp || data.phone,
    track: data.track,
    events_selected: data.events_selected || [],
    is_team: !!data.is_team,
    team_members: data.team_members || [],
    amount_due: data.amount_due || 250,
    amount_paid: 0,
    payment_status: 'pending',
    payment_reference: null,
    created_at: now,
    updated_at: now
  };

  // 1. Local Fallback
  const localRegs = getLocalRegs();
  localRegs.unshift(record);
  setLocalRegs(localRegs);

  // 2. Supabase push if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: dbData, error } = await supabase
        .from('registrations')
        .insert([record])
        .select()
        .single();
      if (!error && dbData) {
        return dbData;
      }
    } catch (e) {
      console.warn('Supabase insert failed, using local record:', e);
    }
  }

  return record;
}

/**
 * 2. Get registration by ID
 */
export async function getRegistrationById(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local:', e);
    }
  }

  const localRegs = getLocalRegs();
  return localRegs.find(r => r.id === id) || null;
}

/**
 * 3. Update registration payment status
 */
export async function updatePaymentStatus(id, { payment_status, payment_reference }) {
  const now = new Date().toISOString();

  // Local update
  const localRegs = getLocalRegs();
  const index = localRegs.findIndex(r => r.id === id);
  let updatedRecord = null;

  if (index !== -1) {
    const existing = localRegs[index];
    const isPayingNow = payment_status === 'paid' && existing.payment_status !== 'paid';
    
    // Assign sequential registration number if confirming paid
    const regNumber = isPayingNow
      ? existing.registration_number || getNextSequentialNumber()
      : existing.registration_number;

    updatedRecord = {
      ...existing,
      payment_status,
      payment_reference: payment_reference || existing.payment_reference,
      registration_number: regNumber,
      amount_paid: payment_status === 'paid' ? existing.amount_due : existing.amount_paid,
      updated_at: now
    };

    localRegs[index] = updatedRecord;
    setLocalRegs(localRegs);
  }

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        payment_status,
        payment_reference,
        updated_at: now
      };
      const { data: dbData, error } = await supabase
        .from('registrations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && dbData) {
        return dbData;
      }
    } catch (e) {
      console.warn('Supabase payment update failed:', e);
    }
  }

  return updatedRecord;
}

/**
 * 4. Get all registrations (for Admin)
 */
export async function getAllRegistrations() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getAllRegistrations failed, using local:', e);
    }
  }
  return getLocalRegs();
}

/**
 * 5. Delete registration (for Admin)
 */
export async function deleteRegistration(id) {
  const localRegs = getLocalRegs();
  const filtered = localRegs.filter(r => r.id !== id);
  setLocalRegs(filtered);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('registrations').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }
  return true;
}

/**
 * 6. Save Contact Query
 */
export async function saveContactQuery({ name, email, message }) {
  const record = {
    id: 'query-' + Date.now(),
    name,
    email,
    message,
    created_at: new Date().toISOString()
  };

  const localQueries = getLocalQueries();
  localQueries.unshift(record);
  setLocalQueries(localQueries);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('contact_queries').insert([record]);
    } catch (e) {
      console.warn('Supabase query save failed:', e);
    }
  }
  return record;
}

/**
 * 7. Get Contact Queries (for Admin)
 */
export async function getAllContactQueries() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('contact_queries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetch queries failed, using local:', e);
    }
  }
  return getLocalQueries();
}
