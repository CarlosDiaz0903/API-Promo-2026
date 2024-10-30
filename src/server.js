const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://C4rl_DB09:Ca74113504@cluster0.hvwzidh.mongodb.net/?retryWrites=true&w=majority';

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
    res.json({ message: 'Evento guardado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el evento' });
  }
});

// Ruta para obtener eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await Evento.find().sort('fecha');
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Ruta para eliminar un evento
app.delete('/api/eventos/:id', async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.json({ message: 'Evento eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});

// Ruta para editar un evento
app.put('/api/eventos/:id', async (req, res) => {
  try {
    await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Evento actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// Servir el archivo HTML del formulario en la ruta /formulario
app.get('/formulario', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'formulario.html')); // Ruta a index.html (formulario)
});

const visitasSchema = new mongoose.Schema({
  contador: { type: Number, default: 0 }
});

let visitasOlimpiadas = 0;
let visitasIndex = 0;

app.get('/olimpiadas', (req, res) => {
  visitasOlimpiadas++;
  res.sendFile(path.join(__dirname, 'public', 'olimpiadas.html')); // Ruta a olimpiadas.html
});

app.get('/calendario', (req, res) => {
  visitasOlimpiadas++;
  res.sendFile(path.join(__dirname, 'public', 'calendario.html')); // Ruta a olimpiadas.html
});

// Servir el archivo HTML para visualizar eventos en la ruta raíz /
app.get('', (req, res) => {
  visitasIndex++;
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Ruta a eventos.html
});

app.listen(port, () => console.log(`Escuchando en el puerto ${port}...`));
