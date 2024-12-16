const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
require('dotenv').config();
app.use(bodyParser.urlencoded({ extended: true }));
// Configuración de la sesión
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
  }));
// Configurar conexión a MySQL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,       // Host desde .env
    user: process.env.DB_USER,       // Usuario desde .env
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME 
  });
  connection.connect(err => {
    if (err) {
      console.error('Error conectando a MySQL:', err);
      return;
    }
    console.log('Conexión exitosa a MySQL');
  });
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Nombre del archivo
    }
});

const upload = multer({ storage: storage });
  // Middleware para verificar el inicio de sesión
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
  }
// Middleware para verificar el rol
function requireRole(roles) {
    return (req, res, next) => {
        console.log('Usuario en sesión:', req.session.user); // Verifica el usuario en sesión
        if (req.session.user && roles.includes(req.session.user.tipo_usuario)) {
            return next();
        }
        let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                /* Reset de estilos */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
    
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    background-color: #eae7f2; /* Color de fondo suave */
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
    
                .container {
                    width: 80%;
                    max-width: 400px;
                    margin: auto;
                    padding: 20px;
                    background: #ffffff; /* Fondo blanco para el contenedor */
                    border-radius: 10px; /* Bordes redondeados */
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
    
                h1 {
                    color: #6a1b9a; /* Color morado para el título */
                    margin-bottom: 10px;
                }
    
                p {
                    margin: 15px 0;
                    font-size: 1.2em;
                    color: #4a148c; /* Color morado más oscuro para el texto */
                }
    
                .btn {
                    padding: 10px 20px;
                    background: #8e24aa; /* Fondo del botón morado */
                    color: #ffffff; /* Color del texto */
                    border: none; /* Sin borde */
                    border-radius: 5px; /* Bordes redondeados */
                    cursor: pointer; /* Cambia el cursor al pasar el mouse */
                    transition: background 0.3s; /* Transición suave para el fondo */
                    text-decoration: none; /* Eliminar subrayado */
                    font-size: 1em; /* Tamaño de fuente del botón */
                }
    
                .btn:hover {
                    background: #ab47bc; /* Color de fondo al pasar el mouse */
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Acceso Denegado</h1> 
                <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                <button class="btn" onclick="window.location.href='/'">Volver</button>
            </div>
        </body>
        </html>
        `;
        return res.send(html); 
    };
  }
  // Ruta para la página principal
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  app.get('/buscar', (req, res) => {
    const query = req.query.query;
    const sql = `SELECT nombre, propietario FROM mascotas WHERE nombre LIKE ?`;
    connection.query(sql, [`%${query}%`], (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
 // Servir archivos estáticos (HTML)
app.use(express.static(path.join(__dirname, 'public')));
// Ruta para obtener el tipo de usuario actual
app.get('/tipo-usuario', requireLogin, (req, res) => {
    res.json({ tipo_usuario: req.session.user.tipo_usuario });
  });
  // Ruta para registrar
app.get('/registrar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registrar.html'));
  });
// Registro de usuario
app.post('/registrar', (req, res) => {
    const { nombre_usuario, password, codigo_acceso } = req.body;
    console.log('Código de acceso recibido:', codigo_acceso); // Para depuración
    const query = 'SELECT tipo_usuario FROM codigos_acceso WHERE codigo = ?';
    
    connection.query(query, [codigo_acceso], (err, results) => {
        if (err) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                    h1 {
                        color: #6a1b9a; /* Color morado para el título */
                        margin-bottom: 10px;
                    }
        
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4a148c; /* Color morado más oscuro para el texto */
                    }
        
                    .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
        
                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Error al verificar el código de acceso</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }
        
        // Verifica si se encontraron resultados
        if (results.length === 0) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                        h1 {
                            color: #6a1b9a; /* Color morado para el título */
                            margin-bottom: 10px;
                        }
        
                        p {
                            margin: 15px 0;
                            font-size: 1.2em;
                            color: #4a148c; /* Color morado más oscuro para el texto */
                        }
        
                        .btn {
                            padding: 10px 20px;
                            background: #8e24aa; /* Fondo del botón morado */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            text-decoration: none; /* Eliminar subrayado */
                            font-size: 1em; /* Tamaño de fuente del botón */
                        }
        
                        .btn:hover {
                            background: #ab47bc; /* Color de fondo al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Código de acceso inválido</h1> 
                        <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                        <button class="btn" onclick="window.location.href='/login'">Volver</button>
                    </div>
                </body>
            </html>
            `;
            return res.send(html); 
        }

        const tipo_usuario = results[0].tipo_usuario; // Aquí es seguro acceder a results[0]
        const passwordhash = bcrypt.hashSync(password, 10);
        
        const insertUser  = 'INSERT INTO usuarios (nombre_usuario, password_hash, tipo_usuario) VALUES (?, ?, ?)';
        connection.query(insertUser , [nombre_usuario, passwordhash, tipo_usuario], (err) => {
            if (err) {
                let html = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error</title>
                    <style>
                        /* Reset de estilos */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
        
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            background-color: #eae7f2; /* Color de fondo suave */
                            color: #333;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
        
                        .container {
                            width: 80%;
                            max-width: 400px;
                            margin: auto;
                            padding: 20px;
                            background: #ffffff; /* Fondo blanco para el contenedor */
                            border-radius: 10px; /* Bordes redondeados */
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }
        
                        h1 {
                            color: #6a1b9a; /* Color morado para el título */
                            margin-bottom: 10px;
                        }
        
                        p {
                            margin: 15px 0;
                            font-size: 1.2em;
                            color: #4a148c; /* Color morado más oscuro para el texto */
                        }
        
                        .btn {
                            padding: 10px 20px;
                            background: #8e24aa; /* Fondo del botón morado */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            text-decoration: none; /* Eliminar subrayado */
                            font-size: 1em; /* Tamaño de fuente del botón */
                        }
        
                        .btn:hover {
                            background: #ab47bc; /* Color de fondo al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error al registrar usuario</h1> 
                        <p>Ocurrió un problema al intentar registrar al usuario. Por favor, intenta nuevamente.</p>
                        <button class="btn" onclick="window.location.href='/login'">Volver</button>
                    </div>
                </body>
                               </html>
                `;
                return res.send(html); 
            }
            
            // Mensaje de éxito al registrar el usuario
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registro Exitoso</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                    h1 {
                        color: #6a1b9a; /* Color morado para el título */
                        margin-bottom: 10px;
                    }
        
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4a148c; /* Color morado más oscuro para el texto */
                    }
        
                    .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
        
                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Registro Exitoso</h1> 
                    <p>El usuario ha sido registrado correctamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Iniciar Sesión</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        });
    });
});
// Ruta para iniciar sesion
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });
  // Iniciar sesión
app.post('/login', (req, res) => {
    const { nombre_usuario, password } = req.body;
    // Consulta para obtener el usuario y su tipo
    const query = 'SELECT * FROM usuarios WHERE nombre_usuario = ?';
    connection.query(query, [nombre_usuario], (err, results) => {
        if (err) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
    
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
    
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
    
                    h1 {
                        color: #6a1b9a; /* Color morado para el título */
                        margin-bottom: 10px;
                    }
    
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4a148c; /* Color morado más oscuro para el texto */
                    }
    
                    .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
    
                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Error al obtener usuario</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }
        
        if (results.length === 0) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
    
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
    
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
    
                    h1 {
                        color: #6a1b9a; /* Color morado para el título */
                        margin-bottom: 10px;
                    }
    
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4a148c; /* Color morado más oscuro para el texto */
                    }
    
                    .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
    
                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Usuario no encontrado</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }

        const user = results[0];

        // Verificar la contraseña
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
    
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #eae7f2; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
    
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
    
                    h1 {
                        color: #6a1b9a; /* Color morado para el título */
                        margin-bottom: 10px;
                    }
    
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4a148c; /* Color morado más oscuro para el texto */
                    }
    
                    .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
    
                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Contraseña incorrecta</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }

        // Almacenar la información del usuario en la sesión
        req.session.user = {
            id: user.id,
            nombre_usuario: user.nombre_usuario,
            tipo_usuario: user.tipo_usuario // Aquí se establece el tipo de usuario en la sesión
        };

        // Redirigir al usuario a la página principal
        res.redirect('/');
    });
});
// Cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });  
// Ruta para mostrar el formulario de agregar mascota
app.get('/agregar-mascota', requireLogin, requireRole(['admin', 'cliente']), (req, res) => {
    let html = `
      <html>
      <head>
        <link rel="stylesheet" href="/styles.css">
        <title>Agregar Mascota</title>
        <style>
          body {
              font-family: 'Arial', sans-serif;
              background-color: #f0e5ff; /* Fondo suave morado */
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
          }

          h1 {
              color: #8e24aa; /* Color morado para el título */
              margin-bottom: 20px;
          }

          form {
              background: #ffffff; /* Fondo blanco para el formulario */
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              width: 300px; /* Ancho del formulario */
              text-align: left; /* Alinear texto a la izquierda */
          }

          label {
              display: block;
              margin-bottom: 5px;
              color: #6a1b9a; /* Color morado más oscuro para las etiquetas */
          }

          input, select {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: 1px solid #8e24aa; /* Borde morado */
              border-radius: 5px;
          }

          button {
              padding: 10px 15px;
              background: #8e24aa; /* Fondo del botón morado */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              transition: background 0.3s; /* Transición suave para el fondo */
              width: 100%; /* Botón ocupa todo el ancho */
          }

          button:hover {
              background: #ab47bc; /* Color de fondo al pasar el mouse */
          }

          .back-button {
              margin-top: 20px;
              background: #35424a; /* Fondo del botón de volver */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              padding: 10px 15px;
              transition: background 0.3s; /* Transición suave para el fondo */
              width: 100%; /* Botón ocupa todo el ancho */
          }

          .back-button:hover {
              background: #506471; /* Color de fondo al pasar el mouse */
          }
        </style>
      </head>
      <body>
        <h1>Agregar Mascota</h1>
        <form action="/guardar-mascota" method="POST">
          <label>Nombre:</label>
          <input type="text" name="nombre" required>
          <label>Especie:</label>
          <input type="text" name="especie" required>
          <label>Raza:</label>
          <input type="text" name="raza" required>
          <label>Fecha de Nacimiento:</label>
          <input type="date" name="fecha_nacimiento" required>
          <label>Género:</label>
          <select name="genero" required>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
          <label>Propietario (Nombre):</label>
          <input type="text" name="propietario" required>
          <button type="submit">Agregar Mascota</button>
        </form>
        <button class="back-button" onclick="window.location.href='/'">Volver</button>
      </body>
      </html>
    `;
    res.send(html);
});
// Ruta para guardar la nueva mascota
app.post('/guardar-mascota', requireLogin, requireRole(['admin', 'medico', 'cliente']), (req, res) => {
    const { nombre, especie, raza, fecha_nacimiento, genero, propietario } = req.body;

    const query = 'INSERT INTO mascotas (nombre, especie, raza, fecha_nacimiento, genero, propietario) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [nombre, especie, raza, fecha_nacimiento, genero, propietario], (err, result) => {
        if (err) {
            return res.send(`
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error</title>
                    <style>
                        /* Reset de estilos */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            background-color: #f4f4f4;
                            color: #333;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }

                        .container {
                            width: 80%;
                            max-width: 400px;
                            margin: auto;
                            padding: 20px;
                            background: #ffffff;
                            border-radius: 5px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }

                        h1 {
                            color: #e74c3c; /* Color rojo para el título */
                            margin-bottom: 10px;
                        }

                        p {
                            margin: 15px 0;
                            font-size: 1.2em;
                        }

                        .btn {
                            padding: 10px 20px;
                            background: #5e35b1; /* Morado oscuro */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            text-decoration: none; /* Eliminar subrayado */
                        }

                        .btn:hover {
                            background: #7e57c2; /* Morado más claro al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error al agregar la mascota</h1>
                        <p>Ocurrió un problema al intentar guardar la información de la mascota. Por favor, intenta nuevamente.</p>
                        <button class="btn" onclick="window.location.href='/agregar-mascota'">Volver</button>
                    </div>
                </body>
                </html>
            `);
        }

        res.send(`
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Éxito</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #f4f4f4;
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }

                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }

                    h1 {
                        color: #2ecc71; /* Color verde para el título */
                        margin-bottom: 10px;
                    }

                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                    }

                    .btn {
                        padding: 10px 20px;
                        background: #5e35b1; /* Morado oscuro */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                    }

                    .btn:hover {
                        background: #7e57c2; /* Morado más claro al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Mascota agregada exitosamente</h1>
                    <p>La información de la mascota se ha guardado correctamente.</p>
                    <button class="btn" onclick="window.location.href='/mascotas'">Ver Mascotas</button>
                </div>
            </body>
            </html>
        `);
    });
});
  
// Ruta para mostrar las mascotas
app.get('/mascotas', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    connection.query('SELECT * FROM mascotas', (err, results) => {
        if (err) {
            return res.send('Error al obtener los datos.');
        }

        let html = `
        <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <title>Mascotas Registradas</title>
          <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            h1 {
                color: #5e35b1; /* Morado oscuro */
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th, td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
            }
            th {
                background-color: #7e57c2; /* Morado más claro */
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            button {
                padding: 10px 15px;
                background-color: #5e35b1; /* Morado oscuro */
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
                transition: background 0.3s;
            }
            button:hover {
                background-color: #7e57c2; /* Morado más claro al pasar el mouse */
            }
          </style>
        </head>
        <body>
          <h1>Mascotas Registradas</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Fecha de Nacimiento</th>
                <th>Género</th>
                <th>Propietario</th>
              </tr>
            </thead>
            <tbody>
        `;

        results.forEach(mascota => {
            html += `
            <tr>
                <td>${mascota.id}</td>
                <td>${mascota.nombre}</td>
                <td>${mascota.especie}</td>
                <td>${mascota.raza}</td>
                <td>${mascota.fecha_nacimiento}</td>
                <td>${mascota.genero}</td>
                <td>${mascota.propietario}</td>
            </tr>
            `;
        });

        html += `
            </tbody>
          </table>
          <div>
            <button onclick="window.location.href='/agregar-mascota'">Agregar Mascota</button>
            <button onclick="window.location.href='/'">Volver</button>
          </div>
          <div> 
            <form method="POST" action="/eliminar-mascota"> 
                <label for="id">ID de la Mascota:</label> 
                <input type="text" id="id" name="id"> 
                <button type="submit">Eliminar Mascota</button> 
            </form>
           </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Ruta para eliminar una mascota 
app.post('/eliminar-mascota', requireLogin, requireRole(['admin', 'medico']), (req, res) => { 
    const { id } = req.body; 
    connection.query('DELETE FROM mascotas WHERE id = ?', [id], (err, results) => { 
        if (err) { 
            return res.send('Error al eliminar la mascota.'); 
        } 
        res.redirect('/mascotas'); 
    }); 
});

// Ruta para mostrar el formulario de agregar veterinario
app.get('/agregar-veterinario', requireLogin, requireRole('admin'), (req, res) => {
    let html = `
      <html>
      <head>
        <link rel="stylesheet" href="/styles.css">
        <title>Agregar Veterinario</title>
        <style>
          body {
              font-family: 'Arial', sans-serif;
              background-color: #f0e5ff; /* Fondo suave morado */
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
          }

          h1 {
              color: #8e24aa; /* Color morado para el título */
              margin-bottom: 20px;
          }

          form {
              background: #ffffff; /* Fondo blanco para el formulario */
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              width: 300px; /* Ancho del formulario */
              text-align: left; /* Alinear texto a la izquierda */
          }

          label {
              display: block;
              margin-bottom: 5px;
              color: #6a1b9a; /* Color morado más oscuro para las etiquetas */
          }

          input {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: 1px solid #8e24aa; /* Borde morado */
              border-radius: 5px;
          }

          button {
              padding: 10px 15px;
              background: #8e24aa; /* Fondo del botón morado */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              transition: background 0.3s; /* Transición suave para el fondo */
          }

          button:hover {
              background: #ab47bc; /* Color de fondo al pasar el mouse */
          }

          .back-button {
              margin-top: 20px;
              background: #35424a; /* Fondo del botón de volver */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              padding: 10px 15px;
              transition: background 0.3s; /* Transición suave para el fondo */
          }

          .back-button:hover {
              background: #506471; /* Color de fondo al pasar el mouse */
          }
        </style>
      </head>
      <body>
        <h1>Agregar Veterinario</h1>
        <form action="/guardar-veterinario" method="POST">
          <label>Nombre:</label>
          <input type="text" name="nombre" required>
          <label>Especialidad:</label>
          <input type="text" name="especialidad" required>
          <label>Número de Contacto:</label>
          <input type="text" name="numero_contacto" required>
          <button type="submit">Agregar Veterinario</button>
        </form>
        <button class="back-button" onclick="window.location.href='/'">Volver</button>
      </body>
      </html>
    `;
    res.send(html);
});
// Ruta para guardar el nuevo veterinario
app.post('/guardar-veterinario', requireLogin, requireRole('admin'), (req, res) => {
    const { nombre, especialidad, numero_contacto } = req.body;

    const query = 'INSERT INTO veterinarios (nombre, especialidad, numero_contacto) VALUES (?, ?, ?)';
    connection.query(query, [nombre, especialidad, numero_contacto], (err, result) => {
        if (err) {
            console.error(err);
            return res.send(`
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error</title>
                    <style>
                        /* Reset de estilos */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            background-color: #f0e5ff; /* Fondo suave morado */
                            color: #333;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }

                        .container {
                            width: 80%;
                            max-width: 400px;
                            margin: auto;
                            padding: 20px;
                            background: #ffffff; /* Fondo blanco para el contenedor */
                            border-radius: 5px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }

                        h1 {
                            color: #8e24aa; /* Color morado para el título */
                            margin-bottom: 10px;
                        }

                        p {
                            margin: 15px 0;
                            font-size: 1.2em;
                        }

                        .btn {
                            padding: 10px 20px;
                            background: #8e24aa; /* Fondo del botón morado */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            text-decoration: none; /* Eliminar subrayado */
                        }

                        .btn:hover {
                            background: #ab47bc; /* Color de fondo al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error al agregar el veterinario</h1>
                        <p>Ocurrió un problema al intentar guardar la información del veterinario. Por favor, intenta nuevamente.</p>
                        <button class="btn" onclick="window.location.href='/agregar-veterinario'">Volver</button>
                    </div>
                </body>
                </html>
            `);
        }

        // Si la inserción es exitosa
        res.send(`
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Éxito</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }

                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                        margin-bottom: 10px;
                    }

                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                    }

                    .btn {
                        padding: 10px 20
                                            .btn {
                        padding: 10px 20px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                    }

                    .btn:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Veterinario agregado exitosamente</h1>
                    <p>La información del veterinario se ha guardado correctamente.</p>
                    <button class="btn" onclick="window.location.href='/veterinarios'">Ver Veterinarios</button>
                </div>
            </body>
            </html>
        `);
    });
});
// Ruta para mostrar los veterinarios
app.get('/veterinarios', requireLogin, requireRole(['admin', 'veterinario']), (req, res) => {
    connection.query('SELECT * FROM veterinarios', (err, results) => {
        if (err) {
            return res.send('Error al obtener los datos.');
        }

        let html = `
        <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <title>Veterinarios Registrados</title>
          <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f0e5ff; /* Fondo suave morado */
                color: #333;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }

            h1 {
                color: #8e24aa; /* Color morado para el título */
                margin-bottom: 20px;
            }

            table {
                width: 80%;
                border-collapse: collapse;
                margin-bottom: 20px;
                background: #ffffff; /* Fondo blanco para la tabla */
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }

            th {
                background-color: #8e24aa; /* Fondo morado para el encabezado */
                color: white; /* Color del texto en el encabezado */
            }

            tr:hover {
                background-color: #f1e6f2; /* Color de fondo al pasar el mouse */
            }

            button {
                padding: 10px 15px;
                background: #8e24aa; /* Fondo del botón morado */
                color: #ffffff; /* Color del texto */
                border: none; /* Sin borde */
                border-radius: 5px; /* Bordes redondeados */
                cursor: pointer; /* Cambia el cursor al pasar el mouse */
                transition: background 0.3s; /* Transición suave para el fondo */
                margin: 5px; /* Espacio entre botones */
            }

            button:hover {
                background: #ab47bc; /* Color de fondo al pasar el mouse */
            }
          </style>
        </head>
        <body>
          <h1>Veterinarios Registrados</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Número de Contacto</th>
              </tr>
            </thead>
            <tbody>
        `;

        results.forEach(veterinario => {
            html += `
              <tr>
                <td>${veterinario.id}</td>
                <td>${veterinario.nombre}</td>
                <td>${veterinario.especialidad}</td>
                <td>${veterinario.numero_contacto}</td>
              </tr>
            `;
        });

        html += `
            </tbody>
          </table>
          <button onclick="window.location.href='/agregar-veterinario'">Agregar Veterinario</button>
          <button onclick="window.location.href='/'">Volver</button>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Ruta para mostrar las mascotas
app.get('/mascotas', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    connection.query('SELECT * FROM mascotas', (err, results) => {
        if (err) {
            return res.send('Error al obtener los datos.');
        }

        let html = `
        <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <title>Mascotas Registradas</title>
          <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            h1 {
                color: #5e35b1; /* Morado oscuro */
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th, td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
            }
            th {
                background-color: #7e57c2; /* Morado más claro */
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            button {
                padding: 10px 15px;
                background-color: #5e35b1; /* Morado oscuro */
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
                transition: background 0.3s;
            }
            button:hover {
                background-color: #7e57c2; /* Morado más claro al pasar el mouse */
            }
          </style>
        </head>
        <body>
          <h1>Mascotas Registradas</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Fecha de Nacimiento</th>
                <th>Género</th>
                <th>Propietario</th>
              </tr>
            </thead>
            <tbody>
        `;

        results.forEach(mascota => {
            html += `
            <tr>
                <td>${mascota.id}</td>
                <td>${mascota.nombre}</td>
                <td>${mascota.especie}</td>
                <td>${mascota.raza}</td>
                <td>${mascota.fecha_nacimiento}</td>
                <td>${mascota.genero}</td>
                <td>${mascota.propietario}</td>
            </tr>
            `;
        });

        html += `
            </tbody>
          </table>
          <button onclick="window.location.href='/agregar-mascota'">Agregar Mascota</button>
          <button onclick="window.location.href='/'">Volver</button>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Ruta para mostrar el formulario de agregar cita
app.get('/agregar-cita', requireLogin, requireRole(['veterinario', 'cliente']), (req, res) => {
    connection.query('SELECT * FROM mascotas', (errMascotas, mascotas) => {
        if (errMascotas) {
            return res.send('Error al obtener las mascotas.');
        }
        connection.query('SELECT * FROM veterinarios', (errVeterinarios, veterinarios) => {
            if (errVeterinarios) {
                return res.send('Error al obtener los veterinarios.');
            }

            let html = `
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>Agregar Cita</title>
                    <style>
                        /* Estilos aquí (sin cambios) */
                    </style>
                </head>
                <body>
                    <h1>Agregar Cita</h1>
                    <form action="/guardar-cita" method="POST">
                        <label>Mascota:</label>
                        <select name="mascota_id" required> <!-- Cambiado a mascota_id -->
            `;

            mascotas.forEach(mascota => {
                html += `<option value="${mascota.id}">${mascota.nombre}</option>`;
            });

            html += `
                        </select>
                        <label>Veterinario:</label>
                        <select name="veterinario_id" required>
            `;

            veterinarios.forEach(veterinario => {
                html += `<option value="${veterinario.id}">${veterinario.nombre}</option>`;
            });

            html += `
                        </select>
                        <label>Fecha:</label>
                        <input type="date" name="fecha" required>
                        <label>Hora:</label>
                        <input type="time" name="hora" required>
                        <button type="submit">Agregar Cita</button>
                    </form>
                    <button class="back-button" onclick="window.location.href='/'">Volver</button>
                </body>
                </html>
            `;
            res.send(html);
        });
    });
});
app.get('/nueva-cita', requireLogin, requireRole(['veterinario', 'cliente']), (req, res) => {
    connection.query('SELECT * FROM mascotas', (errMascotas, mascotas) => {
        if (errMascotas) {
            return res.send('Error al obtener las mascotas.');
        }
        connection.query('SELECT * FROM veterinarios', (errVeterinarios, veterinarios) => {
            if (errVeterinarios) {
                return res.send('Error al obtener los veterinarios.');
            }

            let html = `
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>Agregar Cita</title>
                    <style>
                        /* Estilos aquí (sin cambios) */
                    </style>
                </head>
                <body>
                    <h1>Agregar Cita</h1>
                    <form action="/guardar-cita" method="POST">
                        <label>Mascota:</label>
                        <select name="mascota_id" required> <!-- Cambiado a mascota_id -->
            `;

            mascotas.forEach(mascota => {
                html += `<option value="${mascota.id}">${mascota.nombre}</option>`;
            });

            html += `
                        </select>
                        <label>Veterinario:</label>
                        <select name="veterinario_id" required>
            `;

            veterinarios.forEach(veterinario => {
                html += `<option value="${veterinario.id}">${veterinario.nombre}</option>`;
            });

            html += `
                        </select>
                        <label>Fecha:</label>
                        <input type="date" name="fecha" required>
                        <label>Hora:</label>
                        <input type="time" name="hora" required>
                        <button type="submit">Agregar Cita</button>
                    </form>
                    <button class="back-button" onclick="window.location.href='/'">Volver</button>
                </body>
                </html>
            `;
            res.send(html);
        });
    });
});
// Ruta para guardar la nueva cita
app.post('/guardar-cita', requireLogin, requireRole(['cliente', 'veterinario']), (req, res) => {
    const { mascota_id, veterinario_id, fecha, hora } = req.body; // Asegúrate de que estos nombres coincidan

    const query = 'INSERT INTO citas (mascota_id, veterinario_id, fecha, hora) VALUES (?, ?, ?, ?)';
    connection.query(query, [mascota_id, veterinario_id, fecha, hora], (err, result) => {
        if (err) {
            console.error(err); // Log del error para depuración
            return res.send(`
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>Error al Agregar Cita</title>
                    <style>
                        /* Estilos aquí (sin cambios) */
                    </style>
                </head>
                <body>
                    <h1>Error al Agregar Cita</h1>
                    <p>Ocurrió un problema al intentar guardar la cita. Por favor, intenta nuevamente.</p>
                    <button onclick="window.location.href='/agregar-cita'">Volver</button>
                </body>
                </html>
            `);
        }

        // Si la inserción es exitosa
        res.send(`
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Cita Agregada</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    p {
                        margin: 15px 0;
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Cita Agregada Exitosamente</h1>
                <p>La cita con el veterinario se ha guardado correctamente para la mascota.</p>
                <button onclick="window.location.href='/citas'">Ver Citas</button>
            </body>
            </html>
        `);
    });
});
// Ruta para mostrar las citas
app.get('/citas', requireLogin, requireRole(['admin', 'veterinario']), (req, res) => {
    const query = `
        SELECT citas.id, 
               mascotas.nombre AS mascota, 
               veterinarios.nombre AS veterinario, 
               citas.fecha, 
               citas.hora
        FROM citas
        JOIN mascotas ON citas.mascota_id = mascotas.id
        JOIN veterinarios ON citas.veterinario_id = veterinarios.id
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.send('Error al obtener los datos.');
        }

        let html = `
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Citas Registradas</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    table {
                        width: 80%; /* Ancho de la tabla */
                        margin: 20px 0; /* Margen superior e inferior */
                        border-collapse: collapse; /* Colapsar bordes */
                        text-align: left; /* Alinear texto a la izquierda */
                    }

                    th, td {
                        padding: 10px; /* Espaciado interno */
                        border: 1px solid #8e24aa; /* Borde morado */
                    }

                    th {
                        background-color: #8e24aa; /* Fondo morado para encabezados */
                        color: white; /* Color del texto en encabezados */
                    }

                    tr:nth-child(even) {
                        background-color: #f2f2f2; /* Color de fondo para filas pares */
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        margin: 5px; /* Margen entre botones */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Citas Registradas</h1>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de Mascota</th>
                            <th>Veterinario</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(cita => {
            html += `
                <tr>
                    <td>${cita.id}</td>
                    <td>${cita.mascota}</td>
                    <td>${cita.veterinario}</td>
                    <td>${cita.fecha}</td>
                    <td>${cita.hora}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <button onclick="window.location.href='/agregar-cita'">Agregar Cita</button>
                <button onclick="window.location.href='/'">Volver</button>
            </body>
            </html>
        `;

        res.send(html);
    });
});
// Ruta para mostrar el formulario de agregar pago
app.get('/agregar-pago', requireLogin, requireRole('admin'), (req, res) => {
    connection.query('SELECT * FROM mascotas', (errMascotas, mascotas) => {
        if (errMascotas) {
            return res.send('Error al obtener los datos de las mascotas.');
        }

        let html = `
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Agregar Pago</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                        margin-bottom: 20px;
                    }

                    form {
                        background: #ffffff; /* Fondo blanco para el formulario */
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        width: 300px; /* Ancho del formulario */
                        text-align: left; /* Alinear texto a la izquierda */
                    }

                    label {
                        display: block;
                        margin-bottom: 5px;
                        color: #6a1b9a; /* Color morado más oscuro para las etiquetas */
                    }

                    select, input {
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 15px;
                        border: 1px solid #8e24aa; /* Borde morado */
                        border-radius: 5px;
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }

                    .back-button {
                        margin-top: 20px;
                        background: #35424a; /* Fondo del botón de volver */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        padding: 10px 15px;
                        transition: background 0.3s; /* Transición suave para el fondo */
                    }

                    .back-button:hover {
                        background: #506471; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Agregar Pago</h1>
                <form action="/guardar-pago" method="POST">
                    <label>Nombre de Mascota:</label>
                    <select name="mascota_id" required>
        `;

        mascotas.forEach(mascota => {
            html += `<option value="${mascota.id}">${mascota.nombre}</option>`;
        });

        html += `
                    </select>
                    <label>Monto:</label>
                    <input type="number" name="monto" required>
                    <label>Método de Pago:</label>
                    <input type="text" name="metodo_pago" required> <!-- Cambiado a texto para métodos de pago -->
                    <label>Estado:</label>
                    <input type="text" name="estado" required> <!-- Cambiado a texto para estado -->
                    <label>Fecha:</label>
                    <input type="date" name="fecha" required>
                    <button type="submit">Agregar Pago</button>
                </form>
                <button class="back-button" onclick="window.location.href='/'">Volver</button>
            </body>
            </html>
        `;
        res.send(html);
    });
});
// Ruta para guardar el nuevo pago
app.post('/guardar-pago', requireLogin, requireRole('admin'), (req, res) => {
    const { mascota_id, monto, metodo_pago, estado, fecha } = req.body;

    const query = 'INSERT INTO Pagos (mascota_id, monto, metodo_pago, estado, fecha) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [mascota_id, monto, metodo_pago, estado, fecha], (err, result) => {
        if (err) {
            console.error(err); // Log del error para depuración
            return res.send('Error al agregar el pago.');
        }

        res.send(`
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Pago Agregado</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Pago Agregado Exitosamente</h1>
                <p>El pago se ha registrado correctamente para la mascota.</p>
                <button onclick="window.location.href='/pagos'">Ver Pagos</button>
            </body>
            </html>
        `);
    });
});
// Ruta para mostrar los pagos
app.get('/pagos', requireLogin, requireRole('admin'), (req, res) => {
    const query = `
        SELECT Pagos.id, 
               Mascotas.nombre AS mascota, 
               Pagos.monto, 
               Pagos.metodo_pago, 
               Pagos.estado, 
               Pagos.fecha
        FROM Pagos
        JOIN Mascotas ON Pagos.mascota_id = Mascotas.id
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.send('Error al obtener los datos.');
        }

        let html = `
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Pagos Registrados</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    table {
                        width: 80%; /* Ancho de la tabla */
                        margin: 20px 0; /* Margen superior e inferior */
                        border-collapse: collapse; /* Colapsar bordes */
                        text-align: left; /* Alinear texto a la izquierda */
                    }

                    th, td {
                        padding: 10px; /* Espaciado interno */
                        border: 1px solid #8e24aa; /* Borde morado */
                    }

                    th {
                        background-color: #8e24aa; /* Fondo morado para encabezados */
                        color: white; /* Color del texto en encabezados */
                    }

                    tr:nth-child(even) {
                        background-color: #f2f2f2; /* Color de fondo para filas pares */
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                                               margin: 5px; /* Margen entre botones */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Pagos Registrados</h1>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre de Mascota</th>
                            <th>Monto</th>
                            <th>Método de Pago</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(pago => {
            html += `
                <tr>
                    <td>${pago.id}</td>
                    <td>${pago.mascota}</td>
                    <td>${pago.monto}</td>
                    <td>${pago.metodo_pago}</td>
                    <td>${pago.estado}</td>
                    <td>${pago.fecha}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <button onclick="window.location.href='/agregar-pago'">Agregar Pago</button>
                <button onclick="window.location.href='/'">Volver</button>
            </body>
            </html>
        `;

        res.send(html);
    });
});
// Ruta para mostrar el formulario de agregar servicio
app.get('/agregar-servicio', requireLogin, requireRole('admin'), (req, res) => {
    let html = `
      <html>
      <head>
        <link rel="stylesheet" href="/styles.css">
        <title>Agregar Servicio</title>
        <style>
          body {
              font-family: 'Arial', sans-serif;
              background-color: #f0e5ff; /* Fondo suave morado */
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
          }

          h1 {
              color: #8e24aa; /* Color morado para el título */
              margin-bottom: 20px;
          }

          form {
              background: #ffffff; /* Fondo blanco para el formulario */
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              width: 300px; /* Ancho del formulario */
              text-align: left; /* Alinear texto a la izquierda */
          }

          label {
              display: block;
              margin-bottom: 5px;
              color: #6a1b9a; /* Color morado más oscuro para las etiquetas */
          }

          input, textarea {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: 1px solid #8e24aa; /* Borde morado */
              border-radius: 5px;
          }

          button {
              padding: 10px 15px;
              background: #8e24aa; /* Fondo del botón morado */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              transition: background 0.3s; /* Transición suave para el fondo */
          }

          button:hover {
              background: #ab47bc; /* Color de fondo al pasar el mouse */
          }

          .back-button {
              margin-top: 20px;
              background: #35424a; /* Fondo del botón de volver */
              color: #ffffff; /* Color del texto */
              border: none; /* Sin borde */
              border-radius: 5px; /* Bordes redondeados */
              cursor: pointer; /* Cambia el cursor al pasar el mouse */
              padding: 10px 15px;
              transition: background 0.3s; /* Transición suave para el fondo */
          }

          .back-button:hover {
              background: #506471; /* Color de fondo al pasar el mouse */
          }
        </style>
      </head>
      <body>
          <h1>Agregar Servicio</h1>
          <form action="/guardar-servicio" method="POST">
              <label>Nombre:</label>
              <input type="text" name="nombre" required>
              <label>Descripción:</label>
              <textarea name="descripcion" required></textarea>
              <label>Costo:</label>
              <input type="number" name="costo" required>
              <button type="submit">Agregar</button>
          </form>
          <button class="back-button" onclick="window.location.href='/'">Volver</button>
      </body>
      </html>
    `;
    res.send(html);
});

// Ruta para guardar el nuevo servicio
app.post('/guardar-servicio', requireLogin, requireRole('admin'), (req, res) => {
    const { nombre, descripcion, costo } = req.body;

    const query = 'INSERT INTO servicios (nombre, descripcion, costo) VALUES (?, ?, ?)';
    connection.query(query, [nombre, descripcion, costo], (err, result) => {
        if (err) {
            return res.send('Error al agregar el servicio.');
        }

        res.send(`
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Servicio Agregado</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }
                                            h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Servicio Agregado Exitosamente</h1>
                <p>El servicio se ha registrado correctamente.</p>
                <button onclick="window.location.href='/servicios'">Ver Servicios</button>
            </body>
            </html>
        `);
    });
});

// Ruta para mostrar los servicios
app.get('/servicios', requireLogin, requireRole(['admin', 'cliente']), (req, res) => {
    connection.query('SELECT * FROM servicios', (err, results) => {
        if (err) {
            return res.send('Error al obtener los datos.');
        }

        let html = `
            <html>
            <head>
                <link rel="stylesheet" href="/styles.css">
                <title>Servicios Registrados</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0e5ff; /* Fondo suave morado */
                        color: #333;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: auto; /* Ajustar altura automáticamente */
                        margin: 0;
                    }

                    h1 {
                        color: #8e24aa; /* Color morado para el título */
                    }

                    table {
                        width: 80%; /* Ancho de la tabla */
                        margin: 20px 0; /* Margen superior e inferior */
                        border-collapse: collapse; /* Colapsar bordes */
                        text-align: left; /* Alinear texto a la izquierda */
                    }

                    th, td {
                        padding: 10px; /* Espaciado interno */
                        border: 1px solid #8e24aa; /* Borde morado */
                    }

                    th {
                        background-color: #8e24aa; /* Fondo morado para encabezados */
                        color: white; /* Color del texto en encabezados */
                    }

                    tr:nth-child(even) {
                        background-color: #f2f2f2; /* Color de fondo para filas pares */
                    }

                    button {
                        padding: 10px 15px;
                        background: #8e24aa; /* Fondo del botón morado */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        margin: 5px; /* Margen entre botones */
                    }

                    button:hover {
                        background: #ab47bc; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <h1>Servicios Registrados</h1>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Costo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(servicio => {
            html += `
                <tr>
                    <td>${servicio.id}</td>
                    <td>${servicio.nombre}</td>
                    <td>${servicio.descripcion}</td>
                    <td>${servicio.costo}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <button onclick="window.location.href='/agregar-servicio'">Agregar Servicio</button>
                <button onclick="window.location.href='/'">Volver</button>
            </body>
            </html>
        `;

        res.send(html);
    });
});
// Ruta para ver las citas programadas de las mascotas del cliente
app.get('/ver-citas-mascotas', requireLogin, (req, res) => {
    const nombrePropietario = req.session.user.nombre_usuario; // Asumiendo que el nombre del propietario está en la sesión
    console.log(req.session.user.nombre_usuario)
    // Consulta para obtener las mascotas del propietario
    const queryMascotas = `SELECT id FROM mascotas WHERE propietario = ?`;

    connection.query(queryMascotas, [nombrePropietario], (err, mascotas) => {
        if (err) {
            console.error('Error al obtener las mascotas:', err);
            return res.send(`
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>Error</title>
                </head>
                <body>
                    <h1>Error al obtener los datos :(</h1>
                    <button onclick="window.location.href='/'">Volver</button>
                </body>
                </html>
            `);
        }

        // Verifica si se encontraron mascotas
        if (mascotas.length === 0) {
            return res.send(`
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>No encontrado</title>
                </head>
                <body>
                    <h1>No se encontraron mascotas para este propietario.</h1>
                    <button onclick="window.location.href='/'">Volver</button>
                </body>
                </html>
            `);
        }

        // Obtener los IDs de las mascotas
        const mascotaIds = mascotas.map(mascota => mascota.id);

        // Consulta para obtener las citas de las mascotas
        const queryCitas = `
            SELECT citas.id, 
                   veterinarios.nombre AS veterinario, 
                   citas.fecha, 
                   citas.hora, 
                   mascotas.nombre AS mascota
            FROM citas
            JOIN veterinarios ON citas.veterinario_id = veterinarios.id
            JOIN mascotas ON citas.mascota_id = mascotas.id
            WHERE citas.mascota_id IN (?)
        `;

        connection.query(queryCitas, [mascotaIds], (err, results) => {
            if (err) {
                console.error('Error al obtener las citas:', err);
                return res.send(`
                    <html>
                    <head>
                        <link rel="stylesheet" href="/styles.css">
                        <title>Error</title>
                    </head>
                    <body>
                        <h1>Error al obtener los datos :(</h1>
                        <button onclick="window.location.href='/'">Volver</button>
                    </body>
                    </html>
                `);
            }

            // Verifica si se encontraron citas
            if (results.length === 0) {
                return res.send(`
                    <html>
                    <head>
                        <link rel="stylesheet" href="/styles.css">
                        <title>No encontrado</title>
                    </head>
                    <body>
                        <h1>No se encontraron citas para las mascotas de este propietario.</h1>
                        <button onclick="window.location.href='/'">Volver</button>
                    </body>
                    </html>
                `);
            }

            // Generar la tabla de citas
            let html = `
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <title>Citas de Mis Mascotas</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            background-color: #f0e5ff; /* Fondo suave morado */
                            color: #333;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: auto; /* Ajustar altura automáticamente */
                            margin: 0;
                        }
                        h1 {
                            color: #8e24aa; /* Color morado para el título */
                        }
                        table {
                            width: 80%; /* Ancho de la tabla */
                            margin: 20px 0; /* Margen superior e inferior */
                            border-collapse: collapse; /* Colapsar bordes */
                            text-align: left; /* Alinear texto a la izquierda */
                        }
                        th, td {
                            padding: 10px; /* Espaciado interno */
                            border: 1px solid #8e24aa; /* Borde morado */
                        }
                        th {
                            background-color: #8e24aa; /* Fondo morado para encabezados */
                            color: white; /* Color del texto en encabezados */
                        }
                        tr:nth-child(even) {
                            background-color: #f2f2f2; /* Color de fondo para filas pares */
                        }
                        button {
                            padding: 10px 15px;
                            background: #8e24aa; /* Fondo del botón morado */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            margin: 5px; /* Margen entre botones */
                        }
                        button:hover {
                            background: #ab47bc; /* Color de fondo al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <h1>Citas de Mis Mascotas</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Veterinario</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Nombre de la Mascota</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            // Agregar cada cita a la tabla
            results.forEach(cita => {
                html += `
                    <tr>
                        <td>${cita.id}</td>
                        <td>${cita.veterinario}</td>
                        <td>${cita.fecha}</td>
                        <td>${cita.hora}</td>
                        <td>${cita.mascota}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                    <button onclick="window.location.href='/'">Volver</button>
                </body>
                </html>
            `;
            res.send(html);
        });
    });
});
//Ruta excel
app.post('/upload', requireLogin,requireRole(['veterinario','admin']), upload.single('excelFile'), (req, res) => {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
    data.forEach(row => {
        const { nombre, especialidad, numero_contacto } = row;
        const sql = `INSERT INTO veterinarios (nombre, especialidad, numero_contacto) VALUES (?, ?,?)`;
        connection.query(sql, [nombre, especialidad, numero_contacto], err => {
          if (err) throw err;
        });
    });
  
    res.sendFile(path.join(__dirname, 'public', 'veterinarios.html'));
  });
app.get('/download', requireLogin,requireRole(['veterinario','admin']), (req, res) =>{
    const sql = `SELECT * FROM veterinarios`;
    connection.query(sql, (err, results) => {
    if (err) {        
        res.sendFile(path.join(__dirname, 'public', 'error.html')); //ERROR
    }

    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Veterinarios');

    const filePath = path.join(__dirname, 'uploads', 'veterinarios.xlsx');
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, 'veterinarios.xlsx');
});
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log(`Servidor escuchando en http://localhost:3000`);
  });
