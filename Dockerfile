# Use the official Node.js 20 LTS image
FROM node:20-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application to the container
COPY . .

# Expose the port your app runs on (default for Azure App Service is 8080)
EXPOSE 8080

# Define the command to start the app
CMD ["npm", "run", "dev"]
