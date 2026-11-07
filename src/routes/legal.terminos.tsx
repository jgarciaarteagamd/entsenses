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
        <strong>Importante.</strong> ENT Senses <strong>no es un producto sanitario con marcado CE</strong> ni un
        audiómetro certificado. La prueba para pacientes es <strong>solo informativa</strong>: no es un diagnóstico y no
        sustituye a una audiometría realizada por un profesional en un centro auditivo. Si nota una pérdida de audición
        repentina, dolor, supuración o vértigo, consulte con un médico cuanto antes.
      </p>

      <h2>1. Objeto</h2>
      <p>
        ENT Senses (en adelante, «la Aplicación») es una herramienta para <strong>profesionales sanitarios</strong>{" "}
        que permite:
      </p>
      <ul>
        <li>
          <strong>Elaborar informes audiométricos</strong> a partir de los datos que el profesional introduce
          (audiometría tonal, impedanciometría, logoaudiometría, antecedentes y diagnóstico), con cálculo de promedios
          tonales y porcentajes de pérdida según métodos publicados.
        </li>
        <li>
          <strong>Ofrecer a sus pacientes una prueba auditiva informativa</strong>, que el paciente realiza en su propio
          dispositivo cuando su médico se lo facilita mediante un enlace o un código QR.
        </li>
        <li>
          En desarrollo: realizar una <strong>audiometría tonal liminal por vía aérea</strong> (125–8000 Hz) en la
          consulta del profesional, con auriculares audiométricos y un perfil de calibración.
        </li>
      </ul>
      <p>El uso de la Aplicación implica la aceptación plena de los presentes Términos.</p>

      <h2>2. Titularidad</h2>
      <p>
        La titularidad de la Aplicación corresponde a <strong>{OWNER.name}</strong>, {OWNER.role.es}, colegiado nº{" "}
        {OWNER.colegiado}, con domicilio profesional en {OWNER.city}. Contacto:{" "}
        <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
      </p>

      <h2>3. Naturaleza de la Aplicación y limitaciones</h2>
      <ul>
        <li>
          <strong>Sin marcado CE.</strong> La Aplicación no ha sido evaluada ni certificada como producto sanitario
          conforme al Reglamento (UE) 2017/745, ni como audiómetro conforme a la norma IEC 60645-1.
        </li>
        <li>
          <strong>Prueba para pacientes (informativa).</strong> Se realiza con el dispositivo, los auriculares y en el
          entorno del paciente, que <strong>no están calibrados</strong>. Sus resultados son aproximados, dependen de
          esos factores y se muestran siempre como «no calibrados». Sirve para informar y orientar sobre la conveniencia
          de una evaluación profesional; <strong>no permite establecer un diagnóstico</strong>.
        </li>
        <li>
          <strong>Generador de informes.</strong> Es una herramienta administrativa de cálculo y redacción. El
          profesional es el único responsable de la veracidad de los datos introducidos, de su interpretación y del
          contenido del informe que firma.
        </li>
        <li>
          <strong>Audiometría en consulta (en desarrollo).</strong> Aunque se diseña siguiendo las normas ISO 8253-1, ISO
          389-1 e IEC 60645-1, sus resultados son <strong>orientativos</strong> mientras no disponga de marcado CE. No
          debe utilizarse para peritajes, certificados laborales o médico-legales, adaptación de audífonos ni indicación
          quirúrgica. Ante hallazgos patológicos se recomienda una audiometría con equipo certificado.
        </li>
        <li>
          <strong>Seguridad.</strong> El paciente debe realizar la prueba con un volumen cómodo y detenerla si nota
          molestias o dolor.
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
          completo, DNI, teléfono, dirección o email). Los campos de identificación del informe (nombre, apellidos,
          documento y fecha de nacimiento) <strong>no se guardan</strong>: se usan solo para imprimir.
        </li>
        <li>No compartir públicamente el enlace o QR de paciente fuera del contexto asistencial para el que se emite.</li>
        <li>No intentar acceder a datos o cuentas ajenas ni alterar el funcionamiento del servicio.</li>
      </ul>

      <h2>6. Descargo médico</h2>
      <p>
        La Aplicación es una <strong>herramienta de apoyo</strong> y no debe utilizarse como único fundamento de un
        diagnóstico o tratamiento. La interpretación de los resultados corresponde exclusivamente al profesional
        sanitario, que debe contrastarlos con la exploración clínica y, cuando proceda, con pruebas realizadas con equipos
        certificados.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        El código, el diseño y los textos originales de la Aplicación están protegidos por la normativa de propiedad
        intelectual. Los métodos de cálculo se basan en procedimientos publicados (AAO-HNS, AMA, AAOO) y los métodos de
        exploración en normas técnicas (ISO 8253-1, ISO 389-1, IEC 60645-1), que se citan como referencia de sus autores.
      </p>

      <h2>8. Disponibilidad y responsabilidad</h2>
      <p>
        Se procura mantener el servicio disponible, sin garantizar la ausencia de interrupciones o errores. En la
        medida máxima permitida por la ley, el titular no será responsable de daños indirectos ni de decisiones
        clínicas basadas total o parcialmente en la información mostrada por la Aplicación.
      </p>

      <h2>9. Encargo del tratamiento (art. 28 RGPD)</h2>
      <p>
        Respecto a los datos de los pacientes, el médico usuario es el <strong>Responsable del tratamiento</strong> y
        ENT Senses actúa como <strong>Encargado</strong>. La aceptación de estos Términos formaliza el encargo:
      </p>
      <ul>
        <li>
          <strong>Objeto:</strong> recibir, almacenar y mostrar al médico los resultados de las pruebas de sus pacientes
          y los datos clínicos de los informes que elabore.
        </li>
        <li>
          <strong>Datos:</strong> umbrales auditivos y resultados de la prueba, cuestionario de síntomas, tipo de
          auricular, indicadores de calidad, rango de edad y sexo opcionales, idioma, fecha, datos clínicos del informe
          (edad, antecedentes, exploración, impedanciometría, logoaudiometría, juicio clínico y plan) y la etiqueta
          seudonimizada que añada el médico.
        </li>
        <li>
          <strong>Obligaciones del médico:</strong> informar al paciente y contar con base jurídica adecuada; no
          introducir identificadores directos en las etiquetas ni en los campos clínicos guardados.
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
          <strong>Supresión:</strong> el médico puede eliminar cualquier resultado desde su bandeja o su cuenta completa
          desde Configuración.
        </li>
      </ul>

      <h2>10. Legislación aplicable</h2>
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
        <strong>Important.</strong> ENT Senses <strong>is not a CE-marked medical device</strong> nor a certified
        audiometer. The patient check is <strong>informative only</strong>: it is not a diagnosis and does not replace an
        audiometry performed by a professional at a hearing centre. If you notice sudden hearing loss, pain, discharge
        or vertigo, see a doctor as soon as possible.
      </p>

      <h2>1. Purpose</h2>
      <p>ENT Senses (the “App”) is a tool for <strong>healthcare professionals</strong> to:</p>
      <ul>
        <li>
          <strong>Prepare audiometric reports</strong> from the data the professional enters (pure-tone audiometry,
          impedance, speech audiometry, history and diagnosis), with pure-tone averages and hearing-loss percentages
          computed by published methods.
        </li>
        <li>
          <strong>Offer their patients an informative hearing check</strong>, taken on the patient’s own device when
          their doctor provides a link or QR code.
        </li>
        <li>
          In development: perform <strong>air-conduction pure-tone threshold audiometry</strong> (125–8000 Hz) in the
          professional’s practice, with audiometric headphones and a calibration profile.
        </li>
      </ul>
      <p>Using the App implies full acceptance of these Terms.</p>

      <h2>2. Ownership</h2>
      <p>
        The App is owned by <strong>{OWNER.name}</strong>, {OWNER.role.en}, licence no. {OWNER.colegiado}, based in{" "}
        {OWNER.city}. Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
      </p>

      <h2>3. Nature of the App and limitations</h2>
      <ul>
        <li>
          <strong>Not CE-marked.</strong> The App has not been assessed or certified as a medical device under
          Regulation (EU) 2017/745, nor as an audiometer under IEC 60645-1.
        </li>
        <li>
          <strong>Patient check (informative).</strong> It runs on the patient’s device, headphones and surroundings,
          which are <strong>not calibrated</strong>. Results are approximate, depend on those factors and are always
          shown as “not calibrated”. It informs and guides on whether a professional assessment is advisable;{" "}
          <strong>it cannot establish a diagnosis</strong>.
        </li>
        <li>
          <strong>Report generator.</strong> An administrative calculation and drafting tool. The professional is solely
          responsible for the accuracy of the data entered, its interpretation and the content of the report they sign.
        </li>
        <li>
          <strong>In-clinic audiometry (in development).</strong> Although designed following ISO 8253-1, ISO 389-1 and
          IEC 60645-1, its results are <strong>orientative</strong> while it lacks CE marking. It must not be used for
          medico-legal or occupational certificates, hearing-aid fitting or surgical indication. Pathological findings
          should be confirmed with certified equipment.
        </li>
        <li>
          <strong>Safety.</strong> Patients should use a comfortable volume and stop if they feel discomfort or pain.
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
          Do not enter patient identifiers (full name, ID number, phone, address or e-mail) in labels or in stored
          clinical fields. The report’s identification fields (name, surname, ID and date of birth){" "}
          <strong>are not stored</strong>: they are used for printing only.
        </li>
        <li>Do not share the patient link or QR code publicly outside the clinical context it was issued for.</li>
        <li>Do not attempt to access other users’ data or accounts or interfere with the service.</li>
      </ul>

      <h2>6. Medical disclaimer</h2>
      <p>
        The App is a <strong>support tool</strong> and must not be the sole basis for a diagnosis or treatment.
        Interpreting results is solely the responsibility of the healthcare professional, who should weigh them against
        the clinical examination and, where appropriate, tests performed with certified equipment.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The App’s code, design and original texts are protected by intellectual property law. Calculations follow
        published procedures (AAO-HNS, AMA, AAOO) and test methods follow technical standards (ISO 8253-1, ISO 389-1, IEC
        60645-1), cited as references to their authors.
      </p>

      <h2>8. Availability and liability</h2>
      <p>
        We aim to keep the service available without guaranteeing it will be free of interruptions or errors. To the
        maximum extent permitted by law, the owner is not liable for indirect damages or for clinical decisions based in
        whole or in part on information shown by the App.
      </p>

      <h2>9. Data processing agreement (Art. 28 GDPR)</h2>
      <p>
        For patient data, the doctor is the <strong>Controller</strong> and ENT Senses acts as{" "}
        <strong>Processor</strong>. Accepting these Terms formalises this agreement:
      </p>
      <ul>
        <li>
          <strong>Subject:</strong> receiving, storing and showing the doctor their patients’ check results and the
          clinical data of the reports they prepare.
        </li>
        <li>
          <strong>Data:</strong> hearing thresholds and check results, symptom questionnaire, headphone type, quality
          indicators, optional age range and sex, language, date, report clinical data (age, history, examination,
          impedance, speech audiometry, clinical impression and plan) and the pseudonymised label added by the doctor.
        </li>
        <li>
          <strong>Doctor’s obligations:</strong> inform the patient and have an appropriate legal basis; do not enter
          direct identifiers in labels or stored clinical fields.
        </li>
        <li>
          <strong>ENT Senses’s obligations:</strong> process data only to provide the service, ensure confidentiality
          and appropriate security, and not use it for its own purposes (advertising, profiling, disclosure or AI model
          training).
        </li>
        <li>
          <strong>Sub-processors:</strong> database, authentication and cloud hosting providers with Art. 28 GDPR
          safeguards.
        </li>
        <li>
          <strong>Erasure:</strong> the doctor can delete any result from the inbox, or the whole account from Settings.
        </li>
      </ul>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by Spanish law. Disputes are submitted to the courts of the user’s domicile where
        consumer law so requires and, otherwise, to those of {OWNER.city}.
      </p>
    </>
  );
}
