
## 🎨 PowerPoint Generator App — Plan de implementación

### Visión general
Una aplicación web de 4 pasos que permite generar archivos `.pptx` personalizados a partir de una imagen de fondo (plantilla) y un archivo Excel con datos, configurando visualmente el diseño con drag & drop.

---

### Paso 1 — Pantalla de configuración inicial

**Dimensiones del slide**
- Campo numérico para ancho y alto en centímetros (por defecto: A4 horizontal → 29.7 × 21 cm)
- Selector rápido con presets: A4, 16:9, 4:3

**Carga de imagen de fondo**
- Zona de drop (drag & drop) o botón para subir imagen PNG/JPG
- Preview de la imagen escalada al formato elegido

---

### Paso 2 — Carga de datos (Excel + Imágenes)

**Archivo Excel**
- Subida del archivo `.xlsx` / `.xls`
- Lectura automática de headers (primera fila) → se convierten en **variables**
- Vista previa de la tabla con las primeras filas de datos

**Carga masiva de imágenes (para columnas tipo imagen)**
- El usuario sube una carpeta o múltiples archivos de imagen
- La app detecta automáticamente las columnas cuyo contenido coincide con nombres de archivo subidos y las marca como **variables de tipo imagen**
- El resto de columnas se marcan como **variables de texto**

---

### Paso 3 — Editor de diseño (canvas visual)

**Canvas del slide**
- Vista previa del slide con la imagen de fondo, a escala proporcional
- El canvas representa visualmente las dimensiones configuradas

**Panel izquierdo — Variables disponibles**
- Lista de variables (headers del Excel), diferenciadas por icono: texto 📝 o imagen 🖼️
- Cada variable es un chip/pastilla arrastrable hacia el canvas

**Drag & Drop sobre el canvas**
- Al soltar una variable sobre el canvas, se coloca un elemento posicionado
- El elemento puede moverse libremente por el canvas (drag dentro del canvas)
- Se puede redimensionar con handles en las esquinas

**Panel derecho — Propiedades del elemento seleccionado**
- Para variables de **texto**: fuente, tamaño (pt), color, alineación, negrita, cursiva
- Para variables de **imagen**: ancho, alto, mantener proporción
- Para todos: posición X/Y exacta en cm (editable numéricamente)

**Texto estático**
- Botón "Añadir texto fijo" que inserta un elemento de texto editable directamente en el canvas
- Se formatea igual que las variables de texto
- El texto escrito se repite igual en todos los slides

**Guías y ayudas visuales**
- Reglas en los bordes del canvas (opcional)
- Snap a bordes y centro del canvas al arrastrar

---

### Paso 4 — Generación del PowerPoint

**Botón "Generar PowerPoint"**
- Procesa cada fila del Excel como un slide
- Aplica la imagen de fondo a cada slide
- Renderiza cada variable (texto e imagen) en la posición y formato configurados
- Las imágenes de tipo imagen se buscan entre las archivos subidos por nombre de archivo
- Descarga automáticamente el archivo `.pptx` generado con `pptxgenjs`

---

### Flujo de navegación

La app se organiza en 4 pasos secuenciales con una barra de progreso:

> **[1. Dimensiones & Fondo]** → **[2. Datos Excel & Imágenes]** → **[3. Diseño del slide]** → **[4. Generar PPTX]**

El usuario puede navegar hacia atrás para ajustar configuraciones anteriores sin perder el trabajo del paso actual.

---

### Tecnologías utilizadas
- **pptxgenjs** (vía npm) para generación del archivo PowerPoint
- **xlsx** (SheetJS) para lectura del Excel en el navegador
- **react-dnd** o similar para el drag & drop del canvas
- Todo funciona 100% en el navegador, sin backend ni servidor

