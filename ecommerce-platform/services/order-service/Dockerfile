FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create tsconfig.json if it doesn't exist
RUN if [ ! -f tsconfig.json ]; then echo '{"compilerOptions":{"target":"es2016","module":"commonjs","outDir":"./dist","esModuleInterop":true,"forceConsistentCasingInFileNames":true,"strict":true,"skipLibCheck":true},"include":["src/**/*"]}' > tsconfig.json; fi

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 8003

# Start the application
CMD ["npm", "start"]