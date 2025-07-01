FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Start the app using nodemon + ts-node
CMD ["npm", "run", "dev"]
