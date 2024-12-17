1. Archivos JSON
Para instalar los tres archivos en tu proyecto Node.js, debes seguir estos pasos:

● Crear un archivo package.json: Si aún no tienes un archivo package.json, crea uno con el
siguiente comando en tu terminal:
  npm init -y
Este comando crea un archivo package.json con la configuración predeterminada.

● Crear y configurar nodemon.json: 
  nodemon.json
Crea un archivo llamado nodemon.json en la raíz de tu proyecto
y añade tu configuración personalizada:

{
"watch": ["src"],
"ext": "js,json",
"ignore": ["node_modules"],
"exec": "node server.js"
}

● Se utilizo el comando “ npm install express mysql2 dotenv multer xlsx nodemon bcrypt “ para que
descargue varios paquetes que se utilizan para diferentes propósitos en una aplicación Node.js:
  npm install express mysql2 dotenv multer xlsx nodemon bcrypt

2. MySQL
Empezamos con la creación de la base de datos de nuestro proyecto y cada tabla:
  CREATE DATABASE petlife;  
Seleccionamos la base de datos creada:
  USE petlife;
Empezamos a crear nuestras tablas:

  CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('admin', 'veterinario', 'cliente') NOT NULL
  );
  
  CREATE TABLE codigos_acceso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(255) NOT NULL UNIQUE,
  tipo_usuario ENUM('admin', 'veterinario', 'cliente') NOT NULL
  );
  
Definimos los roles de cada usuario:
  INSERT INTO codigos_acceso (codigo, tipo_usuario) VALUES
  ('admin', 'admin'),
  ('vete', 'veterinario'),
  ('cliente', 'cliente');
  
Continuamos con la creacion de nuestras tablas:

  CREATE TABLE mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  especie VARCHAR(255) NOT NULL,
  raza VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero ENUM('macho', 'hembra') NOT NULL,
  propietario VARCHAR(255) NOT NULL
  );
  
  CREATE TABLE veterinarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  numero_contacto VARCHAR(15) NOT NULL
  );
  
  CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  veterinario_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id),
  FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id)
  );

  CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
  );

  CREATE TABLE servicios(
  id int auto_increment primary key,
  nombre varchar(255),
  descripcion text,
  costo decimal(10,2)
  );
