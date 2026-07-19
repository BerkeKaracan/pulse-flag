export type Locale = "en" | "tr";

export const LOCALES: Locale[] = ["en", "tr"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "pf-locale";

export type Dictionary = {
  nav: {
    projects: string;
    apiDocs: string;
    signOut: string;
  };
  login: {
    title: string;
    subtitle: string;
    google: string;
    github: string;
    hint: string;
    authError: string;
  };
  common: {
    copy: string;
    copied: string;
    remove: string;
    any: string;
    none: string;
    loading: string;
    saving: string;
    creating: string;
    active: string;
    inactive: string;
    on: string;
    off: string;
    open: string;
    closed: string;
    noDescription: string;
    unnamedRule: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; body: string }[];
  };
  projects: {
    title: string;
    subtitle: string;
    newProject: string;
    apiUnavailable: string;
    empty: string;
    createFirst: string;
    detail: string;
    flags: string;
    loadError: string;
  };
  newProject: {
    step: string;
    title: string;
    subtitle: string;
    name: string;
    slug: string;
    description: string;
    submit: string;
    error: string;
  };
  projectDetail: {
    label: string;
    apiKeyTitle: string;
    apiKeyHint: string;
    copyKey: string;
    curlTitle: string;
    copyCurl: string;
    nextStep: string;
    manageFlags: string;
    createFlag: string;
  };
  flags: {
    title: string;
    subtitle: string;
    create: string;
    empty: string;
    createFirst: string;
    ruleTest: string;
    rulesCount: string;
  };
  newFlag: {
    step: string;
    title: string;
    subtitle: string;
    key: string;
    displayName: string;
    description: string;
    defaultEnabled: string;
    submit: string;
    error: string;
  };
  flagDetail: {
    default: string;
    rulesTitle: string;
    rulesHint: string;
    emptyRules: string;
  };
  addRule: {
    step: string;
    title: string;
    subtitle: string;
    name: string;
    tenants: string;
    tenantsPlaceholder: string;
    tiers: string;
    tiersPlaceholder: string;
    priority: string;
    enableOnMatch: string;
    submit: string;
    error: string;
    requireConstraint: string;
  };
  evaluate: {
    title: string;
    subtitle: string;
    tenant: string;
    tier: string;
    submit: string;
    querying: string;
    error: string;
  };
};

const en: Dictionary = {
  nav: {
    projects: "Projects",
    apiDocs: "API Docs",
    signOut: "Sign out",
  },
  login: {
    title: "Sign in",
    subtitle: "Continue with Google or GitHub to manage your projects.",
    google: "Continue with Google",
    github: "Continue with GitHub",
    hint: "No email/password. Delivery evaluate stays public for product APIs.",
    authError:
      "Sign-in failed. Check Supabase redirect URL: /api/auth/callback",
  },
  common: {
    copy: "Copy",
    copied: "Copied",
    remove: "Remove",
    any: "any",
    none: "none",
    loading: "Loading…",
    saving: "Saving…",
    creating: "Creating…",
    active: "active",
    inactive: "inactive",
    on: "enable",
    off: "disable",
    open: "on",
    closed: "off",
    noDescription: "No description",
    unnamedRule: "Unnamed rule",
  },
  howItWorks: {
    title: "How it works",
    subtitle:
      "Pulse Flag decides; your product only applies the result. This console is for admins.",
    steps: [
      {
        title: "1. Project",
        body: "Register the product that will call evaluate (e.g. SaaS Engine). You get a delivery api_key.",
      },
      {
        title: "2. Flag",
        body: "Create a stable key (e.g. ai.canvas_generator). The consumer asks about this key.",
      },
      {
        title: "3. Rule",
        body: "Target explicit tenant IDs and/or plan tiers. Empty lists do not match everyone.",
      },
      {
        title: "4. Evaluate",
        body: 'The consumer calls GET /evaluate; the response is always { "enabled": true|false }.',
      },
    ],
  },
  projects: {
    title: "Projects",
    subtitle:
      "Register products that consume feature flags (e.g. SaaS Engine). Then add flags and rules, and test with",
    newProject: "New project",
    apiUnavailable:
      "API unreachable. Make sure FastAPI is running, then refresh.",
    empty: "No projects yet. First step: register SaaS Engine.",
    createFirst: "Create first project",
    detail: "Details",
    flags: "Flags",
    loadError: "Failed to load projects",
  },
  newProject: {
    step: "Step 1 / 3",
    title: "Register a project",
    subtitle:
      "This is the product that will call GET /evaluate. After save you receive a delivery api_key.",
    name: "Name",
    slug: "Slug",
    description: "Description",
    submit: "Create project",
    error: "Could not create project",
  },
  projectDetail: {
    label: "Project",
    apiKeyTitle: "Delivery api_key",
    apiKeyHint: "Put this in SaaS Engine as Authorization: Bearer …",
    copyKey: "Copy key",
    curlTitle: "Ready-made curl",
    copyCurl: "Copy curl",
    nextStep:
      "Next: create a flag (e.g. ai.canvas_generator), then target with a rule.",
    manageFlags: "Manage flags",
    createFlag: "Create flag",
  },
  flags: {
    title: "Feature flags",
    subtitle: "Keys your product asks about. Example:",
    create: "Create flag",
    empty: "No flags yet. Step 2: create the ai.canvas_generator key.",
    createFirst: "Create first flag",
    ruleTest: "Rules + test",
    rulesCount: "rules",
  },
  newFlag: {
    step: "Step 2 / 3",
    title: "Create a feature flag",
    subtitle:
      "The key is stable — your product code uses the same string. Changing it breaks the integration.",
    key: "key",
    displayName: "Display name",
    description: "Description",
    defaultEnabled: "Enabled by default when no rule matches",
    submit: "Create flag",
    error: "Could not create flag",
  },
  flagDetail: {
    default: "default",
    rulesTitle: "Targeting rules",
    rulesHint:
      "First matching rule (by priority) wins. If none match, the flag default is used.",
    emptyRules: "No rules yet. Evaluate falls back to the flag default",
  },
  addRule: {
    step: "Step 3 / 3",
    title: "Who should get it?",
    subtitle:
      "Specify at least one tenant ID or tier. Empty fields do not mean “everyone”.",
    name: "Rule name",
    tenants: "tenant_id list (comma-separated)",
    tenantsPlaceholder: "Workspace UUID(s)",
    tiers: "allowed_tiers (comma-separated)",
    tiersPlaceholder: "advanced,pro",
    priority: "priority (lower = first)",
    enableOnMatch: "Enable feature when this rule matches",
    submit: "Add rule",
    error: "Could not add rule",
    requireConstraint: "Add at least one tenant_id or tier.",
  },
  evaluate: {
    title: "Live test",
    subtitle:
      "Try the same call your product will make. Response is always",
    tenant: "tenant_id (workspace UUID)",
    tier: "tier (optional)",
    submit: "Evaluate",
    querying: "Querying…",
    error: "Test failed",
  },
};

const tr: Dictionary = {
  nav: {
    projects: "Projeler",
    apiDocs: "API Docs",
    signOut: "Çıkış",
  },
  login: {
    title: "Giriş yap",
    subtitle: "Projelerinizi yönetmek için Google veya GitHub ile devam edin.",
    google: "Google ile devam et",
    github: "GitHub ile devam et",
    hint: "E-posta/şifre yok. Delivery evaluate ürün API’leri için açık kalır.",
    authError:
      "Giriş başarısız. Supabase redirect URL’yi kontrol edin: /api/auth/callback",
  },
  common: {
    copy: "Kopyala",
    copied: "Kopyalandı",
    remove: "Kaldır",
    any: "herhangi",
    none: "yok",
    loading: "Yükleniyor…",
    saving: "Kaydediliyor…",
    creating: "Oluşturuluyor…",
    active: "aktif",
    inactive: "pasif",
    on: "aç",
    off: "kapat",
    open: "açık",
    closed: "kapalı",
    noDescription: "Açıklama yok",
    unnamedRule: "İsimsiz rule",
  },
  howItWorks: {
    title: "Sistem nasıl çalışır?",
    subtitle:
      "Pulse Flag karar verir; ürün sadece sonucu uygular. Bu panel yöneticiler içindir.",
    steps: [
      {
        title: "1. Project",
        body: "Evaluate çağıracak ürünü kaydedin (örn. SaaS Engine). Size bir delivery api_key verilir.",
      },
      {
        title: "2. Flag",
        body: "Sabit bir key oluşturun (örn. ai.canvas_generator). Motor bu key’i sorar.",
      },
      {
        title: "3. Rule",
        body: "Açıkça tenant_id ve/veya plan tier hedefleyin. Boş liste herkes demek değildir.",
      },
      {
        title: "4. Evaluate",
        body: 'Ürün GET /evaluate çağırır; cevap her zaman { "enabled": true|false }.',
      },
    ],
  },
  projects: {
    title: "Projeler",
    subtitle:
      "Feature flag kullanacak ürünleri (ör. SaaS Engine) burada kaydedin. Sonra flag ve rule ekleyip",
    newProject: "Yeni project",
    apiUnavailable:
      "API’ye ulaşılamıyor. FastAPI’nin çalıştığından emin olun, sonra sayfayı yenileyin.",
    empty: "Henüz project yok. İlk adım: SaaS Engine’i kaydet.",
    createFirst: "İlk project’i oluştur",
    detail: "Detay",
    flags: "Flags",
    loadError: "Projeler yüklenemedi",
  },
  newProject: {
    step: "Adım 1 / 3",
    title: "Project kaydet",
    subtitle:
      "Bu, GET /evaluate çağıracak ürün. Kayıttan sonra bir delivery api_key alırsın.",
    name: "İsim",
    slug: "Slug",
    description: "Açıklama",
    submit: "Project oluştur",
    error: "Project oluşturulamadı",
  },
  projectDetail: {
    label: "Project",
    apiKeyTitle: "Delivery api_key",
    apiKeyHint: "SaaS Engine’e bunu koy: Authorization: Bearer …",
    copyKey: "Key’i kopyala",
    curlTitle: "Hazır çağrı örneği",
    copyCurl: "curl’ü kopyala",
    nextStep:
      "Sonraki adım: flag oluştur (örn. ai.canvas_generator), sonra rule ile hedefle.",
    manageFlags: "Flag’leri yönet",
    createFlag: "Flag oluştur",
  },
  flags: {
    title: "Feature flags",
    subtitle: "Ürünün sorduğu key listesi. Örnek:",
    create: "Flag oluştur",
    empty: "Henüz flag yok. Adım 2: ai.canvas_generator key’ini oluştur.",
    createFirst: "İlk flag’i oluştur",
    ruleTest: "Rule + test",
    rulesCount: "rule",
  },
  newFlag: {
    step: "Adım 2 / 3",
    title: "Feature flag oluştur",
    subtitle:
      "Key sabittir; ürün kodunda aynı string’i kullan. Değiştirmek entegrasyonu kırar.",
    key: "key",
    displayName: "Görünen isim",
    description: "Açıklama",
    defaultEnabled: "Hiçbir rule eşleşmezse varsayılan olarak açık olsun",
    submit: "Flag oluştur",
    error: "Flag oluşturulamadı",
  },
  flagDetail: {
    default: "varsayılan",
    rulesTitle: "Targeting rules",
    rulesHint:
      "İlk eşleşen rule (priority’ye göre) kazanır. Eşleşme yoksa flag varsayılanı kullanılır.",
    emptyRules: "Henüz rule yok. Evaluate şu an varsayılana düşer",
  },
  addRule: {
    step: "Adım 3 / 3",
    title: "Kimler için açılsın?",
    subtitle:
      "En az bir tenant_id veya tier yazın. Boş alan “herkes” anlamına gelmez.",
    name: "Rule adı",
    tenants: "tenant_id listesi (virgülle)",
    tenantsPlaceholder: "Workspace UUID",
    tiers: "allowed_tiers (virgülle)",
    tiersPlaceholder: "advanced,pro",
    priority: "priority (düşük = önce)",
    enableOnMatch: "Eşleşince özelliği aç",
    submit: "Rule ekle",
    error: "Rule eklenemedi",
    requireConstraint: "En az bir tenant_id veya tier ekleyin.",
  },
  evaluate: {
    title: "Canlı test",
    subtitle: "Ürünün soracağı çağrıyı burada dene. Sonuç her zaman",
    tenant: "tenant_id (workspace UUID)",
    tier: "tier (opsiyonel)",
    submit: "Evaluate et",
    querying: "Sorgulanıyor…",
    error: "Test başarısız",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, tr };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "tr";
}
