import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, OWNER } from "@/components/LegalLayout";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/legal/privacidad")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLang();
  return (
    <LegalLayout titleKey="legal.privacy.title" other="terms">
      {lang === "es" ? <PrivacyES /> : <PrivacyEN />}
    </LegalLayout>
  );
}

function PrivacyES() {
  return (
    <>
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p>
          <strong>Aviso al paciente.</strong> En ninguna prueba se le pide su nombre ni datos de contacto: sus
          resultados llegan a su médico de forma anónima.
        </p>
        <ul className="mt-2">
          <li><strong>Cuestionarios (Quest):</strong> solo se envían sus respuestas y la puntuación.</li>
          <li>
            <strong>Voz (Voice):</strong> su voz se analiza en su propio dispositivo;{" "}
            <strong>el audio no se envía ni se guarda</strong>. Solo llegan los resultados numéricos.
          </li>
          <li>
            <strong>Audición (Hearing):</strong> solo se envían los resultados de la prueba y sus respuestas al
            cuestionario. Si la prueba usa el micrófono para estimar el ruido de la sala, el sonido no se graba ni se
            envía.
          </li>
          <li>
            Si su médico le envió un enlace por correo, ENT Senses <strong>no guarda su dirección</strong>.
          </li>
        </ul>
      </div>

      <h2>1. Responsable y roles</h2>
      <p>
        Responsable de los datos de las cuentas profesionales: <strong>{OWNER.name}</strong>, {OWNER.role.es}, colegiado
        nº {OWNER.colegiado}, {OWNER.city}. Contacto: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. Respecto a
        los datos de los pacientes, el Responsable es el profesional que solicita la prueba o crea el registro, y ENT
        Senses actúa como Encargado del tratamiento (art. 28 RGPD), según se detalla en los Términos de uso.
      </p>

      <h2>2. Qué datos se tratan</h2>
      <ul>
        <li>
          <strong>Profesional:</strong> email y contraseña cifrada, nombre, apellidos, número de colegiado, fechas de
          aceptación de los términos y, opcionalmente, datos de residencia.
        </li>
        <li>
          <strong>Paciente — Quest:</strong> respuestas al cuestionario, puntuación e interpretación, fecha.
        </li>
        <li>
          <strong>Paciente — Voice:</strong> resultados numéricos del análisis acústico (por ejemplo F0, jitter, shimmer,
          HNR, CPPS, AVQI, tiempo máximo de fonación, cociente s/z), estimaciones orientativas GRBAS/CAPE-V, indicadores
          de calidad de la grabación, idioma, fecha y, si el paciente lo indica, sexo y rango de edad.
        </li>
        <li>
          <strong>Paciente — Hearing:</strong> umbrales y resultados de la prueba, respuestas al cuestionario de
          síntomas, tipo de auricular y de conexión, indicadores de calidad, idioma, fecha y, si el paciente lo indica,
          sexo y rango de edad.
        </li>
        <li>
          <strong>Registros e informes del profesional:</strong> cuestionarios rellenados en consulta, valoración
          perceptual de la voz, informes audiométricos (audiograma, impedanciometría, logoaudiometría, edad,
          antecedentes, exploración, juicio clínico y plan) y la <strong>etiqueta</strong> seudonimizada que el
          profesional elige. <strong>Nombre, apellidos, documento y fecha de nacimiento no se guardan</strong>: se
          escriben solo para imprimir un informe y se borran al recargar la página.
        </li>
        <li>
          <strong>Invitaciones:</strong> cuestionario, etiqueta, fechas de envío, caducidad y respuesta, y un código
          aleatorio de un solo uso. La dirección de correo del paciente <strong>nunca se guarda</strong>: solo rellena
          el destinatario en el correo del propio profesional.
        </li>
        <li>
          <strong>Datos técnicos mínimos</strong> que los proveedores de infraestructura registran para el funcionamiento
          y la seguridad del servicio (por ejemplo, fecha y dirección IP de las peticiones).
        </li>
      </ul>
      <p>
        Los datos de salud, aun seudonimizados mediante una etiqueta, son una <strong>categoría especial</strong> de
        datos (art. 9 RGPD) y se tratan con las garantías correspondientes.
      </p>

      <h2>3. Audio y micrófono</h2>
      <p>
        El navegador solo usa el micrófono con el permiso del usuario. En Voice, la grabación se mantiene únicamente en
        la memoria del dispositivo durante la prueba, el análisis se ejecuta localmente y el audio se descarta al
        terminar o al cerrar la página; en la evaluación en consulta el profesional puede reproducirlo en el mismo
        dispositivo durante la sesión, sin que se envíe ni se guarde. En Hearing, el micrófono solo se usa, si acaso,
        para estimar el ruido de la sala.
      </p>

      <h2>4. Finalidad y base jurídica</h2>
      <ul>
        <li>Prestar al profesional las herramientas de la Aplicación y la gestión de sus resultados e informes.</li>
        <li>
          Cuentas profesionales: ejecución de la relación de servicio (art. 6.1.b RGPD) e interés legítimo en la seguridad
          (art. 6.1.f RGPD).
        </li>
        <li>
          Datos de pacientes: la base jurídica la determina el profesional Responsable (típicamente consentimiento
          explícito, arts. 6.1.a y 9.2.a RGPD, o asistencia sanitaria, art. 9.2.h RGPD). Antes de cada prueba, el paciente
          debe aceptar expresamente estos términos.
        </li>
      </ul>
      <p>Los datos no se utilizan con fines publicitarios, de perfilado ni para entrenar modelos de inteligencia artificial.</p>

      <h2>5. Conservación</h2>
      <ul>
        <li>Los registros se conservan mientras el profesional los mantenga en su bandeja; puede eliminarlos en cualquier momento.</li>
        <li>Las invitaciones caducan a los 14 días y pueden eliminarse en cualquier momento.</li>
        <li>Los datos de la cuenta se conservan mientras esté activa y se eliminan al darla de baja, salvo obligación legal.</li>
      </ul>

      <h2>6. Destinatarios</h2>
      <p>
        No se ceden datos a terceros salvo obligación legal. Se utilizan proveedores de base de datos y autenticación
        (Supabase, con servidores en Fráncfort, Unión Europea) y de alojamiento web (Netlify), que actúan como encargados
        del tratamiento con las garantías del art. 28 RGPD y, en su caso, cláusulas contractuales tipo para
        transferencias internacionales.
      </p>

      <h2>7. Derechos</h2>
      <p>
        Puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo
        a <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. Como los resultados de pacientes son anónimos para ENT
        Senses, las solicitudes relativas a ellos deben dirigirse al profesional que solicitó la prueba. Puede reclamar
        ante la Agencia Española de Protección de Datos (www.aepd.es).
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Cifrado en tránsito (HTTPS), control de acceso por filas (cada profesional solo puede ver sus propios datos),
        mediciones inmutables una vez registradas, enlaces de invitación aleatorios de un solo uso y minimización de
        datos: no se guardan audio ni datos identificativos de los pacientes.
      </p>

      <h2>9. Menores</h2>
      <p>
        Cuando la prueba la realice un menor, corresponde al profesional recabar el consentimiento de sus representantes
        legales conforme a la normativa aplicable.
      </p>

      <h2>10. Almacenamiento local</h2>
      <p>
        Solo se usa almacenamiento técnico en el navegador: la sesión del profesional, el idioma, la aceptación de este
        aviso y, si el profesional lo decide, los datos de firma de los informes y la cuenta de Gmail desde la que envía
        invitaciones. No se usan cookies de análisis ni de marketing.
      </p>

      <h2>11. Cambios</h2>
      <p>Esta política puede actualizarse; la versión vigente se publica en esta página con su fecha.</p>
    </>
  );
}

function PrivacyEN() {
  return (
    <>
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p>
          <strong>Patient notice.</strong> No test asks for your name or contact details: your results reach your doctor
          anonymously.
        </p>
        <ul className="mt-2">
          <li><strong>Questionnaires (Quest):</strong> only your answers and the score are sent.</li>
          <li>
            <strong>Voice:</strong> your voice is analysed on your own device; <strong>the audio is never sent or
            stored</strong>. Only the numerical results are sent.
          </li>
          <li>
            <strong>Hearing:</strong> only the check results and your questionnaire answers are sent. If the check uses
            the microphone to estimate room noise, the sound is never recorded or sent.
          </li>
          <li>If your doctor sent you a link by e-mail, ENT Senses <strong>does not store your address</strong>.</li>
        </ul>
      </div>

      <h2>1. Controller and roles</h2>
      <p>
        Controller for professional account data: <strong>{OWNER.name}</strong>, {OWNER.role.en}, licence no.{" "}
        {OWNER.colegiado}, {OWNER.city}. Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. For patient data,
        the Controller is the professional who requests the test or creates the record, and ENT Senses acts as Processor
        (Art. 28 GDPR), as detailed in the Terms of use.
      </p>

      <h2>2. Data processed</h2>
      <ul>
        <li>
          <strong>Professional:</strong> e-mail and encrypted password, name, surname, licence number, dates of acceptance
          of the terms and, optionally, place of residence.
        </li>
        <li><strong>Patient — Quest:</strong> questionnaire answers, score and interpretation, date.</li>
        <li>
          <strong>Patient — Voice:</strong> numerical acoustic results (e.g. F0, jitter, shimmer, HNR, CPPS, AVQI, maximum
          phonation time, s/z ratio), orientative GRBAS/CAPE-V estimates, recording quality indicators, language, date
          and, if the patient chooses, sex and age range.
        </li>
        <li>
          <strong>Patient — Hearing:</strong> thresholds and check results, symptom questionnaire answers, headphone and
          connection type, quality indicators, language, date and, if the patient chooses, sex and age range.
        </li>
        <li>
          <strong>Professional’s records and reports:</strong> questionnaires completed in clinic, perceptual voice
          ratings, audiometric reports (audiogram, impedance, speech audiometry, age, history, examination, clinical
          impression and plan) and the pseudonymised <strong>label</strong> chosen by the professional.{" "}
          <strong>Name, surname, ID and date of birth are never stored</strong>: they are typed only to print a report
          and are cleared when the page reloads.
        </li>
        <li>
          <strong>Invitations:</strong> questionnaire, label, sent, expiry and answer dates, and a random single-use code.
          The patient’s e-mail address is <strong>never stored</strong>: it only fills in the recipient in the
          professional’s own e-mail.
        </li>
        <li>
          <strong>Minimal technical data</strong> logged by infrastructure providers to run and secure the service (e.g.
          date and IP address of requests).
        </li>
      </ul>
      <p>
        Health data, even when pseudonymised with a label, is a <strong>special category</strong> of data (Art. 9 GDPR)
        and is processed with the corresponding safeguards.
      </p>

      <h2>3. Audio and microphone</h2>
      <p>
        The browser only uses the microphone with the user’s permission. In Voice, the recording stays only in the
        device’s memory during the test, the analysis runs locally and the audio is discarded when the test ends or the
        page closes; during in-clinic assessment the professional can play it back on the same device during the session,
        without it being sent or stored. In Hearing, the microphone is used, if at all, only to estimate room noise.
      </p>

      <h2>4. Purpose and legal basis</h2>
      <ul>
        <li>Providing the professional with the App’s tools and the management of their results and reports.</li>
        <li>Professional accounts: performance of the service (Art. 6.1.b GDPR) and legitimate interest in security (Art. 6.1.f GDPR).</li>
        <li>
          Patient data: the legal basis is determined by the professional as Controller (typically explicit consent,
          Arts. 6.1.a and 9.2.a GDPR, or healthcare, Art. 9.2.h GDPR). Patients must expressly accept these terms before
          each test.
        </li>
      </ul>
      <p>Data is never used for advertising, profiling or training artificial intelligence models.</p>

      <h2>5. Retention</h2>
      <ul>
        <li>Records are kept while the professional keeps them in their inbox; they can be deleted at any time.</li>
        <li>Invitations expire after 14 days and can be deleted at any time.</li>
        <li>Account data is kept while the account is active and deleted when it is closed, unless the law requires otherwise.</li>
      </ul>

      <h2>6. Recipients</h2>
      <p>
        No data is disclosed to third parties unless required by law. Database and authentication (Supabase, with servers
        in Frankfurt, European Union) and web hosting (Netlify) providers act as processors with Art. 28 GDPR safeguards
        and, where applicable, standard contractual clauses for international transfers.
      </p>

      <h2>7. Rights</h2>
      <p>
        You can exercise your rights of access, rectification, erasure, objection, restriction and portability by writing
        to <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. As patient results are anonymous to ENT Senses, requests
        about them must be addressed to the professional who requested the test. You may lodge a complaint with the
        Spanish Data Protection Agency (www.aepd.es).
      </p>

      <h2>8. Security</h2>
      <p>
        Encryption in transit (HTTPS), row-level access control (each professional can only see their own data),
        measurements that cannot be changed once recorded, random single-use invitation links, and data minimisation: no
        audio or patient identifiers are stored.
      </p>

      <h2>9. Minors</h2>
      <p>When a minor takes a test, the professional must obtain consent from their legal representatives as required by law.</p>

      <h2>10. Local storage</h2>
      <p>
        Only technical browser storage is used: the professional’s session, language, acceptance of this notice and, if
        the professional chooses, report signature details and the Gmail account used to send invitations. No analytics or
        marketing cookies are used.
      </p>

      <h2>11. Changes</h2>
      <p>This policy may be updated; the current version is published on this page with its date.</p>
    </>
  );
}
