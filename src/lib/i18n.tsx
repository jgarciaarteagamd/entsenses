import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

export type Dict = Record<string, { es: string; en: string }>;

const DICT: Dict = {
  "auth.forgot": { es: "¿Olvidó su contraseña?", en: "Forgot your password?" },
  "auth.forgot_title": { es: "Restablecer contraseña", en: "Reset password" },
  "auth.forgot_desc": { es: "Escriba el correo de su cuenta y le enviaremos un enlace para elegir una contraseña nueva.", en: "Enter your account e-mail and we will send you a link to choose a new password." },
  "auth.send_link": { es: "Enviar enlace", en: "Send link" },
  "auth.reset_sent": { es: "Si existe una cuenta con ese correo, le hemos enviado un enlace. Revise también la carpeta de spam.", en: "If an account exists for that e-mail, we have sent you a link. Please also check your spam folder." },
  "auth.back_signin": { es: "Volver a iniciar sesión", en: "Back to sign in" },
  "auth.reset_title": { es: "Nueva contraseña", en: "New password" },
  "auth.reset_new": { es: "Nueva contraseña (mínimo 8 caracteres)", en: "New password (at least 8 characters)" },
  "auth.reset_save": { es: "Guardar contraseña", en: "Save password" },
  "auth.reset_done": { es: "Contraseña actualizada", en: "Password updated" },
  "auth.reset_checking": { es: "Comprobando el enlace…", en: "Checking the link…" },
  "auth.reset_invalid": { es: "El enlace no es válido o ha caducado. Solicite uno nuevo desde «¿Olvidó su contraseña?».", en: "The link is invalid or has expired. Request a new one from “Forgot your password?”." },
  "print.kicker.voice": { es: "Evaluación de la voz", en: "Voice assessment" },
  "print.title.voice": { es: "Escanee el código con su teléfono", en: "Scan the code with your phone" },
  "print.instructions.voice": { es: "Necesitará unos 3 minutos en un lugar silencioso. Siga las instrucciones en pantalla: le pediremos que diga «aaaa», que mantenga los sonidos «s» y «z» y que lea unas frases y un texto breve.", en: "You will need about 3 minutes in a quiet place. Follow the on-screen instructions: you will say “aaah”, hold the sounds “s” and “z”, and read a few sentences and a short text." },
  "print.privacy.voice": { es: "Su voz se analiza en su propio teléfono y no se guarda. Su médico recibirá solo los resultados, de forma anónima.", en: "Your voice is analysed on your own phone and is not stored. Your doctor will receive only the results, anonymously." },
  "panel.qr.desc.voice": { es: "El paciente escanea el código con la cámara del móvil, acepta las condiciones, activa el micrófono y realiza la prueba. Los resultados llegan a su bandeja de forma anónima.", en: "The patient scans the code with their phone camera, accepts the terms, enables the microphone and takes the test. Results reach your inbox anonymously." },
  "nav.invitations": { es: "Invitaciones", en: "Invitations" },
  "module.tinnitus.desc": { es: "Evaluación de acúfenos.", en: "Tinnitus assessment." },
  "module.scales.desc": { es: "Escalas clínicas de ORL.", en: "ENT clinical scales." },
  "module.hearing.desc": { es: "Informes audiométricos con audiograma, impedanciometría y logoaudiometría. Prueba auditiva informativa para pacientes.", en: "Audiometric reports with audiogram, impedance and speech audiometry. Informative hearing check for patients." },
  "module.voice.desc": { es: "Análisis acústico de la voz en el navegador (AVQI, CPPS, jitter, shimmer) y estimación GRBAS/CAPE-V.", en: "In-browser acoustic voice analysis (AVQI, CPPS, jitter, shimmer) and GRBAS/CAPE-V estimate." },
  "module.quest.desc": { es: "Cuestionarios clínicos validados (SNOT-22, VHI, EAT-10…): en consulta, con QR, impresos o por correo.", en: "Validated clinical questionnaires (SNOT-22, VHI, EAT-10…): in clinic, by QR, printed or by e-mail." },
  "module.coming": { es: "Próximamente", en: "Coming soon" },
  "module.open": { es: "Abrir", en: "Open" },
  "panel.subtitle": { es: "Elija un módulo o comparta el código QR con sus pacientes.", en: "Choose a module or share the QR code with your patients." },
  "app.tagline": { es: "Herramientas para otorrinolaringología", en: "Tools for ENT" },
  "panel.qr.desc.hearing": { es: "El paciente escanea el código con la cámara del móvil, acepta las condiciones y realiza una prueba auditiva informativa con sus auriculares. Los resultados llegan a su bandeja de forma anónima, marcados como «no calibrados».", en: "The patient scans the code with their phone camera, accepts the terms and takes an informative hearing check with their headphones. Results reach your inbox anonymously, flagged as “not calibrated”." },
  "print.privacy.hearing": { es: "La prueba es informativa y no le pide su nombre ni datos de contacto. Su médico recibirá solo los resultados, de forma anónima.", en: "The check is informative and does not ask for your name or contact details. Your doctor will receive only the results, anonymously." },
  "print.instructions.hearing": { es: "Necesitará unos minutos en un lugar silencioso y, a ser posible, auriculares con cable. Siga las instrucciones en pantalla. La prueba es informativa y no sustituye a una audiometría en un centro auditivo.", en: "You will need a few minutes somewhere quiet and, ideally, wired headphones. Follow the on-screen instructions. The check is informative and does not replace a hearing-centre audiometry." },
  "print.title.hearing": { es: "Escanee el código con su teléfono", en: "Scan the code with your phone" },
  "print.kicker.hearing": { es: "Prueba auditiva informativa", en: "Informative hearing check" },
  "consent.hearing.informative": { es: "Esta prueba es informativa: no es un diagnóstico médico ni sustituye a una audiometría realizada por un profesional en un centro auditivo.", en: "This check is informative: it is not a medical diagnosis and does not replace an audiometry performed by a professional at a hearing centre." },
  "consent.hearing.anonymous": { es: "No se le pide su nombre ni ningún dato de contacto. Solo llegan a su médico resultados numéricos, de forma anónima.", en: "You are not asked for your name or any contact details. Only numerical results reach your doctor, anonymously." },
  "consent.hearing.safety": { es: "Hágala en un lugar silencioso, a ser posible con auriculares con cable y un volumen cómodo. Deténgala si nota molestias o dolor.", en: "Take it somewhere quiet, ideally with wired headphones and a comfortable volume. Stop if you feel discomfort or pain." },
  "consent.hearing.mic": { es: "Si la prueba usa el micrófono para estimar el ruido de la sala, el sonido se analiza en este dispositivo y no se graba ni se envía.", en: "If the check uses the microphone to estimate room noise, the sound is analysed on this device and is never recorded or sent." },
  "report.print_notice.remote": { es: "Resultado NO CALIBRADO, obtenido por el paciente con su propio dispositivo y auriculares: solo informativo. Requiere audiometría en un centro auditivo.", en: "NOT CALIBRATED result obtained by the patient with their own device and headphones: informative only. A hearing-centre audiometry is required." },
  "report.print_notice.audiometer": { es: "Audiometría tonal realizada con un sistema sin marcado CE como producto sanitario: resultado orientativo. Ante hallazgos patológicos o decisiones terapéuticas, quirúrgicas o periciales, se recomienda audiometría con equipo certificado.", en: "Pure-tone audiometry performed with a system that is not CE-marked as a medical device: orientative result. For pathological findings or therapeutic, surgical or medico-legal decisions, an audiometry with certified equipment is recommended." },
  "inbox.open_report": { es: "Informe", en: "Report" },
  "inbox.pta_left": { es: "PTA OI", en: "PTA left" },
  "inbox.pta_right": { es: "PTA OD", en: "PTA right" },
  "inbox.origin.remote": { es: "Prueba del paciente", en: "Patient check" },
  "inbox.origin.audiometer": { es: "Audiómetro ENT Senses", en: "ENT Senses audiometer" },
  "inbox.origin.manual": { es: "Introducido a mano", en: "Entered manually" },
  "inbox.origin": { es: "Origen", en: "Source" },
  "report.pro.hint": { es: "Datos de la firma del informe. Se recuerdan en este navegador.", en: "Report signature details. Remembered on this browser." },
  "report.pro.license": { es: "Nº de colegiado", en: "Licence number" },
  "report.pro.profession": { es: "Especialidad", en: "Specialty" },
  "report.pro.name": { es: "Facultativo", en: "Clinician" },
  "report.identity_not_stored": { es: "Nombre, apellidos, documento y fecha de nacimiento no se guardan en ningún sitio: se usan solo para imprimir este informe y se borran al recargar la página. Sí se guardan la edad y los datos clínicos.", en: "Name, surname, ID and date of birth are never stored: they are used only to print this report and are cleared when the page reloads. Age and clinical data are saved." },
  "report.audiogram_locked": { es: "Audiograma registrado por el sistema: no se puede modificar. Puede completar la impedanciometría, la logoaudiometría y el resto del informe.", en: "Audiogram recorded by the system: it cannot be changed. You can complete impedance, speech audiometry and the rest of the report." },
  "report.back_to_editor": { es: "Volver al editor", en: "Back to editor" },
  "report.save_error": { es: "No se pudo guardar. Inténtelo de nuevo.", en: "Could not save. Please try again." },
  "report.saved": { es: "Guardado en la bandeja", en: "Saved to inbox" },
  "report.save": { es: "Guardar", en: "Save" },
  "report.view": { es: "Ver informe", en: "View report" },
  "report.tab.diagnosis": { es: "Diagnóstico", en: "Diagnosis" },
  "report.tab.studies": { es: "Estudios auditivos", en: "Hearing studies" },
  "report.tab.patient": { es: "Paciente", en: "Patient" },
  "report.years": { es: "años", en: "years" },
  "clinic.label": { es: "Etiqueta del paciente (iniciales o nº de historia)", en: "Patient label (initials or record number)" },
  "report.not_calibrated": { es: "Resultado NO CALIBRADO, obtenido con el dispositivo del paciente: solo informativo. Requiere audiometría en un centro auditivo.", en: "NOT CALIBRATED result obtained with the patient's device: informative only. A hearing-centre audiometry is required." },
  "clinic.subtitle": { es: "Nuevo informe: introduzca el audiograma del audiómetro utilizado y, si lo desea, la impedanciometría, la logoaudiometría, los antecedentes y el diagnóstico.", en: "New report: enter the audiogram from the audiometer used and, optionally, impedance, speech audiometry, history and diagnosis." },
  "clinic.title": { es: "ENT Senses Hearing · Nuevo informe", en: "ENT Senses Hearing · New report" },
  "device.transducer.unknown": { es: "No indicado", en: "Not stated" },
  "device.transducer.circumaural": { es: "Circumaurales", en: "Circumaural" },
  "device.transducer.supra-aural": { es: "Supraaurales", en: "Supra-aural" },
  "device.transducer.earbuds": { es: "Intrauriculares", en: "Earbuds" },
  "device.transducer.insert": { es: "De inserción", en: "Insert" },
  "inbox.not_calibrated": { es: "No calibrado", en: "Not calibrated" },
  "inbox.calibrated": { es: "Calibrado", en: "Calibrated" },
  "inbox.calibration": { es: "Calibración", en: "Calibration" },
  "patient.coming": { es: "La prueba estará disponible próximamente.", en: "The check will be available soon." },
  "patient.disclaimer": { es: "Esta prueba es informativa y no constituye un diagnóstico médico. Sus resultados dependen del dispositivo, los auriculares y el entorno, que no están calibrados. No sustituye a una audiometría realizada por un profesional en un centro auditivo. Si nota una pérdida de audición repentina, dolor, supuración o vértigo, consulte con un médico cuanto antes.", en: "This check is informative and is not a medical diagnosis. Results depend on the device, headphones and surroundings, which are not calibrated. It does not replace an audiometry performed by a professional at a hearing centre. If you notice sudden hearing loss, pain, discharge or vertigo, see a doctor as soon as possible." },
  // Brand
  "app.name": { es: "ENT Senses", en: "ENT Senses" },
  "lang.toggle": { es: "Idioma", en: "Language" },

  // Nav
  "nav.panel": { es: "Panel", en: "Dashboard" },
  "nav.evaluate": { es: "Audiometría en consulta", en: "In-clinic audiometry" },
  "nav.inbox": { es: "Bandeja", en: "Inbox" },
  "nav.settings": { es: "Configuración", en: "Settings" },
  "nav.logout": { es: "Salir", en: "Log out" },

  // Landing
  "landing.access": { es: "Acceder", en: "Sign in" },
  "landing.title": { es: "Las herramientas de ORL, en un solo lugar", en: "ENT tools, all in one place" },
  "landing.subtitle": { es: "Cuestionarios clínicos validados, análisis acústico de la voz e informes audiométricos. Sus pacientes responden desde su móvil con un código QR o un enlace, y usted recibe los resultados de forma anónima en una sola bandeja.", en: "Validated clinical questionnaires, acoustic voice analysis and audiometric reports. Your patients respond from their phone via a QR code or link, and you receive the results anonymously in a single inbox." },
  "landing.cta": { es: "Empezar ahora", en: "Get started" },
  "landing.f1.title": { es: "Privacidad por diseño", en: "Privacy by design" },
  "landing.f1.desc": { es: "Sus pacientes no dan su nombre: los resultados llegan anónimos y usted los identifica con una etiqueta.", en: "Patients never give their name: results arrive anonymously and you identify them with a label." },
  "landing.f2.title": { es: "Módulos para cada sentido", en: "A module for each sense" },
  "landing.f2.desc": { es: "Quest (cuestionarios), Voice (voz) y Hearing (audición). Próximamente: Scales y Tinnitus.", en: "Quest (questionnaires), Voice and Hearing. Coming soon: Scales and Tinnitus." },
  "landing.f3.title": { es: "Una cuenta, una bandeja", en: "One account, one inbox" },
  "landing.f3.desc": { es: "Todos los resultados e informes en un mismo lugar, con etiquetas, leído/no leído e informes imprimibles.", en: "All results and reports in one place, with labels, read/unread and printable reports." },
  "landing.legal.terms": { es: "Términos de uso", en: "Terms of use" },
  "landing.legal.privacy": { es: "Privacidad", en: "Privacy" },
  "setup.not_configured": {
    es: "La aplicación aún no está conectada a su base de datos (faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY). Consulte el README.",
    en: "The app is not connected to its database yet (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing). See the README.",
  },

  // Consent gate
  "consent.title": { es: "Antes de empezar", en: "Before you start" },
  "consent.accept_prefix": { es: "He leído y acepto los", en: "I have read and accept the" },
  "consent.terms_link": { es: "Términos de uso", en: "Terms of use" },
  "consent.and": { es: "y la", en: "and the" },
  "consent.privacy_link": { es: "Política de privacidad", en: "Privacy policy" },
  "consent.accept_button": { es: "Aceptar y continuar", en: "Accept and continue" },

  // Setup
  "setup.sex.male": { es: "Hombre", en: "Male" },
  "setup.sex.female": { es: "Mujer", en: "Female" },
  "setup.sex.unspecified": { es: "Prefiero no indicarlo", en: "Prefer not to say" },
  "setup.age.<18": { es: "Menor de 18", en: "Under 18" },
  "setup.age.18-39": { es: "18–39 años", en: "18–39 years" },
  "setup.age.40-59": { es: "40–59 años", en: "40–59 years" },
  "setup.age.60+": { es: "60 años o más", en: "60 or older" },
  "setup.age.unspecified": { es: "Prefiero no indicarlo", en: "Prefer not to say" },

  // Tasks

  // Analysis / submission
  "patient.header": { es: "Prueba auditiva informativa", en: "Informative hearing check" },
  "patient.invalid": {
    es: "El enlace no es válido. Pida a su médico un nuevo código QR.",
    en: "This link is not valid. Ask your doctor for a new QR code.",
  },

  // Doctor in-clinic evaluation

  // Panel
  "panel.title": { es: "Panel", en: "Dashboard" },
  "panel.qr.title": { es: "Código QR para sus pacientes", en: "QR code for your patients" },
  "panel.qr.copy": { es: "Copiar enlace", en: "Copy link" },
  "panel.qr.copied": { es: "Enlace copiado", en: "Link copied" },
  "panel.qr.print": { es: "Imprimir hoja con QR", en: "Print QR sheet" },
  "panel.evaluate.desc": { es: "Realice la audiometría en consulta con el equipo calibrado y genere el informe.", en: "Run the audiometry in clinic with the calibrated equipment and generate the report." },
  "panel.evaluate.button": { es: "Abrir audiometría", en: "Open audiometry" },
  "panel.inbox.desc": { es: "{0} resultado(s) sin leer.", en: "{0} unread result(s)." },
  "panel.inbox.button": { es: "Abrir bandeja", en: "Open inbox" },

  // Print QR sheet
  "print.back": { es: "Volver", en: "Back" },
  "print.print": { es: "Imprimir", en: "Print" },

  // Inbox
  "inbox.title": { es: "Bandeja de resultados", en: "Results inbox" },
  "inbox.subtitle": { es: "Resultados de sus pacientes e informes de consulta, por módulo.", en: "Your patients' results and clinic reports, by module." },
  "inbox.new": { es: "nuevas", en: "new" },
  "inbox.loading": { es: "Cargando…", en: "Loading…" },
  "inbox.empty": { es: "Aún no hay resultados. Comparta su código QR con sus pacientes o realice una audiometría en consulta.", en: "No results yet. Share your QR code with your patients or run an in-clinic audiometry." },
  "inbox.filter.all": { es: "Todas", en: "All" },
  "inbox.filter.patient": { es: "Paciente", en: "Patient" },
  "inbox.filter.doctor": { es: "Consulta", en: "Clinic" },
  "inbox.source.patient": { es: "Paciente", en: "Patient" },
  "inbox.source.doctor": { es: "Consulta", en: "Clinic" },
  "inbox.item": { es: "Audiometría tonal", en: "Pure-tone audiometry" },
  "inbox.mark_read": { es: "Marcar leído", en: "Mark read" },
  "inbox.mark_unread": { es: "Marcar no leído", en: "Mark unread" },
  "inbox.confirm_delete": { es: "¿Eliminar este resultado?", en: "Delete this result?" },
  "inbox.new_badge": { es: "Nuevo", en: "New" },
  "inbox.label.add": { es: "Añadir etiqueta", en: "Add label" },
  "inbox.label.edit": { es: "Editar etiqueta", en: "Edit label" },
  "inbox.label.save": { es: "Guardar", en: "Save" },
  "inbox.label.saving": { es: "Guardando…", en: "Saving…" },
  "inbox.label.placeholder": { es: "Ej: J.P. / HC-1234", en: "E.g. J.D. / MRN-1234" },
  "inbox.label.hint": {
    es: "Use iniciales o un código interno. No incluya datos identificativos (nombre completo, DNI, teléfono, email).",
    en: "Use initials or an internal code. Do not include identifying data (full name, national ID, phone, email).",
  },
  "inbox.copy": { es: "Copiar", en: "Copy" },
  "inbox.copied": { es: "Copiado", en: "Copied" },
  "inbox.details.show": { es: "Ver informe", en: "View report" },
  "inbox.details.hide": { es: "Ocultar informe", en: "Hide report" },
  "inbox.error": { es: "No se pudo completar la acción.", en: "The action could not be completed." },

  // Report
  "report.not_available": { es: "Informe no disponible.", en: "Report not available." },

  // Parameters

  // Quality warnings

  // Clinician rating

  // Auth
  "auth.signin": { es: "Iniciar sesión", en: "Sign in" },
  "auth.signup": { es: "Crear cuenta", en: "Create account" },
  "auth.email": { es: "Email", en: "Email" },
  "auth.password": { es: "Contraseña", en: "Password" },
  "auth.password2": { es: "Repetir contraseña", en: "Repeat password" },
  "auth.enter": { es: "Entrar", en: "Enter" },
  "auth.register": { es: "Registrarse", en: "Register" },
  "auth.loading": { es: "Cargando…", en: "Loading…" },
  "auth.error": { es: "Error de autenticación", en: "Authentication error" },
  "auth.toSignUp": { es: "¿No tiene cuenta? Regístrese", en: "No account? Register" },
  "auth.toSignIn": { es: "¿Ya tiene cuenta? Inicie sesión", en: "Already have an account? Sign in" },
  "auth.first_name": { es: "Nombre", en: "First name" },
  "auth.last_name": { es: "Apellidos", en: "Last name" },
  "auth.license": { es: "Número de colegiado", en: "Medical license number" },
  "auth.pass_mismatch": { es: "Las contraseñas no coinciden.", en: "Passwords do not match." },
  "auth.pass_short": { es: "La contraseña debe tener al menos 8 caracteres.", en: "Password must be at least 8 characters." },
  "auth.missing_fields": { es: "Complete todos los campos obligatorios.", en: "Please fill in all required fields." },
  "auth.must_accept": {
    es: "Debe aceptar la declaración profesional y los términos legales.",
    en: "You must accept the professional declaration and the legal terms.",
  },
  "auth.too_fast": { es: "Envío demasiado rápido, inténtelo de nuevo.", en: "Submitted too quickly, please try again." },
  "auth.check_email_verify": {
    es: "Cuenta creada. Revise su correo y haga clic en el enlace de verificación antes de iniciar sesión.",
    en: "Account created. Check your email and click the verification link before signing in.",
  },
  "auth.declaration": { es: "Declaro que soy profesional sanitario (médico otorrinolaringólogo, foniatra, logopeda, audiólogo, audioprotesista u otro profesional de ORL), me hago responsable de la veracidad de los datos introducidos y de su interpretación, y entiendo que ENT Senses no es un producto sanitario con marcado CE.", en: "I declare that I am a healthcare professional (ENT physician, phoniatrician, speech-language pathologist, audiologist, hearing-aid specialist or other ENT professional), that I am responsible for the accuracy of the data entered and its interpretation, and that I understand ENT Senses is not a CE-marked medical device." },
  "auth.accept_terms": { es: "He leído y acepto los", en: "I have read and accept the" },

  // Settings
  "settings.title": { es: "Configuración", en: "Settings" },
  "settings.profile": { es: "Datos profesionales", en: "Professional details" },
  "settings.language": { es: "Idioma", en: "Language" },
  "settings.password": { es: "Cambio de contraseña", en: "Change password" },
  "settings.new_password": { es: "Nueva contraseña", en: "New password" },
  "settings.change_pass": { es: "Actualizar contraseña", en: "Update password" },
  "settings.pass_ok": { es: "Contraseña actualizada", en: "Password updated" },
  "settings.save": { es: "Guardar cambios", en: "Save changes" },
  "settings.saved": { es: "Guardado con éxito", en: "Saved successfully" },
  "settings.danger": { es: "Zona peligrosa", en: "Danger zone" },
  "settings.delete_warn": {
    es: "Eliminar su cuenta borrará sus datos profesionales y todos los resultados de su bandeja. Esta acción no se puede deshacer.",
    en: "Deleting your account removes your professional details and every result in your inbox. This cannot be undone.",
  },
  "settings.delete": { es: "Eliminar cuenta", en: "Delete account" },
  "settings.delete_title": { es: "Confirmar eliminación", en: "Confirm deletion" },
  "settings.delete_desc": { es: "Escriba DELETE para confirmar.", en: "Type DELETE to confirm." },
  "settings.cancel": { es: "Cancelar", en: "Cancel" },
  "settings.confirm_delete": { es: "Eliminar definitivamente", en: "Delete permanently" },
  "settings.deleted": { es: "Cuenta eliminada", en: "Account deleted" },

  // Legal
  "legal.terms.title": { es: "Términos de uso", en: "Terms of use" },
  "legal.privacy.title": { es: "Política de privacidad", en: "Privacy policy" },
  "legal.updated": { es: "Última actualización", en: "Last updated" },
  "legal.back": { es: "Volver al inicio", en: "Back home" },

  // Cookies
  "cookies.text": {
    es: "Usamos únicamente almacenamiento técnico necesario para el funcionamiento (sesión de inicio e idioma). No usamos cookies de análisis ni de marketing.",
    en: "We only use technical storage strictly necessary for the app (login session and language). No analytics or marketing cookies.",
  },
  "cookies.more": { es: "Más información", en: "Learn more" },
  "cookies.accept": { es: "Aceptar", en: "Accept" },

  // 404
  "notfound.title": { es: "Página no encontrada", en: "Page not found" },
  "notfound.home": { es: "Ir al inicio", en: "Go home" },
};

const STORAGE_KEY = "entsenses.lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function format(str: string, args: (string | number)[]) {
  args.forEach((a, i) => {
    str = str.replace(new RegExp(`\\{${i}\\}`, "g"), String(a));
  });
  return str;
}

/**
 * Translator for a module: looks the key up in the module's own dictionary first, then in the
 * core one. Lets each module keep its texts (and its key names) without clashing with others.
 */
export function createModuleLang(moduleDict: Dict) {
  return function useModuleLang(): LangContextValue {
    const core = useLang();
    return {
      ...core,
      t: (key, ...args) => {
        const e = moduleDict[key];
        return e ? format(e[core.lang] ?? e.es, args) : core.t(key, ...args);
      },
    };
  };
}

function translate(lang: Lang, key: string, args: (string | number)[]) {
  const entry = DICT[key];
  let str = entry ? (entry[lang] ?? entry.es) : key;
  args.forEach((a, i) => {
    str = str.replace(new RegExp(`\\{${i}\\}`, "g"), String(a));
  });
  return str;
}

function detectLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
    const langs = (navigator.languages?.length ? navigator.languages : [navigator.language ?? ""]).map((l) =>
      l.toLowerCase(),
    );
    if (langs.some((l) => l.startsWith("es"))) return "es";
    if (langs.some((l) => l.startsWith("en"))) return "en";
  } catch {
    // ignore
  }
  return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (typeof window === "undefined" ? "es" : detectLang()));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: (key, ...args) => translate(lang, key, args) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "es", setLang: () => {}, t: (key, ...args) => translate("es", key, args) };
  return ctx;
}
