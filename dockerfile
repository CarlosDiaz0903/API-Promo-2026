# Usa una imagen base de Node.js
FROM node:18

# Configura el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de paquetes y las dependencias
COPY src/package*.json ./
RUN npm install

# Copia el resto de los archivos desde el directorio src
COPY src/ ./

# Expone el puerto en el que la aplicación estará escuchando
EXPOSE 3000

# Define el comando para ejecutar la aplicación
CMD ["node", "server.js"]
