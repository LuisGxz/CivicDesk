export type Lang = 'en' | 'es';

/** Status → human label, per language. */
export const STATUS_LABEL: Record<Lang, Record<string, string>> = {
  en: { Draft: 'Draft', Submitted: 'Received', UnderReview: 'Under review', NeedsInfo: 'Action needed', Approved: 'Approved', Rejected: 'Rejected' },
  es: { Draft: 'Borrador', Submitted: 'Recibida', UnderReview: 'En revisión', NeedsInfo: 'Requiere acción', Approved: 'Aprobada', Rejected: 'Rechazada' }
};

export const CATEGORY_LABEL: Record<Lang, Record<string, string>> = {
  en: { Business: 'Business', Permits: 'Permits', Records: 'Records', Property: 'Property', Community: 'Community' },
  es: { Business: 'Negocios', Permits: 'Permisos', Records: 'Registros', Property: 'Propiedad', Community: 'Comunidad' }
};

export const ROLE_LABEL: Record<Lang, Record<string, string>> = {
  en: { Citizen: 'Citizen', Officer: 'Officer', Supervisor: 'Supervisor' },
  es: { Citizen: 'Ciudadano', Officer: 'Funcionario', Supervisor: 'Supervisor' }
};

export interface Copy {
  brand: string; brandSub: string; officialBanner: string;
  nav: { catalog: string; myApplications: string; inbox: string; about: string; signIn: string; signOut: string; signedIn: string };
  common: {
    loading: string; back: string; next: string; cancel: string; save: string; submit: string; search: string;
    fee: string; free: string; processingTime: string; reference: string; submitted: string; updated: string;
    status: string; service: string; applicant: string; required: string; optional: string; close: string; retry: string;
  };
  auth: {
    title: string; subtitle: string; email: string; password: string; fullName: string;
    login: string; register: string; noAccount: string; haveAccount: string; createAccount: string;
    demoAccounts: string; useAccount: string; aboutLink: string;
    citizenDemo: string; officerDemo: string; supervisorDemo: string;
  };
  home: { heroTitle: string; heroSubtitle: string; searchPlaceholder: string; all: string; empty: string; apply: string };
  apply: {
    title: string; step: string; details: string; documents: string; review: string; saveContinue: string;
    uploadHere: string; uploadHint: string; maxSize: string; verified: string; uploading: string; replace: string;
    reviewIntro: string; confirmSubmit: string; draftSaved: string; submitted: string;
  };
  tracker: {
    title: string; subtitle: string; empty: string; emptyCta: string; viewDetail: string; newApplication: string;
  };
  detail: {
    timeline: string; submittedInfo: string; details: string; documents: string; messages: string;
    download: string; provideInfo: string; resubmit: string; resubmitNote: string; notifyNote: string;
  };
  officer: {
    inbox: string; queue: string; allStatuses: string; mineOnly: string; searchPlaceholder: string;
    claim: string; requestInfo: string; approve: string; reject: string; assign: string; assignTo: string;
    internalNote: string; addComment: string; postComment: string; messageToCitizen: string;
    verify: string; rejectDoc: string; auditTrail: string; staff: string; noResults: string;
    requestInfoTitle: string; rejectTitle: string; approveTitle: string; messageEn: string; messageEs: string;
    reasonEn: string; reasonEs: string; noteEnOptional: string; noteEsOptional: string; confirm: string;
    unassigned: string; assignedTo: string; dashboard: string;
  };
  guide: {
    title: string; intro: string; gotIt: string; replay: string; youAre: string; explore: string;
    citizenTip: string; officerTip: string; supervisorTip: string; ahaCitizen: string; ahaOfficer: string;
  };
}

const EN: Copy = {
  brand: 'CivicDesk', brandSub: 'Citizen services portal',
  officialBanner: 'An official website of the City of Riverton government',
  nav: { catalog: 'Services', myApplications: 'My applications', inbox: 'Officer inbox', about: 'About this project', signIn: 'Sign in', signOut: 'Sign out', signedIn: 'Signed in' },
  common: {
    loading: 'Loading…', back: 'Back', next: 'Next', cancel: 'Cancel', save: 'Save', submit: 'Submit', search: 'Search',
    fee: 'Fee', free: 'Free', processingTime: 'Processing time', reference: 'Application', submitted: 'Submitted', updated: 'Updated',
    status: 'Status', service: 'Service', applicant: 'Applicant', required: 'Required', optional: 'Optional', close: 'Close', retry: 'Try again'
  },
  auth: {
    title: 'Sign in to CivicDesk', subtitle: 'Apply for, pay and track your municipal services online.',
    email: 'Email', password: 'Password', fullName: 'Full name',
    login: 'Sign in', register: 'Create account', noAccount: "Don't have an account?", haveAccount: 'Already have an account?', createAccount: 'Create one',
    demoAccounts: 'Demo accounts — one click to explore each role', useAccount: 'Use', aboutLink: 'About this project →',
    citizenDemo: 'Citizen — file & track applications', officerDemo: 'Officer — review the queue', supervisorDemo: 'Supervisor — assign & audit'
  },
  home: {
    heroTitle: 'What do you need to get done today?',
    heroSubtitle: 'Apply, pay, and track your municipal services online — no lines.',
    searchPlaceholder: 'e.g. business license, parking permit…', all: 'All', empty: 'No services match your search.', apply: 'Start application'
  },
  apply: {
    title: 'Application', step: 'Step', details: 'Details', documents: 'Documents', review: 'Review', saveContinue: 'Save & continue',
    uploadHere: 'Click to upload or drag a file here', uploadHint: 'PDF, JPG or PNG · max 10 MB', maxSize: 'Max 10 MB per file',
    verified: 'Verified', uploading: 'Uploading…', replace: 'Replace',
    reviewIntro: 'Review your application before submitting. The fee is collected on submission.',
    confirmSubmit: 'Submit application', draftSaved: 'Draft saved', submitted: 'Application submitted'
  },
  tracker: {
    title: 'My applications', subtitle: 'Track every request and respond when the city needs more from you.',
    empty: 'You have no applications yet.', emptyCta: 'Browse services', viewDetail: 'View', newApplication: 'New application'
  },
  detail: {
    timeline: 'Status timeline', submittedInfo: 'Submitted', details: 'Your details', documents: 'Documents', messages: 'Messages',
    download: 'Download', provideInfo: 'The city needs more information', resubmit: 'Resubmit application', resubmitNote: 'Add a note (optional)',
    notifyNote: "We'll notify you by email whenever the status changes."
  },
  officer: {
    inbox: 'Officer inbox', queue: 'Application queue', allStatuses: 'All statuses', mineOnly: 'Assigned to me', searchPlaceholder: 'Search by reference or citizen…',
    claim: 'Take this case', requestInfo: 'Request changes', approve: 'Approve', reject: 'Reject', assign: 'Assign', assignTo: 'Assign to',
    internalNote: 'Internal note (officers only)', addComment: 'Add a note', postComment: 'Post', messageToCitizen: 'Message to citizen',
    verify: 'Mark verified', rejectDoc: 'Reject', auditTrail: 'Audit trail', staff: 'Staff', noResults: 'No applications match these filters.',
    requestInfoTitle: 'Request changes from the citizen', rejectTitle: 'Reject this application', approveTitle: 'Approve this application',
    messageEn: 'Message (English)', messageEs: 'Message (Spanish)', reasonEn: 'Reason (English)', reasonEs: 'Reason (Spanish)',
    noteEnOptional: 'Note to citizen, English (optional)', noteEsOptional: 'Note to citizen, Spanish (optional)', confirm: 'Confirm',
    unassigned: 'Unassigned', assignedTo: 'Assigned to', dashboard: 'Queue overview'
  },
  guide: {
    title: 'How to explore this demo', intro: 'CivicDesk is a citizen-services portal. What you can do changes with your role.',
    gotIt: 'Got it', replay: 'How to explore', youAre: 'You are', explore: 'Explore',
    citizenTip: 'Browse services, file an application with documents, and track its status timeline.',
    officerTip: 'Open the inbox, take a case, request changes, then approve or reject it.',
    supervisorTip: 'Everything officers can do, plus assign cases to staff and read the audit trail.',
    ahaCitizen: 'File a pet registration, upload a document, and watch it move through the workflow.',
    ahaOfficer: 'Take a queued case and approve it — the citizen sees the timeline update instantly.'
  }
};

const ES: Copy = {
  brand: 'CivicDesk', brandSub: 'Portal de trámites ciudadanos',
  officialBanner: 'Sitio oficial del Gobierno de la Ciudad de Riverton',
  nav: { catalog: 'Trámites', myApplications: 'Mis solicitudes', inbox: 'Bandeja del funcionario', about: 'Sobre este proyecto', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión', signedIn: 'Sesión' },
  common: {
    loading: 'Cargando…', back: 'Atrás', next: 'Siguiente', cancel: 'Cancelar', save: 'Guardar', submit: 'Enviar', search: 'Buscar',
    fee: 'Costo', free: 'Gratis', processingTime: 'Tiempo de gestión', reference: 'Trámite', submitted: 'Enviado', updated: 'Actualizado',
    status: 'Estado', service: 'Trámite', applicant: 'Solicitante', required: 'Obligatorio', optional: 'Opcional', close: 'Cerrar', retry: 'Reintentar'
  },
  auth: {
    title: 'Inicia sesión en CivicDesk', subtitle: 'Solicita, paga y da seguimiento a tus trámites municipales en línea.',
    email: 'Correo', password: 'Contraseña', fullName: 'Nombre completo',
    login: 'Iniciar sesión', register: 'Crear cuenta', noAccount: '¿No tienes cuenta?', haveAccount: '¿Ya tienes cuenta?', createAccount: 'Créala',
    demoAccounts: 'Cuentas demo — un clic para explorar cada rol', useAccount: 'Usar', aboutLink: 'Sobre este proyecto →',
    citizenDemo: 'Ciudadano — solicita y da seguimiento', officerDemo: 'Funcionario — revisa la bandeja', supervisorDemo: 'Supervisor — asigna y audita'
  },
  home: {
    heroTitle: '¿Qué trámite necesitas hacer hoy?',
    heroSubtitle: 'Solicita, paga y da seguimiento a tus trámites municipales en línea, sin filas.',
    searchPlaceholder: 'ej. licencia comercial, permiso de estacionamiento…', all: 'Todos', empty: 'Ningún trámite coincide con tu búsqueda.', apply: 'Iniciar trámite'
  },
  apply: {
    title: 'Solicitud', step: 'Paso', details: 'Datos', documents: 'Documentos', review: 'Revisión', saveContinue: 'Guardar y continuar',
    uploadHere: 'Haz clic para subir o arrastra un archivo aquí', uploadHint: 'PDF, JPG o PNG · máx. 10 MB', maxSize: 'Máx. 10 MB por archivo',
    verified: 'Verificado', uploading: 'Subiendo…', replace: 'Reemplazar',
    reviewIntro: 'Revisa tu solicitud antes de enviarla. El costo se cobra al enviar.',
    confirmSubmit: 'Enviar solicitud', draftSaved: 'Borrador guardado', submitted: 'Solicitud enviada'
  },
  tracker: {
    title: 'Mis solicitudes', subtitle: 'Da seguimiento a cada trámite y responde cuando la ciudad necesite más de ti.',
    empty: 'Aún no tienes solicitudes.', emptyCta: 'Ver trámites', viewDetail: 'Ver', newApplication: 'Nueva solicitud'
  },
  detail: {
    timeline: 'Línea de tiempo', submittedInfo: 'Enviada', details: 'Tus datos', documents: 'Documentos', messages: 'Mensajes',
    download: 'Descargar', provideInfo: 'La ciudad necesita más información', resubmit: 'Reenviar solicitud', resubmitNote: 'Agrega una nota (opcional)',
    notifyNote: 'Te avisaremos por correo cuando cambie el estado.'
  },
  officer: {
    inbox: 'Bandeja del funcionario', queue: 'Cola de solicitudes', allStatuses: 'Todos los estados', mineOnly: 'Asignadas a mí', searchPlaceholder: 'Buscar por trámite o ciudadano…',
    claim: 'Tomar este caso', requestInfo: 'Solicitar cambios', approve: 'Aprobar', reject: 'Rechazar', assign: 'Asignar', assignTo: 'Asignar a',
    internalNote: 'Nota interna (solo funcionarios)', addComment: 'Agregar nota', postComment: 'Publicar', messageToCitizen: 'Mensaje al ciudadano',
    verify: 'Marcar verificado', rejectDoc: 'Rechazar', auditTrail: 'Trail de auditoría', staff: 'Personal', noResults: 'Ninguna solicitud coincide con estos filtros.',
    requestInfoTitle: 'Solicitar cambios al ciudadano', rejectTitle: 'Rechazar esta solicitud', approveTitle: 'Aprobar esta solicitud',
    messageEn: 'Mensaje (inglés)', messageEs: 'Mensaje (español)', reasonEn: 'Motivo (inglés)', reasonEs: 'Motivo (español)',
    noteEnOptional: 'Nota al ciudadano, inglés (opcional)', noteEsOptional: 'Nota al ciudadano, español (opcional)', confirm: 'Confirmar',
    unassigned: 'Sin asignar', assignedTo: 'Asignada a', dashboard: 'Resumen de la cola'
  },
  guide: {
    title: 'Cómo explorar esta demo', intro: 'CivicDesk es un portal de trámites ciudadanos. Lo que puedes hacer cambia según tu rol.',
    gotIt: 'Entendido', replay: 'Cómo explorar', youAre: 'Eres', explore: 'Explora',
    citizenTip: 'Explora trámites, presenta una solicitud con documentos y sigue su línea de tiempo.',
    officerTip: 'Abre la bandeja, toma un caso, solicita cambios y luego apruébalo o recházalo.',
    supervisorTip: 'Todo lo del funcionario, más asignar casos al personal y leer el trail de auditoría.',
    ahaCitizen: 'Registra una mascota, sube un documento y mira cómo avanza por el flujo.',
    ahaOfficer: 'Toma un caso en cola y apruébalo — el ciudadano ve la línea de tiempo actualizarse al instante.'
  }
};

export const COPY: Record<Lang, Copy> = { en: EN, es: ES };
