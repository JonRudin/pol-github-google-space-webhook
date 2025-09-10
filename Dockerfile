FROM node:20-alpine

WORKDIR /opt/app

# Only copy what's needed to install dependencies
COPY package.json package-lock.json ./

# Install deps with npm
RUN npm ci

# Copy the rest of the app
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the app using your npm script
CMD ["npm", "run", "start"]