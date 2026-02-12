import type { GuidePhase } from "./types";

export const guideCatalog: GuidePhase[] = [
  // ═══════════════════════════════════════════════════════
  // FASE 1: Configuracion Inicial (FREE)
  // ═══════════════════════════════════════════════════════
  {
    number: 1,
    title: "Configuracion Inicial",
    description: "Prepara tu computadora con todo lo necesario para programar.",
    tier: "free",
    guides: [
      {
        slug: "instalar-nodejs",
        title: "Instalar Node.js y npm",
        description: "Descarga e instala Node.js, el entorno de ejecucion que necesitas para crear proyectos web modernos.",
        icon: "server",
        estimatedMinutes: 5,
        tier: "free",
        phase: 1,
        steps: [
          {
            title: "Descarga Node.js",
            description: "Ve a la pagina oficial de Node.js y descarga la version LTS (Long Term Support). Esta es la version mas estable y recomendada.",
            osCommands: {
              windows: "# Abre tu navegador y ve a:\n# https://nodejs.org\n# Haz clic en el boton verde que dice \"LTS\"\n# Descarga el archivo .msi",
              mac: "# Abre tu navegador y ve a:\n# https://nodejs.org\n# Haz clic en el boton verde que dice \"LTS\"\n# Descarga el archivo .pkg",
            },
          },
          {
            title: "Instala Node.js",
            description: "Ejecuta el instalador que descargaste. Acepta todas las opciones por defecto — no necesitas cambiar nada.",
            osCommands: {
              windows: "# Doble clic en el archivo .msi descargado\n# Clic en \"Next\" en cada paso\n# Clic en \"Install\" al final\n# Espera a que termine y clic en \"Finish\"",
              mac: "# Doble clic en el archivo .pkg descargado\n# Clic en \"Continuar\" en cada paso\n# Ingresa tu contraseña cuando la pida\n# Clic en \"Instalar\"",
            },
          },
          {
            title: "Verifica la instalacion",
            description: "Abre una terminal y ejecuta estos comandos para confirmar que Node.js y npm estan instalados correctamente.",
            osCommands: {
              windows: "node --version\nnpm --version",
              mac: "node --version\nnpm --version",
            },
            tip: "Deberias ver numeros de version como v20.x.x y 10.x.x. Si ves un error, reinicia tu terminal e intenta de nuevo.",
          },
        ],
      },
      {
        slug: "instalar-vscode",
        title: "Instalar VS Code",
        description: "Configura Visual Studio Code, el editor de codigo mas popular del mundo, con las extensiones esenciales.",
        icon: "code",
        estimatedMinutes: 5,
        tier: "free",
        phase: 1,
        steps: [
          {
            title: "Descarga VS Code",
            description: "Visual Studio Code es gratis y disponible para Windows y Mac.",
            osCommands: {
              windows: "# Ve a https://code.visualstudio.com\n# Clic en \"Download for Windows\"\n# Descarga el instalador .exe",
              mac: "# Ve a https://code.visualstudio.com\n# Clic en \"Download for Mac\"\n# Descarga el archivo .zip",
            },
          },
          {
            title: "Instala VS Code",
            description: "Ejecuta el instalador. En Windows, marca la opcion 'Agregar al PATH' cuando aparezca.",
            osCommands: {
              windows: "# Doble clic en el archivo .exe\n# IMPORTANTE: Marca \"Add to PATH\" cuando aparezca\n# Clic en \"Next\" y luego \"Install\"",
              mac: "# Descomprime el archivo .zip\n# Arrastra \"Visual Studio Code\" a la carpeta Aplicaciones",
            },
          },
          {
            title: "Instala extensiones esenciales",
            description: "Abre VS Code y ve a la seccion de extensiones (icono de cuadros en la barra lateral). Busca e instala estas extensiones:",
            codeBlock: {
              language: "text",
              code: "Extensiones recomendadas:\n\n1. ESLint — detecta errores en tu codigo\n2. Prettier — formatea tu codigo automaticamente\n3. Tailwind CSS IntelliSense — autocompletado para estilos\n4. Spanish Language Pack — VS Code en espanol (opcional)",
              filename: "extensiones.txt",
            },
            tip: "Puedes buscar cada extension por nombre en la barra de busqueda de extensiones (Ctrl+Shift+X en Windows, Cmd+Shift+X en Mac).",
          },
        ],
      },
      {
        slug: "instalar-git",
        title: "Instalar Git",
        description: "Instala Git, la herramienta que te permite guardar versiones de tu codigo y colaborar con otros.",
        icon: "git-branch",
        estimatedMinutes: 5,
        tier: "free",
        phase: 1,
        steps: [
          {
            title: "Descarga e instala Git",
            description: "Git es gratis y necesario para trabajar con GitHub y desplegar tus proyectos.",
            osCommands: {
              windows: "# Ve a https://git-scm.com\n# Clic en \"Download for Windows\"\n# Ejecuta el instalador .exe\n# Acepta todas las opciones por defecto",
              mac: "# Abre Terminal y ejecuta:\nxcode-select --install\n# Esto instala Git junto con las herramientas de desarrollo de Apple",
            },
          },
          {
            title: "Configura tu identidad",
            description: "Git necesita saber tu nombre y email para marcar cada cambio que hagas. Usa el mismo email que usaras en GitHub.",
            osCommands: {
              windows: "git config --global user.name \"Tu Nombre\"\ngit config --global user.email \"tu@email.com\"",
              mac: "git config --global user.name \"Tu Nombre\"\ngit config --global user.email \"tu@email.com\"",
            },
          },
          {
            title: "Verifica la instalacion",
            description: "Confirma que Git esta instalado y configurado correctamente.",
            osCommands: {
              windows: "git --version\ngit config --global --list",
              mac: "git --version\ngit config --global --list",
            },
            tip: "Deberias ver algo como 'git version 2.x.x' y tu nombre/email configurados.",
          },
        ],
      },
      {
        slug: "terminal-basico",
        title: "Terminal Basico",
        description: "Aprende los comandos esenciales de la terminal que usaras todos los dias como programador.",
        icon: "terminal",
        estimatedMinutes: 10,
        tier: "free",
        phase: 1,
        steps: [
          {
            title: "Abre tu terminal",
            description: "La terminal es donde ejecutas comandos. Cada sistema operativo tiene la suya.",
            osCommands: {
              windows: "# Opcion 1: Busca \"PowerShell\" en el menu inicio\n# Opcion 2: En VS Code, abre la terminal con Ctrl+`\n# Opcion 3: Clic derecho en una carpeta > \"Abrir en Terminal\"",
              mac: "# Opcion 1: Busca \"Terminal\" en Spotlight (Cmd+Space)\n# Opcion 2: En VS Code, abre la terminal con Cmd+`\n# Opcion 3: Finder > Aplicaciones > Utilidades > Terminal",
            },
          },
          {
            title: "Navega entre carpetas",
            description: "Estos son los comandos mas basicos para moverte entre carpetas.",
            osCommands: {
              windows: "# Ver en que carpeta estas\npwd\n\n# Listar archivos de la carpeta actual\nls\n\n# Entrar a una carpeta\ncd nombre-carpeta\n\n# Subir una carpeta\ncd ..\n\n# Ir a tu carpeta de usuario\ncd ~",
              mac: "# Ver en que carpeta estas\npwd\n\n# Listar archivos de la carpeta actual\nls\n\n# Entrar a una carpeta\ncd nombre-carpeta\n\n# Subir una carpeta\ncd ..\n\n# Ir a tu carpeta de usuario\ncd ~",
            },
          },
          {
            title: "Crea y elimina carpetas",
            description: "Aprende a crear carpetas nuevas para tus proyectos.",
            osCommands: {
              windows: "# Crear una carpeta nueva\nmkdir mi-proyecto\n\n# Crear carpeta y entrar a ella\nmkdir mi-proyecto && cd mi-proyecto\n\n# Eliminar una carpeta vacia\nrmdir nombre-carpeta",
              mac: "# Crear una carpeta nueva\nmkdir mi-proyecto\n\n# Crear carpeta y entrar a ella\nmkdir mi-proyecto && cd mi-proyecto\n\n# Eliminar una carpeta vacia\nrmdir nombre-carpeta",
            },
          },
          {
            title: "Limpia y cierra la terminal",
            description: "Comandos utiles para mantener tu terminal organizada.",
            osCommands: {
              windows: "# Limpiar la pantalla\nclear\n# o tambien: cls\n\n# Cancelar un comando en ejecucion\n# Presiona Ctrl+C",
              mac: "# Limpiar la pantalla\nclear\n# o tambien: Cmd+K\n\n# Cancelar un comando en ejecucion\n# Presiona Ctrl+C",
            },
            tip: "Consejo pro: usa la flecha arriba para repetir comandos anteriores. Es mucho mas rapido que escribirlos de nuevo.",
          },
        ],
      },
      {
        slug: "instalar-claude-code",
        title: "Instalar Claude Code",
        description: "Instala Claude Code, la IA que te ayudara a programar directamente desde tu terminal.",
        icon: "sparkles",
        estimatedMinutes: 5,
        tier: "free",
        phase: 1,
        steps: [
          {
            title: "Instala Claude Code",
            description: "Claude Code se instala con un solo comando de npm. Necesitas tener Node.js instalado (guia anterior).",
            osCommands: {
              windows: "npm install -g @anthropic-ai/claude-code",
              mac: "npm install -g @anthropic-ai/claude-code",
            },
          },
          {
            title: "Configura tu API Key",
            description: "Para usar Claude Code necesitas una API key de Anthropic. Ve a console.anthropic.com, crea una cuenta, y genera una key.",
            codeBlock: {
              language: "bash",
              code: "# Despues de obtener tu API key, ejecuta:\nclaude\n\n# Claude Code te pedira tu API key la primera vez\n# Pegala y presiona Enter",
              filename: "terminal",
            },
            tip: "Guarda tu API key en un lugar seguro. No la compartas con nadie ni la subas a GitHub.",
          },
          {
            title: "Prueba tu primer comando",
            description: "Verifica que todo funciona ejecutando Claude Code en cualquier carpeta.",
            osCommands: {
              windows: "# Crea una carpeta de prueba\nmkdir prueba-claude && cd prueba-claude\n\n# Inicia Claude Code\nclaude\n\n# Escribe: \"Crea un archivo hola.js que imprima Hola Mundo\"",
              mac: "# Crea una carpeta de prueba\nmkdir prueba-claude && cd prueba-claude\n\n# Inicia Claude Code\nclaude\n\n# Escribe: \"Crea un archivo hola.js que imprima Hola Mundo\"",
            },
            tip: "Si Claude Code creo el archivo correctamente, ya estas listo para crear proyectos completos!",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 2: Tu Primer Proyecto (BASIC)
  // ═══════════════════════════════════════════════════════
  {
    number: 2,
    title: "Tu Primer Proyecto",
    description: "Crea tu primer proyecto web y publicalo en internet en menos de una hora.",
    tier: "basic",
    guides: [
      {
        slug: "crear-proyecto-claude-code",
        title: "Crear Proyecto con Claude Code",
        description: "Usa un prompt copy-paste para que Claude Code genere un proyecto Next.js completo.",
        icon: "wand",
        estimatedMinutes: 15,
        tier: "basic",
        phase: 2,
        steps: [
          {
            title: "Crea la carpeta del proyecto",
            description: "Primero, crea una carpeta nueva para tu proyecto y abrela en VS Code.",
            osCommands: {
              windows: "mkdir mi-primer-proyecto\ncd mi-primer-proyecto\ncode .",
              mac: "mkdir mi-primer-proyecto\ncd mi-primer-proyecto\ncode .",
            },
          },
          {
            title: "Inicia Claude Code con el prompt",
            description: "Abre la terminal en VS Code y ejecuta Claude Code. Luego copia y pega el siguiente prompt:",
            copyPrompt: {
              label: "Prompt para crear proyecto Next.js",
              prompt: "Crea un proyecto Next.js 15 con App Router, TypeScript, y Tailwind CSS. Incluye:\n- Una pagina principal con un hero section que tenga titulo, subtitulo y un boton\n- Un navbar responsivo con links a Inicio, Sobre Mi, y Contacto\n- Una pagina /sobre-mi con un parrafo de texto placeholder\n- Una pagina /contacto con un formulario simple (nombre, email, mensaje)\n- Usa colores oscuros profesionales (fondo negro/gris oscuro, texto blanco)\n- Asegurate de que sea mobile-first y responsive\n- Ejecuta 'pnpm install' y verifica que 'pnpm dev' funcione sin errores",
            },
          },
          {
            title: "Verifica que funcione",
            description: "Despues de que Claude Code termine, tu proyecto deberia estar corriendo.",
            codeBlock: {
              language: "bash",
              code: "# Si Claude Code no inicio el servidor, hazlo manualmente:\npnpm dev\n\n# Abre tu navegador en:\n# http://localhost:3000",
              filename: "terminal",
            },
            tip: "Deberias ver tu pagina web funcionando. Si hay errores, puedes pedirle a Claude Code que los arregle.",
          },
        ],
      },
      {
        slug: "subir-a-github",
        title: "Subir a GitHub",
        description: "Aprende a guardar tu proyecto en GitHub para tenerlo seguro en la nube y poder desplegarlo.",
        icon: "github",
        estimatedMinutes: 10,
        tier: "basic",
        phase: 2,
        steps: [
          {
            title: "Crea una cuenta en GitHub",
            description: "Si no tienes cuenta, ve a github.com y crea una. Es gratis.",
            codeBlock: {
              language: "text",
              code: "1. Ve a https://github.com\n2. Clic en \"Sign up\"\n3. Sigue los pasos para crear tu cuenta\n4. Verifica tu email",
              filename: "pasos.txt",
            },
          },
          {
            title: "Crea un repositorio nuevo",
            description: "En GitHub, crea un repositorio nuevo para tu proyecto.",
            codeBlock: {
              language: "text",
              code: "1. En GitHub, clic en el boton \"+\" arriba a la derecha\n2. Clic en \"New repository\"\n3. Nombre: mi-primer-proyecto\n4. Deja las demas opciones como estan\n5. Clic en \"Create repository\"",
              filename: "pasos.txt",
            },
          },
          {
            title: "Sube tu codigo",
            description: "Desde la terminal de tu proyecto, ejecuta estos comandos para subir tu codigo a GitHub.",
            osCommands: {
              windows: "git init\ngit add .\ngit commit -m \"primer commit\"\ngit branch -M main\ngit remote add origin https://github.com/TU-USUARIO/mi-primer-proyecto.git\ngit push -u origin main",
              mac: "git init\ngit add .\ngit commit -m \"primer commit\"\ngit branch -M main\ngit remote add origin https://github.com/TU-USUARIO/mi-primer-proyecto.git\ngit push -u origin main",
            },
            tip: "Reemplaza TU-USUARIO con tu nombre de usuario de GitHub. GitHub te pedira autenticarte la primera vez.",
          },
        ],
      },
      {
        slug: "deploy-en-vercel",
        title: "Deploy en Vercel",
        description: "Publica tu proyecto en internet con Vercel. Tu sitio tendra una URL publica en minutos.",
        icon: "globe",
        estimatedMinutes: 10,
        tier: "basic",
        phase: 2,
        steps: [
          {
            title: "Crea una cuenta en Vercel",
            description: "Vercel es la plataforma ideal para desplegar proyectos Next.js. Tiene un plan gratuito generoso.",
            codeBlock: {
              language: "text",
              code: "1. Ve a https://vercel.com\n2. Clic en \"Sign Up\"\n3. Selecciona \"Continue with GitHub\"\n4. Autoriza Vercel para acceder a tu GitHub",
              filename: "pasos.txt",
            },
          },
          {
            title: "Importa tu proyecto",
            description: "Conecta tu repositorio de GitHub con Vercel para desplegarlo automaticamente.",
            codeBlock: {
              language: "text",
              code: "1. En el dashboard de Vercel, clic en \"Add New Project\"\n2. Selecciona tu repositorio \"mi-primer-proyecto\"\n3. Vercel detectara que es un proyecto Next.js\n4. Deja la configuracion por defecto\n5. Clic en \"Deploy\"",
              filename: "pasos.txt",
            },
          },
          {
            title: "Tu sitio esta en vivo!",
            description: "Despues de 1-2 minutos, Vercel te dara una URL publica donde tu sitio esta disponible.",
            codeBlock: {
              language: "bash",
              code: "# Tu sitio estara disponible en algo como:\n# https://mi-primer-proyecto.vercel.app\n\n# Cada vez que hagas push a GitHub,\n# Vercel redesplegara automaticamente!",
              filename: "terminal",
            },
            tip: "Comparte tu URL con amigos y familia. Ya tienes tu primer sitio web en produccion!",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 3: Biblioteca de Prompts (BASIC)
  // ═══════════════════════════════════════════════════════
  {
    number: 3,
    title: "Biblioteca de Prompts",
    description: "Prompts copy-paste para crear proyectos completos con Claude Code.",
    tier: "basic",
    guides: [
      {
        slug: "landing-page-profesional",
        title: "Landing Page Profesional",
        description: "Crea una landing page de alto impacto con hero, features, testimonios y CTA.",
        icon: "layout",
        estimatedMinutes: 5,
        tier: "basic",
        phase: 3,
        steps: [
          {
            title: "Prepara tu proyecto",
            description: "Crea una carpeta nueva e inicia Claude Code.",
            osCommands: {
              windows: "mkdir landing-profesional\ncd landing-profesional\nclaude",
              mac: "mkdir landing-profesional\ncd landing-profesional\nclaude",
            },
          },
          {
            title: "Usa el prompt de Landing Page",
            description: "Copia y pega este prompt en Claude Code para generar una landing page completa:",
            copyPrompt: {
              label: "Prompt - Landing Page Profesional",
              prompt: "Crea un proyecto Next.js 15 con una landing page profesional de alto impacto. Incluye:\n\n**Secciones:**\n- Hero: titulo grande con gradiente, subtitulo, boton CTA principal, imagen/mockup decorativo\n- Logos de clientes: fila de 5-6 logos placeholder en escala de grises\n- Features: grid de 3 columnas con iconos, titulo y descripcion por feature\n- Testimonios: 3 cards con foto, nombre, empresa y quote\n- Pricing: 3 planes (Free, Pro, Enterprise) con lista de features y boton\n- CTA final: seccion con fondo gradiente, titulo y boton\n- Footer: links organizados en columnas, copyright\n\n**Diseno:**\n- Tema oscuro profesional (fondo #0a0a0a)\n- Acentos en azul electrico (#3b82f6) y verde esmeralda (#10b981)\n- Tipografia grande y bold en headings\n- Espaciado generoso entre secciones\n- Animaciones suaves al hacer scroll (usar framer-motion)\n- 100% responsive (mobile-first)\n\nUsa Tailwind CSS. Ejecuta pnpm install && pnpm dev al terminar.",
            },
          },
          {
            title: "Personaliza el contenido",
            description: "Una vez generado, pide a Claude Code que personalice el contenido para tu marca.",
            copyPrompt: {
              label: "Prompt - Personalizar contenido",
              prompt: "Actualiza el contenido de la landing page con esta informacion:\n- Nombre de empresa: [TU EMPRESA]\n- Descripcion: [QUE HACE TU EMPRESA]\n- Features principales: [FEATURE 1], [FEATURE 2], [FEATURE 3]\n- Planes: Free (gratis), Pro ($29/mes), Enterprise ($99/mes)\nMantiene el diseno intacto, solo cambia textos y datos.",
            },
            tip: "Reemplaza los valores entre [corchetes] con la informacion real de tu proyecto.",
          },
        ],
      },
      {
        slug: "portfolio-personal",
        title: "Portfolio Personal",
        description: "Crea un portfolio para mostrar tus proyectos y habilidades como desarrollador.",
        icon: "user",
        estimatedMinutes: 5,
        tier: "basic",
        phase: 3,
        steps: [
          {
            title: "Prepara tu proyecto",
            description: "Crea una carpeta nueva e inicia Claude Code.",
            osCommands: {
              windows: "mkdir mi-portfolio\ncd mi-portfolio\nclaude",
              mac: "mkdir mi-portfolio\ncd mi-portfolio\nclaude",
            },
          },
          {
            title: "Usa el prompt de Portfolio",
            description: "Copia y pega este prompt para generar tu portfolio:",
            copyPrompt: {
              label: "Prompt - Portfolio Personal",
              prompt: "Crea un portfolio personal con Next.js 15, TypeScript y Tailwind CSS. Incluye:\n\n**Paginas:**\n- Home: hero con nombre y titulo, seccion de skills, proyectos destacados\n- Proyectos: grid de cards con imagen, titulo, descripcion, tags de tecnologias, links a demo y GitHub\n- Sobre Mi: foto, bio, timeline de experiencia, lista de tecnologias\n- Contacto: formulario funcional (nombre, email, mensaje) con validacion\n\n**Diseno:**\n- Tema oscuro minimalista y elegante\n- Navbar fijo con scroll suave entre secciones\n- Cards de proyecto con hover effects\n- Gradientes sutiles en textos importantes\n- Animaciones con framer-motion\n- 100% responsive\n\n**Datos:**\n- Usa un archivo data/portfolio.ts con arrays de proyectos y skills\n- Esto facilita actualizar el contenido sin tocar componentes\n\nEjecuta pnpm install && pnpm dev al terminar.",
            },
          },
          {
            title: "Personaliza tu informacion",
            description: "Actualiza el archivo de datos con tu informacion real.",
            copyPrompt: {
              label: "Prompt - Personalizar portfolio",
              prompt: "Actualiza data/portfolio.ts con mi informacion:\n- Nombre: [TU NOMBRE]\n- Titulo: [TU TITULO, ej: Full-Stack Developer]\n- Bio: [2-3 oraciones sobre ti]\n- Skills: [LISTA DE TECNOLOGIAS]\n- Proyectos: agrega 3 proyectos de ejemplo con screenshots placeholder",
            },
          },
        ],
      },
      {
        slug: "blog-con-markdown",
        title: "Blog con Markdown",
        description: "Crea un blog donde puedes escribir posts en Markdown sin necesidad de base de datos.",
        icon: "file-text",
        estimatedMinutes: 5,
        tier: "basic",
        phase: 3,
        steps: [
          {
            title: "Prepara tu proyecto",
            description: "Crea una carpeta nueva e inicia Claude Code.",
            osCommands: {
              windows: "mkdir mi-blog\ncd mi-blog\nclaude",
              mac: "mkdir mi-blog\ncd mi-blog\nclaude",
            },
          },
          {
            title: "Usa el prompt de Blog",
            description: "Copia y pega este prompt para generar un blog completo:",
            copyPrompt: {
              label: "Prompt - Blog con Markdown",
              prompt: "Crea un blog con Next.js 15, TypeScript y Tailwind CSS usando archivos Markdown. Incluye:\n\n**Estructura:**\n- Carpeta content/posts/ con archivos .mdx\n- Cada post tiene frontmatter: title, date, description, tags, coverImage\n- Pagina /blog con lista de posts ordenados por fecha\n- Pagina /blog/[slug] que renderiza el contenido MDX\n- Pagina principal con los 3 posts mas recientes\n\n**Features:**\n- Sintaxis highlighting en bloques de codigo (usar rehype-pretty-code)\n- Tabla de contenidos automatica\n- Tags clickeables que filtran posts\n- Tiempo de lectura estimado\n- Compartir en redes sociales\n- SEO con metadata dinamica por post\n\n**Diseno:**\n- Tema oscuro, tipografia optimizada para lectura\n- Ancho maximo de 680px para el contenido del post\n- Espaciado generoso entre parrafos\n\nIncluye 3 posts de ejemplo sobre programacion. Ejecuta pnpm install && pnpm dev.",
            },
          },
          {
            title: "Escribe tu primer post",
            description: "Crea un nuevo archivo Markdown para escribir tu primer post.",
            copyPrompt: {
              label: "Prompt - Crear nuevo post",
              prompt: "Crea un nuevo post en content/posts/mi-primer-post.mdx con:\n- Titulo: \"Mi Primer Post\"\n- Un parrafo de introduccion\n- Un bloque de codigo de ejemplo en JavaScript\n- Una seccion con 3 tips para principiantes\n- Tags: [\"principiante\", \"javascript\"]",
            },
          },
        ],
      },
      {
        slug: "ecommerce-basico",
        title: "E-commerce Basico",
        description: "Crea una tienda online con catalogo de productos, carrito y pagina de checkout.",
        icon: "shopping-cart",
        estimatedMinutes: 5,
        tier: "basic",
        phase: 3,
        steps: [
          {
            title: "Prepara tu proyecto",
            description: "Crea una carpeta nueva e inicia Claude Code.",
            osCommands: {
              windows: "mkdir mi-tienda\ncd mi-tienda\nclaude",
              mac: "mkdir mi-tienda\ncd mi-tienda\nclaude",
            },
          },
          {
            title: "Usa el prompt de E-commerce",
            description: "Copia y pega este prompt para generar una tienda online:",
            copyPrompt: {
              label: "Prompt - E-commerce Basico",
              prompt: "Crea una tienda online con Next.js 15, TypeScript y Tailwind CSS. Incluye:\n\n**Paginas:**\n- Home: hero banner, productos destacados, categorias\n- /productos: grid de products con filtros por categoria y rango de precio\n- /productos/[slug]: detalle del producto con galeria, descripcion, variantes, boton agregar\n- /carrito: lista de items, cantidades editables, total, boton checkout\n- /checkout: formulario de envio y resumen de orden\n\n**Features:**\n- Carrito persistente en localStorage (React Context + useReducer)\n- Busqueda de productos\n- Filtros por categoria y precio\n- Contador de items en el navbar\n- Animacion al agregar al carrito\n\n**Datos:**\n- Archivo data/products.ts con 12 productos de ejemplo\n- Cada producto: id, name, slug, price, description, images[], category, inStock\n- Categorias: Electronica, Ropa, Accesorios, Hogar\n\n**Diseno:**\n- Tema oscuro profesional\n- Cards de producto con hover zoom\n- Badge de descuento si aplica\n\nEjecuta pnpm install && pnpm dev.",
            },
          },
          {
            title: "Personaliza tus productos",
            description: "Actualiza el catalogo con tus productos reales.",
            copyPrompt: {
              label: "Prompt - Personalizar productos",
              prompt: "Actualiza data/products.ts con mis productos:\n- Categoria: [TU CATEGORIA]\n- Agrega 6 productos con nombre, precio en USD, y descripcion corta\n- Usa imagenes placeholder de https://placehold.co/600x400\n- Ajusta las categorias del filtro para que coincidan",
            },
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // FASE 4: Proyectos Avanzados (PRO)
  // ═══════════════════════════════════════════════════════
  {
    number: 4,
    title: "Proyectos Avanzados",
    description: "Lleva tus proyectos al siguiente nivel con autenticacion, bases de datos y pagos.",
    tier: "pro",
    guides: [
      {
        slug: "app-fullstack-con-auth",
        title: "App Full-Stack con Auth",
        description: "Crea una aplicacion completa con registro, login, dashboard de usuario y roles.",
        icon: "shield",
        estimatedMinutes: 30,
        tier: "pro",
        phase: 4,
        steps: [
          {
            title: "Prepara tu proyecto",
            description: "Crea una carpeta nueva e inicia Claude Code.",
            osCommands: {
              windows: "mkdir app-fullstack\ncd app-fullstack\nclaude",
              mac: "mkdir app-fullstack\ncd app-fullstack\nclaude",
            },
          },
          {
            title: "Genera la app con autenticacion",
            description: "Este prompt genera una aplicacion completa con sistema de usuarios:",
            copyPrompt: {
              label: "Prompt - App Full-Stack con Auth",
              prompt: "Crea una aplicacion full-stack con Next.js 15, TypeScript, Tailwind CSS, Prisma y PostgreSQL. Incluye:\n\n**Autenticacion:**\n- Registro con email y contrasena (hash con bcrypt)\n- Login con sesion JWT en httpOnly cookie\n- Middleware que protege rutas /dashboard/*\n- Logout que limpia la cookie\n- Pagina de recuperar contrasena (flujo basico)\n\n**Paginas publicas:**\n- Landing page con hero y features\n- /login y /registro con formularios validados\n\n**Dashboard (protegido):**\n- /dashboard: resumen con stats cards\n- /dashboard/perfil: editar nombre, email, foto\n- /dashboard/configuracion: cambiar contrasena, preferencias\n- Sidebar con navegacion\n\n**Base de datos (Prisma):**\n- Modelo User: id, email, name, passwordHash, role (USER/ADMIN), createdAt\n- Modelo Session: id, userId, token, expiresAt\n- Script seed con usuario admin de prueba\n\n**Diseno:**\n- Tema oscuro, dashboard con sidebar colapsable\n- Formularios con validacion y mensajes de error\n- Loading states y transiciones suaves\n\nUsa pnpm. Incluye .env.example. Ejecuta pnpm install.",
            },
          },
          {
            title: "Configura la base de datos",
            description: "Conecta tu base de datos PostgreSQL y ejecuta las migraciones.",
            codeBlock: {
              language: "bash",
              code: "# Copia el archivo de variables de entorno\ncp .env.example .env\n\n# Edita .env con tu URL de PostgreSQL:\n# DATABASE_URL=\"postgresql://user:pass@localhost:5432/mydb\"\n\n# Ejecuta las migraciones\npnpm prisma migrate dev\n\n# Carga datos de prueba\npnpm prisma db seed\n\n# Inicia el proyecto\npnpm dev",
              filename: "terminal",
            },
            tip: "Puedes usar Supabase para obtener una base de datos PostgreSQL gratuita en la nube. Ve a supabase.com y crea un proyecto nuevo.",
          },
        ],
      },
      {
        slug: "base-de-datos-prisma",
        title: "Base de Datos con Prisma",
        description: "Aprende a disenar modelos de datos, hacer queries y manejar migraciones con Prisma.",
        icon: "database",
        estimatedMinutes: 20,
        tier: "pro",
        phase: 4,
        steps: [
          {
            title: "Instala Prisma en tu proyecto",
            description: "Agrega Prisma a un proyecto Next.js existente.",
            codeBlock: {
              language: "bash",
              code: "# Instala Prisma\npnpm add prisma @prisma/client\npnpm add -D prisma\n\n# Inicializa Prisma con PostgreSQL\nnpx prisma init --datasource-provider postgresql",
              filename: "terminal",
            },
          },
          {
            title: "Define tus modelos",
            description: "Edita el archivo prisma/schema.prisma para definir la estructura de tu base de datos.",
            copyPrompt: {
              label: "Prompt - Modelos Prisma",
              prompt: "Actualiza prisma/schema.prisma con estos modelos:\n\n- User: id (uuid), email (unique), name, passwordHash, role (enum: USER, ADMIN), avatar, bio, createdAt, updatedAt\n- Post: id (uuid), title, slug (unique), content (text), published (bool), authorId (relation User), tags, createdAt, updatedAt\n- Comment: id (uuid), content, authorId (relation User), postId (relation Post), createdAt\n\nAgrega las relaciones inversas (user.posts, user.comments, post.comments).\nCrea un archivo lib/prisma.ts con el client singleton.\nCrea un seed script en prisma/seed.ts con 3 usuarios y 5 posts de ejemplo.",
            },
          },
          {
            title: "Ejecuta migraciones y queries",
            description: "Aplica los cambios a la base de datos y aprende los queries basicos.",
            codeBlock: {
              language: "bash",
              code: "# Crea la migracion\nnpx prisma migrate dev --name init\n\n# Ejecuta el seed\nnpx prisma db seed\n\n# Abre Prisma Studio para ver tus datos\nnpx prisma studio",
              filename: "terminal",
            },
            tip: "Prisma Studio se abre en localhost:5555 y te permite ver y editar datos directamente en tu navegador.",
          },
        ],
      },
      {
        slug: "pagos-con-stripe",
        title: "Pagos con Stripe",
        description: "Integra pagos con tarjeta de credito usando Stripe Checkout y webhooks.",
        icon: "credit-card",
        estimatedMinutes: 20,
        tier: "pro",
        phase: 4,
        steps: [
          {
            title: "Configura Stripe",
            description: "Crea una cuenta de Stripe y obtiene tus API keys de prueba.",
            codeBlock: {
              language: "text",
              code: "1. Ve a https://dashboard.stripe.com\n2. Crea una cuenta (gratis)\n3. En la seccion \"Developers\" > \"API Keys\"\n4. Copia tu \"Publishable key\" y \"Secret key\"\n5. Asegurate de estar en modo \"Test\"",
              filename: "pasos.txt",
            },
          },
          {
            title: "Integra Stripe Checkout",
            description: "Usa este prompt para agregar pagos a tu proyecto existente:",
            copyPrompt: {
              label: "Prompt - Integrar Stripe",
              prompt: "Agrega pagos con Stripe a mi proyecto Next.js. Incluye:\n\n**Instalacion:**\n- pnpm add stripe @stripe/stripe-js\n\n**API Routes:**\n- POST /api/checkout: crea una Stripe Checkout session con los items del carrito\n- POST /api/webhooks/stripe: recibe eventos de Stripe (checkout.session.completed)\n\n**Paginas:**\n- /checkout/success: pagina de pago exitoso con confetti\n- /checkout/cancel: pagina de pago cancelado con boton para reintentar\n\n**Implementacion:**\n- Usa Stripe Checkout (redirect, no embedded)\n- Maneja el webhook para actualizar el estado de la orden en la DB\n- Verifica la firma del webhook para seguridad\n- Usa variables de entorno: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET\n\nIncluye instrucciones para probar con stripe listen --forward-to localhost:3000/api/webhooks/stripe",
            },
          },
          {
            title: "Prueba el flujo de pago",
            description: "Usa las tarjetas de prueba de Stripe para verificar que todo funcione.",
            codeBlock: {
              language: "bash",
              code: "# Instala Stripe CLI para recibir webhooks localmente\n# https://stripe.com/docs/stripe-cli\n\n# Inicia el listener de webhooks\nstripe listen --forward-to localhost:3000/api/webhooks/stripe\n\n# Tarjetas de prueba:\n# Exito:    4242 4242 4242 4242\n# Rechazada: 4000 0000 0000 0002\n# Requiere auth: 4000 0025 0000 3155",
              filename: "terminal",
            },
            tip: "Siempre prueba con las tarjetas de test de Stripe antes de activar el modo produccion.",
          },
        ],
      },
      {
        slug: "deploy-a-produccion",
        title: "Deploy a Produccion",
        description: "Configura variables de entorno, dominio personalizado y monitoreo para tu app en produccion.",
        icon: "rocket",
        estimatedMinutes: 15,
        tier: "pro",
        phase: 4,
        steps: [
          {
            title: "Configura variables de entorno",
            description: "Agrega todas las variables de entorno necesarias en Vercel.",
            codeBlock: {
              language: "text",
              code: "En Vercel > Tu Proyecto > Settings > Environment Variables\n\nAgrega cada variable:\n- DATABASE_URL = tu URL de PostgreSQL de produccion\n- AUTH_SECRET = un string aleatorio largo (32+ caracteres)\n- STRIPE_SECRET_KEY = tu key de produccion (sk_live_...)\n- STRIPE_WEBHOOK_SECRET = whsec_... de produccion\n- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...\n- NEXT_PUBLIC_APP_URL = https://tudominio.com",
              filename: "pasos.txt",
            },
            tip: "NUNCA pongas variables de entorno de produccion en tu codigo o en GitHub. Siempre usalas a traves del dashboard de Vercel.",
          },
          {
            title: "Conecta un dominio personalizado",
            description: "Configura tu propio dominio para que apunte a tu proyecto en Vercel.",
            codeBlock: {
              language: "text",
              code: "1. En Vercel > Tu Proyecto > Settings > Domains\n2. Escribe tu dominio: tudominio.com\n3. Vercel te dara registros DNS para configurar:\n\n   Tipo: A     | Nombre: @  | Valor: 76.76.21.21\n   Tipo: CNAME | Nombre: www | Valor: cname.vercel-dns.com\n\n4. Agrega estos registros en tu proveedor de dominio\n5. Espera 5-30 minutos para propagacion\n6. Vercel generara un certificado SSL automaticamente",
              filename: "pasos.txt",
            },
          },
          {
            title: "Monitorea tu aplicacion",
            description: "Configura herramientas basicas de monitoreo para saber si tu app esta funcionando.",
            codeBlock: {
              language: "text",
              code: "Herramientas recomendadas (todas tienen plan gratuito):\n\n1. Vercel Analytics — ya incluido, activalo en Settings\n2. Vercel Speed Insights — metricas de rendimiento\n3. Sentry (sentry.io) — captura errores automaticamente\n4. Better Uptime (betteruptime.com) — alerta si tu sitio se cae\n\nPasos:\n- Activa Analytics en Vercel Dashboard\n- Crea cuenta en Sentry, instala @sentry/nextjs\n- Configura un monitor en Better Uptime con tu URL",
              filename: "pasos.txt",
            },
            tip: "Con estas herramientas sabras inmediatamente si algo falla en produccion, antes de que tus usuarios te avisen.",
          },
        ],
      },
    ],
  },
];
