# SaaS Fichajes WhatsApp (Fase 1)

Este es un MVP de software multiempresa (SaaS) para la gestión de horarios, turnos y control de fichaje de jornada laboral mediante WhatsApp usando **FastAPI**, **SQLAlchemy** y **Twilio**.

## 📌 Características de la Fase 1
- **Multi-tenancy**: Separación lógica estricta de datos por `company_id`.
- **Registro Horario Inmutable (España RD-Ley 8/2019)**: No se expone eliminación física (`DELETE`) de fichajes. Las ediciones/creaciones manuales de jornada generan logs de auditoría completos (registro del estado previo y posterior).
- **GDPR Ready**: Opción de "anónimización" del empleado para el derecho al olvido, preservando la continuidad horaria de 4 años requerida por inspección de trabajo.
- **Exportación a CSV**: Descarga tabulada delimitada por punto y coma (`;`), legible en hojas de cálculo (Excel).
- **Procesamiento de Comandos WhatsApp**: Webhook listo para Twilio Sandbox con soporte de comandos:
  - `ENTRADA`: Registra inicio de jornada.
  - `SALIDA`: Registra fin de jornada y calcula la duración.
  - `TURNO HOY` / `TURNO`: Consulta el turno programado para la fecha actual.
  - `HORARIO`: Consulta turnos programados para los siguientes 7 días.
  - `AYUDA`: Muestra la guía de comandos.

---

## 🛠️ Requisitos e Instalación

### 1. Clonar o acceder al proyecto
Asegúrate de que estás en el directorio raíz del proyecto:
```bash
cd WASAP-FICHAJES
```

### 2. Crear y activar un entorno virtual
En macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

---

## ⚙️ Configuración (.env)

El archivo `.env` ya viene preconfigurado para desarrollo local usando **SQLite** como base de datos por defecto (`sqlite:///./sql_app.db`). Esto permite levantar el servidor y pasar los tests de forma inmediata.

Para entornos de producción o pruebas con **PostgreSQL**, edita la variable `DATABASE_URL` en tu archivo `.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_base_datos"
```

---

## 🗄️ Base de Datos y Migraciones (Alembic)

### Inicialización Local
Si utilizas **SQLite**, no necesitas correr migraciones inicialmente ya que el proyecto autogenera el archivo `sql_app.db` con todas las tablas al arrancar la aplicación.

### Usando Alembic (PostgreSQL)
Para generar y aplicar migraciones en base de datos PostgreSQL:

1. **Autogenerar migración inicial**:
   ```bash
   alembic revision --autogenerate -m "init_db"
   ```
2. **Aplicar la migración a la base de datos**:
   ```bash
   alembic upgrade head
   ```

---

## 🚀 Ejecutar el Servidor de Desarrollo

Inicia el backend utilizando `uvicorn`:
```bash
uvicorn app.main:app --reload
```
Una vez levantado, puedes acceder a la documentación interactiva de la API:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Ejecutar la Suite de Pruebas

El proyecto cuenta con una suite completa de pruebas unitarias e integración en la carpeta `tests/` que cubren:
- Registro de empresas y administradores.
- Control de tokens y autorización JWT.
- Alta de empleados y validaciones de formato de teléfono E.164.
- GDPR anonimización.
- Comandos del Webhook de WhatsApp simulados.

Ejecuta todas las pruebas con:
```bash
pytest -v
```

---

## 📲 Conectar con el Sandbox de Twilio WhatsApp

Para probar el flujo de WhatsApp localmente desde tu teléfono móvil real:

1. **Exponer tu puerto local**:
   Utiliza una herramienta de túnel como **ngrok** para exponer el puerto 8000:
   ```bash
   ngrok http 8000
   ```
   Copia la URL segura generada (ej: `https://abcd-123-45.ngrok-free.app`).

2. **Configurar el Webhook en Twilio Console**:
   - Accede a tu consola de Twilio > Messaging > Try it out > WhatsApp Sandbox.
   - En **"When a message comes in"** pega tu URL de ngrok agregando la ruta del webhook:
     `https://abcd-123-45.ngrok-free.app/api/v1/whatsapp/webhook`
   - Configura el método HTTP como `POST`.
   - Guarda los cambios.

3. **Registrar tu número en el Sandbox**:
   - Envía el mensaje de activación (ej. `join word-word`) al número de WhatsApp del Sandbox de Twilio (`+14155238886`).
   - Registra tu número en el backend REST de la empresa (o mediante el endpoint de registro de empresa `/api/v1/companies/register` usando tu número en el campo `admin.phone_number` con formato E.164 completo, ej. `+34600112233`).
   - Envía el comando `AYUDA` o `ENTRADA` desde tu WhatsApp para ver la respuesta interactiva.

---

## 🖥️ FASE 2: Panel Web Administrador (React + Vite)

Se ha desarrollado un panel web administrativo premium interactivo diseñado con una estética futurista (temática oscura, glassmorphic y brillos ambientales HSL) que permite controlar todo el SaaS de forma visual.

### 📌 Características de la Fase 2
- **Portal de Autenticación Unificado**: Formulario interactivo para iniciar sesión y para registrar nuevas empresas con su administrador.
- **Resumen General (Dashboard)**: Métricas en vivo de empleados totales, turnos asignados, empleados trabajando actualmente y solicitudes pendientes de aprobación.
- **Gestión de Empleados & GDPR**:
  - Altas de nuevos empleados (con roles `employee` o `admin`).
  - Acción de **Anonimizar GDPR** para derecho al olvido, la cual limpia los datos identificativos (nombre, email, teléfono) pero preserva inmutables los registros horarios durante 4 años.
- **Planificación de Calendarios y Turnos**: Formulario para asignar turnos a empleados específicos con validación horaria.
- **Historial de Fichajes y Exportación**:
  - Tabla de registros de Entrada/Salida con duración calculada.
  - Edición manual de fichajes con justificación requerida (genera un log en la tabla de auditoría inmutable).
  - Botón de descarga de informe en formato CSV delimitado por `;` adaptado a la legislación española.
- **Centro de Solicitudes**: Aprobación o rechazo directo de incidencias/peticiones de fichajes enviadas por empleados.
- **Sección de Logs e Inmutabilidad**:
  - **Auditoría Legal**: Histórico en tiempo real de quién modificó qué fichaje y con qué valores.
  - **WhatsApp Logs**: Registro exhaustivo de todos los mensajes entrantes por WhatsApp para depurar la comunicación con Twilio.

### 🚀 Ejecución del Panel Web
1. Entra en la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en: [http://localhost:5173](http://localhost:5173)

