import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, OWNER } from "@/components/LegalLayout";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/legal/terminos")({
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useLang();
  return (
    <LegalLayout titleKey="legal.terms.title" other="privacy">
      {lang === "es" ? <TermsES /> : <TermsEN />}
    </LegalLayout>
  );
}

function TermsES() {
  return (
    <>
      <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <strong>Importante.</strong> ENT Senses <strong>no es un producto sanitario con marcado CE</strong>. Sus
        resultados son <strong>orientativos</strong> y no sustituyen la valoración clínica ni las pruebas realizadas con
        equipos certificados. Las pruebas que hacen los pacientes en su propio dispositivo son{" "}
        <strong>informativas</strong>. Si nota una pérdida de audición o de voz repentina, dolor, supuración, vértigo o
        dificultad para tragar o respirar, consulte con un médico cuanto antes.
      </p>

      <h2>1. Objeto</h2>
      <p>
        ENT Senses (en adelante, «la Aplicación») es un conjunto de herramientas para{" "}
        <strong>profesionales sanitarios de otorrinolaringología</strong>, organizado en módulos:
      </p>
      <ul>
        <li>
          <strong>ENT Senses Quest:</strong> cuestionarios clínicos validados que el paciente responde en consulta, en
          papel, mediante un código QR o mediante un enlace que el profesional le envía, con cálculo de la puntuación y
          su interpretación publicada.
        </li>
        <li>
          <strong>ENT Senses Voice:</strong> análisis acústico de la voz realizado en el navegador a partir de un
          protocolo breve de grabación, con parámetros acústicos y una estimación orientativa de las escalas GRBAS y
          CAPE-V.
        </li>
        <li>
          <strong>ENT Senses Hearing:</strong> elaboración de informes audiométricos (audiometría tonal,
          impedanciometría, logoaudiometría) y, en desarrollo, una prueba auditiva informativa para pacientes y una
          audiometría tonal en consulta.
        </li>
      </ul>
      <p>Podrán añadirse otros módulos. El uso de la Aplicación implica la aceptación plena de los presentes Términos.</p>

      <h2>2. Titularidad</h2>
      <p>
        La titularidad de la Aplicación corresponde a <strong>{OWNER.name}</strong>, {OWNER.role.es}, colegiado nº{" "}
        {OWNER.colegiado}, con domicilio profesional en {OWNER.city}. Contacto:{" "}
        <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
      </p>

      <h2>3. Naturaleza de la Aplicación y limitaciones</h2>
      <ul>
        <li>
          <strong>Sin marcado CE.</strong> Ningún módulo ha sido evaluado ni certificado como producto sanitario
          conforme al Reglamento (UE) 2017/745.
        </li>
        <li>
          <strong>Quest.</strong> Las puntuaciones y sus interpretaciones proceden de los estudios de validación
          publicados y son orientativas. Las versiones traducidas o adaptadas se identifican como tales.
        </li>
        <li>
          <strong>Voice.</strong> Los parámetros acústicos dependen del dispositivo, del micrófono (no calibrado) y del
          entorno de grabación; sus valores de referencia son orientativos. GRBAS y CAPE-V son escalas perceptuales: la
          estimación acústica no sustituye la valoración auditiva del clínico ni la exploración laríngea.
        </li>
        <li>
          <strong>Hearing.</strong> El generador de informes es una herramienta administrativa de cálculo y redacción.
          La prueba del paciente se realiza con dispositivos y auriculares no calibrados y se muestra siempre como «no
          calibrada». La audiometría en consulta (en desarrollo) se diseña siguiendo ISO 8253-1, ISO 389-1 e IEC
          60645-1, pero sus resultados son orientativos mientras no disponga de marcado CE y no deben usarse para
          peritajes, certificados laborales o médico-legales, adaptación de audífonos ni indicación quirúrgica.
        </li>
        <li>
          <strong>Seguridad del paciente.</strong> Las pruebas con sonido deben hacerse con un volumen cómodo y
          detenerse ante cualquier molestia o dolor.
        </li>
      </ul>

      <h2>4. Cuentas de profesionales</h2>
      <ul>
        <li>El registro está reservado a profesionales sanitarios. El usuario se compromete a facilitar información veraz.</li>
        <li>El usuario es responsable de la confidencialidad de sus credenciales y de todo uso realizado con su cuenta.</li>
      </ul>

      <h2>5. Uso aceptable</h2>
      <ul>
        <li>
          No introducir en las etiquetas ni en los campos clínicos guardados datos identificativos de pacientes (nombre
          completo, DNI, teléfono, dirección o email); use iniciales o códigos internos. Los campos de identificación de
          los informes de Hearing (nombre, apellidos, documento y fecha de nacimiento) <strong>no se guardan</strong>.
        </li>
        <li>
          Las <strong>invitaciones</strong> se envían desde el correo o la aplicación del propio profesional; la
          Aplicación no guarda la dirección de correo del paciente.
        </li>
        <li>No compartir públicamente los enlaces o códigos QR de paciente fuera del contexto asistencial para el que se emiten.</li>
        <li>No intentar acceder a datos o cuentas ajenas ni alterar el funcionamiento del servicio.</li>
      </ul>

      <h2>6. Descargo médico</h2>
      <p>
        La Aplicación proporciona <strong>herramientas de apoyo</strong> y no debe utilizarse como único fundamento de
        un diagnóstico o tratamiento. La interpretación de los resultados, el diagnóstico y la decisión terapéutica
        corresponden exclusivamente al profesional sanitario que atiende al paciente. La Aplicación no establece
        relación médico-paciente con ninguna persona.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        El código, el diseño, la marca y los textos originales de la Aplicación están protegidos por la normativa de
        propiedad intelectual e industrial. Los cuestionarios clínicos (SNOT-22, EAT-10, DHI-25, THI-25, ETDQ-7, VHI-30 y
        otros) son instrumentos publicados por sus autores; el profesional es responsable de respetar la licencia de
        cada instrumento. Los métodos de análisis y cálculo se basan en publicaciones y normas que se citan como
        referencia de sus autores (p. ej., Boersma y Praat; AVQI y CPPS; GRBAS de Hirano y CAPE-V de ASHA; AAO-HNS, AMA y
        AAOO; ISO 8253-1, ISO 389-1 e IEC 60645-1).
      </p>

      <h2>8. Disponibilidad y responsabilidad</h2>
      <p>
        Se procura mantener el servicio disponible y actualizado, sin garantizar la ausencia de interrupciones o
        errores. En la medida máxima permitida por la ley, el titular no será responsable de daños indirectos, pérdida
        de datos ni de decisiones clínicas basadas total o parcialmente en la información mostrada por la Aplicación.
      </p>

      <h2>9. Encargo del tratamiento (art. 28 RGPD)</h2>
      <p>
        Respecto a los datos de los pacientes, el profesional usuario es el <strong>Responsable del tratamiento</strong>{" "}
        y ENT Senses actúa como <strong>Encargado</strong>. La aceptación de estos Términos formaliza el encargo:
      </p>
      <ul>
        <li>
          <strong>Objeto:</strong> recibir, almacenar y mostrar al profesional los resultados que le envían sus
          pacientes y los registros e informes que él mismo crea.
        </li>
        <li>
          <strong>Datos:</strong> respuestas y puntuaciones de cuestionarios; parámetros acústicos y estimaciones de la
          voz (nunca el audio); umbrales y resultados auditivos, cuestionario de síntomas y tipo de auricular; datos
          clínicos de los informes (edad, antecedentes, exploración, impedanciometría, logoaudiometría, juicio clínico y
          plan); sexo y rango de edad opcionales; idioma, fecha; datos de las invitaciones (cuestionario, fechas y
          etiqueta) y la etiqueta seudonimizada que añade el profesional.
        </li>
        <li>
          <strong>Obligaciones del profesional:</strong> informar al paciente y contar con base jurídica adecuada; no
          introducir identificadores directos en etiquetas ni en campos clínicos guardados.
        </li>
        <li>
          <strong>Obligaciones de ENT Senses:</strong> tratar los datos sólo para prestar el servicio, garantizar
          confidencialidad y medidas de seguridad adecuadas, y no usarlos con fines propios (publicidad, perfilado,
          cesión o entrenamiento de modelos de IA).
        </li>
        <li>
          <strong>Subencargados:</strong> proveedores de base de datos, autenticación y alojamiento en la nube con
          garantías del art. 28 RGPD.
        </li>
        <li>
          <strong>Supresión:</strong> el profesional puede eliminar cualquier registro desde su bandeja, cualquier
          invitación desde Invitaciones, o su cuenta completa desde Configuración.
        </li>
      </ul>

      <h2>10. Cancelación</h2>
      <p>
        El profesional puede darse de baja en cualquier momento desde Configuración; se eliminarán sus datos y los
        registros de todos los módulos, salvo obligación legal de conservarlos.
      </p>

      <h2>11. Legislación aplicable</h2>
      <p>
        Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los
        juzgados del domicilio del usuario cuando así lo exija la normativa de consumo y, en su defecto, a los de{" "}
        {OWNER.city}.
      </p>
    </>
  );
}

function TermsEN() {
  return (
    <>
      <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <strong>Important.</strong> ENT Senses <strong>is not a CE-marked medical device</strong>. Its results are{" "}
        <strong>orientative</strong> and do not replace clinical assessment or tests performed with certified
        equipment. Tests that patients take on their own device are <strong>informative</strong>. If you notice sudden
        hearing or voice loss, pain, discharge, vertigo, or difficulty swallowing or breathing, see a doctor as soon as
        possible.
      </p>

      <h2>1. Purpose</h2>
      <p>
        ENT Senses (the “App”) is a set of tools for <strong>ENT healthcare professionals</strong>, organised in
        modules:
      </p>
      <ul>
        <li>
          <strong>ENT Senses Quest:</strong> validated clinical questionnaires answered in clinic, on paper, via a QR
          code or via a link the professional sends, with the score and its published interpretation.
        </li>
        <li>
          <strong>ENT Senses Voice:</strong> in-browser acoustic voice analysis from a short recording protocol, with
          acoustic parameters and an orientative GRBAS and CAPE-V estimate.
        </li>
        <li>
          <strong>ENT Senses Hearing:</strong> audiometric reports (pure-tone audiometry, impedance, speech audiometry)
          and, in development, an informative hearing check for patients and in-clinic pure-tone audiometry.
        </li>
      </ul>
      <p>Other modules may be added. Using the App implies full acceptance of these Terms.</p>

      <h2>2. Ownership</h2>
      <p>
        The App is owned by <strong>{OWNER.name}</strong>, {OWNER.role.en}, licence no. {OWNER.colegiado}, based in{" "}
        {OWNER.city}. Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
      </p>

      <h2>3. Nature of the App and limitations</h2>
      <ul>
        <li>
          <strong>Not CE-marked.</strong> No module has been assessed or certified as a medical device under Regulation
          (EU) 2017/745.
        </li>
        <li>
          <strong>Quest.</strong> Scores and interpretations come from the published validation studies and are
          orientative. Translated or adapted versions are labelled as such.
        </li>
        <li>
          <strong>Voice.</strong> Acoustic parameters depend on the device, the (uncalibrated) microphone and the
          recording environment; reference values are orientative. GRBAS and CAPE-V are perceptual scales: the acoustic
          estimate does not replace the clinician’s auditory rating or laryngeal examination.
        </li>
        <li>
          <strong>Hearing.</strong> The report generator is an administrative calculation and drafting tool. The patient
          check uses uncalibrated devices and headphones and is always shown as “not calibrated”. In-clinic audiometry
          (in development) follows ISO 8253-1, ISO 389-1 and IEC 60645-1, but its results are orientative while it lacks
          CE marking and must not be used for medico-legal or occupational certificates, hearing-aid fitting or surgical
          indication.
        </li>
        <li>
          <strong>Patient safety.</strong> Tests with sound should use a comfortable volume and stop at any discomfort or
          pain.
        </li>
      </ul>

      <h2>4. Professional accounts</h2>
      <ul>
        <li>Registration is reserved for healthcare professionals, who must provide truthful information.</li>
        <li>Users are responsible for keeping their credentials confidential and for all use of their account.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <ul>
        <li>
          Do not enter patient identifiers (full name, ID number, phone, address or e-mail) in labels or stored clinical
          fields; use initials or internal codes. The identification fields of Hearing reports (name, surname, ID and
          date of birth) <strong>are not stored</strong>.
        </li>
        <li>
          <strong>Invitations</strong> are sent from the professional’s own e-mail or app; the App does not store the
          patient’s e-mail address.
        </li>
        <li>Do not share patient links or QR codes publicly outside the clinical context they were issued for.</li>
        <li>Do not attempt to access other users’ data or accounts or interfere with the service.</li>
      </ul>

      <h2>6. Medical disclaimer</h2>
      <p>
        The App provides <strong>support tools</strong> and must not be the sole basis for a diagnosis or treatment.
        Interpretation, diagnosis and therapeutic decisions rest solely with the healthcare professional treating the
        patient. The App does not create a doctor–patient relationship with anyone.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The App’s code, design, brand and original texts are protected by intellectual and industrial property law.
        Clinical questionnaires (SNOT-22, EAT-10, DHI-25, THI-25, ETDQ-7, VHI-30 and others) are instruments published by
        their authors; professionals are responsible for respecting each instrument’s licence. Analysis and calculation
        methods follow publications and standards cited as references to their authors (e.g. Boersma and Praat; AVQI and
        CPPS; Hirano’s GRBAS and ASHA’s CAPE-V; AAO-HNS, AMA and AAOO; ISO 8253-1, ISO 389-1 and IEC 60645-1).
      </p>

      <h2>8. Availability and liability</h2>
      <p>
        We aim to keep the service available and up to date without guaranteeing it will be free of interruptions or
        errors. To the maximum extent permitted by law, the owner is not liable for indirect damages, data loss or
        clinical decisions based in whole or in part on information shown by the App.
      </p>

      <h2>9. Data processing agreement (Art. 28 GDPR)</h2>
      <p>
        For patient data, the professional is the <strong>Controller</strong> and ENT Senses acts as{" "}
        <strong>Processor</strong>. Accepting these Terms formalises this agreement:
      </p>
      <ul>
        <li>
          <strong>Subject:</strong> receiving, storing and showing the professional the results their patients send and
          the records and reports they create.
        </li>
        <li>
          <strong>Data:</strong> questionnaire answers and scores; acoustic voice parameters and estimates (never the
          audio); hearing thresholds and results, symptom questionnaire and headphone type; report clinical data (age,
          history, examination, impedance, speech audiometry, clinical impression and plan); optional sex and age range;
          language, date; invitation data (questionnaire, dates and label) and the pseudonymised label added by the
          professional.
        </li>
        <li>
          <strong>Professional’s obligations:</strong> inform the patient and have an appropriate legal basis; do not
          enter direct identifiers in labels or stored clinical fields.
        </li>
        <li>
          <strong>ENT Senses’ obligations:</strong> process data only to provide the service, ensure confidentiality and
          appropriate security, and not use it for its own purposes (advertising, profiling, disclosure or AI model
          training).
        </li>
        <li>
          <strong>Sub-processors:</strong> database, authentication and cloud hosting providers with Art. 28 GDPR
          safeguards.
        </li>
        <li>
          <strong>Erasure:</strong> the professional can delete any record from the inbox, any invitation from
          Invitations, or the whole account from Settings.
        </li>
      </ul>

      <h2>10. Cancellation</h2>
      <p>
        Professionals can close their account at any time from Settings; their data and the records of every module are
        deleted, unless the law requires otherwise.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by Spanish law. Disputes are submitted to the courts of the user’s domicile where
        consumer law so requires and, otherwise, to those of {OWNER.city}.
      </p>
    </>
  );
}
