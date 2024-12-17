### Instalación y Configuración del Proyecto Node.js y MySQL###

1. ##Archivos JSON##

### Crear un archivo `package.json`  
Si aún no tienes un archivo `package.json`, crea uno con el siguiente comando en tu terminal:

```bash
npm init -y
```
Este comando crea un archivo package.json con la configuración predeterminada.

###Crear y configurar nodemon.json
Crea un archivo llamado nodemon.json en la raíz de tu proyecto y añade tu configuración personalizada:

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "exec": "node server.js"
}
```
###Instalar dependencias necesarias
Ejecuta el siguiente comando para instalar paquetes clave utilizados en la aplicación:

```bash
npm install express mysql2 dotenv multer xlsx nodemon bcrypt
```
2. ##Configuración de la Base de Datos MySQL##

Crear la base de datos
Ejecuta la siguiente instrucción en tu cliente MySQL:

```sql
CREATE DATABASE petlife;
```
###Seleccionar la base de datos
```sql
USE petlife;
```
####Crear tablas:####
Tabla usuarios
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('admin', 'veterinario', 'cliente') NOT NULL
);
```
###Tabla codigos_acceso
```sql
CREATE TABLE codigos_acceso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(255) NOT NULL UNIQUE,
  tipo_usuario ENUM('admin', 'veterinario', 'cliente') NOT NULL
);
```
###Insertar roles de usuario
```sql
INSERT INTO codigos_acceso (codigo, tipo_usuario) VALUES
  ('admin', 'admin'),
  ('vete', 'veterinario'),
  ('cliente', 'cliente');
```
###Tabla mascotas
```sql
CREATE TABLE mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  especie VARCHAR(255) NOT NULL,
  raza VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero ENUM('macho', 'hembra') NOT NULL,
  propietario VARCHAR(255) NOT NULL
);
```
###Tabla veterinarios
```sql
CREATE TABLE veterinarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  numero_contacto VARCHAR(15) NOT NULL
);
```
###Tabla citas
```sql
CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  veterinario_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
  FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id)
);
```
###Tabla pagos
```sql
CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
);
```
###Tabla servicios
```sql
CREATE TABLE servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  costo DECIMAL(10,2)
);
```
