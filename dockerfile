# Usa una imagen base de Node.js
FROM node:18

# Configura el directorio de trabajo
WORKDIR /app

# Copia los archivos de package.json y package-lock.json desde src/ al directorio de trabajo
COPY src/package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el contenido de src/ al directorio de trabajo en el contenedor
COPY src/ .

# Configura el puerto en el que la aplicación escuchará
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
