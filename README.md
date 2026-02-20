# Slide Master Pro PPTX

Aplicación de escritorio que genera presentaciones PowerPoint (.pptx) automáticamente a partir de una plantilla y datos en Excel. Ideal para crear múltiples diapositivas con el mismo diseño y contenido variable (nombres, títulos, imágenes, etc.).

---

## Descargar e instalar

### Dónde descargar el instalador

1. Ve a la página de **Lanzamientos (Releases)** del proyecto:
   - **En GitHub:** Entra al repositorio y haz clic en **"Releases"** en el menú de la derecha, o visita:
   - [https://github.com/camilogh/slide-master-pro/releases](https://github.com/camilogh/slide-master-pro/releases)
2. En la última versión, descarga el archivo **"Slide Master Pro PPTX Setup X.X.X.exe"** (donde X.X.X es el número de versión).

### Requisitos

- Windows 10 o superior
- No necesitas instalar Node.js ni ningún programa adicional

### Instalación

1. Ejecuta el archivo **Slide Master Pro PPTX Setup X.X.X.exe** que descargaste.
2. Sigue las instrucciones del asistente de instalación.
3. Al terminar, la aplicación quedará instalada y podrás abrirla desde el menú Inicio de Windows.

---

## Cómo usar la aplicación

La aplicación funciona en **4 pasos** que aparecen en la barra superior:

### Paso 1: Dimensiones y fondo

1. Elige el tamaño de las diapositivas (16:9, 4:3, etc.).
2. Sube una imagen de fondo para todas las diapositivas (por ejemplo, un logo o diseño corporativo).
3. Haz clic en **Siguiente**.

### Paso 2: Datos Excel

1. Sube un archivo **Excel (.xlsx)** con los datos. La primera fila debe tener los nombres de las columnas (por ejemplo: Nombre, Cargo, Foto).
2. Cada fila de datos generará una diapositiva.
3. Si usas imágenes en alguna columna (por ejemplo, fotos de personas), sube esas imágenes en la zona indicada. Los nombres de los archivos deben coincidir con los valores que aparecen en la columna correspondiente del Excel.
4. Revisa que las columnas de texto e imagen estén bien detectadas.
5. Haz clic en **Siguiente**.

### Paso 3: Diseño

1. Verás una vista previa del fondo con un lienzo encima.
2. Arrastra elementos desde el panel izquierdo hacia el lienzo:
   - **Variables de texto:** Para mostrar datos del Excel (nombres, cargos, etc.).
   - **Variables de imagen:** Para mostrar imágenes según los datos del Excel.
   - **Texto estático:** Para texto fijo que no cambia (títulos, subtítulos, etc.).
3. Coloca cada elemento donde quieras, ajusta el tamaño y el estilo (tipo de letra, color, alineación).
4. Puedes guardar el diseño en un archivo .json para reutilizarlo más adelante.
5. Haz clic en **Siguiente**.

### Paso 4: Generar PPTX

1. Revisa el resumen (cantidad de diapositivas, variables, etc.).
2. Escribe el nombre con el que quieres guardar el archivo.
3. Haz clic en **Generar PPTX**.
4. Espera a que termine el proceso.
5. Se descargará automáticamente el archivo .pptx. Ábrelo con PowerPoint o cualquier programa compatible.

---

## Resumen rápido

| Paso | Qué haces |
|------|-----------|
| 1 | Subes el fondo y eliges el tamaño |
| 2 | Subes el Excel con los datos y las imágenes (si aplica) |
| 3 | Diseñas la plantilla arrastrando texto e imágenes al lienzo |
| 4 | Generas y descargas el PowerPoint |

---

## Para desarrolladores

Si quieres modificar el código o ejecutar el proyecto en modo desarrollo:

- **Requisitos:** Node.js 18+ y npm
- **Instalar dependencias:** `npm install`
- **Modo desarrollo (web):** `npm run dev`
- **Modo desarrollo (Electron):** `npm run electron:dev`
- **Generar el .exe:** `npm run electron:build`

El ejecutable se genera en la carpeta `release/`.
