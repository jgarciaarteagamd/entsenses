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
      <p className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <strong>Aviso al paciente.</strong> La prueba auditiva es <strong>informativa</strong> y no le pide su nombre ni
        ningún dato de contacto. Solo llegan a su médico, de forma anónima, los resultados numéricos de la prueba y sus
        respuestas al cuestionario. Si la prueba usa el micrófono para estimar el ruido de la sala, el sonido se analiza
        en su dispositivo y <strong>no se graba ni se envía</strong>.
      </p>

      <h2>1. Responsable y roles</h2>
      <p>
        Responsable de los datos de las cuentas profesionales: <strong>{OWNER.name}</strong>, {OWNER.role.es}, colegiado
        nº {OWNER.colegiado}, {OWNER.city}. Contacto: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. Respecto a
        los datos de los pacientes, el Responsable es el médico que solicita la prueba o elabora el informe, y ENT Senses
        Test actúa como Encargado del tratamiento (art. 28 RGPD), según se detalla en los Términos de uso.
      </p>

      <h2>2. Qué datos se tratan</h2>
      <ul>
        <li>
          <strong>Paciente que hace la prueba informativa:</strong> umbrales y resultados de la prueba, respuestas al
          cuestionario de síntomas, tipo de auricular y de conexión, indicadores de calidad (por ejemplo, ruido de la
          sala), idioma, fecha y, solo si el paciente lo indica, sexo y rango de edad. No se tratan datos identificativos
          ni de contacto.
        </li>
        <li>
          <strong>Informes elaborados por el médico:</strong> audiograma, impedanciometría, logoaudiometría, edad,
          antecedentes, exploración, juicio clínico, plan y la etiqueta seudonimizada (iniciales o nº de historia) que el
          médico elige. <strong>Nombre, apellidos, documento y fecha de nacimiento no se guardan</strong>: se escriben
          solo para imprimir el informe, permanecen en la memoria del navegador y se borran al recargar la página.
        </li>
        <li>
          <strong>Profesional:</strong> email y contraseña cifrada, nombre, apellidos, número de colegiado y fechas de
          aceptación de los términos.
        </li>
        <li>
          <strong>Datos técnicos mínimos</strong> que los proveedores de infraestructura registran para el funcionamiento
          y la seguridad del servicio (por ejemplo, fecha y dirección IP de las peticiones).
        </li>
      </ul>

      <h2>3. Finalidad y base jurídica</h2>
      <ul>
        <li>Prestar al profesional el servicio de pruebas auditivas informativas, elaboración de informes y gestión de resultados.</li>
        <li>
          Cuentas profesionales: ejecución de la relación de servicio (art. 6.1.b RGPD) e interés legítimo en la seguridad
          (art. 6.1.f RGPD).
        </li>
        <li>
          Datos de pacientes: la base jurídica la determina el médico Responsable (típicamente consentimiento explícito,
          arts. 6.1.a y 9.2.a RGPD, o asistencia sanitaria, art. 9.2.h RGPD). Antes de iniciar la prueba, el paciente
          debe aceptar expresamente estos términos.
        </li>
      </ul>
      <p>Los datos no se utilizan con fines publicitarios, de perfilado ni para entrenar modelos de inteligencia artificial.</p>

      <h2>4. Conservación</h2>
      <ul>
        <li>Los resultados e informes se conservan mientras el profesional los mantenga en su bandeja; puede eliminarlos en cualquier momento.</li>
        <li>Los datos de la cuenta se conservan mientras esté activa y se eliminan al darla de baja, salvo obligación legal.</li>
      </ul>

      <h2>5. Destinatarios</h2>
      <p>
        No se ceden datos a terceros salvo obligación legal. Se utilizan proveedores de base de datos y autenticación
        (Supabase, con servidores en la Unión Europea) y de alojamiento web (Netlify), que actúan como encargados del
        tratamiento con las garantías del art. 28 RGPD y, en su caso, cláusulas contractuales tipo para transferencias
        internacionales.
      </p>

      <h2>6. Derechos</h2>
      <p>
        Puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo
        a <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. Como los resultados de pacientes son anónimos para
        ENT Senses, las solicitudes relativas a ellos deben dirigirse al médico que solicitó la prueba. Puede
        reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Cifrado en tránsito (HTTPS), control de acceso por filas (cada médico solo puede ver sus propios datos),
        mediciones inmutables una vez registradas y minimización de datos: no se guardan datos identificativos de los
        pacientes ni audio.
      </p>

      <h2>8. Menores</h2>
      <p>
        Cuando la prueba la realice un menor, corresponde al profesional recabar el consentimiento de sus representantes
        legales conforme a la normativa aplicable.
      </p>

      <h2>9. Almacenamiento local</h2>
      <p>
        Solo se usa almacenamiento técnico en el navegador: la sesión del profesional, el idioma, la aceptación de este
        aviso y los datos de firma del informe que el profesional decide recordar. No se usan cookies de análisis ni de
        marketing.
      </p>

      <h2>10. Cambios</h2>
      <p>Esta política puede actualizarse; la versión vigente se publica en esta página con su fecha.</p>
    </>
  );
}

function PrivacyEN() {
  return (
    <>
      <p className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <strong>Patient notice.</strong> The hearing check is <strong>informative</strong> and does not ask for your name
        or any contact details. Only the numerical results and your questionnaire answers reach your doctor,
        anonymously. If the check uses the microphone to estimate room noise, the sound is analysed on your device and{" "}
        <strong>is never recorded or sent</strong>.
      </p>

      <h2>1. Controller and roles</h2>
      <p>
        Controller for professional account data: <strong>{OWNER.name}</strong>, {OWNER.role.en}, licence no.{" "}
        {OWNER.colegiado}, {OWNER.city}. Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. For patient data,
        the Controller is the doctor who requests the check or prepares the report, and ENT Senses acts as Processor
        (Art. 28 GDPR), as detailed in the Terms of use.
      </p>

      <h2>2. Data processed</h2>
      <ul>
        <li>
          <strong>Patient taking the informative check:</strong> thresholds and check results, symptom questionnaire
          answers, headphone and connection type, quality indicators (e.g. room noise), language, date and, only if the
          patient chooses, sex and age range. No identifying or contact data is processed.
        </li>
        <li>
          <strong>Reports prepared by the doctor:</strong> audiogram, impedance, speech audiometry, age, history,
          examination, clinical impression, plan and the pseudonymised label (initials or record number) chosen by the
          doctor. <strong>Name, surname, ID and date of birth are never stored</strong>: they are typed only to print the
          report, stay in the browser’s memory and are cleared when the page reloads.
        </li>
        <li>
          <strong>Professional:</strong> e-mail and encrypted password, name, surname, licence number and dates of
          acceptance of the terms.
        </li>
        <li>
          <strong>Minimal technical data</strong> logged by infrastructure providers to run and secure the service (e.g.
          date and IP address of requests).
        </li>
      </ul>

      <h2>3. Purpose and legal basis</h2>
      <ul>
        <li>Providing the professional with informative hearing checks, report preparation and results management.</li>
        <li>Professional accounts: performance of the service (Art. 6.1.b GDPR) and legitimate interest in security (Art. 6.1.f GDPR).</li>
        <li>
          Patient data: the legal basis is determined by the doctor as Controller (typically explicit consent, Arts. 6.1.a
          and 9.2.a GDPR, or healthcare, Art. 9.2.h GDPR). Patients must expressly accept these terms before starting.
        </li>
      </ul>
      <p>Data is never used for advertising, profiling or training artificial intelligence models.</p>

      <h2>4. Retention</h2>
      <ul>
        <li>Results and reports are kept while the professional keeps them in their inbox; they can be deleted at any time.</li>
        <li>Account data is kept while the account is active and deleted when it is closed, unless the law requires otherwise.</li>
      </ul>

      <h2>5. Recipients</h2>
      <p>
        No data is disclosed to third parties unless required by law. Database and authentication (Supabase, with servers
        in the European Union) and web hosting (Netlify) providers act as processors with Art. 28 GDPR safeguards and,
        where applicable, standard contractual clauses for international transfers.
      </p>

      <h2>6. Rights</h2>
      <p>
        You can exercise your rights of access, rectification, erasure, objection, restriction and portability by
        writing to <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. As patient results are anonymous to ENT Senses,
        requests about them must be addressed to the doctor who requested the check. You may lodge a complaint with the
        Spanish Data Protection Agency (www.aepd.es).
      </p>

      <h2>7. Security</h2>
      <p>
        Encryption in transit (HTTPS), row-level access control (each doctor can only see their own data), measurements
        that cannot be changed once recorded, and data minimisation: no patient identifiers or audio are stored.
      </p>

      <h2>8. Minors</h2>
      <p>When a minor takes the check, the professional must obtain consent from their legal representatives as required by law.</p>

      <h2>9. Local storage</h2>
      <p>
        Only technical browser storage is used: the professional’s session, language, acceptance of this notice and the
        report signature details the professional chooses to remember. No analytics or marketing cookies are used.
      </p>

      <h2>10. Changes</h2>
      <p>This policy may be updated; the current version is published on this page with its date.</p>
    </>
  );
}
