const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Usar variable de entorno para MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

// Conectar a MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB...'))
  .catch(err => console.error('Error al conectarse a MongoDB:', err));

// Schema de Mongoose para eventos
const eventoSchema = new mongoose.Schema({
  tipo: String,
  nombre: String,
  curso: String,
  fecha: Date,
  hora: String,
  detalles: String,
  resolucion: String,
  lugar: String,
  imagen: String
});

const Evento = mongoose.model('Evento', eventoSchema);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos

// Ruta para guardar eventos
app.post('/api/eventos', async (req, res) => {
  const evento = new Evento(req.body);
  try {
    await evento.save();
    res.send('Evento guardado con éxito');
  } catch (error) {
    res.status(500).send('Error al guardar el evento');
  }
});

// Ruta para obtener eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await Evento.find().sort('fecha');
    res.json(eventos);
  } catch (error) {
    res.status(500).send('Error al obtener eventos');
  }
});

// Servir el archivo HTML de eventos
app.get('/eventos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Formulario.html')); // Ruta a Formulario.html
});

app.listen(port, () => console.log(`Escuchando en el puerto ${port}...`));
