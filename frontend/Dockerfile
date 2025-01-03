# Dockerfile for frontend
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run the Prisma migration
RUN npx prisma migrate deploy

ENV GOOGLE_CLIENT_ID=PLACEHOLDER_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=PLACEHOLDER_CLIENT_SECRET
ENV NEXTAUTH_SECRET=PLACEHOLDER_NEXTAUTH_SECRET

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

RUN npx ts-node scripts/create-user.ts

# Command to run the application
CMD ["npm", "start"]