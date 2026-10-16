// Content for the public landing only; account screens keep their own copy.
export const landingEs = {
  media: { video: 'Espacio reservado para el video', gif: 'Espacio reservado para el GIF de reconocimiento facial' },
  nav: { how: 'Cómo funciona', roles: 'Roles', facial: 'Reconocimiento facial' },
  hero: {
    pill: 'GESTIÓN INTELIGENTE DE ASISTENCIA',
    title1: 'Transformando el', title2: 'control de', titleAccent: 'asistencia\nacadémica',
    description: 'FaceLit facilita el registro y la consulta de asistencia mediante reconocimiento facial, conectando la información académica de los aprendices con sus sesiones de formación.',
    login: 'Ya tengo cuenta', how: 'Conoce cómo funciona',
    phoneInfo: 'Reconocimiento facial para el registro de asistencia académica.',
    biometry: 'Registro facial', secure: 'Asistencia académica',
  },
  about: { label: 'Qué es FaceLit',
    title: 'La información de tu formación, conectada en un solo lugar',
    text: 'FaceLit reúne usuarios, programas, fichas y sesiones académicas para facilitar la organización y el seguimiento de la asistencia.',
    roles: 'El coordinador administra la información académica, el instructor trabaja con sus grupos y sesiones, y el aprendiz participa en el registro facial y consulta sus datos. Cada persona accede a las funciones correspondientes al rol asignado a su cuenta.',
    videoTitle: 'Conoce FaceLit', videoText: 'Descubre cómo se conectan la organización académica, el registro facial y la consulta de asistencia dentro del sistema.', videoButton: 'Ver cómo funciona FaceLit',
  },
  process: {
    title: 'Desde la organización académica hasta la consulta de asistencia',
    steps: [
      { short: 'Organización', title: 'Organización académica', text: 'El coordinador registra a los usuarios y organiza su vinculación con los programas y las fichas correspondientes. Esta información define el contexto académico en el que participan instructores y aprendices.' },
      { short: 'Registro facial', title: 'Registro facial', text: 'El aprendiz registra su rostro siguiendo las indicaciones de la aplicación. Este paso prepara una referencia facial que permite realizar comparaciones posteriores.' },
      { short: 'Asistencia', title: 'Sesión y asistencia', text: 'El instructor configura el contexto de la sesión. Durante el proceso de asistencia, el sistema compara la captura facial con los registros de los aprendices asociados a la ficha correspondiente.' },
      { short: 'Consulta', title: 'Consulta de registros', text: 'Cada usuario consulta la información disponible según su rol. El instructor revisa la asistencia de sus grupos y el aprendiz consulta sus propios registros.' },
    ],
  },
  rolesLabel: 'Tres roles · Un mismo sistema', rolesTitle: 'Tu espacio en FaceLit.', accessLabel: 'Acceso al sistema',
  capabilities: 'Con FaceLit puedes:',
  roles: {
    coordinator: {
      label: 'Coordinador', title: 'Organiza la información que conecta la formación',
      text: 'El coordinador mantiene organizada la información académica necesaria para utilizar FaceLit. Gestiona usuarios, programas y fichas, y establece las asociaciones que conectan a los instructores y aprendices con su formación.',
      items: ['Registrar y gestionar usuarios de forma manual o mediante la carga de archivos CSV.', 'Administrar programas y fichas.', 'Gestionar las asociaciones académicas de instructores y aprendices.', 'Gestionar traslados de ficha y atender solicitudes administrativas según tus permisos.'],
      videoTitle: 'FaceLit para coordinadores', videoText: 'Conoce el recorrido de gestión de usuarios, programas, fichas y asociaciones académicas desde el espacio del coordinador.', videoButton: 'Ver cómo utiliza FaceLit el coordinador',
    },
    instructor: {
      label: 'Instructor', title: 'Acompaña las sesiones y realiza el seguimiento de asistencia',
      text: 'El instructor trabaja con sus fichas asignadas y utiliza las herramientas de FaceLit para preparar el contexto de las sesiones y revisar la participación de sus aprendices.',
      items: ['Consultar la información académica de tus grupos.', 'Configurar ambientes y el contexto de las sesiones.', 'Utilizar las funciones de captura y reconocimiento facial disponibles.', 'Consultar los registros de asistencia correspondientes a tus grupos.'],
      videoTitle: 'FaceLit para instructores', videoText: 'Conoce cómo acceder a tus fichas, preparar una sesión y utilizar las funciones de asistencia de tu espacio de trabajo.', videoButton: 'Ver cómo utiliza FaceLit el instructor',
    },
    apprentice: {
      label: 'Aprendiz', title: 'Participa en tu formación y consulta tu asistencia',
      text: 'El aprendiz accede a su información personal y realiza el registro de su rostro para participar en el proceso de reconocimiento facial. Desde su espacio puede consultar su perfil y sus registros de asistencia.',
      items: ['Consultar tu perfil y tu información personal.', 'Realizar el registro inicial de tu rostro.', 'Consultar tus registros de asistencia.', 'Solicitar el restablecimiento de tu registro facial cuando corresponda.'],
      videoTitle: 'FaceLit para aprendices', videoText: 'Conoce cómo acceder a tu cuenta, realizar el registro facial y consultar la información de tu asistencia.', videoButton: 'Ver cómo utiliza FaceLit el aprendiz',
    },
  },
  facial: {
    title: 'Tu registro facial, vinculado con cada sesión',
    text: 'FaceLit utiliza una referencia de tu rostro para compararla con una captura realizada durante el proceso de asistencia. La comparación se lleva a cabo dentro del contexto académico de la sesión y considera los registros correspondientes a su ficha.',
    distinction: 'Registrar tu rostro y registrar tu asistencia son pasos diferentes. El registro inicial prepara tu referencia facial; la asistencia corresponde a tu participación en una sesión de formación.',
    meshTitle: 'Malla facial y comparación de identidad',
    meshText: 'La malla facial, mediante Face Mesh, apoya el análisis de los puntos y la geometría del rostro durante la captura. InsightFace genera una representación numérica del rostro que permite realizar la comparación de identidad. La malla facial y la comparación cumplen funciones distintas dentro del proceso.',
    prepare: 'Prepara tu captura',
    items: ['Mantén el rostro visible y dentro del encuadre indicado.', 'Utiliza una iluminación adecuada para que la cámara pueda captar el rostro con claridad.', 'Sigue las indicaciones que aparecen en la aplicación.', 'Espera la confirmación del resultado antes de considerar terminado el proceso.'],
    videoTitle: 'Prepara tu captura facial', videoText: 'Conoce las recomendaciones para ubicarte frente a la cámara y realizar tu registro facial.', videoButton: 'Ver cómo realizar el registro facial',
  },
  access: { title: 'Cada rol tiene su propio espacio en FaceLit', text: 'Inicia sesión con tu número de documento y contraseña. La aplicación te mostrará las funciones correspondientes al rol asignado a tu cuenta: coordinador, instructor o aprendiz.', help: 'Si todavía no tienes una cuenta, consulta con el coordinador responsable de tu registro.' },
  closing: { title: 'Una forma más organizada de gestionar la asistencia académica', text: 'FaceLit conecta la información académica, el reconocimiento facial y las responsabilidades de cada rol para facilitar el seguimiento de las sesiones de formación.', login: 'Iniciar sesión' },
  footer: 'FaceLit · Gestión de asistencia académica', videoPending: 'Video próximamente', backToTop: 'Volver al inicio',
};

type LandingContent = typeof landingEs;

export const landingEn: LandingContent = {
  media: { video: 'Space reserved for the video', gif: 'Space reserved for the facial recognition GIF' },
  nav: { how: 'How it works', roles: 'Roles', facial: 'Facial recognition' },
  hero: {
    pill: 'SMART ATTENDANCE MANAGEMENT', title1: 'Transforming', title2: 'academic', titleAccent: 'attendance\nmanagement',
    description: 'FaceLit makes it easier to record and review attendance through facial recognition, connecting learners’ academic information with their training sessions.',
    login: 'I already have an account', how: 'See how it works', phoneInfo: 'Facial recognition for academic attendance recording.', biometry: 'Facial enrollment', secure: 'Academic attendance',
  },
  about: { label: 'What is FaceLit?',
    title: 'Your training information, connected in one place', text: 'FaceLit brings together users, programs, training groups and academic sessions to help organize and track attendance.',
    roles: 'Coordinators manage academic information, instructors work with their groups and sessions, and learners enroll their faces and review their information. Each person can access the features available to the role assigned to their account.',
    videoTitle: 'Discover FaceLit', videoText: 'Discover how academic organization, facial enrollment and attendance records connect within the system.', videoButton: 'See how FaceLit works',
  },
  process: { title: 'From academic organization to attendance records', steps: [
    { short: 'Organization', title: 'Academic organization', text: 'The coordinator registers users and links them to the relevant programs and training groups. This information defines the academic context for instructors and learners.' },
    { short: 'Facial enrollment', title: 'Facial enrollment', text: 'Learners enroll their faces by following the application’s instructions. This step creates a facial reference for later comparisons.' },
    { short: 'Attendance', title: 'Session and attendance', text: 'The instructor sets up the session context. During attendance recording, the system compares the facial capture with the records of learners in the relevant training group.' },
    { short: 'Records', title: 'Reviewing records', text: 'Each user reviews the information available to their role. Instructors review attendance for their groups, and learners review their own records.' },
  ] },
  rolesLabel: 'Three roles · One system', rolesTitle: 'Your space in FaceLit.', accessLabel: 'System access',
  capabilities: 'With FaceLit you can:',
  roles: {
    coordinator: { label: 'Coordinator', title: 'Organize the information that connects training', text: 'Coordinators organize the academic information needed to use FaceLit. They manage users, programs and training groups, and establish the associations that connect instructors and learners with their training.', items: ['Register and manage users manually or by uploading CSV files.', 'Manage programs and training groups.', 'Manage the academic associations of instructors and learners.', 'Manage training group transfers and administrative requests according to your permissions.'], videoTitle: 'FaceLit for coordinators', videoText: 'Explore user, program, training group and academic association management in the coordinator workspace.', videoButton: 'See how coordinators use FaceLit' },
    instructor: { label: 'Instructor', title: 'Support sessions and track attendance', text: 'Instructors work with their assigned training groups and use FaceLit tools to prepare session contexts and review learner participation.', items: ['Review academic information for your groups.', 'Set up training rooms and session contexts.', 'Use the available facial capture and recognition features.', 'Review attendance records for your groups.'], videoTitle: 'FaceLit for instructors', videoText: 'Learn how to access your training groups, prepare a session and use the attendance features in your workspace.', videoButton: 'See how instructors use FaceLit' },
    apprentice: { label: 'Learner', title: 'Take part in your training and review your attendance', text: 'Learners access their personal information and enroll their faces to take part in facial recognition. In their workspace, they can review their profiles and attendance records.', items: ['Review your profile and personal information.', 'Complete your initial facial enrollment.', 'Review your attendance records.', 'Request a facial enrollment reset when needed.'], videoTitle: 'FaceLit for learners', videoText: 'Learn how to access your account, enroll your face and review your attendance information.', videoButton: 'See how learners use FaceLit' },
  },
  facial: {
    title: 'Your facial reference, linked to each session', text: 'FaceLit uses a reference of your face to compare it with a capture taken during attendance recording. The comparison takes place within the academic context of the session and considers the records for its training group.',
    distinction: 'Enrolling your face and recording your attendance are different steps. Initial enrollment creates your facial reference; attendance relates to your participation in a training session.',
    meshTitle: 'Facial mesh and identity comparison', meshText: 'The facial mesh, through Face Mesh, helps analyze facial points and geometry during capture. InsightFace generates a numerical representation of the face for identity comparison. The facial mesh and comparison serve different purposes in this process.',
    prepare: 'Prepare for your capture', items: ['Keep your face visible and within the indicated frame.', 'Use suitable lighting so the camera can capture your face clearly.', 'Follow the instructions shown in the application.', 'Wait for confirmation of the result before considering the process complete.'],
    videoTitle: 'Prepare your facial capture', videoText: 'Learn how to position yourself in front of the camera and complete facial enrollment.', videoButton: 'See how to enroll your face',
  },
  access: { title: 'Every role has its own space in FaceLit', text: 'Sign in with your identification number and password. The application will show the features available to the role assigned to your account: coordinator, instructor or learner.', help: 'If you do not have an account yet, contact the coordinator responsible for your registration.' },
  closing: { title: 'A more organized way to manage academic attendance', text: 'FaceLit connects academic information, facial recognition and each role’s responsibilities to make training sessions easier to track.', login: 'Sign in' },
  footer: 'FaceLit · Academic attendance management', videoPending: 'Video coming soon', backToTop: 'Back to top',
};

export const landingFr: LandingContent = {
  media: { video: 'Espace réservé à la vidéo', gif: 'Espace réservé au GIF de reconnaissance faciale' },
  nav: { how: 'Fonctionnement', roles: 'Rôles', facial: 'Reconnaissance faciale' },
  hero: { pill: 'GESTION INTELLIGENTE DES PRÉSENCES', title1: 'Transformer le', title2: 'suivi des', titleAccent: 'présences\nen formation', description: 'FaceLit facilite l’enregistrement et la consultation des présences grâce à la reconnaissance faciale, en reliant les informations pédagogiques des apprenants à leurs séances de formation.', login: 'J’ai déjà un compte', how: 'Découvrir le fonctionnement', phoneInfo: 'La reconnaissance faciale pour enregistrer les présences en formation.', biometry: 'Enregistrement du visage', secure: 'Présences en formation' },
  about: { label: 'Qu’est-ce que FaceLit ?', title: 'Les informations de votre formation, réunies au même endroit', text: 'FaceLit regroupe les utilisateurs, les programmes, les groupes de formation et les séances pour faciliter l’organisation et le suivi des présences.', roles: 'Le coordinateur gère les informations pédagogiques, le formateur travaille avec ses groupes et ses séances, et l’apprenant enregistre son visage et consulte ses données. Chaque personne accède aux fonctions correspondant au rôle attribué à son compte.', videoTitle: 'Découvrez FaceLit', videoText: 'Découvrez les liens entre l’organisation pédagogique, l’enregistrement du visage et la consultation des présences dans le système.', videoButton: 'Découvrir le fonctionnement de FaceLit' },
  process: { title: 'De l’organisation pédagogique à la consultation des présences', steps: [
    { short: 'Organisation', title: 'Organisation pédagogique', text: 'Le coordinateur inscrit les utilisateurs et les rattache aux programmes et aux groupes de formation correspondants. Ces informations définissent le contexte pédagogique des formateurs et des apprenants.' },
    { short: 'Visage', title: 'Enregistrement du visage', text: 'L’apprenant enregistre son visage en suivant les indications de l’application. Cette étape prépare une référence faciale pour les comparaisons ultérieures.' },
    { short: 'Présences', title: 'Séance et présence', text: 'Le formateur configure le contexte de la séance. Lors de l’enregistrement des présences, le système compare la capture du visage aux références des apprenants du groupe concerné.' },
    { short: 'Consultation', title: 'Consultation des données', text: 'Chaque utilisateur consulte les informations accessibles selon son rôle. Le formateur vérifie les présences de ses groupes et l’apprenant consulte ses propres données.' },
  ] },
  rolesLabel: 'Trois rôles · Un même système', rolesTitle: 'Votre espace dans FaceLit.', accessLabel: 'Accès au système',
  capabilities: 'Avec FaceLit, vous pouvez :',
  roles: {
    coordinator: { label: 'Coordinateur', title: 'Organisez les informations qui relient la formation', text: 'Le coordinateur organise les informations pédagogiques nécessaires à l’utilisation de FaceLit. Il gère les utilisateurs, les programmes et les groupes, et établit les liens entre les formateurs, les apprenants et leur formation.', items: ['Inscrire et gérer les utilisateurs manuellement ou en important des fichiers CSV.', 'Gérer les programmes et les groupes de formation.', 'Gérer les rattachements pédagogiques des formateurs et des apprenants.', 'Gérer les changements de groupe et les demandes administratives selon vos autorisations.'], videoTitle: 'FaceLit pour les coordinateurs', videoText: 'Découvrez la gestion des utilisateurs, des programmes, des groupes et des rattachements pédagogiques depuis l’espace coordinateur.', videoButton: 'Voir comment le coordinateur utilise FaceLit' },
    instructor: { label: 'Formateur', title: 'Accompagnez les séances et suivez les présences', text: 'Le formateur travaille avec les groupes qui lui sont attribués et utilise les outils de FaceLit pour préparer le contexte des séances et consulter la participation des apprenants.', items: ['Consulter les informations pédagogiques de vos groupes.', 'Configurer les salles de formation et le contexte des séances.', 'Utiliser les fonctions disponibles de capture et de reconnaissance faciale.', 'Consulter les présences de vos groupes.'], videoTitle: 'FaceLit pour les formateurs', videoText: 'Découvrez comment accéder à vos groupes, préparer une séance et utiliser les fonctions de suivi des présences de votre espace.', videoButton: 'Voir comment le formateur utilise FaceLit' },
    apprentice: { label: 'Apprenant', title: 'Participez à votre formation et consultez vos présences', text: 'L’apprenant accède à ses informations personnelles et enregistre son visage pour participer à la reconnaissance faciale. Depuis son espace, il peut consulter son profil et ses présences.', items: ['Consulter votre profil et vos informations personnelles.', 'Effectuer l’enregistrement initial de votre visage.', 'Consulter vos présences.', 'Demander la réinitialisation de votre enregistrement facial si nécessaire.'], videoTitle: 'FaceLit pour les apprenants', videoText: 'Découvrez comment accéder à votre compte, enregistrer votre visage et consulter vos présences.', videoButton: 'Voir comment l’apprenant utilise FaceLit' },
  },
  facial: { title: 'Votre référence faciale, liée à chaque séance', text: 'FaceLit compare une référence de votre visage à une capture réalisée lors de l’enregistrement des présences. La comparaison tient compte du contexte pédagogique de la séance et des références des apprenants du groupe concerné.', distinction: 'Enregistrer votre visage et enregistrer votre présence sont deux étapes différentes. L’enregistrement initial prépare votre référence faciale ; la présence correspond à votre participation à une séance de formation.', meshTitle: 'Maillage facial et comparaison d’identité', meshText: 'Le maillage facial, avec Face Mesh, facilite l’analyse des points et de la géométrie du visage pendant la capture. InsightFace génère une représentation numérique du visage pour comparer l’identité. Le maillage facial et la comparaison remplissent des fonctions différentes dans ce processus.', prepare: 'Préparez votre capture', items: ['Gardez le visage visible et dans le cadre indiqué.', 'Utilisez un éclairage adapté pour que la caméra capture clairement votre visage.', 'Suivez les indications affichées dans l’application.', 'Attendez la confirmation du résultat avant de considérer le processus comme terminé.'], videoTitle: 'Préparez la capture de votre visage', videoText: 'Découvrez les recommandations pour vous placer devant la caméra et enregistrer votre visage.', videoButton: 'Voir comment enregistrer votre visage' },
  access: { title: 'Chaque rôle dispose de son espace dans FaceLit', text: 'Connectez-vous avec votre numéro d’identification et votre mot de passe. L’application affichera les fonctions correspondant au rôle attribué à votre compte : coordinateur, formateur ou apprenant.', help: 'Si vous n’avez pas encore de compte, contactez le coordinateur responsable de votre inscription.' },
  closing: { title: 'Une manière plus organisée de gérer les présences en formation', text: 'FaceLit relie les informations pédagogiques, la reconnaissance faciale et les responsabilités de chaque rôle pour faciliter le suivi des séances de formation.', login: 'Se connecter' },
  footer: 'FaceLit · Gestion des présences en formation', videoPending: 'Vidéo à venir', backToTop: 'Retour en haut',
};

export const landingDe: LandingContent = {
  media: { video: 'Platz für das Video', gif: 'Platz für das GIF zur Gesichtserkennung' },
  nav: { how: 'So funktioniert es', roles: 'Rollen', facial: 'Gesichtserkennung' },
  hero: { pill: 'INTELLIGENTE ANWESENHEITSVERWALTUNG', title1: 'Neue Wege für die', title2: 'Erfassung der', titleAccent: 'Anwesenheit\nin der Ausbildung', description: 'FaceLit erleichtert die Erfassung und Abfrage der Anwesenheit durch Gesichtserkennung und verknüpft die Ausbildungsdaten der Lernenden mit ihren Unterrichtseinheiten.', login: 'Ich habe bereits ein Konto', how: 'So funktioniert es', phoneInfo: 'Gesichtserkennung zur Anwesenheitserfassung in der Ausbildung.', biometry: 'Gesichtsregistrierung', secure: 'Anwesenheit im Unterricht' },
  about: { label: 'Was ist FaceLit?', title: 'Ihre Ausbildungsdaten, an einem Ort verknüpft', text: 'FaceLit führt Benutzer, Programme, Ausbildungsgruppen und Unterrichtseinheiten zusammen, um die Organisation und Nachverfolgung der Anwesenheit zu erleichtern.', roles: 'Koordinatoren verwalten die Ausbildungsdaten, Lehrkräfte arbeiten mit ihren Gruppen und Unterrichtseinheiten, und Lernende registrieren ihr Gesicht und sehen ihre Daten ein. Jede Person erhält Zugriff auf die Funktionen der ihrem Konto zugewiesenen Rolle.', videoTitle: 'FaceLit kennenlernen', videoText: 'Entdecken Sie, wie Ausbildungsorganisation, Gesichtsregistrierung und Anwesenheitsabfrage im System zusammenwirken.', videoButton: 'So funktioniert FaceLit' },
  process: { title: 'Von der Ausbildungsorganisation bis zur Anwesenheitsabfrage', steps: [
    { short: 'Organisation', title: 'Ausbildungsorganisation', text: 'Der Koordinator registriert Benutzer und ordnet sie den jeweiligen Programmen und Ausbildungsgruppen zu. Diese Informationen legen den Ausbildungskontext für Lehrkräfte und Lernende fest.' },
    { short: 'Gesichtsregistrierung', title: 'Gesichtsregistrierung', text: 'Lernende registrieren ihr Gesicht anhand der Anweisungen der Anwendung. Dabei wird eine Gesichtsreferenz für spätere Vergleiche erstellt.' },
    { short: 'Anwesenheit', title: 'Unterricht und Anwesenheit', text: 'Die Lehrkraft richtet den Kontext der Unterrichtseinheit ein. Bei der Anwesenheitserfassung vergleicht das System die Gesichtsaufnahme mit den Referenzen der Lernenden in der zugehörigen Ausbildungsgruppe.' },
    { short: 'Abfrage', title: 'Einträge einsehen', text: 'Jeder Benutzer sieht die Informationen ein, die seiner Rolle zur Verfügung stehen. Lehrkräfte prüfen die Anwesenheit ihrer Gruppen, Lernende ihre eigenen Einträge.' },
  ] },
  rolesLabel: 'Drei Rollen · Ein System', rolesTitle: 'Ihr Bereich in FaceLit.', accessLabel: 'Zugang zum System',
  capabilities: 'Mit FaceLit können Sie:',
  roles: {
    coordinator: { label: 'Koordinator', title: 'Organisieren Sie die Daten, die Ihre Ausbildung verbinden', text: 'Der Koordinator organisiert die für FaceLit benötigten Ausbildungsdaten. Er verwaltet Benutzer, Programme und Ausbildungsgruppen und stellt die Zuordnungen zwischen Lehrkräften, Lernenden und ihrer Ausbildung her.', items: ['Benutzer manuell oder durch Hochladen von CSV-Dateien registrieren und verwalten.', 'Programme und Ausbildungsgruppen verwalten.', 'Die Ausbildungszuordnungen von Lehrkräften und Lernenden verwalten.', 'Gruppenwechsel und administrative Anfragen entsprechend Ihren Berechtigungen bearbeiten.'], videoTitle: 'FaceLit für Koordinatoren', videoText: 'Lernen Sie die Verwaltung von Benutzern, Programmen, Gruppen und Ausbildungszuordnungen im Koordinatorbereich kennen.', videoButton: 'So nutzen Koordinatoren FaceLit' },
    instructor: { label: 'Lehrkraft', title: 'Begleiten Sie den Unterricht und verfolgen Sie die Anwesenheit', text: 'Lehrkräfte arbeiten mit ihren zugewiesenen Ausbildungsgruppen und nutzen FaceLit, um Unterrichtseinheiten vorzubereiten und die Teilnahme der Lernenden einzusehen.', items: ['Die Ausbildungsdaten Ihrer Gruppen einsehen.', 'Unterrichtsräume und den Kontext der Unterrichtseinheiten einrichten.', 'Die verfügbaren Funktionen zur Gesichtsaufnahme und Gesichtserkennung nutzen.', 'Die Anwesenheitseinträge Ihrer Gruppen einsehen.'], videoTitle: 'FaceLit für Lehrkräfte', videoText: 'Erfahren Sie, wie Sie Ihre Gruppen aufrufen, eine Unterrichtseinheit vorbereiten und die Anwesenheitsfunktionen Ihres Arbeitsbereichs nutzen.', videoButton: 'So nutzen Lehrkräfte FaceLit' },
    apprentice: { label: 'Lernende', title: 'Nehmen Sie an Ihrer Ausbildung teil und prüfen Sie Ihre Anwesenheit', text: 'Lernende greifen auf ihre persönlichen Informationen zu und registrieren ihr Gesicht für die Gesichtserkennung. In ihrem Bereich können sie ihr Profil und ihre Anwesenheitseinträge einsehen.', items: ['Ihr Profil und Ihre persönlichen Informationen einsehen.', 'Ihr Gesicht erstmals registrieren.', 'Ihre Anwesenheitseinträge einsehen.', 'Bei Bedarf die Zurücksetzung Ihrer Gesichtsregistrierung beantragen.'], videoTitle: 'FaceLit für Lernende', videoText: 'Erfahren Sie, wie Sie sich anmelden, Ihr Gesicht registrieren und Ihre Anwesenheitsdaten einsehen.', videoButton: 'So nutzen Lernende FaceLit' },
  },
  facial: { title: 'Ihre Gesichtsreferenz, mit jeder Unterrichtseinheit verknüpft', text: 'FaceLit vergleicht eine Referenz Ihres Gesichts mit einer Aufnahme aus der Anwesenheitserfassung. Der Vergleich erfolgt im Ausbildungskontext der Unterrichtseinheit und berücksichtigt die Referenzen der zugehörigen Ausbildungsgruppe.', distinction: 'Die Registrierung Ihres Gesichts und die Erfassung Ihrer Anwesenheit sind unterschiedliche Schritte. Die erste Registrierung erstellt Ihre Gesichtsreferenz; die Anwesenheit bezieht sich auf Ihre Teilnahme an einer Unterrichtseinheit.', meshTitle: 'Gesichtsnetz und Identitätsvergleich', meshText: 'Das Gesichtsnetz unterstützt mithilfe von Face Mesh die Analyse der Gesichtspunkte und der Gesichtsgeometrie während der Aufnahme. InsightFace erstellt eine numerische Darstellung des Gesichts für den Identitätsvergleich. Das Gesichtsnetz und der Vergleich erfüllen dabei unterschiedliche Aufgaben.', prepare: 'Bereiten Sie Ihre Aufnahme vor', items: ['Halten Sie Ihr Gesicht sichtbar und innerhalb des angegebenen Rahmens.', 'Sorgen Sie für geeignete Beleuchtung, damit die Kamera Ihr Gesicht deutlich erfassen kann.', 'Folgen Sie den Anweisungen in der Anwendung.', 'Warten Sie auf die Bestätigung des Ergebnisses, bevor Sie den Vorgang als abgeschlossen betrachten.'], videoTitle: 'Bereiten Sie Ihre Gesichtsaufnahme vor', videoText: 'Erfahren Sie, wie Sie sich vor der Kamera positionieren und Ihr Gesicht registrieren.', videoButton: 'So registrieren Sie Ihr Gesicht' },
  access: { title: 'Jede Rolle hat ihren eigenen Bereich in FaceLit', text: 'Melden Sie sich mit Ihrer Ausweisnummer und Ihrem Passwort an. Die Anwendung zeigt die Funktionen der Ihrem Konto zugewiesenen Rolle an: Koordinator, Lehrkraft oder Lernende.', help: 'Wenn Sie noch kein Konto haben, wenden Sie sich an den für Ihre Registrierung zuständigen Koordinator.' },
  closing: { title: 'Eine besser organisierte Anwesenheitsverwaltung in der Ausbildung', text: 'FaceLit verbindet Ausbildungsdaten, Gesichtserkennung und die Aufgaben jeder Rolle, um die Nachverfolgung der Unterrichtseinheiten zu erleichtern.', login: 'Anmelden' },
  footer: 'FaceLit · Anwesenheitsverwaltung in der Ausbildung', videoPending: 'Video demnächst verfügbar', backToTop: 'Nach oben',
};
